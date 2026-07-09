package ca.mohawkCollege.wiselySplitServer.daos;

import ca.mohawkCollege.wiselySplitServer.utilities.classification.TrainingPipeline.LabeledRow;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class TrainingDataDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureSchema() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS training_data (
                Id        INT PRIMARY KEY AUTO_INCREMENT,
                Title     VARCHAR(255) NOT NULL,
                Label     VARCHAR(64)  NOT NULL,
                Source    ENUM('seed','user_confirmed','user_corrected') NOT NULL DEFAULT 'user_confirmed',
                UserID    INT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_training_label (Label),
                INDEX idx_training_created (CreatedAt)
            )
        """);
    }

    public void insertRow(String title, String label, String source, Integer userId) {
        jdbcTemplate.update(
                "INSERT INTO training_data (Title, Label, Source, UserID) VALUES (?, ?, ?, ?)",
                title, label, source, userId
        );
    }

    public int countSeedRows() {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM training_data WHERE Source = 'seed'",
                Integer.class
        );
        return n == null ? 0 : n;
    }

    public int countAll() {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM training_data", Integer.class
        );
        return n == null ? 0 : n;
    }

    public int countPendingTrainDataSinceLastTrain() {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM training_data WHERE Source = 'user_corrected' AND CreatedAt > (SELECT CreatedAt FROM model_store order by ModelID desc limit 1) ",
                Integer.class
        );
        return n == null ? 0 : n;
    }

    public List<LabeledRow> findAllLabeled() {
        return jdbcTemplate.query(
                "SELECT Title, Label FROM training_data",
                (rs, rn) -> new LabeledRow(rs.getString("Title"), rs.getString("Label"))
        );
    }

    /** Aggregated count of training rows grouped by Label, descending. */
    public Map<String, Integer> countByLabel() {
        Map<String, Integer> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT Label, COUNT(*) AS n FROM training_data GROUP BY Label ORDER BY n DESC, Label ASC",
                rs -> { result.put(rs.getString("Label"), rs.getInt("n")); }
        );
        return result;
    }

    /** Aggregated count of training rows grouped by Source. */
    public Map<String, Integer> countBySource() {
        Map<String, Integer> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT Source, COUNT(*) AS n FROM training_data GROUP BY Source ORDER BY n DESC",
                rs -> { result.put(rs.getString("Source"), rs.getInt("n")); }
        );
        return result;
    }

    /** Removes every row sourced from the bundled seed CSV. */
    public int deleteSeedRows() {
        return jdbcTemplate.update("DELETE FROM training_data WHERE Source = 'seed'");
    }

    /**
     * Paginated feedback rows filtered by a single source value
     * (e.g. 'user_confirmed' or 'user_corrected'). Seed rows are never
     * returned through this method — callers must pass a non-seed source.
     */
    public List<Map<String, Object>> findRecentBySource(String source, int limit, int offset) {
        String sql = """
            SELECT Id        AS id,
                   Title     AS title,
                   Label     AS label,
                   Source    AS source,
                   UserID    AS userId,
                   CreatedAt AS createdAt
              FROM training_data
             WHERE Source = ?
             ORDER BY CreatedAt DESC, Id DESC
             LIMIT ? OFFSET ?
            """;
        return jdbcTemplate.queryForList(sql, source, limit, offset);
    }

    /** Count of training rows for a single source value. */
    public int countBySourceValue(String source) {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM training_data WHERE Source = ?",
                Integer.class, source
        );
        return n == null ? 0 : n;
    }
}
