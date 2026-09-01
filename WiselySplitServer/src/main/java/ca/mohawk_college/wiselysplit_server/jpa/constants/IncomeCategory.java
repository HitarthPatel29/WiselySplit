package ca.mohawk_college.wiselysplit_server.jpa.constants;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum IncomeCategory {
    FREELANCE("Freelance"),
    INVESTMENT("Investment"),
    SALARY("Salary"),
    GIFT("Gift"),
    REFUND("Refund"),
    SAVINGS("Savings"),
    OTHER("Other");

    public static final IncomeCategory DEFAULT = OTHER;

    private final String displayName;

    IncomeCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonCreator
    public static IncomeCategory fromJson(String value) {
        return fromDisplayName(value);
    }
    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    /** Resolve from API/CSV/classifier text; falls back to {@link #OTHER}. */
    public static IncomeCategory fromDisplayName(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT;
        }
        String normalized = value.trim();
        for (IncomeCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(normalized)
                    || category.name().equalsIgnoreCase(normalized.replace(' ', '_').replace("&", "AND"))) {
                return category;
            }
        }
        return DEFAULT;
    }
}
