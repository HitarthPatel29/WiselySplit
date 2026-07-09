package ca.mohawkCollege.wiselySplitServer.models.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Payload for a single income row in a CSV batch import.
 * Income categories are left empty (the expense-trained classifier is not used).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class IncomeImportDTO {
    private String title;
    private String date;
    private double amount;
    private int userId;
    private Integer walletId;

    public IncomeImportDTO() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public Integer getWalletId() { return walletId; }
    public void setWalletId(Integer walletId) { this.walletId = walletId; }
}
