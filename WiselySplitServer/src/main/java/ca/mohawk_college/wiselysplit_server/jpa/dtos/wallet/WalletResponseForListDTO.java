package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;

public record WalletResponseForListDTO (Long walletId, String name, WalletColor color){}
