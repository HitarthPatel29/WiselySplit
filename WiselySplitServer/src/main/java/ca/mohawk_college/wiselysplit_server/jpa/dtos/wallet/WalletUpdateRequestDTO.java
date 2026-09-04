package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;


public record WalletUpdateRequestDTO (Long walletId,

    String name,

    BigDecimal initialBalance,

    String cardName,

    WalletColor color
    ){}
