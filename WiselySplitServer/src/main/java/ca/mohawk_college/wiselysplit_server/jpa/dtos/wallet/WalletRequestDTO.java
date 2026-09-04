package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletRequestDTO {

    @NotBlank(message = "walletName cannot be empty")
    private String name;

    private BigDecimal initialBalance = BigDecimal.ZERO;

    private String cardName;

    private WalletColor color;
}
