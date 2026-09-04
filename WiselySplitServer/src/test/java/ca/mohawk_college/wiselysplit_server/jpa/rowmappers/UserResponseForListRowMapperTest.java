package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserResponseForListRowMapperTest {

    @Test
    void shouldReturnNullWhenUserIsNull() {
        assertThat(UserResponseForListRowMapper.toDto(null)).isNull();
    }

    @Test
    void shouldMapIdentityFields() {
        UserResponseForListDTO dto = UserResponseForListRowMapper.toDto(TestData.user(5L, "Eve"));

        assertThat(dto.userId()).isEqualTo(5L);
        assertThat(dto.name()).isEqualTo("Eve");
        assertThat(dto.userName()).isEqualTo("eve");
        assertThat(dto.profilePicture()).isEqualTo("https://cdn.example.com/5.png");
    }

    @Test
    void shouldReturnNullWhenListIsNull() {
        assertThat(UserResponseForListRowMapper.toDtoList(null)).isNull();
    }

    @Test
    void shouldMapList() {
        List<UserResponseForListDTO> dtos =
                UserResponseForListRowMapper.toDtoList(List.of(TestData.user(1L), TestData.user(2L)));

        assertThat(dtos).extracting(UserResponseForListDTO::userId).containsExactly(1L, 2L);
    }
}
