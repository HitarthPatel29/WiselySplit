package ca.mohawkCollege.wiselySplitServer.jpa.dtos.user;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {

    private Long userId;

    private String name;

    private String userName;

    private String email;

    private Long phoneNum;

    private String profilePicture;

    private String stripeAccountId;

}
