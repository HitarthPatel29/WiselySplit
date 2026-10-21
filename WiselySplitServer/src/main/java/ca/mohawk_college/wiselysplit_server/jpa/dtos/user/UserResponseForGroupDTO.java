package ca.mohawk_college.wiselysplit_server.jpa.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseForGroupDTO{
    Long userId;
    String name;
    String userName;
    String profilePicture;
    BigDecimal amountLentOrOwedToUser =  BigDecimal.ZERO;
}
