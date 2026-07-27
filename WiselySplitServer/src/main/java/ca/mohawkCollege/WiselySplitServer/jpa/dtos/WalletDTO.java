package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletDTO {

    private Integer walletId;

    private Integer userId;

    @NotBlank(message = "walletName cannot be empty")
    private String name;

    private double initialBalance = 0.00;

    private String cardName;

    private String color;
}
