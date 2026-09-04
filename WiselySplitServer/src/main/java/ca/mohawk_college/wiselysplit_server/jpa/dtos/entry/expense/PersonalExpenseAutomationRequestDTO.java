package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.expense;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDate;

//  Old Schema
//{
//        "amount": "iap34q",
//        "cardName": "tdChequing",
//        "transactionTitle": "Diner",
//        "transactionDate": "2026-05-08",
//        "userEmail": "patelhivi04@gmail.com",
//        "password" : "Test@123"
//}
public record PersonalExpenseAutomationRequestDTO(
        String transactionTitle,
        @NotBlank(message = "Amount can not be null")
        String amount,
        @NotBlank(message = "CardName cannot be null")
        String cardName,
//        @NotBlank(message = "Date cannot be null")
        LocalDate transactionDate,
        @NotBlank(message = "userEmail cannot be null")
        @Email(message = "Not a valid email")
        String userEmail,
        @NotBlank(message = "password cannot be null")
        String password
) {}
