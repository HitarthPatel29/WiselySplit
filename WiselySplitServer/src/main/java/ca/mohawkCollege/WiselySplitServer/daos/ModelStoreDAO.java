package ca.mohawkCollege.wiselySplitServer.daos;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public class ModelStoreDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureSchema() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS model_store (
                ModelID      INT PRIMARY KEY AUTO_INCREMENT,
                Version      INT NOT NULL,
                Algorithm    VARCHAR(32) NOT NULL DEFAULT 'NaiveBayes',
                ModelBlob    LONGBLOB    NOT NULL,
                Classes      TEXT        NOT NULL,
                TrainingSize INT         NOT NULL,
                CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_model_version (Version DESC)
            )
        """);
    }

    /** Latest model row (highest Version) or null if none exists. */
    public LatestModel findLatest() {
        try {
            return jdbcTemplate.queryForObject(
                    """
                    SELECT Version, ModelBlob, TrainingSize, CreatedAt
                      FROM model_store
                     ORDER BY Version DESC
                     LIMIT 1
                    """,
                    (rs, rn) -> new LatestModel(
                            rs.getInt("Version"),
                            rs.getBytes("ModelBlob"),
                            rs.getInt("TrainingSize"),
                            rs.getTimestamp("CreatedAt")
                    )
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public int getMaxVersion() {
        Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(Version), 0) FROM model_store",
                Integer.class
        );
        return v == null ? 0 : v;
    }

    public int insertModel(int version, byte[] blob, String classesCsv, int trainingSize) {
        return jdbcTemplate.update(
                """
                INSERT INTO model_store (Version, Algorithm, ModelBlob, Classes, TrainingSize)
                VALUES (?, 'NaiveBayes', ?, ?, ?)
                """,
                version, blob, classesCsv, trainingSize
        );
    }

    public record LatestModel(int version, byte[] blob, int trainingSize, Timestamp createdAt) {}

    /** Lightweight metadata for every persisted model version, newest first. */
    public List<ModelInfo> findAllVersions() {
        return jdbcTemplate.query(
                """
                SELECT ModelID, Version, Algorithm, Classes, TrainingSize,
                       OCTET_LENGTH(ModelBlob) AS BlobBytes, CreatedAt
                  FROM model_store
                 ORDER BY Version DESC
                """,
                (rs, rn) -> new ModelInfo(
                        rs.getInt("ModelID"),
                        rs.getInt("Version"),
                        rs.getString("Algorithm"),
                        rs.getString("Classes"),
                        rs.getInt("TrainingSize"),
                        rs.getLong("BlobBytes"),
                        rs.getTimestamp("CreatedAt")
                )
        );
    }

    public record ModelInfo(
            int modelId,
            int version,
            String algorithm,
            String classes,
            int trainingSize,
            long blobBytes,
            Timestamp createdAt
    ) {}
}
