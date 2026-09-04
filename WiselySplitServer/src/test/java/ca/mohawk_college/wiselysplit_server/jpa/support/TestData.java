package ca.mohawk_college.wiselysplit_server.jpa.support;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.PersonalExpenseRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.SharedExpenseRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseParticipation;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Invite;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Payment;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Deterministic fixtures for JPA unit tests. Amounts are always {@link BigDecimal}. */
public final class TestData {

    public static final LocalDate DATE = LocalDate.of(2026, 3, 15);

    private TestData() {}

    public static User user(long id) {
        return user(id, "User" + id);
    }

    public static User user(long id, String name) {
        User user = new User();
        user.setUserId(id);
        user.setName(name);
        user.setUserName(name.toLowerCase().replace(" ", ""));
        user.setEmail(name.toLowerCase().replace(" ", "") + "@example.com");
        user.setProfilePicture("https://cdn.example.com/" + id + ".png");
        user.setPassword("hashed");
        return user;
    }

    public static Wallet wallet(long id, User owner) {
        Wallet wallet = new Wallet();
        wallet.setWalletId(id);
        wallet.setUser(owner);
        wallet.setName("Chequing");
        wallet.setCardName("tdChequing");
        wallet.setColor("#111111");
        wallet.setInitialBalance(new BigDecimal("100.00"));
        wallet.setBalance(new BigDecimal("250.00"));
        return wallet;
    }

    public static ExpenseGroup group(long id) {
        ExpenseGroup group = new ExpenseGroup();
        group.setGroupId(id);
        group.setGroupName("Trip");
        group.setGroupType("TRIP");
        group.setProfilePicture("https://cdn.example.com/group.png");
        return group;
    }

    public static Payment payment(long id, User payer, User receiver) {
        Payment payment = new Payment();
        payment.setPaymentId(id);
        payment.setPayer(payer);
        payment.setReceiver(receiver);
        payment.setAmount(new BigDecimal("40.00"));
        return payment;
    }

    public static ExpenseParticipation participation(Expense expense, User user, String contribution) {
        return ExpenseParticipation.builder()
                .expense(expense)
                .user(user)
                .contribution(new BigDecimal(contribution))
                .contributionPortion(BigDecimal.ONE)
                .build();
    }

    public static Expense sharedExpense(long id, User payer, User other, String total, String payerShare, String otherShare) {
        Expense expense = Expense.builder()
                .entryId(id)
                .title("Dinner")
                .amount(new BigDecimal(total))
                .date(DATE)
                .expenseCategory(ExpenseCategory.FOOD_AND_DINING)
                .payer(payer)
                .isSettleUp(false)
                .isPersonal(false)
                .participants(new ArrayList<>())
                .build();
        expense.getParticipants().add(participation(expense, payer, payerShare));
        expense.getParticipants().add(participation(expense, other, otherShare));
        return expense;
    }

    public static Expense personalExpense(long id, User payer, String amount) {
        return Expense.builder()
                .entryId(id)
                .title("Groceries")
                .amount(new BigDecimal(amount))
                .date(DATE)
                .expenseCategory(ExpenseCategory.SHOPPING)
                .payer(payer)
                .isSettleUp(false)
                .isPersonal(true)
                .participants(new ArrayList<>())
                .build();
    }

    public static Income income(long id, User user, String amount) {
        return Income.builder()
                .entryId(id)
                .title("Salary")
                .amount(new BigDecimal(amount))
                .date(DATE)
                .incomeCategory(IncomeCategory.SALARY)
                .user(user)
                .build();
    }

    public static Invite invite(long id, User sender, User receiver, InviteType type, InviteStatus status) {
        Invite invite = new Invite();
        invite.setInviteId(id);
        invite.setSender(sender);
        invite.setReceiver(receiver);
        invite.setReceiverEmail(receiver != null ? receiver.getEmail() : "guest@example.com");
        invite.setType(type);
        invite.setStatus(status);
        invite.setCreatedAt(Instant.parse("2026-03-01T00:00:00Z"));
        invite.setExpiresAt(Instant.parse("2026-03-08T00:00:00Z"));
        return invite;
    }

    public static SharedExpenseRequestDTO sharedRequest(Long payerId, String total, List<ExpenseParticipantRequestDTO> participants) {
        return new SharedExpenseRequestDTO(
                "Dinner",
                new BigDecimal(total),
                DATE,
                ExpenseCategory.FOOD_AND_DINING,
                payerId,
                null,
                false,
                null,
                null,
                participants,
                ExpenseCategory.FOOD_AND_DINING);
    }

    public static ExpenseParticipantRequestDTO participant(long userId, String amount) {
        return new ExpenseParticipantRequestDTO(userId, new BigDecimal(amount), BigDecimal.ONE);
    }

    public static PersonalExpenseRequestDTO personalRequest(Long payerId, Long walletId, String amount) {
        return new PersonalExpenseRequestDTO(
                "Coffee",
                new BigDecimal(amount),
                DATE,
                ExpenseCategory.FOOD_AND_DINING,
                payerId,
                walletId,
                ExpenseCategory.FOOD_AND_DINING);
    }
}
