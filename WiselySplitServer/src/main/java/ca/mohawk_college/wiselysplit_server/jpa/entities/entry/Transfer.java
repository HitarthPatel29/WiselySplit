package ca.mohawk_college.wiselysplit_server.jpa.entities.entry;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@SuperBuilder
@DiscriminatorValue("transfer")
public class Transfer extends Entry {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PayerID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WalletID", nullable = true) // source wallet
    private Wallet fromWallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ToWalletID", nullable = true) // destination wallet
    private Wallet toWallet;

    @Override
    public EntryType getEntryType() { return EntryType.TRANSFER; }
}