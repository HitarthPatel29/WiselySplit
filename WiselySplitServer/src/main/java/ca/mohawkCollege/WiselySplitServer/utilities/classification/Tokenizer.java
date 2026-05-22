package ca.mohawkCollege.wiselySplitServer.utilities.classification;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lightweight tokenizer for short expense titles.
 * Lowercases, strips non-letters, splits on whitespace, and removes
 * short tokens plus a small English stop-word list.
 */
@Component
public class Tokenizer {

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
            "a", "an", "the", "and", "or", "but", "of", "to", "for", "in",
            "on", "at", "from", "by", "with", "is", "are", "was", "were",
            "be", "been", "being", "it", "its", "this", "that", "these",
            "those", "my", "your", "our", "their", "his", "her", "i", "we",
            "you", "they", "he", "she", "as", "if", "so", "do", "did", "done"
    ));

    public List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null) return tokens;

        String cleaned = text.toLowerCase().replaceAll("[^a-z]+", " ").trim();
        if (cleaned.isEmpty()) return tokens;

        for (String tok : cleaned.split("\\s+")) {
            if (tok.length() < 2) continue;
            if (STOP_WORDS.contains(tok)) continue;
            tokens.add(tok);
        }
        return tokens;
    }
}
