package ca.mohawkCollege.wiselySplitServer.jpa.entities;

import ca.mohawkCollege.wiselySplitServer.models.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "User")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID", columnDefinition = "BIGINT")
    private Integer userId;

    @NotBlank(message = "Name cannot be empty")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    @Column(name = "Name", columnDefinition = "VARCHAR")
    private String name;

    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(name = "UserName", columnDefinition = "VARCHAR")
    private String userName;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Not a valid email!")
    @Column(name = "Email", columnDefinition = "VARCHAR")
    private String email;

    @Column(name = "PhoneNum", columnDefinition = "BIGINT")
    private Integer phoneNum;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Column(name = "Password", columnDefinition = "VARCHAR")
    private String password;

    @Column(name = "ProfilePicture", columnDefinition = "VARCHAR")
    private String profilePicture;

    @Column(name = "StripeAccountId", columnDefinition = "VARCHAR")
    private String stripeAccountId;

    @Column(name = "Role", columnDefinition = "VARCHAR")
    private String role = Role.DEFAULT;
}
