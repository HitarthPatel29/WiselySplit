-- user_queries.sql

-- Insert a new user
INSERT_USER = INSERT INTO User (Name, UserName, Email, PhoneNum, Password, ProfilePicture)
              VALUES (?, ?, ?, ?, ?, ?);

-- Find user by email
FIND_BY_EMAIL = SELECT * FROM User WHERE Email = ?;

-- Find user by ID
FIND_BY_ID = SELECT * FROM User WHERE UserID = ?;

-- Update user
UPDATE_USER = UPDATE User
              SET Name = ?, UserName = ?, Email = ?, PhoneNum = ?, Password = ?, ProfilePicture = ?
              WHERE UserID = ?;

-- Delete user
DELETE_USER = DELETE FROM User WHERE UserID = ?;

-- List all users
FIND_ALL = SELECT * FROM User;