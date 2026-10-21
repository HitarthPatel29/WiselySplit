package ca.mohawk_college.wiselysplit_server.jpa.dtos.group;

import ca.mohawk_college.wiselysplit_server.jpa.constants.GroupType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.multipart.MultipartFile;

public record GroupUpdateRequestDTO(
        @NotNull
        Long groupId,
        @NotBlank(message = "Group name required")
        @Pattern(
                regexp = "^[a-zA-Z0-9\\s]+$",
                message = "Name can only contain letters and numbers"
        )
        String groupName,
        @NotNull
        GroupType groupType,
        MultipartFile profilePicture) {}
