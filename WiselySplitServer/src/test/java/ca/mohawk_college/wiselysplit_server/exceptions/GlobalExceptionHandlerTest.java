package ca.mohawk_college.wiselysplit_server.exceptions;

import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Locks down the response contract. These assertions are the reason the rest of the code is
 * allowed to throw freely: they prove that whatever is thrown, the caller gets an envelope with a
 * known code and no internal detail.
 */
class GlobalExceptionHandlerTest {

    /** Stands in for a real controller so the handler can be exercised without a database. */
    @RestController
    static class ProbeController {

        @GetMapping("/probe/business")
        String business() {
            throw new BusinessException(StatusCode.INVITE_ALREADY_EXISTS,
                    "sender 7 already invited bob@example.com to group 3");
        }

        @GetMapping("/probe/subclass")
        String subclass() {
            throw new UserNotFoundException("user 42 is missing from the Users table");
        }

        @GetMapping("/probe/details")
        String details() {
            throw new BusinessException(StatusCode.BATCH_SIZE_EXCEEDED, "diagnostic text")
                    .withDetails(Map.of("maxRows", 150));
        }

        @GetMapping("/probe/boom")
        String boom() {
            throw new IllegalStateException("jdbc connection reset from 10.0.0.5 on table Expenses");
        }

        @GetMapping("/probe/enum/{status}")
        String enumParam(@PathVariable InviteStatus status) {
            return status.name();
        }
    }

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ProbeController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void businessExceptionKeepsItsStatusCodeAndStaysHttp200() throws Exception {
        mvc.perform(get("/probe/business"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.INVITE_ALREADY_EXISTS.getCode()))
                .andExpect(jsonPath("$.statusDescription").value(StatusCode.INVITE_ALREADY_EXISTS.getDescription()))
                .andExpect(jsonPath("$.traceId").value(nullValue()));
    }

    @Test
    void diagnosticMessageNeverReachesTheCaller() throws Exception {
        String body = mvc.perform(get("/probe/business"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body)
                .doesNotContain("bob@example.com")
                .doesNotContain("sender 7");
    }

    @Test
    void businessExceptionSubclassesResolveThroughTheSameHandler() throws Exception {
        mvc.perform(get("/probe/subclass"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.USER_NOT_FOUND.getCode()));
    }

    @Test
    void detailsAreSurfacedAsData() throws Exception {
        mvc.perform(get("/probe/details"))
                .andExpect(jsonPath("$.statusCode").value(StatusCode.BATCH_SIZE_EXCEEDED.getCode()))
                .andExpect(jsonPath("$.data.maxRows").value(150));
    }

    @Test
    void unexpectedFaultIsAnonymisedAndGivenATraceId() throws Exception {
        String body = mvc.perform(get("/probe/boom"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.INTERNAL_ERROR.getCode()))
                .andReturn().getResponse().getContentAsString();

        assertThat(body)
                .doesNotContain("jdbc")
                .doesNotContain("10.0.0.5")
                .doesNotContain("IllegalStateException");
    }

    @Test
    void traceIdOnAFaultIsAUsableIdentifier() throws Exception {
        String body = mvc.perform(get("/probe/boom")).andReturn().getResponse().getContentAsString();
        String traceId = body.replaceAll("(?s).*\"traceId\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        assertThat(UUID.fromString(traceId)).isNotNull();
    }

    @Test
    void unparseableEnumReportsTheAcceptedValues() throws Exception {
        mvc.perform(get("/probe/enum/NOT_A_STATUS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.INVALID_ENUM_VALUE.getCode()))
                .andExpect(jsonPath("$.data.parameter").value("status"))
                .andExpect(jsonPath("$.data.accepted").isArray())
                .andExpect(jsonPath("$.data.accepted[0]").value(InviteStatus.PENDING.name()));
    }

    @Test
    void rejectedEnumValueIsNotEchoedBack() throws Exception {
        String body = mvc.perform(get("/probe/enum/NOT_A_STATUS"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain("NOT_A_STATUS");
    }
}
