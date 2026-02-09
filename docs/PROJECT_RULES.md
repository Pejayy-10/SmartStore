# React Native Project Rules & Standards

This document defines the **non-negotiable rules** for creating all React Native projects. These rules ensure every project is **secure, scalable, responsive, maintainable, and production-ready**.

---

## 🎯 Core Philosophy

Every React Native project must:
- Solve a real user problem
- Be offline-capable when possible
- Prioritize performance over shortcuts
- Be readable by another developer in the future

> If it works but is messy, it is not done.

---

## 🏗 Project Structure Rules

### Folder Structure (Standard)
```
/src
  /components
  /screens
  /navigation
  /store
  /services
  /database
  /hooks
  /utils
  /types
  /constants
/assets
```

**Rules:**
- One responsibility per folder
- No business logic inside UI components
- Screens only orchestrate logic, not calculate

---

## 🎨 Design & UI Rules

### Responsiveness
- Must support mobile and tablet
- Use percentage-based sizing or responsive utilities
- Never hardcode widths/heights unless necessary

### UI Principles
- Touch targets ≥ 44px
- Clear visual hierarchy
- High contrast for readability
- Consistent spacing system

### Design System
- Centralized colors, spacing, fonts
- No random inline styles
- Dark mode support when possible

---

## ⚙ Functionality Rules

### State Management
- Use Zustand or Redux Toolkit
- No prop drilling beyond 2 levels
- Derived state must be memoized

### Side Effects
- All async logic in services or hooks
- No API/database calls inside components

### Forms & Inputs
- Validate all user inputs
- Prevent invalid states
- Always handle empty values

---

## 🔐 Security Rules (Critical)

### Local Data Security
- Never store sensitive data in plain text
- Use secure storage for PINs or auth tokens
- Hash PINs/passwords (even locally)

### Validation
- Validate inputs at UI and logic levels
- Never trust user input

### Access Control
- Role-based permissions (Owner, Cashier)
- Sensitive actions require confirmation

---

## 🗄 Database Rules (SQLite)

- All database access goes through a data layer
- No raw queries in UI files
- Use transactions for multi-step writes
- Never delete records, use soft delete (`is_active`)

### Data Integrity
- Foreign key consistency
- Defensive checks before writes
- Schema versioning required

---

## 📈 Scalability Rules

- Features must be modular
- No hard dependency between modules
- Avoid global state pollution
- Business logic must be reusable

---

## 🧠 Error Handling Rules

### Runtime Errors
- Wrap critical screens with error boundaries
- Catch and log all async failures

### User Feedback
- Show friendly error messages
- Never expose raw errors to users

---

## 🚀 Performance Rules

- Use memoization where needed
- Avoid unnecessary re-renders
- Lazy-load heavy components
- Paginate long lists

---

## 🧪 Testing & Quality Rules

### Definition of Done
- No console errors
- No TypeScript warnings
- No unhandled promises
- UI tested on phone & tablet

---

## 📌 Final Rule

If a feature breaks performance, security, or user clarity — it does not ship.
