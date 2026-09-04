package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseCategoryTest {

    @Test
    void fromJsonShouldDelegateToFromDisplayName() {
        assertThat(ExpenseCategory.fromJson("Food & Dining")).isEqualTo(ExpenseCategory.FOOD_AND_DINING);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "not-a-category"})
    void fromDisplayNameShouldDefaultToOther(String value) {
        assertThat(ExpenseCategory.fromDisplayName(value)).isEqualTo(ExpenseCategory.OTHER);
    }

    @Test
    void getDisplayNameShouldBeTheWireValue() {
        assertThat(ExpenseCategory.HEALTH_AND_MEDICAL.getDisplayName()).isEqualTo("Health & Medical");
    }
}
