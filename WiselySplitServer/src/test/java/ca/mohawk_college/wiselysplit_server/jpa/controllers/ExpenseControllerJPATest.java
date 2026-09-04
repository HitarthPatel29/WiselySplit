package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.GlobalExceptionHandler;
import ca.mohawk_college.wiselysplit_server.jpa.constants.AppConstants;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.PersonalSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.PersonalExpenseAutomationRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.ExpenseServiceJPA;
import ca.mohawk_college.wiselysplit_server.jpa.support.SecurityTestSupport;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import ca.mohawk_college.wiselysplit_server.models.dtos.PersonalExpenseImportDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExpenseControllerJPATest {

    @Mock private ExpenseServiceJPA expenseService;
    @Mock private AuthenticationManager authManager;
    @InjectMocks private ExpenseControllerJPA controller;

    private MockMvc mvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(converter)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityTestSupport.clearContext();
    }

    @Nested
    class Create {

        @Test
        void shouldReturnCreatedForSharedExpense() throws Exception {
            when(expenseService.createSharedExpense(any())).thenReturn(100L);

            mvc.perform(post("/api/jpa/expenses/shared")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "title": "Dinner",
                                      "amount": 100.00,
                                      "date": "2026-03-15",
                                      "category": "Food & Dining",
                                      "payerId": 1,
                                      "participants": [{"userId": 1, "amount": 100.00, "portion": 1}]
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.CREATED.getCode()))
                    .andExpect(jsonPath("$.data").value(100));
        }

        @Test
        void shouldReturnValidationErrorWhenAmountMissing() throws Exception {
            mvc.perform(post("/api/jpa/expenses/shared")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "title": "Dinner",
                                      "date": "2026-03-15",
                                      "payerId": 1,
                                      "participants": [{"userId": 1, "amount": 1, "portion": 1}]
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.VALIDATION_ERROR.getCode()))
                    .andExpect(jsonPath("$.data.fields.amount").exists());
            verify(expenseService, never()).createSharedExpense(any());
        }

        @Test
        void shouldReturnCreatedForPersonalExpense() throws Exception {
            when(expenseService.createPersonalExpense(any())).thenReturn(12L);

            mvc.perform(post("/api/jpa/expenses/personal")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "title": "Coffee",
                                      "amount": 4.50,
                                      "date": "2026-03-15",
                                      "category": "Food & Dining",
                                      "payerId": 1
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.CREATED.getCode()))
                    .andExpect(jsonPath("$.data").value(12));
        }

        @Test
        void shouldRejectEmptyBatch() throws Exception {
            mvc.perform(post("/api/jpa/expenses/personal/batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("[]"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.EMPTY_BATCH.getCode()));
            verify(expenseService, never()).createPersonalExpensesBatch(anyList());
        }

        @Test
        void shouldRejectOversizedBatch() throws Exception {
            List<PersonalExpenseImportDTO> rows = new ArrayList<>();
            for (int i = 0; i < AppConstants.MAX_ROWS_IN_CSV_BATCH + 1; i++) {
                PersonalExpenseImportDTO row = new PersonalExpenseImportDTO();
                row.setTitle("r" + i);
                row.setAmount(1);
                row.setPayerId(1L);
                rows.add(row);
            }

            mvc.perform(post("/api/jpa/expenses/personal/batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(rows)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.BATCH_SIZE_EXCEEDED.getCode()))
                    .andExpect(jsonPath("$.data.maxRows").value(150));
        }

        @Test
        void shouldCreateBatchWhenWithinLimit() throws Exception {
            when(expenseService.createPersonalExpensesBatch(anyList())).thenReturn(Map.of("inserted", 1, "skipped", List.of()));

            mvc.perform(post("/api/jpa/expenses/personal/batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    [{"title":"Coffee","date":"2026-03-15","amount":3.5,"payerId":1}]
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.CREATED.getCode()))
                    .andExpect(jsonPath("$.data.inserted").value(1));
        }

        @Test
        void shouldRejectAutomationWhenCredentialsMissing() {
            PersonalExpenseAutomationRequestDTO request =
                    new PersonalExpenseAutomationRequestDTO("Diner", "12", "td", TestData.DATE, null, null);

            org.assertj.core.api.Assertions.assertThatThrownBy(
                            () -> controller.createPersonalExpenseWithAutomation(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.MISSING_REQUIRED_FIELD);
        }

        @Test
        void shouldMapBadCredentialsOnAutomation() throws Exception {
            when(authManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("bad"));

            mvc.perform(post("/api/jpa/expenses/personal/automation")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionTitle": "Diner",
                                      "amount": "12.50",
                                      "cardName": "tdChequing",
                                      "transactionDate": "2026-03-15",
                                      "userEmail": "alice@example.com",
                                      "password": "wrong"
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.INVALID_CREDENTIALS.getCode()));
            verify(expenseService, never()).createPersonalExpenseWithAutomation(any());
        }

        @Test
        void shouldCreateAutomationExpenseAfterAuth() throws Exception {
            when(expenseService.createPersonalExpenseWithAutomation(any())).thenReturn(44L);

            mvc.perform(post("/api/jpa/expenses/personal/automation")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionTitle": "Diner",
                                      "amount": "12.50",
                                      "cardName": "tdChequing",
                                      "transactionDate": "2026-03-15",
                                      "userEmail": "alice@example.com",
                                      "password": "Test@123"
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.CREATED.getCode()))
                    .andExpect(jsonPath("$.data").value(44));
        }

        @Test
        void shouldCreatePayment() throws Exception {
            when(expenseService.createPayment(any())).thenReturn(Map.of("success", true, "paymentId", 55L));

            mvc.perform(post("/api/jpa/expenses/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"amount":40,"payerId":1,"receiverId":2}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.CREATED.getCode()))
                    .andExpect(jsonPath("$.data.paymentId").value(55));
        }
    }

    @Nested
    class ReadsUpdatesDeletes {

        @Test
        void shouldGetExpense() throws Exception {
            ExpenseResponseDTO dto = new ExpenseResponseDTO();
            dto.setExpenseId(10L);
            dto.setAmount(new BigDecimal("9.00"));
            when(expenseService.getExpenseDetails(10L)).thenReturn(dto);

            mvc.perform(get("/api/jpa/expenses/10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()))
                    .andExpect(jsonPath("$.data.expenseId").value(10));
        }

        @Test
        void shouldDenySummaryWhenPrincipalMissing() throws Exception {
            mvc.perform(get("/api/jpa/expenses/me/summary")
                            .param("startDate", "2026-03-01")
                            .param("endDate", "2026-03-31"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.ACCESS_DENIED.getCode()));
            verify(expenseService, never()).getPersonalSummary(anyLong(), any(), any());
        }

        @Test
        void shouldUseJwtUserIdForSummary() throws Exception {
            SecurityTestSupport.asUser(7L);
            when(expenseService.getPersonalSummary(eq(7L), any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(PersonalSummaryResponseDTO.builder()
                            .netStanding(BigDecimal.ZERO)
                            .totalIncome(BigDecimal.ZERO)
                            .totalExpense(BigDecimal.ZERO)
                            .totalAmountLent(BigDecimal.ZERO)
                            .totalAmountOwed(BigDecimal.ZERO)
                            .expenses(List.of())
                            .incomes(List.of())
                            .build());

            mvc.perform(get("/api/jpa/expenses/me/summary")
                            .param("startDate", "2026-03-01")
                            .param("endDate", "2026-03-31"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()))
                    .andExpect(jsonPath("$.data.netStanding").value(0));
            verify(expenseService).getPersonalSummary(7L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));
        }

        @Test
        void shouldGroupByWalletsUsingPrincipal() throws Exception {
            SecurityTestSupport.asUser(7L);
            when(expenseService.getExpensesGroupedByWallet(7L)).thenReturn(List.of());

            mvc.perform(get("/api/jpa/expenses/me/group-by-wallets/"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()));
            verify(expenseService).getExpensesGroupedByWallet(7L);
        }

        @Test
        void shouldDeleteExpense() throws Exception {
            mvc.perform(delete("/api/jpa/expenses/10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.DELETED.getCode()))
                    .andExpect(jsonPath("$.data.expenseId").value(10));
            verify(expenseService).deleteExpense(10L);
        }

        @Test
        void shouldUpdateExpense() throws Exception {
            ExpenseResponseDTO dto = new ExpenseResponseDTO();
            dto.setExpenseId(10L);
            when(expenseService.updateExpense(any(ExpenseUpdateRequestDTO.class))).thenReturn(dto);

            mvc.perform(put("/api/jpa/expenses")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "expenseId": 10,
                                      "title": "Updated",
                                      "amount": 15.00,
                                      "date": "2026-03-15",
                                      "category": "Other",
                                      "payerId": 1,
                                      "isPersonal": true
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.UPDATED.getCode()));
        }
    }
}
