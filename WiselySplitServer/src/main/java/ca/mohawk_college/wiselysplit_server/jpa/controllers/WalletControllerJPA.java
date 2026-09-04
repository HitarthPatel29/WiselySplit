package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.ResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.WalletServiceJPA;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jpa/me/wallets")
public class WalletControllerJPA {
    @Autowired
    private WalletServiceJPA walletService;

    /* Get all Wallets */
    @GetMapping
    public ResponseEntity<ResponseDTO> getWallets(@AuthenticationPrincipal AuthenticatedUser me) {
        List<WalletResponseDTO> wallets = walletService.getWallets(me.getUserId());
        return ResponseDTO.respond(StatusCode.SUCCESS, wallets);
    }

    @GetMapping("/with-expenses/")
    public ResponseEntity<ResponseDTO> getExpensesGroupedByWallets(@AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseDTO.respond(StatusCode.SUCCESS, walletService.getExpensesGroupedByWallet(me.getUserId()));
    }

    @PostMapping
    public ResponseEntity<ResponseDTO> createWallet(@AuthenticationPrincipal AuthenticatedUser me, @RequestBody WalletRequestDTO payload) {
        WalletResponseDTO result = walletService.createWallet(me.getUserId(), payload);
        return ResponseDTO.respond(StatusCode.CREATED, result);
    }

    @PreAuthorize("@authz.ownsWallet(#updateRequestDTO.walletId)")
    @PutMapping
    public ResponseEntity<ResponseDTO> updateExpense(@RequestBody WalletUpdateRequestDTO updateRequestDTO) {
       WalletResponseDTO result = walletService.updateWallet(updateRequestDTO);
        return ResponseDTO.respond(StatusCode.UPDATED, result);
    }

    @PreAuthorize("@authz.ownsWallet(#walletId)")
    @DeleteMapping("/{walletId}")
    public ResponseEntity<ResponseDTO> deleteWallet(@PathVariable long walletId) {
        walletService.deleteWallet(walletId);
        return ResponseDTO.respond(StatusCode.DELETED);
    }
}
