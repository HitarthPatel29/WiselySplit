[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/cqMWIy-z)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19032475&assignment_repo_type=AssignmentRepo)

# WiselySplit 💸

WiselySplit is a **web-based expense-splitting application** designed to make managing shared costs simple and transparent. Whether you are traveling with friends, managing household bills, or keeping track of group expenses, WiselySplit ensures fairness and accountability.

---

## 🚀 Project Overview
The platform allows users to:
- Log personal and group expenses
- Split costs **equally, by percentage, or by specific amounts**
- Track **who owes whom** and how much
- Settle balances using a **secure payment system (Stripe)**
- Manage personal summaries and view spending categories

---

## ✨ Key Features
- **Authentication System**
  - Login with email/password or Google
  - Multi-factor authentication
  - Secure password storage and reset with strength checks
  - Remember me functionality

- **User & Profile Management**
  - Create accounts with email verification
  - Upload/change profile picture
  - Update email, phone, or username (with revalidation)

- **Expense Management**
  - Add individual or group expenses with categories and dates
  - Flexible splitting options: equal, percentage, specific amount
  - Bill splitting at an itemized level
  - Edit expenses, participants, or groups

- **Group Management**
  - Create groups with custom names and photos
  - Invite users by username, email, or phone
  - View group balances, expenses, and standings

- **Individual & Personal Views**
  - View balances with specific users
  - Monthly summaries and category-based reports
  - Date range filtering

- **Secure Payments**
  - Stripe API integration for settling debts
  - Real-time balance updates on settlement

- **Accessibility & Security**
  - Protection against SQL injection, XSS, and session hijacking
  - Accessibility standards (alt text, ARIA roles, color contrast)

---

## 🧑‍🤝‍🧑 User Roles
- **User Who Paid**
  - Log expenses and assign participants
  - Track who owes them money
  - Receive payments via Stripe
- **User Who Owes**
  - View outstanding balances
  - Make payments securely
  - Settle balances manually or via Stripe

---

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS  
- **Backend:** Java Spring Boot
- **Database:** MySQL
- **Authentication:** JWT, Google OAuth, Multi-factor Email Verification 
- **Payments:** Stripe API   

---

## 📅 Development Timeline
| Milestone                | Description | Achieved? |
|--------------------------|-------------|-----------|
| **Milestone 1:** | Authentication, account creation, profile setup | ✅ |
| **Milestone 2:** | Expense & group management | ✅ |
| **Milestone 3:** | Bill split, personal summaries, filters | ✅ |
| **Milestone 4:** | Stripe integration, testing, accessibility | ✅ |
| **Milestone 5:** | Automate Expense Entries with Siri Shortcut | in Progress |
| **Milestone 6:** | Generate monthly and category wise summaries |  |



---

## 🔒 Security & Accessibility
- Input validation to prevent SQL injection and XSS attacks  
- Password hashing with strong encryption  
- Multi-factor authentication for added security  
- WCAG 2.1 accessibility compliance
  
---
## Author - Hitarth Patel

### 📌 Repository
GitHub Repo: [capstone-project-HitarthPatel29](https://github.com/Steve-at-Mohawk-College/capstone-project-HitarthPatel29)
