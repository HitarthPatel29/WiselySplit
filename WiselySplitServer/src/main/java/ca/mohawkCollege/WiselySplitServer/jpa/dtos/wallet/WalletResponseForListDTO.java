package ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record WalletResponseForListDTO (Long walletId, String name, String color){}
