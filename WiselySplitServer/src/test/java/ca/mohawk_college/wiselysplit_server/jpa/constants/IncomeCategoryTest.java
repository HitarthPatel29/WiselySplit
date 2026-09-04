package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class IncomeCategoryTest {

    @Test
    void fromJsonShouldDelegateToFromDisplayName() {
        assertThat(IncomeCategory.fromJson("Freelance")).isEqualTo(IncomeCategory.FREELANCE);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "bonus"})
    void fromDisplayNameShouldDefaultToOther(String value) {
        assertThat(IncomeCategory.fromDisplayName(value)).isEqualTo(IncomeCategory.OTHER);
    }

    @Test
    void getDisplayNameShouldBeTheWireValue() {
        assertThat(IncomeCategory.INVESTMENT.getDisplayName()).isEqualTo("Investment");
    }
}
