package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.ExpensesDAO;
import ca.mohawk_college.wiselysplit_server.daos.PaymentDAO;
import ca.mohawk_college.wiselysplit_server.daos.UserDAO;
import ca.mohawk_college.wiselysplit_server.daos.WalletDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.UserNotFoundException;
import ca.mohawk_college.wiselysplit_server.exceptions.GlobalExceptionHandler;
import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.*;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.*;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletWithExpensesResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseParticipation;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.*;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.*;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.ExpenseResponseRowMapper;
import ca.mohawk_college.wiselysplit_server.jpa.rowmappers.WalletWithExpensesResponseRowMapper;
import ca.mohawk_college.wiselysplit_server.models.dtos.PersonalExpenseImportDTO;
import ca.mohawk_college.wiselysplit_server.services.classification.ClassificationService;
import ca.mohawk_college.wiselysplit_server.services.classification.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

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
     * {@link GlobalExceptionHandler} can log it as a
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

        List<ExpenseParticipantRequestDTO> verifiedExpenseRequestDTO = verifyExpenseParticipantRequestDTO(expenseRequestDTO.participants(), newExpense);
        newExpense.setParticipants(
                verifiedExpenseRequestDTO.stream()
                        .map(participant -> ExpenseParticipation.builder()
                                .expense(newExpense)
                                .user(userRepo.getReferenceById(participant.userId()))
                                .contribution(participant.amount())
                                .contributionPortion(participant.portion())
                                .build())
                        .toList()
                );

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
     *
     * @param participantDTOs -> ExpenseParticipantRequestDTO
     * @param newExpense      -> Expense
     * @return List<expenseparticipation> -> list of entity type mapped from the requestDTO
     * @throws BusinessException
     */
    private List<ExpenseParticipantRequestDTO> verifyExpenseParticipantRequestDTO(List<ExpenseParticipantRequestDTO> participantDTOs, Expense newExpense) throws BusinessException{

        if (participantDTOs.isEmpty())
            throw new BusinessException(StatusCode.PARTICIPANTS_REQUIRED);

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

//      Participants Verified!
        return participantsWithValidContribution;
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
    @Transactional
    public ExpenseResponseDTO getExpenseDetails(long expenseId) {
        Expense expense = expenseRepo.findById(expenseId)
                .orElseThrow(()-> new BusinessException(StatusCode.EXPENSE_NOT_FOUND));

        return ExpenseResponseRowMapper.toDto(expense);
    }

    /** Fetch Shared + Personal Expenses (Grouped by Wallet)
     * TODO: Move this to WalletService and Add getExpensesForWallet(long walletId)
     * */
    @Transactional
    public List<WalletWithExpensesResponseDTO> getExpensesGroupedByWallet(long userId){
        List<Wallet> wallets = userRepo.findById(userId)
                .orElseThrow(() -> new BusinessException(StatusCode.USER_NOT_FOUND, "Fetching Wallet Expenses for User failed, User not found!"))
                .getWallets();

        if (null == wallets) throw new BusinessException(StatusCode.NO_WALLETS_FOUND);

        return wallets.stream()
                .map(wallet -> {
                    List<Expense> expenseListOfWallet = expenseRepo.findByWallet_WalletIdIsOrToWallet_WalletIdIs(wallet.getWalletId(),wallet.getWalletId() );
                    return WalletWithExpensesResponseRowMapper.toDto(wallet, expenseListOfWallet);
                })
                .toList();
    }


    /**  Delete expense */
    public void deleteExpense(long expenseId) {
        if (expenseRepo.existsById(expenseId)) {
            expenseRepo.deleteById(expenseId);
            walletDAO.updateWalletBalanceForEntryDelete(expenseId, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        } else throw new BusinessException(StatusCode.EXPENSE_DELETE_FAILED, "Expense with ExpenseID: " + expenseId + " not found!");
    }

    @Transactional
    public ExpenseResponseDTO updateExpense(ExpenseUpdateRequestDTO expenseUpdateDTO) {
        Expense expenseToBeUpdated = expenseRepo.findById(expenseUpdateDTO.expenseId())
                .orElseThrow(()-> new BusinessException(
                        StatusCode.EXPENSE_UPDATE_FAILED, "Expense with expenseId : "+expenseUpdateDTO.expenseId()+ " not found"));

        expenseToBeUpdated.setExpenseTitle(expenseUpdateDTO.title());
        expenseToBeUpdated.setAmount(expenseUpdateDTO.amount());
        expenseToBeUpdated.setExpenseDate(expenseUpdateDTO.date());
        expenseToBeUpdated.setExpenseCategory(expenseUpdateDTO.category());
        expenseToBeUpdated.setEntryType(EntryType.expense);
        expenseToBeUpdated.setIsSettleUp(Boolean.TRUE.equals(expenseUpdateDTO.isSettleUp()));
        expenseToBeUpdated.setIsPersonal(Boolean.TRUE.equals(expenseUpdateDTO.isPersonal()));

        Long payerId = expenseUpdateDTO.payerId();
        if (null == payerId)
            throw new BusinessException(StatusCode.PAYER_NOT_FOUND);
        expenseToBeUpdated.setPayer(userRepo.getReferenceById(payerId));

        if(null != expenseUpdateDTO.groupId())
            expenseToBeUpdated.setExpenseGroup(groupRepo.getReferenceById(expenseUpdateDTO.groupId()));

        if(null != expenseUpdateDTO.paymentId())
            expenseToBeUpdated.setPayment(paymentRepo.getReferenceById(expenseUpdateDTO.paymentId()));

        //If walletId is not null, get Wallet Reference for Expense and Update wallet Balance
        Long walletId = expenseUpdateDTO.walletId();
        if (null != walletId) {
            expenseToBeUpdated.setWallet(walletRepo.getReferenceById(walletId));
            walletDAO.updateWalletBalanceForEntryUpdate(
                    payerId, walletId,
                    expenseUpdateDTO.expenseId(),
                    expenseUpdateDTO.amount().doubleValue(),
                    WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        if (!Boolean.TRUE.equals(expenseUpdateDTO.isPersonal()) && null != expenseUpdateDTO.participants()) {

            /*
            Every new expenseparticipation will create a new embeddedId by combining expenseId + UserID.
            And If the expenseparticipation with the exact CombinedId exists, creating a new expenseparticipation will throw
             -> NonUniqueObjectException: A different object with the same identifier value was already associated with the session: [expenseparticipation#ExpenseParticipationId(expenseId=204, userId=19)]
            So make sure to find if expenseparticipation with the exact embeddedId exists and then update the other Properties.

            Here is what we are doing iterate on verifiedExpenseParticipantDTO
            find the same expenseparticipation in the expenseToBeUpdated
                if -> update the values in expenseToBeUpdated.getParticipants() and add it in the updatedListOfParticipants.
                orElse -> create a new expenseparticipation and map the DTO to the new object and add it in the updatedListOfParticipants.
            */
            List<ExpenseParticipantRequestDTO> verifiedExpenseParticipantDTO = verifyExpenseParticipantRequestDTO(expenseUpdateDTO.participants(), expenseToBeUpdated);
            ArrayList<ExpenseParticipation> updatedListOfParticipants = verifiedExpenseParticipantDTO.stream()
                    .map(participantRequestDTO ->
                            expenseToBeUpdated.getParticipants().stream()
                                    .filter(existingParticipant -> participantRequestDTO.userId().equals(existingParticipant.getUser().getUserId()))
                                    .findFirst()
                                    .map((participant) -> {
                                        participant.setContribution(participantRequestDTO.amount());
                                        participant.setContributionPortion(participantRequestDTO.portion());
                                        return participant;
                                    }).orElseGet(()-> ExpenseParticipation.builder()
                                            .expense(expenseToBeUpdated)
                                            .user(userRepo.getReferenceById(participantRequestDTO.userId()))
                                            .contribution(participantRequestDTO.amount())
                                            .contributionPortion(participantRequestDTO.portion())
                                            .build()
                                    )
                    ).collect(Collectors.toCollection(ArrayList::new));
            /*
            Why not toList(), why collect(Collectors.toCollection(ArrayList::new)) ???
            List is immutable collection. Any time a .stream() result is handed to a Hibernate-managed collection setter (Expense.setParticipants())
            Hibernate requires a mutable collection
             */
            expenseToBeUpdated.getParticipants().clear();
            expenseToBeUpdated.getParticipants().addAll(updatedListOfParticipants);
        }


        Expense updatedExpense = expenseRepo.save(expenseToBeUpdated);

        sendClassifierFeedback(
                expenseUpdateDTO.title(),
                expenseUpdateDTO.category(),
                expenseUpdateDTO.predictedCategory(),
                expenseUpdateDTO.payerId(),
                EntryType.expense);

        return ExpenseResponseRowMapper.toDto(updatedExpense);
    }
}
