package ca.mohawk_college.wiselysplit_server.jpa.dtos;

import java.math.BigDecimal;

public record FriendResponseForListDTO (
        Long UserId,
        String name,
        String userName,
        String profilePicture,
        BigDecimal amountOwedOrLentToUser
){
}
