package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;

import java.util.List;
import java.util.stream.Collectors;

public class UserResponseForListRowMapper {
    public static UserResponseForListDTO toDto (User user){
        if (user == null) return null;

        return new UserResponseForListDTO(
                user.getUserId(),
                user.getName(),
                user.getUserName(),
                user.getProfilePicture()
        );
    }

    public static List<UserResponseForListDTO> toDtoList (List<User> users){
        if (users == null) return null;
        return users.stream()
                .map(UserResponseForListRowMapper::toDto)
                .collect(Collectors.toList());
    }
}
