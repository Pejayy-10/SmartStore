# Services

Business logic and service layer for SmartStore.

## Purpose

- Contains all async logic and side effects
- Acts as intermediary between UI and database
- No direct database calls from components

## Rules (per PROJECT_RULES.md)

- All async logic in services or hooks
- No API/database calls inside components
