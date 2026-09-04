package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.exceptions.GlobalExceptionHandler;
import ca.mohawk_college.wiselysplit_server.exceptions.UserNotFoundException;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.UserService;
import ca.mohawk_college.wiselysplit_server.services.user.ImageUploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerJPATest {

    @Mock private UserService userService;
    @Mock private ImageUploadService imageUploadService;
    @InjectMocks private UserControllerJPA controller;
    private MockMvc mvc;

    private final UserResponseDTO alice = new UserResponseDTO(
            1L, "Alice", "alice", "alice@example.com", 555L, "pic", null);

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void shouldCreateUserWithoutPicture() throws Exception {
        when(userService.createUser(any())).thenReturn(alice);

        mvc.perform(multipart("/api/jpa/users")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "alice@example.com")
                        .param("password", "Test@123"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void shouldUploadPictureOnCreate() throws Exception {
        when(imageUploadService.uploadProfilePicture(any())).thenReturn("https://cdn.example.com/a.png");
        when(userService.createUser(any())).thenReturn(alice);
        MockMultipartFile picture = new MockMultipartFile(
                "profilePicture", "a.png", "image/png", new byte[]{1, 2, 3});

        mvc.perform(multipart("/api/jpa/users")
                        .file(picture)
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "alice@example.com")
                        .param("password", "Test@123"))
                .andExpect(status().isCreated());
        verify(imageUploadService).uploadProfilePicture(any());
    }

    @Test
    void shouldReturnBadRequestWhenCreateThrowsIllegalArgument() throws Exception {
        when(userService.createUser(any())).thenThrow(new IllegalArgumentException("Invalid email format"));

        mvc.perform(multipart("/api/jpa/users")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "bad")
                        .param("password", "Test@123"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnServerErrorWhenCreateThrowsUnexpected() throws Exception {
        when(userService.createUser(any())).thenThrow(new RuntimeException("boom"));

        mvc.perform(multipart("/api/jpa/users")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "alice@example.com")
                        .param("password", "Test@123"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void shouldGetUserByIdAndEmail() throws Exception {
        when(userService.getUserById(1L)).thenReturn(alice);
        when(userService.getUserByEmail("alice@example.com")).thenReturn(alice);

        mvc.perform(get("/api/jpa/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value("alice"));
        mvc.perform(get("/api/jpa/users/email/alice@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void checkUsernameShouldExcludeCurrentUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(alice);

        mvc.perform(get("/api/jpa/users/1/check-username").param("username", "alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkUsernameShouldReportTakenWhenDifferentUserHoldsIt() throws Exception {
        when(userService.getUserById(1L)).thenReturn(alice);
        when(userService.checkUserNameExists("bob")).thenReturn(true);

        mvc.perform(get("/api/jpa/users/1/check-username").param("username", "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void checkEmailShouldExcludeCurrentUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(alice);

        mvc.perform(get("/api/jpa/users/1/check-email").param("email", "alice@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkEmailShouldReportTakenWhenDifferentUserHoldsIt() throws Exception {
        when(userService.getUserById(1L)).thenReturn(alice);
        when(userService.checkEmailExists("bob@example.com")).thenReturn(true);

        mvc.perform(get("/api/jpa/users/1/check-email").param("email", "bob@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void publicAvailabilityChecksShouldInvertExists() throws Exception {
        when(userService.checkUserNameExists("alice")).thenReturn(true);
        when(userService.checkEmailExists("free@example.com")).thenReturn(false);

        mvc.perform(get("/api/jpa/users/check-username").param("username", "alice"))
                .andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/api/jpa/users/check-email").param("email", "free@example.com"))
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void shouldUpdateUser() throws Exception {
        when(userService.updateUser(any(UserUpdateRequestDTO.class))).thenReturn(alice);

        mvc.perform(multipart("/api/jpa/users/1")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "alice@example.com")
                        .param("phoneNum", "555")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void shouldReturnBadRequestWhenUpdateThrowsIllegalArgument() throws Exception {
        when(userService.updateUser(any())).thenThrow(new IllegalArgumentException("Invalid email format"));

        mvc.perform(multipart("/api/jpa/users/1")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "bad")
                        .param("phoneNum", "555")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnServerErrorWhenUpdateThrowsUnexpected() throws Exception {
        when(userService.updateUser(any())).thenThrow(new RuntimeException("boom"));

        mvc.perform(multipart("/api/jpa/users/1")
                        .param("name", "Alice")
                        .param("userName", "alice")
                        .param("email", "alice@example.com")
                        .param("phoneNum", "555")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void shouldDeleteAndListUsers() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(alice));

        mvc.perform(delete("/api/jpa/users/1")).andExpect(status().isNoContent());
        verify(userService).deleteUser(1L);

        mvc.perform(get("/api/jpa/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(1));
    }

    @Test
    void shouldGetConnections() throws Exception {
        when(userService.getUserConnections(1L))
                .thenReturn(new UserService.ConnectionListDTO(List.of(), List.of()));

        mvc.perform(get("/api/jpa/users/1/connections"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnServerErrorWhenConnectionsFail() throws Exception {
        when(userService.getUserConnections(1L)).thenThrow(new UserNotFoundException("missing"));

        mvc.perform(get("/api/jpa/users/1/connections"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }
}
