package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppConstantsTest {

    @Test
    void csvBatchLimitShouldBe150() {
        assertThat(AppConstants.MAX_ROWS_IN_CSV_BATCH).isEqualTo(150);
    }
}
