import { createRouter, createWebHistory } from '@ionic/vue-router'
import DefaultLayout from '../layout/DefaultLayout.vue'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: HomeView },
      { path: 'products', name: 'ProductsList', component: () => import('../views/supply-chain/products/ListView.vue') },
      { path: 'categories', name: 'CategoriesList', component: () => import('../views/supply-chain/categories/ListView.vue') },
      { path: 'cashier', name: 'Cashier', component: () => import('../views/cashier/CashierView.vue') },
      { path: 'stock', name: 'Stock', component: () => import('../views/supply-chain/stock/StockView.vue') },
      { path: 'expenses', name: 'ExpensesList', component: () => import('../views/accounting/expenses/ListView.vue') },
      { path: 'expenses/create', name: 'ExpensesCreate', component: () => import('../views/accounting/expenses/FormView.vue') },
      { path: 'expenses/:id/edit', name: 'ExpensesEdit', component: () => import('../views/accounting/expenses/FormView.vue') },
      { path: 'incomes', name: 'IncomesList', component: () => import('../views/accounting/incomes/ListView.vue') },
      { path: 'debts', name: 'DebtsList', component: () => import('../views/accounting/debts/ListView.vue') },
      { path: 'savings', name: 'SavingsList', component: () => import('../views/accounting/savings/ListView.vue') },
      { path: 'savings/create', redirect: '/savings' },
      { path: 'savings/:id/edit', redirect: '/savings' },
      { path: 'buku_kas', name: 'FinancialRecords', component: () => import('../views/buku_kas/Index.vue') },
      { path: 'buku_kas/:id', name: 'FinancialRecordsDetails', component: () => import('../views/buku_kas/Details.vue') },
      { path: 'users', name: 'UsersList', component: () => import('../views/users/ListView.vue') },
      { path: 'todo-personal', name: 'TodoPersonal', component: () => import('../views/todo/PersonalTodoView.vue') },
      { path: 'todo', name: 'TodoList', component: () => import('../views/todo/ListView.vue') },
      { path: 'todo/create', redirect: '/todo' },
      { path: 'todo/:id/edit', redirect: '/todo' },
      { path: 'ceklok', name: 'Ceklok', component: () => import('../views/ceklok/CeklokView.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/profile/ProfileView.vue') },
      { path: 'backup-restore', name: 'BackupRestore', component: () => import('../views/profile/BackupRestoreView.vue') },
      { path: 'reminders', name: 'Reminders', component: () => import('../views/reminder/ReminderView.vue') },
      { path: 'notes', name: 'NotesList', component: () => import('../views/notes/ListView.vue') },
      { path: 'about', name: 'About', component: () => import('../views/AboutView.vue') },
      { path: ':pathMatch(.*)*', name: 'NotFoundChild', component: () => import('../views/NotFound.vue'), meta: { bare: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue'), meta: { bare: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router