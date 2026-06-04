package ca.mohawkCollege.wiselySplitServer.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Payload for a single personal expense row in a CSV batch import.
 * Extra fields produced by the frontend's normalizeExpenseForAPI
 * (e.g. entryKind, toWalletId, isPersonal, category, predictedCategory)
 * are ignored — the backend classifier assigns the category.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PersonalExpenseImportDTO {
    private String title;
    private String date;
    private double amount;
    private int payerId;
    private Integer walletId;

    public PersonalExpenseImportDTO() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public int getPayerId() { return payerId; }
    public void setPayerId(int payerId) { this.payerId = payerId; }

    public Integer getWalletId() { return walletId; }
    public void setWalletId(Integer walletId) { this.walletId = walletId; }
}
