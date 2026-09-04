package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletWithExpensesResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Entry;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.EntryRepo;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.WalletResponseRowMapper;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.WalletWithExpensesResponseRowMapper;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthorizationService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WalletServiceJPA {

    @Autowired
    private WalletRepo walletRepo;

    @Autowired @Qualifier("authz")
    private AuthorizationService authzService;

    @Autowired
    private UserRepo userRepo;
    @Autowired private EntryRepo entryRepo;

    @Transactional
    public WalletResponseDTO updateWallet(WalletUpdateRequestDTO walletRequestDTO) {
        authzService.requireOwnsWallet(walletRequestDTO.walletId());

        Wallet walletToUpdate = walletRepo.findById(walletRequestDTO.walletId())
                .orElseThrow(()-> new NullPointerException("Wallet with ID:" + walletRequestDTO.walletId() + " not found"));

        walletToUpdate.setName(walletRequestDTO.name());
        walletToUpdate.setCardName(walletRequestDTO.cardName());
        walletToUpdate.setColor(walletRequestDTO.color());

        //swapping new InitialBalance with Old InitialBalance in wallet balance
        BigDecimal balanceWithOutInitialBalance = walletToUpdate.getBalance().subtract(walletToUpdate.getInitialBalance());
        BigDecimal balanceWithNewInitialBalance = balanceWithOutInitialBalance.add(walletRequestDTO.initialBalance());
        walletToUpdate.setBalance(balanceWithNewInitialBalance);

        walletToUpdate.setInitialBalance(walletRequestDTO.initialBalance());
        Wallet saved = walletRepo.save(walletToUpdate);

        return WalletResponseRowMapper.toDto(saved);
    }

    @Transactional
    public WalletResponseDTO createWallet(long userId, WalletRequestDTO walletRequestDTO) {
        User user = userRepo.findById(userId).orElseThrow(() -> new BusinessException(StatusCode.WALLET_NOT_FOUND, "User not found"));

        Wallet newWallet = new Wallet();
        newWallet.setUser(user);
        newWallet.setName(walletRequestDTO.getName());
        newWallet.setCardName(walletRequestDTO.getCardName());
        newWallet.setColor(walletRequestDTO.getColor());
        newWallet.setInitialBalance(walletRequestDTO.getInitialBalance());
        newWallet.setBalance(walletRequestDTO.getInitialBalance());

        Wallet savedWallet = walletRepo.save(newWallet);

        return WalletResponseRowMapper.toDto(savedWallet);
    }

    @Transactional
    public List<WalletResponseDTO> getWallets(long userId) {
        authzService.requireSelf(userId);
        List<Wallet> walletList = walletRepo.findAllByUser_UserIdIs(userId);
        return WalletResponseRowMapper.toDtoList(walletList);
    }

    /** Fetch Shared + Personal Expenses (Grouped by Wallet)
     * */
    @Transactional
    public List<WalletWithExpensesResponseDTO> getExpensesGroupedByWallet(long userId){
        authzService.requireSelf(userId);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new BusinessException(StatusCode.USER_NOT_FOUND, "Fetching Wallet Expenses for User failed, User not found!"));

        List<Wallet> wallets = user.getWallets();
        if (null == wallets) throw new BusinessException(StatusCode.NO_WALLETS_FOUND);

        return wallets.stream()
                .map(wallet -> {
                    List<Entry> entryListOfWallet = entryRepo.findAllByWallet(wallet.getWalletId());
                    return WalletWithExpensesResponseRowMapper.toDto(wallet, entryListOfWallet);
                })
                .toList();
    }

    @Transactional
    public void deleteWallet(long walletId) {
        authzService.requireOwnsWallet(walletId);

        if (walletRepo.existsById(walletId)) {
            walletRepo.deleteById(walletId);
        } else throw new BusinessException(StatusCode.WALLET_DELETE_FAILED, "Wallet not found");
    }

}