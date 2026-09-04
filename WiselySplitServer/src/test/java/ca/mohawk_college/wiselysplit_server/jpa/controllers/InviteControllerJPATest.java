package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.GlobalExceptionHandler;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.invite.InviteResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.InviteServiceJPA;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InviteControllerJPATest {

    @Mock private InviteServiceJPA inviteService;
    @InjectMocks private InviteControllerJPA controller;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void shouldSendInvite() throws Exception {
        when(inviteService.sendInvite(1L, "bob@example.com", null)).thenReturn("sent");

        mvc.perform(post("/api/jpa/invite/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderId":1,"target":"bob@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.message").value("sent"));
    }

    @Test
    void shouldSurfaceBusinessExceptionFromSend() throws Exception {
        when(inviteService.sendInvite(anyLong(), any(), any()))
                .thenThrow(new BusinessException(StatusCode.INVITE_ALREADY_EXISTS));

        mvc.perform(post("/api/jpa/invite/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderId":1,"target":"bob@example.com","groupId":3}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.INVITE_ALREADY_EXISTS.getCode()))
                .andExpect(jsonPath("$.statusDescription").value(StatusCode.INVITE_ALREADY_EXISTS.getDescription()));
    }

    @Test
    void shouldUpdateInviteStatus() throws Exception {
        mvc.perform(put("/api/jpa/invite/4/status").param("status", "ACCEPTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.UPDATED.getCode()))
                .andExpect(jsonPath("$.data.inviteId").value(4))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
        verify(inviteService).updateInviteStatus(4L, InviteStatus.ACCEPTED);
    }

    @Test
    void shouldReturnNoResultsWhenBothListsEmpty() throws Exception {
        when(inviteService.getAllInvitesForUser(1L))
                .thenReturn(new InviteServiceJPA.SentAndReceivedInvitesForUserDTO(List.of(), List.of()));

        mvc.perform(get("/api/jpa/invite/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.NO_RESULTS.getCode()));
    }

    @Test
    void shouldReturnSuccessWhenInvitesPresent() throws Exception {
        InviteResponseDTO sent = new InviteResponseDTO();
        sent.setInviteId(1L);
        when(inviteService.getAllInvitesForUser(1L))
                .thenReturn(new InviteServiceJPA.SentAndReceivedInvitesForUserDTO(List.of(sent), List.of()));

        mvc.perform(get("/api/jpa/invite/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.invitesSent[0].inviteId").value(1));
    }
}
