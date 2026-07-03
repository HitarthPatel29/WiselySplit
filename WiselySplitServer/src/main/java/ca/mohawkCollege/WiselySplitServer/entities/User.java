package ca.mohawkCollege.wiselySplitServer.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID", columnDefinition = "BIGINT")
    private Integer userId;

    @Column(name = "Name", columnDefinition = "VARCHAR")
    private String name;

    @Column(name = "UserName", columnDefinition = "VARCHAR")
    private String userName;

    @Email(message = "Not a valid email!")
    @Column(name = "Email", columnDefinition = "VARCHAR")
    private String email;

    @Column(name = "PhoneNum", columnDefinition = "BIGINT")
    private Integer phoneNum;

    @Size(min = 6, message = "Password must be at least 6 characters long")
    @Column(name = "Password", columnDefinition = "VARCHAR")
    private String password;

    @Column(name = "ProfilePicture", columnDefinition = "VARCHAR")
    private String profilePicture;

    @Column(name = "StripeAccountId", columnDefinition = "VARCHAR")
    private String stripeAccountId;

    @Column(name = "Role", columnDefinition = "VARCHAR")
    private String role;
}
