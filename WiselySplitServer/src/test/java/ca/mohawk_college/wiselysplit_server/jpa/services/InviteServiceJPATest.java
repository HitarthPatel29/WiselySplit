package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.ExpensesDAO;
import ca.mohawk_college.wiselysplit_server.daos.GroupsDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.UserNotFoundException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.invite.InviteResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Invite;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.ExpenseGroupRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.InviteRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import ca.mohawk_college.wiselysplit_server.services.EmailServiceMailTrapAPI;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InviteServiceJPATest {

    @Mock private UserRepo userRepo;
    @Mock private EmailServiceMailTrapAPI emailServiceMailTrapAPI;
    @Mock private GroupsDAO groupsDAO;
    @Mock private ExpensesDAO expensesDAO;
    @Mock private ExpenseGroupRepo groupRepo;
    @Mock private InviteRepo inviteRepo;

    @InjectMocks
    private InviteServiceJPA inviteService;

    private final User alice = TestData.user(1L, "Alice");
    private final User bob = TestData.user(2L, "Bob");

    @BeforeEach
    void hostingUrl() {
        ReflectionTestUtils.setField(inviteService, "hostingURL", "https://app.example.com");
    }

    @Nested
    class SendInvite {

        @Test
        void shouldRejectUnknownSender() {
            when(userRepo.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "bob@example.com", null))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void shouldRejectUnknownUsername() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByUserName("nobody")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "nobody", null))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.INVITE_RECIPIENT_NOT_FOUND);
        }

        @Test
        void shouldRejectDuplicatePendingInvite() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, "bob@example.com", null)).thenReturn(true);

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "bob@example.com", null))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.INVITE_ALREADY_EXISTS);
        }

        @Test
        void shouldRejectMissingGroup() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, "bob@example.com", 9L)).thenReturn(false);
            when(groupRepo.findById(9L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "bob@example.com", 9L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.GROUP_NOT_FOUND);
        }

        @Test
        void shouldResolveExistingUserByUsername() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByUserName("bob")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, bob.getEmail(), null)).thenReturn(false);

            String message = inviteService.sendInvite(1L, "bob", null);

            assertThat(message).contains("In-app invite");
            verify(emailServiceMailTrapAPI).sendEmail(eq(bob.getEmail()), anyString(), anyString());
        }

        @Test
        void shouldEmailExistingUserForGroupInvite() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, "bob@example.com", 3L)).thenReturn(false);
            when(groupRepo.findById(3L)).thenReturn(Optional.of(TestData.group(3L)));

            String message = inviteService.sendInvite(1L, "bob@example.com", 3L);

            assertThat(message).contains("In-app invite");
            ArgumentCaptor<Invite> captor = ArgumentCaptor.forClass(Invite.class);
            verify(inviteRepo).save(captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(InviteType.GROUP);
            verify(emailServiceMailTrapAPI).sendEmail(eq("bob@example.com"), anyString(), anyString());
        }

        @Test
        void shouldEmailExistingUserForFriendInvite() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, "bob@example.com", null)).thenReturn(false);

            String message = inviteService.sendInvite(1L, "bob@example.com", null);

            assertThat(message).contains("In-app invite");
            ArgumentCaptor<Invite> captor = ArgumentCaptor.forClass(Invite.class);
            verify(inviteRepo).save(captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(InviteType.USER);
            assertThat(captor.getValue().getReceiver()).isEqualTo(bob);
            verify(emailServiceMailTrapAPI).sendEmail(eq("bob@example.com"), anyString(), anyString());
        }

        @Test
        void shouldEmailSignupLinkWhenRecipientHasNoAccount() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    alice, "new@example.com", null)).thenReturn(false);

            String message = inviteService.sendInvite(1L, "new@example.com", null);

            assertThat(message).contains("User Account not found");
            verify(emailServiceMailTrapAPI).sendEmail(eq("new@example.com"), anyString(), anyString());
        }

        @Test
        void shouldWrapSignupEmailFailure() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    any(), anyString(), isNull())).thenReturn(false);
            doThrow(new RuntimeException("smtp")).when(emailServiceMailTrapAPI)
                    .sendEmail(anyString(), anyString(), anyString());

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "new@example.com", null))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.EMAIL_SEND_FAILED);
        }

        @Test
        void shouldWrapEmailFailure() {
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(userRepo.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
            when(inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(
                    any(), anyString(), isNull())).thenReturn(false);
            doThrow(new RuntimeException("smtp")).when(emailServiceMailTrapAPI)
                    .sendEmail(anyString(), anyString(), anyString());

            assertThatThrownBy(() -> inviteService.sendInvite(1L, "bob@example.com", null))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.EMAIL_SEND_FAILED);
        }
    }

    @Nested
    class UpdateInviteStatus {

        @Test
        void shouldAddGroupParticipantWhenGroupInviteAccepted() {
            Invite invite = TestData.invite(4L, alice, bob, InviteType.GROUP, InviteStatus.PENDING);
            invite.setGroup(TestData.group(8L));
            when(inviteRepo.findById(4L)).thenReturn(Optional.of(invite));

            inviteService.updateInviteStatus(4L, InviteStatus.ACCEPTED);

            verify(inviteRepo).updateStatusByInviteIdIs(InviteStatus.ACCEPTED, 4L);
            verify(groupsDAO).addParticipant(8L, 2L);
            verify(expensesDAO, never()).insertSharedExpense(
                    anyString(), anyString(), anyString(), anyDouble(), anyLong(), any(), any(Boolean.class), any(), any());
        }

        @Test
        void shouldCreateFugaziExpenseWhenFriendInviteAccepted() {
            Invite invite = TestData.invite(4L, alice, bob, InviteType.USER, InviteStatus.PENDING);
            when(inviteRepo.findById(4L)).thenReturn(Optional.of(invite));
            when(expensesDAO.insertSharedExpense(anyString(), anyString(), anyString(), eq(0.0),
                    eq(1L), isNull(), eq(false), isNull(), isNull())).thenReturn(77L);

            inviteService.updateInviteStatus(4L, InviteStatus.ACCEPTED);

            verify(expensesDAO).insertExpenseParticipation(77L, 1L, 0.0, 1.0);
            verify(expensesDAO).insertExpenseParticipation(77L, 2L, 0.0, 1.0);
            verify(groupsDAO, never()).addParticipant(anyLong(), anyLong());
        }

        @Test
        void shouldRejectMissingInviteOnAccept() {
            when(inviteRepo.findById(4L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inviteService.updateInviteStatus(4L, InviteStatus.ACCEPTED))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.INVITE_NOT_FOUND);
        }

        @Test
        void shouldNotLoadInviteWhenStatusIsNotAccepted() {
            inviteService.updateInviteStatus(4L, InviteStatus.REJECTED);

            verify(inviteRepo).updateStatusByInviteIdIs(InviteStatus.REJECTED, 4L);
            verify(inviteRepo, never()).findById(anyLong());
        }
    }

    @Nested
    class Queries {

        @Test
        void getAllInvitesForUserShouldExpireThenMap() {
            Invite sent = TestData.invite(1L, alice, bob, InviteType.USER, InviteStatus.PENDING);
            Invite received = TestData.invite(2L, bob, alice, InviteType.USER, InviteStatus.PENDING);
            alice.setInvitesSent(new ArrayList<>(List.of(sent)));
            alice.setInvitesReceived(new ArrayList<>(List.of(received)));
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));

            InviteServiceJPA.SentAndReceivedInvitesForUserDTO result = inviteService.getAllInvitesForUser(1L);

            verify(inviteRepo).updateStatusForExpiredInvites();
            assertThat(result.invitesSent()).hasSize(1);
            assertThat(result.invitesReceived()).hasSize(1);
        }

        @Test
        void getAllInvitesForUserShouldRejectUnknownUser() {
            when(userRepo.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inviteService.getAllInvitesForUser(1L))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void inviteToInviteResponseDTOShouldHandleNullReceiverAndGroup() {
            Invite invite = TestData.invite(3L, alice, null, InviteType.USER, InviteStatus.PENDING);
            invite.setReceiverEmail("guest@example.com");

            InviteResponseDTO dto = inviteService.inviteToInviteResponseDTO(invite);

            assertThat(dto.getReceiver()).isNull();
            assertThat(dto.getGroup()).isNull();
            assertThat(dto.getReceiverEmail()).isEqualTo("guest@example.com");
        }

        @Test
        void getFriendsOfUserShouldReturnTheOtherParty() {
            Invite invite = TestData.invite(1L, alice, bob, InviteType.USER, InviteStatus.ACCEPTED);
            when(inviteRepo.findAcceptedUserInvitesInvolving(InviteStatus.ACCEPTED, alice))
                    .thenReturn(List.of(invite));

            assertThat(inviteService.getFriendsOfUser(alice))
                    .extracting(f -> f.userId())
                    .containsExactly(2L);
        }
    }
}
