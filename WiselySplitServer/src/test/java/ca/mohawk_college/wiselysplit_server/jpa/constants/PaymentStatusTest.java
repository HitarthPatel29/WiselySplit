package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentStatusTest {

    @Test
    void defaultShouldBeCreated() {
        assertThat(PaymentStatus.DEFAULT).isEqualTo("CREATED");
        assertThat(PaymentStatus.PENDING).isNotNull();
        assertThat(PaymentStatus.COMPLETED).isNotNull();
    }
}
