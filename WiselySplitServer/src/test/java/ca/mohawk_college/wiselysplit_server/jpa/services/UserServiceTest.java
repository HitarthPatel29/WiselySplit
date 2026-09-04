package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.InviteDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.DuplicateUserException;
import ca.mohawk_college.wiselysplit_server.exceptions.UserNotFoundException;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final String DEFAULT_AVATAR = "https://cdn.example.com/default.png";

    @Mock private UserRepo userRepo;
    @Mock private InviteDAO inviteDAO;
    @Mock private InviteServiceJPA inviteService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void injectAvatar() {
        ReflectionTestUtils.setField(userService, "DEFAULT_AVATAR_URL", DEFAULT_AVATAR);
    }

    @Nested
    class CreateUser {

        @Test
        void shouldRejectInvalidEmail() {
            User user = newUser("not-an-email", "Test@123");

            assertThatThrownBy(() -> userService.createUser(user))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid email");
            verify(userRepo, never()).save(any());
        }

        @Test
        void shouldRejectWeakPassword() {
            User user = newUser("alice@example.com", "password");

            assertThatThrownBy(() -> userService.createUser(user))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Weak password");
        }

        @Test
        void shouldRejectDuplicateEmail() {
            User user = newUser("alice@example.com", "Test@123");
            when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(TestData.user(9L)));

            assertThatThrownBy(() -> userService.createUser(user))
                    .isInstanceOf(DuplicateUserException.class);
        }

        @Test
        void shouldRejectDuplicateUsername() {
            User user = newUser("alice@example.com", "Test@123");
            when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepo.findByUserName("alice")).thenReturn(Optional.of(TestData.user(9L)));

            assertThatThrownBy(() -> userService.createUser(user))
                    .isInstanceOf(DuplicateUserException.class);
        }

        @Test
        void shouldHashPasswordApplyDefaultAvatarAndLinkInvites() {
            User user = newUser("alice@example.com", "Test@123");
            user.setProfilePicture(null);
            when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepo.findByUserName(anyString())).thenReturn(Optional.empty());
            when(userRepo.save(any(User.class))).thenAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                saved.setUserId(42L);
                return saved;
            });

            UserResponseDTO dto = userService.createUser(user);

            assertThat(dto.getUserId()).isEqualTo(42L);
            assertThat(dto.getProfilePicture()).isEqualTo(DEFAULT_AVATAR);
            assertThat(user.getPassword()).isNotEqualTo("Test@123");
            assertThat(user.getPassword()).startsWith("$2");
            verify(inviteDAO).linkInvitesToUser("alice@example.com", 42L);
        }

        @Test
        void shouldTranslateIntegrityViolationToDuplicateUser() {
            User user = newUser("alice@example.com", "Test@123");
            when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepo.findByUserName(anyString())).thenReturn(Optional.empty());
            when(userRepo.save(any(User.class))).thenThrow(new DataIntegrityViolationException("dup"));

            assertThatThrownBy(() -> userService.createUser(user))
                    .isInstanceOf(DuplicateUserException.class);
        }

        private User newUser(String email, String password) {
            User user = new User();
            user.setName("Alice");
            user.setUserName("alice");
            user.setEmail(email);
            user.setPassword(password);
            return user;
        }
    }

    @Nested
    class ReadsAndDeletes {

        @Test
        void getUserByEmailShouldThrowWhenMissing() {
            when(userRepo.findByEmail("missing@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserByEmail("missing@example.com"))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void getUserByIdShouldMapDto() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(TestData.user(1L, "Alice")));

            UserResponseDTO dto = userService.getUserById(1L);

            assertThat(dto.getUserId()).isEqualTo(1L);
            assertThat(dto.getEmail()).isEqualTo("alice@example.com");
        }

        @Test
        void deleteUserShouldDelegate() {
            userService.deleteUser(3L);
            verify(userRepo).deleteById(3L);
        }

        @Test
        void getAllUsersShouldMapEach() {
            when(userRepo.findAll()).thenReturn(List.of(TestData.user(1L), TestData.user(2L)));

            assertThat(userService.getAllUsers()).hasSize(2);
        }

        @Test
        void existenceChecksShouldUseRepo() {
            when(userRepo.findByUserName("alice")).thenReturn(Optional.of(TestData.user(1L)));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.empty());

            assertThat(userService.checkUserNameExists("alice")).isTrue();
            assertThat(userService.checkEmailExists("bob@example.com")).isFalse();
        }
    }

    @Nested
    class UpdateUser {

        @Test
        void shouldRejectUnknownUser() {
            when(userRepo.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(update(1L, "alice@example.com", "alice")))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void shouldRejectInvalidEmail() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(TestData.user(1L, "Alice")));

            assertThatThrownBy(() -> userService.updateUser(update(1L, "bad", "alice")))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void shouldRejectUsernameTakenBySomeoneElse() {
            User existing = TestData.user(1L, "Alice");
            existing.setEmail("alice@example.com");
            existing.setUserName("alice");
            when(userRepo.findById(1L)).thenReturn(Optional.of(existing));
            when(userRepo.findByUserName("bob")).thenReturn(Optional.of(TestData.user(2L)));

            assertThatThrownBy(() -> userService.updateUser(update(1L, "alice@example.com", "bob")))
                    .isInstanceOf(DuplicateUserException.class);
        }

        @Test
        void shouldRejectEmailTakenBySomeoneElse() {
            User existing = TestData.user(1L, "Alice");
            existing.setEmail("alice@example.com");
            existing.setUserName("alice");
            when(userRepo.findById(1L)).thenReturn(Optional.of(existing));
            when(userRepo.findByEmail("taken@example.com")).thenReturn(Optional.of(TestData.user(2L)));

            assertThatThrownBy(() -> userService.updateUser(update(1L, "taken@example.com", "alice")))
                    .isInstanceOf(DuplicateUserException.class);
        }

        @Test
        void shouldAllowKeepingSameEmailAndApplyDefaultAvatar() {
            User existing = TestData.user(1L, "Alice");
            existing.setEmail("alice@example.com");
            existing.setUserName("alice");
            when(userRepo.findById(1L)).thenReturn(Optional.of(existing));
            when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UserUpdateRequestDTO dto = update(1L, "alice@example.com", "alice");
            dto.setProfilePicture(null);

            UserResponseDTO result = userService.updateUser(dto);

            assertThat(result.getProfilePicture()).isEqualTo(DEFAULT_AVATAR);
            verify(userRepo).save(existing);
        }

        @Test
        void shouldTranslateIntegrityViolationOnUpdate() {
            User existing = TestData.user(1L, "Alice");
            existing.setEmail("alice@example.com");
            existing.setUserName("alice");
            when(userRepo.findById(1L)).thenReturn(Optional.of(existing));
            when(userRepo.save(any(User.class))).thenThrow(new DataIntegrityViolationException("dup"));

            assertThatThrownBy(() -> userService.updateUser(update(1L, "alice@example.com", "alice")))
                    .isInstanceOf(DuplicateUserException.class);
        }

        private UserUpdateRequestDTO update(long id, String email, String userName) {
            return new UserUpdateRequestDTO(id, "Alice", userName, email, 555L, null);
        }
    }

    @Nested
    class Connections {

        @Test
        void shouldRejectUnknownUser() {
            when(userRepo.findByIdWithGroupsAndParticipants(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserConnections(1L))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void shouldReturnFriendsAndGroups() {
            User alice = TestData.user(1L, "Alice");
            User bob = TestData.user(2L, "Bob");
            ExpenseGroup group = TestData.group(5L);
            group.setParticipants(Set.of(alice, bob));
            alice.setGroups(new HashSet<>(Set.of(group)));
            when(userRepo.findByIdWithGroupsAndParticipants(1L)).thenReturn(Optional.of(alice));
            when(inviteService.getFriendsOfUser(alice)).thenReturn(List.of(
                    new ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO(
                            2L, "Bob", "bob", "pic")));

            UserService.ConnectionListDTO connections = userService.getUserConnections(1L);

            assertThat(connections.friends()).hasSize(1);
            assertThat(connections.groups()).hasSize(1);
            assertThat(connections.groups().get(0).participants()).hasSize(2);
        }
    }
}
