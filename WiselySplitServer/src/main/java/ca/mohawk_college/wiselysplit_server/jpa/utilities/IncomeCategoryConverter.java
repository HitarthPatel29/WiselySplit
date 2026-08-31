package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link ExpenseCategory} as the UI/DB display name
 * (e.g. {@code "Food & Dining"}), not the enum constant name.
 */
@Converter(autoApply = true)
public class IncomeCategoryConverter implements AttributeConverter<ExpenseCategory, String> {

    // Converts the Enum to its DisplayName
    @Override
    public String convertToDatabaseColumn(ExpenseCategory category) {
        return category == null ? null : category.getDisplayName();
    }

    //Converts the DisplayName to Enum
    @Override
    public ExpenseCategory convertToEntityAttribute(String dbValue) {
        return ExpenseCategory.fromDisplayName(dbValue);
    }
}
