package ca.mohawkCollege.wiselySplitServer.controllers;

import ca.mohawkCollege.wiselySplitServer.daos.ModelStoreDAO;
import ca.mohawkCollege.wiselySplitServer.daos.ModelStoreDAO.ModelInfo;
import ca.mohawkCollege.wiselySplitServer.daos.TrainingDataDAO;
import ca.mohawkCollege.wiselySplitServer.services.classification.ClassificationService;
import ca.mohawkCollege.wiselySplitServer.services.classification.ClassificationService.Prediction;
import ca.mohawkCollege.wiselySplitServer.services.classification.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classify")
public class ClassificationController {

    @Autowired private ClassificationService classificationService;
    @Autowired private FeedbackService feedbackService;
    @Autowired private TrainingDataDAO trainingDataDAO;
    @Autowired private ModelStoreDAO modelStoreDAO;

    /** GET /api/classify/predict?title=... */
    @GetMapping("/predict")
    public ResponseEntity<?> predict(@RequestParam("title") String title) {
        try {
            Prediction p = classificationService.predict(title);
            Map<String, Object> body = new LinkedHashMap<>();
            if (p == null) {
                body.put("category", null);
                body.put("confidence", 0.0);
                body.put("confident", false);
                body.put("ready", classificationService.isReady());
                return ResponseEntity.ok(body);
            }
            body.put("category", p.category());
            body.put("confidence", round4(p.confidence()));
            body.put("confident", p.confident());
            body.put("ready", true);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/classify/feedback { title, predicted, final, userId? } */
    @PostMapping("/feedback")
    public ResponseEntity<?> feedback(@RequestBody Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String predicted = (String) payload.get("predicted");
            String finalLabel = (String) payload.get("final");
            Integer userId = payload.get("userId") instanceof Number n ? n.intValue() : null;
            feedbackService.recordFeedback(title, predicted, finalLabel, userId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/classify/retrain — manual trigger (admin/testing). */
    @PostMapping("/retrain")
    public ResponseEntity<?> retrain() {
        try {
            int version = feedbackService.retrainSync();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "version", version,
                    "trainingSize", classificationService.trainingSize()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/classify/retrain-from-seed
     *   1. wipes 'seed' rows from training_data
     *   2. re-imports seed_categories.csv as fresh seed rows
     *   3. retrains the classifier on every row (seed + user feedback)
     *   4. persists the new model and hot-swaps it into the live service
     */
    @PostMapping("/retrain-from-seed")
    public ResponseEntity<?> retrainFromSeed() {
        try {
            int seedRows = classificationService.reloadSeedRowsFromCsv();
            int version = feedbackService.retrainSync();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "seedRows", seedRows,
                    "version", version,
                    "trainingSize", classificationService.trainingSize()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/classify/status — quick sanity check. */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        Map<String, Object> body = new HashMap<>();
        body.put("ready", classificationService.isReady());
        body.put("classes", classificationService.classes());
        body.put("trainingSize", classificationService.trainingSize());
        return ResponseEntity.ok(body);
    }

    /**
     * GET /api/classify/stats — aggregate counts for the admin dashboard.
     * Returns:
     *   {
     *     totalRows,            // total training rows in DB
     *     activeTrainingSize,   // rows used to fit the currently active model
     *     byLabel: { label: n, ... },
     *     bySource: { source: n, ... }
     *   }
     */
    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("totalRows", trainingDataDAO.countAll());
            body.put("activeTrainingSize", classificationService.trainingSize());
            body.put("byLabel", trainingDataDAO.countByLabel());
            body.put("bySource", trainingDataDAO.countBySource());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/classify/models — every persisted model version, newest first.
     * Returns: { models: [ { modelId, version, algorithm, classes, trainingSize, blobBytes, createdAt }, ... ] }
     */
    @GetMapping("/models")
    public ResponseEntity<?> models() {
        try {
            List<ModelInfo> versions = modelStoreDAO.findAllVersions();
            List<Map<String, Object>> rows = new ArrayList<>(versions.size());
            for (ModelInfo m : versions) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("modelId", m.modelId());
                row.put("version", m.version());
                row.put("algorithm", m.algorithm());
                row.put("classes", m.classes());
                row.put("trainingSize", m.trainingSize());
                row.put("blobBytes", m.blobBytes());
                row.put("createdAt", m.createdAt());
                rows.add(row);
            }
            return ResponseEntity.ok(Map.of("models", rows));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }
}
