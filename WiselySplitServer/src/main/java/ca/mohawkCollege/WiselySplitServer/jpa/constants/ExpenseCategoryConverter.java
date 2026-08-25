package ca.mohawkCollege.wiselySplitServer.jpa.constants;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link ExpenseCategory} as the UI/DB display name
 * (e.g. {@code "Food & Dining"}), not the enum constant name.
 */
@Converter(autoApply = true)
public class ExpenseCategoryConverter implements AttributeConverter<ExpenseCategory, String> {

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
