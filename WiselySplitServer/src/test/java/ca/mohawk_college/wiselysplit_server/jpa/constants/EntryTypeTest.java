package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EntryTypeTest {

    @Test
    void defaultShouldBeExpense() {
        assertThat(EntryType.DEFAULT).isEqualTo("EXPENSE");
        assertThat(EntryType.TRANSFER).isNotNull();
        assertThat(EntryType.INCOME).isNotNull();
    }
}
