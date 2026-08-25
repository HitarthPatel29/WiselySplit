package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.daos.ExpensesDAO;
import ca.mohawkCollege.wiselySplitServer.daos.PaymentDAO;
import ca.mohawkCollege.wiselySplitServer.daos.UserDAO;
import ca.mohawkCollege.wiselySplitServer.daos.WalletDAO;
import ca.mohawkCollege.wiselySplitServer.exceptions.BusinessException;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.ExpenseParticipantRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.PersonalExpenseAutomationRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.PersonalExpenseRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.SharedExpenseRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Expense;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.ExpenseParticipation;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.*;
import ca.mohawkCollege.wiselySplitServer.models.dtos.PersonalExpenseImportDTO;
import ca.mohawkCollege.wiselySplitServer.services.classification.ClassificationService;
import ca.mohawkCollege.wiselySplitServer.services.classification.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ExpenseServiceJPA {
    @Autowired private UserService userService;
    @Autowired private UserRepo userRepo;
    @Autowired private ExpenseGroupRepo groupRepo;
    @Autowired private PaymentRepo paymentRepo;
    @Autowired private WalletRepo walletRepo;
    @Autowired private ExpensesDAO expensesDAO;
    @Autowired private WalletDAO walletDAO;
    @Autowired private UserDAO userDAO;
    @Autowired private PaymentDAO paymentDAO;
    @Autowired private ClassificationService classificationService;
    @Autowired private FeedbackService feedbackService;
    @Autowired
    private ExpenseRepo expenseRepo;


    /**
     * Best-effort: send a feedback row to the classifier, so it can learn from
     * what the user actually saved. Never throws into the expense flow.
     */
    private void sendClassifierFeedback(String title, ExpenseCategory finalCategory, ExpenseCategory predictedCategory, Long payerId, EntryType entryType) {
        try {
            if (title == null || finalCategory == null) return;

            // ignore non-expense entries (income / transfer) — they aren't categorized by the model
            if (entryType != null && !EntryType.expense.equals(entryType)) return;

            feedbackService.recordFeedback( title, predictedCategory.getDisplayName(), finalCategory.getDisplayName(), payerId );
        } catch (Exception ignored) {
            // Never let feedback errors break the expense create flow.
            ignored.printStackTrace();
        }
    }

    /**
     * Create expense for friend or group.
     *
     * <p>Deliberately has no {@code catch}. Broken business rules are reported as
     * {@link BusinessException} with the code the caller should see, and anything else — a lost
     * connection, a constraint violation, a bug — propagates untouched so
     * {@link ca.mohawkCollege.wiselySplitServer.exceptions.GlobalExceptionHandler} can log it as a
     * genuine fault with its original stack trace intact.
     */
    @Transactional
    public Long createSharedExpense(SharedExpenseRequestDTO expenseRequestDTO) {
        Long payerId = expenseRequestDTO.payerId();
        if (null == payerId)
            throw new BusinessException(StatusCode.PAYER_NOT_FOUND,
                    "Shared expense '" + expenseRequestDTO.title() + "' submitted without a payerId");

        if (null == expenseRequestDTO.participants() || expenseRequestDTO.participants().isEmpty())
            throw new BusinessException(StatusCode.PARTICIPANTS_REQUIRED,
                    "Shared expense from payer " + payerId + " submitted with no participants");

        Expense newExpense = new Expense();
        newExpense.setExpenseTitle(expenseRequestDTO.title());
        newExpense.setAmount(expenseRequestDTO.amount());
        newExpense.setExpenseDate(expenseRequestDTO.date());
        newExpense.setExpenseCategory(expenseRequestDTO.category());
        newExpense.setEntryType(EntryType.expense);
        newExpense.setPayer(userRepo.getReferenceById(payerId));
        newExpense.setIsSettleUp(Boolean.TRUE.equals(expenseRequestDTO.isSettleUp()));
        newExpense.setIsPersonal(Boolean.FALSE);

        if(null != expenseRequestDTO.groupId())
            newExpense.setExpenseGroup(groupRepo.getReferenceById(expenseRequestDTO.groupId()));

        if(null != expenseRequestDTO.paymentId())
            newExpense.setPayment(paymentRepo.getReferenceById(expenseRequestDTO.paymentId()));

        Long walletId = expenseRequestDTO.walletId();
        if (null != walletId) {
            newExpense.setWallet(walletRepo.getReferenceById(walletId));
            walletDAO.updateWalletBalance(payerId, walletId, expenseRequestDTO.amount().doubleValue(), WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        newExpense.setParticipants(
                verifyAndMapDtoToExpenseParticipation(expenseRequestDTO.participants(), newExpense));

        Long expenseId = expenseRepo.save(newExpense).getExpenseId();

        sendClassifierFeedback(
                expenseRequestDTO.title(),
                expenseRequestDTO.category(),
                expenseRequestDTO.predictedCategory(),
                expenseRequestDTO.payerId(),
                EntryType.expense);

        return expenseId;
    }

    /**
     * Checks if any Participant with valid contribution present.
     * Checks if the sum of participant contribution matched the total expense amount.
     * Maps the requestDTO to the Entity.
     * @param participantDTOs -> ExpenseParticipantRequestDTO
     * @param newExpense    -> Expense
     * @return List<ExpenseParticipation> -> list of entity type mapped from the requestDTO
     * @throws BusinessException
     */
    private List<ExpenseParticipation> verifyAndMapDtoToExpenseParticipation(List<ExpenseParticipantRequestDTO> participantDTOs, Expense newExpense) throws BusinessException{

//      Filter out participants with 0 or less than 0 contribution. If no valid participant found throw error.
        List<ExpenseParticipantRequestDTO> participantsWithValidContribution = participantDTOs.stream().
                filter(participant -> participant.amount().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        if (participantsWithValidContribution.isEmpty())
            throw new BusinessException(StatusCode.PARTICIPANTS_REQUIRED);

//      Get sum of Participant contributions and compare with the Total Expense Amount. If not equal throw error.
        BigDecimal sumOfParticipantContribution = participantDTOs.stream()
                .map(ExpenseParticipantRequestDTO::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (sumOfParticipantContribution.compareTo(newExpense.getAmount()) != 0)
            throw new BusinessException(StatusCode.SPLIT_AMOUNT_MISMATCH);

//      Participants Verified! Map the participantDTO to the ExpenseParticipation Entity and return the new list
        return participantsWithValidContribution.stream()
                .map(participant -> ExpenseParticipation.builder()
                        .expense(newExpense)
                        .user(userRepo.getReferenceById(participant.userId()))
                        .contribution(participant.amount())
                        .contributionPortion(participant.portion())
                        .build())
                .toList();
    }

    @Transactional
    public Long createPersonalExpense(PersonalExpenseRequestDTO expenseRequestDTO) {
        Long payerId = expenseRequestDTO.payerId();
        if (null == payerId)
            throw new BusinessException(StatusCode.PAYER_NOT_FOUND,
                    "Personal expense '" + expenseRequestDTO.title() + "' submitted without a payer");

        Expense newExpense = new Expense();
        newExpense.setExpenseTitle(expenseRequestDTO.title());
        newExpense.setAmount(expenseRequestDTO.amount());
        newExpense.setExpenseDate(expenseRequestDTO.date());
        newExpense.setExpenseCategory(expenseRequestDTO.category());
        newExpense.setEntryType(EntryType.expense);
        newExpense.setPayer(userRepo.getReferenceById(payerId));
        newExpense.setIsSettleUp(Boolean.FALSE);
        newExpense.setIsPersonal(Boolean.TRUE);

        Long walletId = expenseRequestDTO.walletId();
        if (null != walletId){
            newExpense.setWallet(walletRepo.getReferenceById(walletId));

            //Update wallet Balance
            walletDAO.updateWalletBalance(payerId, walletId, expenseRequestDTO.amount().doubleValue(), WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        Long expenseId = expenseRepo.save(newExpense).getExpenseId();

        sendClassifierFeedback(
                expenseRequestDTO.title(),
                expenseRequestDTO.category(),
                expenseRequestDTO.predictedCategory(),
                expenseRequestDTO.payerId(),
                EntryType.expense);

        return expenseId;
    }

    /**
     * Batch-create personal expenses from a CSV import.
     * The classifier assigns each row's category. Inserts use INSERT IGNORE so
     * duplicates (per the Expenses unique constraint) are skipped. The wallet
     * balance is updated once per wallet using the sum of the inserted rows.
     *
     * @return { inserted: <count>, skipped: [ {title, date, amount}, ... ] }
     */
    @Transactional
    public Map<String, Object> createPersonalExpensesBatch(List<PersonalExpenseImportDTO> rows) {
        if (rows == null || rows.isEmpty()) {
            return Map.of("inserted", 0, "skipped", new ArrayList<>());
        }

        // Classify a category for every row (fallback to "Other").
        List<String> categories = new ArrayList<>(rows.size());
        for (PersonalExpenseImportDTO r : rows) {
            String category = "Other";
            try {
                ClassificationService.Prediction prediction = classificationService.predict(r.getTitle());
                if (prediction != null && prediction.category() != null && !prediction.category().isBlank()) {
                    category = prediction.category();
                }
            } catch (Exception ignored) {
                // A single prediction failure must not break the whole import.
            }
            categories.add(category);
        }

        int[] counts = expensesDAO.batchInsertPersonalExpenses(rows, categories);

        int inserted = 0;
        List<Map<String, Object>> skipped = new ArrayList<>();
        Map<Long, Double> walletSums = new HashMap<>();
        Map<Long, Long> walletUser = new HashMap<>();

        for (int i = 0; i < rows.size(); i++) {
            PersonalExpenseImportDTO r = rows.get(i);
            boolean wasInserted = i < counts.length && counts[i] != 0; // 1 = inserted, 0 = duplicate
            if (wasInserted) {
                inserted++;
                if (r.getWalletId() != null) {
                    walletSums.merge(r.getWalletId(), r.getAmount(), Double::sum);
                    walletUser.put(r.getWalletId(), r.getPayerId());
                }
            } else {
                Map<String, Object> s = new HashMap<>();
                s.put("title", r.getTitle());
                s.put("date", r.getDate());
                s.put("amount", r.getAmount());
                skipped.add(s);
            }
        }

        // One wallet-balance update per wallet for the inserted (non-duplicate) rows.
        for (Map.Entry<Long, Double> e : walletSums.entrySet()) {
            walletDAO.updateWalletBalance(walletUser.get(e.getKey()), e.getKey(), e.getValue(),
                    WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        return Map.of("inserted", inserted, "skipped", skipped);
    }

    @Transactional
    public Long createPersonalExpenseWithAutomation(PersonalExpenseAutomationRequestDTO expenseAutomationRequestDTO) {
        Expense newExpense = new Expense();
        newExpense.setExpenseTitle(expenseAutomationRequestDTO.transactionTitle());
        newExpense.setExpenseDate(expenseAutomationRequestDTO.transactionDate());
        newExpense.setEntryType(EntryType.expense);
        newExpense.setIsSettleUp(Boolean.FALSE);
        newExpense.setIsPersonal(Boolean.TRUE);

        // Find user by email. If user not found, throw an error
        User user = userRepo.findByEmail(expenseAutomationRequestDTO.userEmail())
                .orElseThrow(() -> new UserNotFoundException("User with email: " + expenseAutomationRequestDTO.userEmail() + " not found"));
        newExpense.setPayer(user);

        //Asks for prediction, if nothing gets return category is empty string
        ClassificationService.Prediction prediction = classificationService.predict(expenseAutomationRequestDTO.transactionTitle());
        String category = (null != prediction) ? prediction.category() : "";
        System.out.println("prediction: "+prediction);
        System.out.println("category: " + category);
        newExpense.setExpenseCategory(ExpenseCategory.fromDisplayName(category));

        // Sanitize Amount string to BigDecimal and If amount is 0, throw an error
        BigDecimal sanitizedAmount = this.sanitizeAmount(expenseAutomationRequestDTO.amount());
        if (sanitizedAmount.compareTo(BigDecimal.ZERO) == 0)
            throw new BusinessException(StatusCode.INVALID_AMOUNT, "Invalid Amount: " + sanitizedAmount);
        newExpense.setAmount(sanitizedAmount);

        // Find wallet by name. If wallet not found, throw an error
        String cardName = expenseAutomationRequestDTO.cardName();
        Wallet wallet = walletRepo.findByCardNameAndUserID(cardName, user.getUserId())
                .orElseThrow(() -> new BusinessException(StatusCode.WALLET_NOT_FOUND, "Wallet with cardName: " + cardName + " not found!"));
        newExpense.setWallet(wallet);

        // Insert personal expense
        Long expenseId = expenseRepo.save(newExpense).getExpenseId();

        //Update wallet Balance
        walletDAO.updateWalletBalance(user.getUserId(), wallet.getWalletId(), sanitizedAmount.doubleValue(), WalletDAO.WalletBalanceUpdateMode.EXPENSE);

        return expenseId;
    }

    /** Sanitize amount remove all characters except digits, decimals and '-' at front.*/
    private BigDecimal sanitizeAmount(Object amountObj) {
        if (amountObj instanceof Number) {
            return BigDecimal.valueOf(((Long) amountObj).doubleValue());
        } else if (amountObj instanceof String) {
            return BigDecimal.valueOf(Double.parseDouble(((String) amountObj).replaceAll("[^\\d.\\-]", "")));
        } else {
            throw new IllegalArgumentException("Amount must be a number or string: " + amountObj);
        }
    }

    /** Create a payment record (used by Stripe flow)
     * TODO: Add payerWalletId and receiverWalletId
     * */

    public Map<String, Object> createPayment(Map<String, Object> payload) {
        try {
            double amount = ((Number) payload.get("amount")).doubleValue();
            Long payerId = ((Number) payload.get("payerId")).longValue();
            Long receiverId = ((Number) payload.get("receiverId")).longValue();

            // Use PaymentDAO instead of ExpensesDAO to properly handle Stripe fields
            Long paymentId = paymentDAO.addPayment(
                    amount,
                    payerId,
                    receiverId,
                    null,  // stripePaymentIntentId - will be set later
                    null,  // stripeTransferId - will be set later
                    "PENDING"  // status
            );

            return Map.of(
                    "success", true,
                    "paymentId", paymentId,
                    "message", "Payment record created successfully"
            );
        } catch (Exception e) {
            throw new RuntimeException("Error creating payment: " + e.getMessage());
        }
    }

    public Map<String, Object> getPersonalSummary(long userId, String startDate, String endDate) {

        List<Map<String, Object>> rows =
                expensesDAO.fetchPersonalSummary(userId, startDate, endDate);

        double totalLent = 0;
        double totalOwed = 0;

        for (Map<String, Object> r : rows) {
            double net = ((Number) r.get("netAmount")).doubleValue();
            if (net < 0) totalLent += Math.abs(net);
            else if (net > 0) totalOwed += net;
        }

        return Map.of(
                "summary", Map.of(
                        "totalLent", totalLent,
                        "totalOwed", totalOwed
                ),
                "expenses", rows
        );
    }

    /**  Fetch single expense details */
    public Map<String, Object> getExpenseDetails(long expenseId) {
        Map<String, Object> expense = expensesDAO.findExpenseById(expenseId);
        if ( ! ((boolean) expense.get("isPersonal")) ) {
            List<Map<String, Object>> participants = expensesDAO.findExpenseParticipants(expenseId);
            expense.put("splitDetails", participants);
        }
        return expense;
    }

    /** Fetch Shared + Personal Expenses (Grouped by Wallet) */
    public List<Map<String, Object>> getExpensesGroupedByWallet(long userId){
        List<Map<String, Object>> wallets = walletDAO.getWallets(userId);
        for (Map<String, Object> wallet : wallets){
            wallet.put("expenses", expensesDAO.getExpenseForWallet(userId, ((Number) wallet.get("walletId")).longValue() ));
        }
        return wallets;
    }

    /**  Delete expense */
    public void deleteExpense(long expenseId) {
        walletDAO.updateWalletBalanceForEntryDelete(expenseId, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        expensesDAO.deleteExpense(expenseId);
    }

    @Transactional
    public Map<String, Object> updateExpense(long expenseId, Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String category = (String) payload.get("category");
            double amount = ((Number) payload.get("amount")).doubleValue();
            long payerId = ((Number) payload.get("payerId")).longValue();
            String shareWithType = (String) payload.get("shareWithType");

            Long groupId = null;
            if ("group".equalsIgnoreCase(shareWithType) && payload.get("shareWithId") != null) {
                groupId = ((Number) payload.get("shareWithId")).longValue();
            }

            Boolean isPersonal = ((Boolean) payload.get("isPersonal")).booleanValue();
            Long walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).longValue() : null;

            //Update wallet Balance
            if (null != walletId) walletDAO.updateWalletBalanceForEntryUpdate(payerId, walletId, expenseId, amount, WalletDAO.WalletBalanceUpdateMode.EXPENSE);

            expensesDAO.updateExpense(expenseId, title, date, category, amount, payerId, groupId, isPersonal, walletId, "expense", null);

            //Only for Shared Expenses
            if (!isPersonal) {
                // Delete old participation and insert new ones
                expensesDAO.deleteExpenseParticipation(expenseId);
                List<Map<String, Object>> participants = (List<Map<String, Object>>) payload.get("splitDetails");
                for (Map<String, Object> m : participants) {
                    long userId = ((Number) m.get("userId")).longValue();
                    double contribution = ((Number) m.get("amount")).doubleValue();
                    double contributionPortion = ((Number) m.get("portion")).doubleValue();
                    if (contribution > 0) {
                        expensesDAO.insertExpenseParticipation(expenseId, userId, contribution, contributionPortion);
                    }
                }
            }
//            sendClassifierFeedback(payload, title, category, payerId);
            return Map.of("success", true, "expenseId", expenseId, "message", "Expense updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error updating expense: " + e.getMessage());
        }
    }
}
