package ca.mohawkCollege.wiselySplitServer.models;

import smile.classification.DiscreteNaiveBayes;

import java.io.Serializable;
import java.util.Map;

/**
 * Serializable bundle of everything needed to make a prediction.
 * Stored as a single LONGBLOB in the model_store table so that the
 * vocabulary index and label index stay aligned with the trained
 * DiscreteNaiveBayes model.
 */
public class ModelBundle implements Serializable {

    private static final long serialVersionUID = 1L;

    private final Map<String, Integer> vocab;
    private final String[] classes;
    private final DiscreteNaiveBayes nb;
    private final int trainingSize;

    public ModelBundle(Map<String, Integer> vocab,
                       String[] classes,
                       DiscreteNaiveBayes nb,
                       int trainingSize) {
        this.vocab = vocab;
        this.classes = classes;
        this.nb = nb;
        this.trainingSize = trainingSize;
    }

    public Map<String, Integer> getVocab() {
        return vocab;
    }

    public String[] getClasses() {
        return classes;
    }

    public DiscreteNaiveBayes getNb() {
        return nb;
    }

    public int getTrainingSize() {
        return trainingSize;
    }

    public int vocabSize() {
        return vocab.size();
    }
}
