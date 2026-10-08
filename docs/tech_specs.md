# Tech Specs & Architecture

## 1. Stack
- **Frontend:** Vue 3 (Composition API)
- **Native Bridge:** Capacitor
- **UI:** CoreUI for Vue (Bootstrap 5)
- **Charts:** Vue-ECharts (Apache ECharts)
- **Persistence:** IndexedDB (via wrapper)
- **Tooling:** Vite, npm

## 2. Architecture
- **State Management:** Pinia or Vue Reactive Provide/Inject.
- **Database Layer:** Async wrapper for IndexedDB (IDB).
- **Communication:** Native capacitor plugins for file system and device access.

## 3. Data Schema
- **Projects:** `{ id, name, initialCapital, status, createdAt }`
- **Transactions:** `{ id, projectId, type, amount, category, date, note }`
- **Tasks:** `{ id, projectId, title, completed, dueDate }`

## 4. Environment Variables
- `VITE_API_URL` (for future backend)
- `VITE_STORAGE_TYPE` (localStorage vs IndexedDB)
