package ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet;

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
public class WalletDTO {

    private Long walletId;

    private Long userId;

    @NotBlank(message = "walletName cannot be empty")
    private String name;

    private BigDecimal initialBalance = BigDecimal.ZERO;

    private String cardName;

    private String color;
}
