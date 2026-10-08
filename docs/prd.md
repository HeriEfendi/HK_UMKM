# Product Requirements Document (PRD): Vue Capacitor Financial Project Management

## 1. Project Overview
A web and native-ready financial project management application built with Vue 3 and Capacitor. Designed for cyclic project tracking (e.g., construction, agriculture, livestock) with a focus on ease of use, financial transparency, and data portability.

## 2. Goals & Objectives
- Provide a centralized tool to manage multiple financial projects/cycles.
- Enable precise tracking of profit/loss (ROI/Margin) per project.
- Ensure cross-platform accessibility via native mobile support (Capacitor).
- Maintain data privacy through local storage/offline capabilities.

## 3. Core Features
### 3.1. Project Management
- Create, view, edit, and archive projects.
- Lifecycle tracking (Active vs. Completed).
- Modal-based task creation for improved UX.

### 3.2. Financial Tracking
- Transaction logging (Categories: Modal, Pengeluaran, Pendapatan).
- Dynamic calculations:
  - **Net Profit:** Revenue - Expenses.
  - **Remaining Capital:** Initial Capital - Expenses.
  - **ROI/Profit Margin:** Percentage calculation based on financial flow.

### 3.3. Productivity
- Integrated To-Do List to manage daily activities related to projects.
- Status-based task tracking with card-based UI.

### 3.4. Analytics & Reporting
- Visual dashboards using `vue-echarts` (Apache ECharts):
  - Donut chart: Expense distribution.
  - Bar chart: Monthly cash flow.

### 3.5. Data Management
- Excel/CSV import and export for external reporting and data backup.

## 4. Technical Stack
- **Frontend:** Vue 3 (Composition API).
- **Native Bridge:** Capacitor.
- **UI:** CoreUI for Vue (Bootstrap 5 based).
- **Charts:** Vue-ECharts (Apache ECharts).
- **Persistence:** IndexedDB (migrated from LocalStorage for reliability).
- **Tooling:** Vite, npm.

## 5. User Journey
1. **Onboarding/Dashboard:** User views overview of active project financial health.
2. **Project Creation:** User initiates a new project cycle with an initial budget.
3. **Transaction Logging:** During the project, user records expenses or income through a simplified modal.
4. **Task Management:** User tracks daily tasks to ensure project progress.
5. **Review:** User checks ROI/Margin reports to evaluate project success.

## 6. Future Roadmap
- Cloud synchronization (Firebase/Supabase).
- Advanced multi-user collaboration.
- AI-driven expense categorization.
- Enhanced offline synchronization conflict resolution.
