package ca.mohawkCollege.WiselySplitServer.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class User {

    private int userId;  // PK

    @NotBlank(message = "Name cannot be empty")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;

    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String userName;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Phone number cannot be null")
    private Long phoneNum;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    private String profilePicture; // optional, no constraints

    // --- Constructors ---
    public User() {}

    public User(int userId, String name, String userName, String email, Long phoneNum, String password, String profilePicture) {
        this.userId = userId;
        this.name = name;
        this.userName = userName;
        this.email = email;
        this.phoneNum = phoneNum;
        this.password = password;
        this.profilePicture = profilePicture;
    }

    // --- Getters & Setters ---
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Long getPhoneNum() { return phoneNum; }
    public void setPhoneNum(Long phoneNum) { this.phoneNum = phoneNum; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", name='" + name + '\'' +
                ", userName='" + userName + '\'' +
                ", email='" + email + '\'' +
                ", phoneNum=" + phoneNum +
                ", profilePicture='" + profilePicture + '\'' +
                '}';
    }
}