package ca.mohawkCollege.wiselySplitServer.services.classification;

import ca.mohawkCollege.wiselySplitServer.daos.ModelStoreDAO;
import ca.mohawkCollege.wiselySplitServer.daos.ModelStoreDAO.LatestModel;
import ca.mohawkCollege.wiselySplitServer.models.ModelBundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

/**
 * Reads/writes ModelBundle blobs from the model_store table.
 */
@Service
public class ModelService {

    private static final Logger log = LoggerFactory.getLogger(ModelService.class);

    @Autowired
    private ModelStoreDAO modelStoreDAO;

    /** Load the latest model from DB, or null if none exists or deserialization fails. */
    public ModelBundle loadLatest() {
        LatestModel row = modelStoreDAO.findLatest();
        if (row == null) {
            log.info("ModelService: no persisted model found");
            return null;
        }
        try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(row.blob()))) {
            ModelBundle bundle = (ModelBundle) in.readObject();
            log.info("ModelService: loaded model v{} (training size {}, vocab {}, classes {})",
                    row.version(), bundle.getTrainingSize(),
                    bundle.vocabSize(), bundle.getClasses().length);
            return bundle;
        } catch (Exception e) {
            log.error("ModelService: failed to deserialize latest model", e);
            return null;
        }
    }

    /** Serialize and persist a new model bundle. Returns the new version number. */
    public int saveNewVersion(ModelBundle bundle) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream out = new ObjectOutputStream(baos)) {

            out.writeObject(bundle);
            out.flush();

            int nextVersion = modelStoreDAO.getMaxVersion() + 1;
            String classesCsv = String.join(",", bundle.getClasses());
            modelStoreDAO.insertModel(nextVersion, baos.toByteArray(), classesCsv, bundle.getTrainingSize());
            log.info("ModelService: persisted model v{} (training size {}, vocab {}, classes [{}])",
                    nextVersion, bundle.getTrainingSize(), bundle.vocabSize(), classesCsv);
            return nextVersion;
        } catch (Exception e) {
            throw new RuntimeException("Failed to persist model bundle: " + e.getMessage(), e);
        }
    }
}
