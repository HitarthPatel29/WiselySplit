package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;

import java.util.List;
import java.util.stream.Collectors;

public class WalletResponseRowMapper {
    public static WalletResponseDTO toDto(Wallet wallet) {
        if (wallet == null) {
            return null;
        }

        return new WalletResponseDTO(
                wallet.getWalletId(),
                wallet.getName(),
                wallet.getCardName(),
                wallet.getInitialBalance(),
                wallet.getBalance(),
                wallet.getColor()
        );
    }

    /**
     * Maps Wallets to WalletResponseForListDTO
     * @param wallets  -> Wallet to be mapped
     * @return list of WalletResponseDTO
     */
    public static List<WalletResponseDTO> toDtoList(List<Wallet> wallets) {
        return wallets.stream()
                .map(wallet -> toDto(wallet))
                .collect(Collectors.toList());
    }
}
