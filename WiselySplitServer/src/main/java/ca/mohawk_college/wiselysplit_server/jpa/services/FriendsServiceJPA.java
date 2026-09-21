package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.FriendsDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.FriendsRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.ExpenseRepo;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.ExpenseResponseForListRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class FriendsServiceJPA {

    @Autowired
    private FriendsDAO friendsDAO;
    @Autowired private ExpenseRepo expenseRepo;

    @Autowired
    private FriendsRepo friendsRepo;
    @Autowired private InviteServiceJPA inviteService;

    @Transactional
    public List<FriendResponseForListDTO> getFriends(long userId) {
        return friendsRepo.findFriendsWithBalances(userId);
    }

    @Transactional
    public FriendResponseDTO getFriend(long userId, long friendId) {
        // 1. Fetch friend info
        UserResponseForListDTO friend = friendsRepo.findByUserId(friendId).orElseThrow(() -> new BusinessException(StatusCode.FRIEND_NOT_FOUND));

        // 2. Fetch all shared expenses
        List<Expense> sharedExpenses = expenseRepo.findSharedExpensesBetween(userId, friendId);
        List<ExpenseResponseForListDTO> expenseDTOs = ExpenseResponseForListRowMapper.toDtoListForFriend(sharedExpenses, userId, friendId);

        //Get total AmountOwedOrLent between User and the friend
        BigDecimal amountOwedOrLent = expenseDTOs.stream()
                .map(ExpenseResponseForListDTO::amountLentOrOwed)
                .reduce(BigDecimal::add).orElse(BigDecimal.ZERO);

        return new FriendResponseDTO(
                friend.userId(),
                friend.name(),
                friend.userName(),
                friend.profilePicture(),
                amountOwedOrLent,
                expenseDTOs
        );
    }
}