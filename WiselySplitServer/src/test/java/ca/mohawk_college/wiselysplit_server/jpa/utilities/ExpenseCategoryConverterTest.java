package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseCategoryConverterTest {

    private final ExpenseCategoryConverter converter = new ExpenseCategoryConverter();

    @Test
    void shouldPersistDisplayNameNotEnumConstant() {
        assertThat(converter.convertToDatabaseColumn(ExpenseCategory.FOOD_AND_DINING))
                .isEqualTo("Food & Dining");
    }

    @Test
    void shouldPersistNullAsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @ParameterizedTest
    @CsvSource({
            "Food & Dining, FOOD_AND_DINING",
            "food & dining, FOOD_AND_DINING",
            "FOOD_AND_DINING, FOOD_AND_DINING",
            "Other, OTHER"
    })
    void shouldResolveDisplayNameOrConstant(String dbValue, ExpenseCategory expected) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "Unknown Category"})
    void shouldFallBackToOtherForBlankOrUnknown(String dbValue) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(ExpenseCategory.OTHER);
    }
}
