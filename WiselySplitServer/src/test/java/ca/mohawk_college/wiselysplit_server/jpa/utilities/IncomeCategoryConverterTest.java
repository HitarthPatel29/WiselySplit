package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class IncomeCategoryConverterTest {

    private final IncomeCategoryConverter converter = new IncomeCategoryConverter();

    @Test
    void shouldPersistDisplayNameNotEnumConstant() {
        assertThat(converter.convertToDatabaseColumn(IncomeCategory.SALARY)).isEqualTo("Salary");
    }

    @Test
    void shouldPersistNullAsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @ParameterizedTest
    @CsvSource({
            "Salary, SALARY",
            "salary, SALARY",
            "SALARY, SALARY",
            "Freelance, FREELANCE"
    })
    void shouldResolveDisplayNameOrConstant(String dbValue, IncomeCategory expected) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "Mystery"})
    void shouldFallBackToOtherForBlankOrUnknown(String dbValue) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(IncomeCategory.OTHER);
    }
}
