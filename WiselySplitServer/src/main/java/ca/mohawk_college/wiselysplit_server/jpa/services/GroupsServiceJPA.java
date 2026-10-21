package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.GroupsDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.AppConstants;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupCreateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForGroupDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.*;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.ExpenseGroupRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.GroupParticipationRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.ExpenseRepo;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.ExpenseResponseForListRowMapper;
import ca.mohawk_college.wiselysplit_server.services.user.ImageUploadService;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class GroupsServiceJPA {

    @Autowired private GroupsDAO groupsDAO;

    @Autowired private ImageUploadService imageUploadService;

    @Autowired private ExpenseGroupRepo groupRepo;

    @Autowired private UserRepo userRepo;

    @Autowired private AuthorizationService authzService;

    @Autowired private ExpenseRepo expenseRepo;

    @Autowired private GroupParticipationRepo groupParticipationRepo;

    @Transactional
    public GroupResponseDTO createGroup(GroupCreateRequestDTO groupDTO, long creatorId) {

        // Upload photo if provided
        String profilePictureURL = null;
        try {
            if (groupDTO.profilePicture() != null && !groupDTO.profilePicture().isEmpty())
                profilePictureURL = imageUploadService.uploadProfilePicture(groupDTO.profilePicture());
            else profilePictureURL = AppConstants.DEFAULT_PROFILE_PICTURE_URL;
        } catch (Exception e) {throw new BusinessException(StatusCode.GROUP_PHOTO_UPLOAD_FAILED);}

        ExpenseGroup newGroup = new ExpenseGroup();
        newGroup.setGroupName(groupDTO.groupName().trim());
        newGroup.setGroupType(groupDTO.groupType());
        newGroup.setProfilePicture(profilePictureURL);
        User creator = userRepo.getReferenceById(creatorId);
        ExpenseGroup savedGroup = groupRepo.save(newGroup);
        groupParticipationRepo.save(new GroupParticipation(creator, savedGroup));
        return new GroupResponseDTO(
                savedGroup.getGroupId(),
                savedGroup.getGroupName(),
                savedGroup.getGroupType(),
                savedGroup.getProfilePicture(),
                List.of(new UserResponseForGroupDTO(
                        creator.getUserId(),
                        creator.getName(),
                        creator.getUserName(),
                        creator.getProfilePicture(),
                        BigDecimal.ZERO
                )),
                null
        );
    }

    public List<GroupSummaryResponseDTO> getGroupsForUser(long userId) {
        return groupRepo.findAllGroupSummariesForUser(userId);
    }

    @Transactional
    public GroupResponseDTO getGroupDetails(long groupId, long userId) {
        ExpenseGroup group = groupRepo.findById(groupId).orElseThrow(() -> new BusinessException(StatusCode.GROUP_NOT_FOUND));
        List<Expense> expenseList = expenseRepo.findAllbyGroupID(groupId);
        HashMap<Long, UserResponseForGroupDTO> gParticipantDtos = group.getParticipants().stream()
                .collect(Collectors.toMap(
                        User::getUserId,
                         participant -> new UserResponseForGroupDTO(
                                 participant.getUserId(),
                                 participant.getName(),
                                 participant.getUserName(),
                                 participant.getProfilePicture(),
                                 BigDecimal.ZERO
                         ),
                        (existing, replacement) -> existing,        // GroupParticipation does not have a PK so there is chances of duplication. That's why there is this defensive line
                        HashMap::new
                ));
        List<ExpenseResponseForListDTO> expenseDto = expenseList.stream().map(
                expense -> {
                    /*
                    if user is payer:
                    every participant will have
                     */
                    if (expense.getPayer().getUserId().equals(userId))
                        expense.getParticipants().stream()
                                .filter(eParticipant -> !eParticipant.getUser().getUserId().equals(userId))
                                .forEach(
                                eParticipant -> {
                                    UserResponseForGroupDTO participantDto = gParticipantDtos.get(eParticipant.getUser().getUserId());
                                    BigDecimal newAmount = participantDto.getAmountLentOrOwedToUser().subtract(eParticipant.getContribution());
                                    participantDto.setAmountLentOrOwedToUser(newAmount);
                                }
                        );
                    else {
                        BigDecimal userContribution = expense.getParticipants().stream()
                                .filter(eParticipant -> eParticipant.getUser().getUserId().equals(userId))
                                .map(ExpenseParticipation::getContribution)
                                .findFirst().orElse(BigDecimal.ZERO);
                        UserResponseForGroupDTO user = gParticipantDtos.get(expense.getPayer().getUserId());
                        user.setAmountLentOrOwedToUser(user.getAmountLentOrOwedToUser().add(userContribution));
                    }
                    return ExpenseResponseForListRowMapper.toDto(expense, userId);
                }
        ).toList();

        return new GroupResponseDTO(
                group.getGroupId(),
                group.getGroupName(),
                group.getGroupType(),
                group.getProfilePicture(),
                new ArrayList<>(gParticipantDtos.values()),
                expenseDto
        );
    }

    // Update group (name, type, optional photo)
    @Transactional
    public GroupResponseDTO updateGroup(GroupUpdateRequestDTO groupDTO) {

        String profilePictureURL = null;
        try {
            if (groupDTO.profilePicture() != null && !groupDTO.profilePicture().isEmpty())
                profilePictureURL = imageUploadService.uploadProfilePicture(groupDTO.profilePicture());
        } catch (Exception e) {throw new BusinessException(StatusCode.GROUP_PHOTO_UPLOAD_FAILED);}

        ExpenseGroup groupToBeUpdated = groupRepo.findById(groupDTO.groupId()).orElseThrow(() -> new BusinessException(StatusCode.GROUP_NOT_FOUND));
        groupToBeUpdated.setGroupType(groupDTO.groupType());
        groupToBeUpdated.setGroupName(groupDTO.groupName());
        if (null != profilePictureURL) groupToBeUpdated.setProfilePicture(profilePictureURL);

        ExpenseGroup savedGroup = groupRepo.save(groupToBeUpdated);
        return new GroupResponseDTO(
                savedGroup.getGroupId(),
                savedGroup.getGroupName(),
                savedGroup.getGroupType(),
                savedGroup.getProfilePicture(),
                savedGroup.getParticipants().stream().map(
                        participant -> new UserResponseForGroupDTO(
                                participant.getUserId(),
                                participant.getName(),
                                participant.getUserName(),
                                participant.getProfilePicture(),
                                null
                        )
                ).toList(),
                null
        );
    }

//     Leave group: only if user's net balance in group is 0
    @Transactional
    public void leaveGroup(long groupId, long userId) {
        authzService.requireGroupMember(groupId);
        boolean hasUnsettledBalance = groupRepo.findUserStandingInGroup(groupId, userId)
                .stream()
                .anyMatch(standing -> standing.getAmountOwedOrLentToUser().signum() != 0);
        if (!hasUnsettledBalance)
            groupParticipationRepo.deleteById(new GroupParticipationId(userId, groupId));
        else throw new BusinessException(StatusCode.GROUP_BALANCE_NOT_SETTLED);
    }

    // Delete group: only if all members are settled
    @Transactional
    public void deleteGroup(long groupId) {
        if (groupRepo.existsById(groupId))
            groupRepo.deleteById(groupId);
        else throw new BusinessException(StatusCode.GROUP_NOT_FOUND);
    }
}