package ca.mohawkCollege.wiselySplitServer.services.classification;

import ca.mohawkCollege.wiselySplitServer.daos.TrainingDataDAO;
import ca.mohawkCollege.wiselySplitServer.models.ModelBundle;
import ca.mohawkCollege.wiselySplitServer.utilities.classification.TrainingPipeline;
import ca.mohawkCollege.wiselySplitServer.utilities.classification.TrainingPipeline.LabeledRow;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Holds the currently-active SMILE ModelBundle in memory and serves predictions.
 *
 *  - On startup: try loading the latest bundle from model_store.
 *    If none exists, seed training_data from the bundled CSV, train,
 *    and persist as v1.
 *  - Exposes hotSwap(...) so FeedbackService can swap a freshly retrained
 *    bundle into place atomically (volatile reference).
 */
@Service
public class ClassificationService {

    private static final Logger log = LoggerFactory.getLogger(ClassificationService.class);

    private static final String SEED_CSV = "ml/seed_categories.csv";
    private static final double MIN_CONFIDENCE = 0.25;

    @Autowired private ModelService modelService;
    @Autowired private TrainingPipeline trainingPipeline;
    @Autowired private TrainingDataDAO trainingDataDAO;

    private volatile ModelBundle current;

    @PostConstruct
    public void init() {
        try {
            ModelBundle loaded = modelService.loadLatest();
            if (loaded != null) {
                this.current = loaded;
                return;
            }

            log.info("ClassificationService: bootstrapping classifier from seed CSV");
            if (trainingDataDAO.countSeedRows() == 0) {
                loadSeedRowsFromCsv();
            }

            List<LabeledRow> rows = trainingDataDAO.findAllLabeled();
            if (rows.isEmpty()) {
                log.warn("ClassificationService: no training rows available, classifier will be disabled");
                return;
            }
            ModelBundle bundle = trainingPipeline.train(rows);
            modelService.saveNewVersion(bundle);
            this.current = bundle;
        } catch (Exception e) {
            log.error("ClassificationService: failed to initialize classifier", e);
        }
    }

    /**
     * Read the bundled seed CSV and insert every (title,label) pair with source='seed'.
     * Returns the number of rows successfully inserted. Caller is responsible for
     * deleting any pre-existing seed rows first if a clean replace is desired.
     */
    public int loadSeedRowsFromCsv() {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource(SEED_CSV).getInputStream(), StandardCharsets.UTF_8))) {

            String header = br.readLine();
            if (header == null) return 0;

            String line;
            int inserted = 0;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;
                int comma = line.lastIndexOf(',');
                if (comma <= 0 || comma == line.length() - 1) continue;
                String title = line.substring(0, comma).trim();
                String label = line.substring(comma + 1).trim();
                if (title.isEmpty() || label.isEmpty()) continue;
                trainingDataDAO.insertRow(title, label, "seed", null);
                inserted++;
            }
            log.info("ClassificationService: inserted {} seed rows", inserted);
            return inserted;
        } catch (Exception e) {
            log.error("ClassificationService: failed to load seed CSV {}", SEED_CSV, e);
            throw new RuntimeException("Failed to load seed CSV: " + e.getMessage(), e);
        }
    }

    /**
     * Replace every existing 'seed' row with a fresh import of the bundled CSV.
     * User-confirmed and user-corrected rows are left intact. Returns the
     * number of rows inserted from the CSV.
     */
    public int reloadSeedRowsFromCsv() {
        trainingDataDAO.deleteSeedRows();
        return loadSeedRowsFromCsv();
    }

    /** Atomically swap the active bundle. */
    public void hotSwap(ModelBundle bundle) {
        if (bundle == null) return;
        this.current = bundle;
        log.info("ClassificationService: hot-swapped model (trainingSize={}, vocab={}, classes={})",
                bundle.getTrainingSize(), bundle.vocabSize(), bundle.getClasses().length);
    }

    public boolean isReady() {
        return current != null;
    }

    /** Predict a category for the given title; returns null if unable. */
    public Prediction predict(String title) {
        ModelBundle bundle = current;
        if (bundle == null || title == null || title.isBlank()) return null;

        int[] titleVectors = trainingPipeline.vectorize(title, bundle.getVocab());
        if (!trainingPipeline.hasFeatures(titleVectors)) return null;

        double[] posteriori = new double[bundle.getClasses().length];
        int idx = bundle.getNb().predict(titleVectors, posteriori);
        if (idx < 0 || idx >= bundle.getClasses().length) return null;

        double confidence = posteriori[idx];
        if (confidence < MIN_CONFIDENCE) {
            return new Prediction(bundle.getClasses()[idx], confidence, false);
        }
        return new Prediction(bundle.getClasses()[idx], confidence, true);
    }

    /** Return the active model classes (in training order) or an empty list. */
    public List<String> classes() {
        ModelBundle bundle = current;
        if (bundle == null) return new ArrayList<>();
        return List.of(bundle.getClasses());
    }

    public int trainingSize() {
        ModelBundle bundle = current;
        return bundle == null ? 0 : bundle.getTrainingSize();
    }

    public record Prediction(String category, double confidence, boolean confident) {}
}
