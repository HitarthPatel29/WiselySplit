package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link IncomeCategory} as the UI/DB display name
 * (e.g. {@code "Food & Dining"}), not the enum constant name.
 */
@Converter(autoApply = true)
public class IncomeCategoryConverter implements AttributeConverter<IncomeCategory, String> {

    // Converts the Enum to its DisplayName
    @Override
    public String convertToDatabaseColumn(IncomeCategory category) {
        return category == null ? null : category.getDisplayName();
    }

    //Converts the DisplayName to Enum
    @Override
    public IncomeCategory convertToEntityAttribute(String dbValue) {
        return IncomeCategory.fromDisplayName(dbValue);
    }
}
