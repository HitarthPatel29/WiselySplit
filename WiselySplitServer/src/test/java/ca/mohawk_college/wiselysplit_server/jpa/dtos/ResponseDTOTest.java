package ca.mohawk_college.wiselysplit_server.jpa.dtos;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class ResponseDTOTest {

    @Test
    void ofShouldCopyCodeAndDescriptionOnlyFromStatusCode() {
        ResponseDTO dto = ResponseDTO.of(StatusCode.SPLIT_AMOUNT_MISMATCH, "payload");

        assertThat(dto.getStatusCode()).isEqualTo("0507");
        assertThat(dto.getStatusDescription()).isEqualTo(StatusCode.SPLIT_AMOUNT_MISMATCH.getDescription());
        assertThat(dto.getStatusDescription()).doesNotContain("SQL", "Expenses", "stack");
        assertThat(dto.getData()).isEqualTo("payload");
        assertThat(dto.getTraceId()).isNull();
    }

    @Test
    void ofWithoutDataShouldLeaveDataNull() {
        ResponseDTO dto = ResponseDTO.of(StatusCode.SUCCESS);

        assertThat(dto.getData()).isNull();
        assertThat(dto.getStatusCode()).isEqualTo("0000");
    }

    @Test
    void respondShouldAlwaysUseHttp200() {
        ResponseEntity<ResponseDTO> response = ResponseDTO.respond(StatusCode.CREATED, 42L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatusCode()).isEqualTo("0010");
        assertThat(response.getBody().getData()).isEqualTo(42L);
    }

    @Test
    void respondWithoutDataShouldLeaveDataNull() {
        ResponseEntity<ResponseDTO> response = ResponseDTO.respond(StatusCode.DELETED);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().getData()).isNull();
        assertThat(response.getBody().getStatusCode()).isEqualTo("0012");
    }

    @Test
    void withTraceIdShouldStampCorrelationId() {
        ResponseDTO dto = ResponseDTO.of(StatusCode.INTERNAL_ERROR).withTraceId("trace-1");

        assertThat(dto.getTraceId()).isEqualTo("trace-1");
    }
}
