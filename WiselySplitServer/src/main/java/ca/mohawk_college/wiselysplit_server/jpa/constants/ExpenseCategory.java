package ca.mohawk_college.wiselysplit_server.jpa.constants;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Fixed set of expense categories.
 * DB/API keep the display name (e.g. {@code "Food & Dining"});
 * use {@link ExpenseCategoryConverter} instead of {@code @Enumerated}.
 */
public enum ExpenseCategory {
    EDUCATION("Education"),
    ENTERTAINMENT("Entertainment"),
    FINANCE("Finance"),
    FOOD_AND_DINING("Food & Dining"),
    GIFTS_AND_DONATIONS("Gifts & Donations"),
    HEALTH_AND_MEDICAL("Health & Medical"),
    HOUSING("Housing"),
    KIDS_AND_FAMILY("Kids & Family"),
    OTHER("Other"),
    PERSONAL_CARE("Personal Care"),
    PETS("Pets"),
    SAVINGS_AND_INVESTMENTS("Savings & Investments"),
    SHOPPING("Shopping"),
    TRANSPORT("Transport"),
    TRAVEL("Travel"),
    UTILITIES("Utilities");

    public static final ExpenseCategory DEFAULT = OTHER;

    private final String displayName;

    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonCreator
    public static ExpenseCategory fromJson(String value) {
        return fromDisplayName(value);
    }
    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    /** Resolve from API/CSV/classifier text; falls back to {@link #OTHER}. */
    public static ExpenseCategory fromDisplayName(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT;
        }
        String normalized = value.trim();
        for (ExpenseCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(normalized)
                    || category.name().equalsIgnoreCase(normalized.replace(' ', '_').replace("&", "AND"))) {
                return category;
            }
        }
        return DEFAULT;
    }



}
