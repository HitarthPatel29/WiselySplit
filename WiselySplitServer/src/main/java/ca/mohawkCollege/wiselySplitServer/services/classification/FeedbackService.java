package ca.mohawkCollege.wiselySplitServer.services.classification;

import ca.mohawkCollege.wiselySplitServer.daos.TrainingDataDAO;
import ca.mohawkCollege.wiselySplitServer.models.ModelBundle;
import ca.mohawkCollege.wiselySplitServer.utilities.classification.TrainingPipeline;
import ca.mohawkCollege.wiselySplitServer.utilities.classification.TrainingPipeline.LabeledRow;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Captures user confirmations / overrides into training_data and triggers
 * an async retrain once enough new rows have arrived.
 */
@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    /** How many user_corrected feedbacks trigger a retrain. */
    private static final int RETRAIN_THRESHOLD = 10;

    @Autowired private TrainingDataDAO trainingDataDAO;
    @Autowired private TrainingPipeline trainingPipeline;
    @Autowired private ModelService modelService;
    @Autowired private ClassificationService classificationService;

    /** Self-injection so @Async invocations go through the Spring proxy. */
    @Autowired @Lazy
    private FeedbackService self;

    private final AtomicInteger pendingSinceLastTrain = new AtomicInteger(0);
    private volatile boolean retrainInFlight = false;

    /**
     * recovers the Number of Pending Training Data since last training from DB
     */
    @PostConstruct
    public void recoverPendingSinceLastTrain(){
        pendingSinceLastTrain.set(trainingDataDAO.countPendingTrainDataSinceLastTrain());
    }
    /**
     * Persist a (title, finalLabel) row. Source is 'user_confirmed',
     * if the model's prediction matched the final category, otherwise 'user_corrected'.
     * No-operations if title or finalLabel is missing.
     * counts the user_corrected feedback and initializes retraining when RETRAIN_THRESHOLD reached
     */
    public void recordFeedback(String title, String predictedLabel, String finalLabel, Integer userId) {
        if (title == null || title.isBlank() || finalLabel == null || finalLabel.isBlank()) return;

        String source = (predictedLabel != null && predictedLabel.equalsIgnoreCase(finalLabel))
                ? "user_confirmed"
                : "user_corrected";
        try {
            trainingDataDAO.insertRow(title.trim(), finalLabel.trim(), source, userId);
        } catch (Exception e) {
            log.warn("FeedbackService: failed to insert training row ({})", e.getMessage());
            return;
        }

        //only count user corrected feedbacks
        if ("user_corrected".equalsIgnoreCase(source)) {
            int newCount = pendingSinceLastTrain.incrementAndGet();
            if (newCount >= RETRAIN_THRESHOLD && !retrainInFlight)
                self.retrainAsync();
        }
    }

    /** Triggers an async retrain off the main request thread. */
    @Async
    public void retrainAsync() {
        if (retrainInFlight) return;
        retrainInFlight = true;
        int snapshot = pendingSinceLastTrain.getAndSet(0);
        try {
            log.info("FeedbackService: retraining classifier ({} new rows since last train)", snapshot);
            retrainSync();
        } catch (Exception e) {
            log.error("FeedbackService: retrain failed, rolling pending counter back", e);
            pendingSinceLastTrain.addAndGet(snapshot);
        } finally {
            retrainInFlight = false;
        }
    }

    /** Synchronous retrain (used by manual /retrain endpoint and async path). */
    public int retrainSync() {
        List<LabeledRow> rows = trainingDataDAO.findAllLabeled();
        if (rows.isEmpty()) {
            log.warn("FeedbackService: retrain skipped, no labeled rows");
            return 0;
        }
        ModelBundle bundle = trainingPipeline.train(rows);
        int version = modelService.saveNewVersion(bundle);
        classificationService.hotSwap(bundle);
        return version;
    }

    public int getPendingSinceLastTrain() {
        return pendingSinceLastTrain.get();
    }
}
