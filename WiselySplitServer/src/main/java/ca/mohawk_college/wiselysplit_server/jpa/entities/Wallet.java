package ca.mohawk_college.wiselysplit_server.jpa.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "Wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "WalletID", columnDefinition = "BIGINT")
    private Long walletId;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.DETACH)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @NotBlank(message = "walletName cannot be empty")
    @Column(name = "Name", columnDefinition = "VARCHAR")
    private String name;

    @Column(name = "InitialBalance", precision = 20, scale = 2)
    private BigDecimal initialBalance = BigDecimal.valueOf(0.00);

    @Column(name = "Balance", precision = 20, scale = 2)
    private BigDecimal balance = BigDecimal.valueOf(0.00);

    @Column(name = "CardName", columnDefinition = "VARCHAR")
    private String cardName;

    @Column(name = "Color", columnDefinition = "VARCHAR")
    private String color;
}
