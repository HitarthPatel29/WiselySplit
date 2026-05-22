package ca.mohawkCollege.wiselySplitServer.utilities.classification;

import ca.mohawkCollege.wiselySplitServer.models.ModelBundle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import smile.classification.DiscreteNaiveBayes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * Builds a fresh ModelBundle from labeled (title, label) rows.
 *
 *  1. Tokenize every title.
 *  2. Build a vocabulary (word -> column index) and a sorted class list.
 *  3. Vectorize each title as a bag-of-words int[] count vector.
 *  4. Fit a multinomial DiscreteNaiveBayes via batch update().
 */
@Component
public class TrainingPipeline {

    @Autowired
    private Tokenizer tokenizer;

    public ModelBundle train(List<LabeledRow> rows) {
        if (rows == null || rows.isEmpty()) {
            throw new IllegalArgumentException("Cannot train classifier on empty dataset");
        }

        List<List<String>> tokenized = new ArrayList<>(rows.size());
        TreeSet<String> classSet = new TreeSet<>();
        Map<String, Integer> vocab = new LinkedHashMap<>();

        for (LabeledRow row : rows) {
            List<String> tokens = tokenizer.tokenize(row.title());
            tokenized.add(tokens);
            classSet.add(row.label());
            for (String t : tokens) {
                vocab.computeIfAbsent(t, k -> vocab.size());
            }
        }

        if (vocab.isEmpty()) {
            throw new IllegalStateException("Training data produced an empty vocabulary");
        }

        String[] classes = classSet.toArray(new String[0]);
        Map<String, Integer> classIndex = new HashMap<>();
        for (int i = 0; i < classes.length; i++) {
            classIndex.put(classes[i], i);
        }

        int n = rows.size();
        int p = vocab.size();
        int k = classes.length;

        int[][] x = new int[n][p];
        int[] y = new int[n];
        for (int i = 0; i < n; i++) {
            List<String> tokens = tokenized.get(i);
            for (String t : tokens) {
                Integer col = vocab.get(t);
                if (col != null) x[i][col] += 1;
            }
            y[i] = classIndex.get(rows.get(i).label());
        }

        DiscreteNaiveBayes nb =
                new DiscreteNaiveBayes(DiscreteNaiveBayes.Model.MULTINOMIAL, k, p);
        nb.update(x, y);

        return new ModelBundle(vocab, classes, nb, n);
    }

    /**
     * Vectorize a single document against an existing vocabulary.
     * Unknown tokens are silently dropped.
     */
    public int[] vectorize(String title, Map<String, Integer> vocab) {
        int[] x = new int[vocab.size()];
        List<String> tokens = tokenizer.tokenize(title);
        for (String t : tokens) {
            Integer col = vocab.get(t);
            if (col != null) x[col] += 1;
        }
        return x;
    }

    /** Returns true if the vector has at least one non-zero entry. */
    public boolean hasFeatures(int[] x) {
        for (int v : x) if (v > 0) return true;
        return false;
    }

    /** Simple immutable training row. */
    public record LabeledRow(String title, String label) {}
}
