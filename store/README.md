# Store

Zustand state management stores for SmartStore.

## Structure

Each store file should export a single store using Zustand's `create` function.

## Rules (per PROJECT_RULES.md)

- Use Zustand or Redux Toolkit
- No prop drilling beyond 2 levels
- Derived state must be memoized
