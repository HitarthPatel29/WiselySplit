package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class StatusCodeTest {

    @Test
    void successCodesShouldBeAtOrBelow0099() {
        assertThat(StatusCode.SUCCESS.isSuccess()).isTrue();
        assertThat(StatusCode.NO_RESULTS.isSuccess()).isTrue();
        assertThat(StatusCode.VALIDATION_ERROR.isSuccess()).isFalse();
        assertThat(StatusCode.SPLIT_AMOUNT_MISMATCH.isSuccess()).isFalse();
    }

    @Test
    void fromCodeShouldResolveKnownWireCode() {
        assertThat(StatusCode.fromCode("0507")).isEqualTo(StatusCode.SPLIT_AMOUNT_MISMATCH);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "9998"})
    void fromCodeShouldFallBackToUnknown(String code) {
        assertThat(StatusCode.fromCode(code)).isEqualTo(StatusCode.UNKNOWN_ERROR);
    }

    @Test
    void descriptionsMustNotLeakInternals() {
        for (StatusCode status : StatusCode.values()) {
            assertThat(status.getDescription())
                    .doesNotContain("SQLException", "stack", "jdbc", "Hibernate");
            assertThat(status.getCode()).isNotBlank();
            assertThat(status.getHttpStatus()).isNotNull();
        }
    }
}
