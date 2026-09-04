package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.TransferResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Transfer;

import java.util.List;
import java.util.stream.Collectors;

public class TransferResponseForListRowMapper {
    public static TransferResponseForListDTO toDto(Transfer transfer) {
        if (transfer == null) {
            return null;
        }

        WalletResponseForListDTO fromWalletDTO = (transfer.getFromWallet() != null)
                ? new WalletResponseForListDTO(
                            transfer.getFromWallet().getWalletId(),
                            transfer.getFromWallet().getName(),
                            transfer.getFromWallet().getColor())
                : null;
        WalletResponseForListDTO toWalletDTO = (transfer.getToWallet() != null)
                ? new WalletResponseForListDTO(
                transfer.getToWallet().getWalletId(),
                transfer.getToWallet().getName(),
                transfer.getToWallet().getColor())
                : null;

        return new TransferResponseForListDTO(
                transfer.getEntryId(),
                transfer.getAmount(),
                transfer.getTitle(),
                transfer.getDate(),
                transfer.getEntryType(),
                fromWalletDTO,
                toWalletDTO
        );
    }

    /**
     * Maps Transfers to TransferResponseForListDTO
     * @param transfers  -> Transfer to be mapped
     * @return list of TransferResponseForListDTO
     */
    public static List<TransferResponseForListDTO> toDtoList(List<Transfer> transfers) {
        return transfers.stream()
                .map(transfer -> toDto(transfer))
                .collect(Collectors.toList());
    }
}
