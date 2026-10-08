<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Pengeluaran</ion-title>
            <ion-buttons slot="end">
              <ion-button class="btn-action primary" @click="createExpense">
                <ion-icon slot="start" :icon="addOutline" /> Tambah
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle">Pantau dan kelola anggaran belanja serta biaya operasional bisnis Anda.</p>
        </div>
      </ion-toolbar>

      <!-- Tabs Segment -->
      <div class="px-3 pb-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="dashboard">
            <ion-label>Dashboard</ion-label>
          </ion-segment-button>
          <ion-segment-button value="riwayat">
            <ion-label>Riwayat & Detail</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- DASHBOARD TAB -->
      <div v-show="activeTab === 'dashboard'" class="ion-padding">


        <ion-grid class="mx-2">
          <ion-row>
            
            <!-- Monthly Budget Card -->
            <ion-col size="12" size-sm="12" size-md="12" size-lg="6">
              <ion-card class="mobile-card m-0">
                <ion-card-content>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted text-uppercase fw-bold text-xs">Anggaran Bulanan</small>
                    <button v-if="!editingBudget" class="btn btn-link btn-sm p-0 text-primary fw-bold text-xs" @click="startEditBudget">
                      <ion-icon :icon="pencilOutline" class="me-1" /> Atur Limit
                    </button>
                  </div>

                  <!-- Inline Budget Edit Form -->
                  <div v-if="editingBudget" class="mb-2">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <NumberInput v-model="budgetDraft" placeholder="Contoh: 3.000.000" input-class="form-control app-control form-control-sm flex-grow-1" />
                      <button class="btn btn-success btn-sm fw-bold px-3" @click="saveBudget">Simpan</button>
                      <button class="btn btn-light btn-sm" @click="editingBudget = false">Batal</button>
                    </div>
                    <label for="budgetCategories" class="form-label text-muted text-xs mb-1">Kategori yang dihitung</label>
                    <div id="budgetCategories" class="d-flex flex-wrap gap-2 mb-1">
                      <label v-for="cat in allCategories" :key="cat" class="form-check form-check-inline text-xs mb-0">
                        <input v-model="budgetCategoriesDraft" class="form-check-input" type="checkbox" :value="cat" :id="`budget-category-${cat}`" />
                        <span class="form-check-label">{{ cat }}</span>
                      </label>
                    </div>
                    <small class="text-muted text-xs">Kosongkan untuk menghitung semua kategori.</small>
                  </div>

                  <div v-else class="d-flex justify-content-between align-items-end">
                    <div>
                      <span class="fs-5 fw-black text-dark">{{ formatPrice(summary.monthly) }}</span>
                      <span class="text-muted text-xs"> terpakai dari {{ formatPrice(budget) }}</span>
                    </div>
                    <span class="badge text-xs" :class="budgetProgress >= 100 ? 'bg-danger' : 'bg-success'">
                      {{ budgetProgress }}%
                    </span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="progress mt-2" style="height: 10px; border-radius: 5px;">
                    <div class="progress-bar" role="progressbar"
                        :style="{ width: budgetProgress + '%' }"
                        :class="budgetProgress >= 100 ? 'bg-danger' : (budgetProgress >= 80 ? 'bg-warning' : 'bg-teal')"
                        aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <small class="text-danger d-block mt-1 fw-bold text-xs" v-if="budgetProgress >= 100">
                    ⚠️ Pengeluaran telah melebihi batas anggaran bulanan!
                  </small>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <!-- Metric Grid -->
            <ion-col size="6" size-md="6" size-lg="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content>
                  <small class="text-muted d-block text-xs">Hari Ini</small>
                  <div class="fs-6 fw-black text-teal mt-1">{{ formatPrice(summary.daily) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="6" size-md="6" size-lg="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content>
                  <small class="text-muted d-block text-xs">Minggu Ini</small>
                  <div class="fs-6 fw-black text-indigo mt-1">{{ formatPrice(summary.weekly) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Charts Grid -->
        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Pengeluaran Harian Minggu Ini</h6>
                    <span class="badge bg-light text-muted border small">Minggu Ini</span>
                  </div>
                  <v-chart v-if="hasDailyData" :option="dailyChartOption" autoresize style="height: 240px; width: 100%;" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data harian.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Trend Pengeluaran Mingguan</h6>
                    <span class="badge bg-light text-muted border small">5 Minggu Terakhir</span>
                  </div>
                  <v-chart v-if="hasWeeklyData" :option="weeklyChartOption" autoresize style="height: 240px; width: 100%;" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data grafik mingguan.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Trend Pengeluaran Bulanan</h6>
                    <span class="badge bg-light text-muted border small">6 Bulan Terakhir</span>
                  </div>
                  <v-chart v-if="hasMonthlyData" :option="monthlyChartOption" autoresize style="height: 240px; width: 100%;" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data bulanan.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Porsi Kategori</h6>
                    <select v-model="categoryPeriodMonths" @change.prevent style="outline: none !important; box-shadow: none !important;" class="form-select app-control app-control-sm w-auto">
                      <option :value="1">1 Bulan</option>
                      <option :value="3">3 Bulan</option>
                      <option :value="6">6 Bulan</option>
                      <option :value="12">1 Tahun</option>
                    </select>
                  </div>
                  <div style="min-height: 240px;" class="d-flex flex-column justify-content-center">
                    <v-chart v-if="hasDonutData" :option="donutChartOption" autoresize style="height: 240px; width: 100%;" />
                    <div v-else class="text-center py-5 text-muted">Belum ada pengeluaran dalam {{ categoryPeriodMonths }} bulan terakhir untuk dianalisa.</div>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

      </div>

      <!-- RIWAYAT & DETAIL TAB -->
      <div v-show="activeTab === 'riwayat'" class="ion-padding">
        <!-- Search & Filter Controls -->
        <div class="mobile-card p-3 mb-3 mx-3">
          <div class="row g-2">
            <div class="col-12 col-md-4">
              <input type="text" v-model="filterSearch" class="form-control form-control-sm app-control" placeholder="Cari keperluan pengeluaran..." />
            </div>
            <div class="col-6 col-md-4">
              <select v-model="filterCategory" class="form-control form-control-sm app-control">
                <option value="">Semua Kategori</option>
                <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="col-6 col-md-4">
              <select v-model="filterAccount" class="form-control form-control-sm app-control">
                <option value="">Semua Sumber Dana</option>
                <option :value="-1">Tanpa Potong Saldo</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Expenses List Grid -->
        <div v-if="filteredExpenses.length" class="row mx-2 mb-2">
          <div v-for="expense in filteredExpenses" :key="expense.id" class="col-12 col-sm-6 col-lg-4 g-2 m-0 mb-1 px-2">
            <div class="mobile-card-sm h-100 d-flex align-items-center justify-content-between p-2">
              <div class="d-flex flex-column" style="flex: 1; min-width: 0;">
                <span class="badge bg-primary mb-1 small align-self-start">{{ expense.category || 'Umum' }}</span>
                <h6 class="fw-bold text-dark mb-0 text-truncate medium w-100">{{ expense.description }}</h6>
              </div>
              <div class="d-flex flex-column align-items-end text-end me-2" style="flex: 2; min-width: 0;">
                <small class="text-muted medium">{{ formatDate(expense.date) }}</small>
                <span class="text-primary fw-bold medium">{{ formatPrice(expense.amount) }}</span>
              </div>

              <div class="d-flex align-items-center gap-1" style="flex: 0;">
                <button class="btn btn-light btn-sm text-primary me-1" @click="$router.push(`/expenses/${expense.id}/edit`)" title="Edit">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="btn btn-light btn-sm text-danger" @click="onDelete(expense.id)" title="Hapus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-5 text-muted mobile-card p-4">
          <p>Tidak ada pengeluaran ditemukan dengan filter saat ini.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { onIonViewWillEnter, IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardContent, alertController } from '@ionic/vue';
import { addOutline, trashOutline, pencilOutline, createOutline } from 'ionicons/icons';
import { expensesRepo, savingAccountsRepo, savingTransactionsRepo } from '../../../db/repositories'
import { db } from '../../../db/schema'
import { useRouter } from 'vue-router'
import { CHART_PALETTE, formatIDR, formatCompactNumber, getModernTooltip, getDonutTooltip, createAreaGradient } from '../../../utils/chartThemes'

export default {
  name: 'AccountingExpensesListView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardContent },
  setup() {
    const router = useRouter()
    const activeTab = ref('dashboard')
    const expenses = ref([])
    const accounts = ref([])
    const budget = ref(3000000) // Default budget limit: Rp 3.000.000
    const categoryPeriodMonths = ref(6)
    const budgetCategories = ref([])
    const editingBudget = ref(false)
    const budgetDraft = ref(null)
    const budgetCategoriesDraft = ref([])

    watch(activeTab, (tab) => {
      if (tab === 'dashboard') {
        nextTick(() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
          }, 50)
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
          }, 250)
        })
      }
    })

    // Filters
    const filterSearch = ref('')
    const filterCategory = ref('')
    const filterAccount = ref('')

    // Fetch All Data
    const fetchBudget = async () => {
      // Load budget limit
      const budgetRecord = await db.table('ceklok_settings').get('expense_budget')
      if (budgetRecord) {
        budget.value = Number(budgetRecord.value || 3000000)
      }
      const budgetCategoriesRecord = await db.table('ceklok_settings').get('expense_budget_categories')
      budgetCategories.value = Array.isArray(budgetCategoriesRecord?.value) ? budgetCategoriesRecord.value : []
    }

    const fetchAll = async () => {
      expenses.value = await expensesRepo.getAll()
      accounts.value = await savingAccountsRepo.getAll()
      await fetchBudget()
      nextTick(() => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 100)
      })
    }

    const startEditBudget = () => {
      budgetDraft.value = budget.value
      budgetCategoriesDraft.value = [...budgetCategories.value]
      editingBudget.value = true
    }

    const saveBudget = async () => {
      const val = Number(budgetDraft.value || 0)
      if (val > 0) {
        await db.table('ceklok_settings').put({
          key: 'expense_budget',
          value: val,
          updatedAt: new Date().toISOString()
        })
        budget.value = val
      }
      await db.table('ceklok_settings').put({
        key: 'expense_budget_categories',
        value: [...budgetCategoriesDraft.value],
        updatedAt: new Date().toISOString()
      })
      budgetCategories.value = [...budgetCategoriesDraft.value]
      editingBudget.value = false
    }

    const onDelete = async (id) => {
      const alert = await alertController.create({
        header: 'Konfirmasi',
        message: 'Yakin ingin hapus data pengeluaran ini? Pengeluaran yang memotong tabungan akan mengembalikan saldo otomatis.',
        buttons: [
          { text: 'Batal', role: 'cancel' },
          { 
            text: 'Hapus', 
            role: 'destructive', 
            handler: async () => {
              try {
                const item = await expensesRepo.getById(id)
                if (item && item.savingTxId) {
                  // Revert saving transaction
                  await savingTransactionsRepo.delete(item.savingTxId)
                }
                await expensesRepo.delete(id)
                await fetchAll()
              } catch (err) {
                console.error('Failed to delete expense:', err)
              }
            } 
          }
        ]
      });
      await alert.present();
    }

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(price || 0))
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'

    const summary = computed(() => {
      const total = (from) => expenses.value.filter(e => new Date(e.date) >= from).reduce((sum, e) => sum + Number(e.amount || 0), 0)
      const budgetTotal = (from) => expenses.value
        .filter(e => new Date(e.date) >= from && (!budgetCategories.value.length || budgetCategories.value.includes(e.category || 'Umum')))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0)
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const mondayOfWeek = new Date(today); mondayOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
      return {
        daily: total(new Date(today)),
        weekly: total(new Date(mondayOfWeek)),
        monthly: budgetTotal(new Date(today.getFullYear(), today.getMonth(), 1)),
      }
    })

    const budgetProgress = computed(() => {
      if (budget.value <= 0) return 0
      return Math.min(100, Math.round((summary.value.monthly / budget.value) * 100))
    })

    const allCategories = computed(() => {
      const cats = expenses.value.map(e => e.category || 'Umum')
      return [...new Set(cats)]
    })

    // Filtered list
    const filteredExpenses = computed(() => {
      let result = [...expenses.value]

      if (filterSearch.value.trim()) {
        const q = filterSearch.value.toLowerCase()
        result = result.filter(e => (e.description || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q))
      }

      if (filterCategory.value) {
        result = result.filter(e => (e.category || 'Umum') === filterCategory.value)
      }

      if (filterAccount.value) {
        const accId = Number(filterAccount.value)
        if (accId === -1) {
          result = result.filter(e => !e.accountId)
        } else {
          result = result.filter(e => e.accountId === accId)
        }
      }

      // Sort newest first
      return result.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

     // Donut Chart logic: dynamic months
     const periodStart = (months) => {
       const now = new Date()
       return new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
     }

     const categoryTotals = computed(() => {
       const start = periodStart(categoryPeriodMonths.value)
       const currentExpenses = expenses.value.filter(e => new Date(e.date) >= start)
       const totals = {}
       for (const e of currentExpenses) {
         const cat = e.category || 'Umum'
         totals[cat] = (totals[cat] || 0) + Number(e.amount || 0)
       }
       return totals
     })

    const hasDonutData = computed(() => Object.values(categoryTotals.value).some(d => d > 0))

    const donutChartOption = computed(() => {
      const data = Object.entries(categoryTotals.value)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({ name, value }))

      return {
        color: CHART_PALETTE,
        tooltip: getDonutTooltip('Rp'),
        legend: {
          bottom: 0,
          left: 'center',
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: '#64748b', fontSize: 11 }
        },
        series: [{
          name: 'Porsi Kategori',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            scale: true,
            label: { show: true, fontSize: 12, fontWeight: 'bold', formatter: '{b}\n{d}%' }
          },
          data
        }]
      }
    })

    // Weekly trend
    const weeklyChartOption = computed(() => {
      const data = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const daysFromMonday = dayOfWeek - 1;
      for (let i = 4; i >= 0; i--) {
        const start = new Date(today); start.setDate(today.getDate() - daysFromMonday - (i * 7));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const val = expenses.value.filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        }).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }

      return {
        color: ['#6366f1'],
        tooltip: getModernTooltip((params) => {
          const item = Array.isArray(params) ? params[0] : params
          return `<div style="font-weight:600;margin-bottom:4px;">${item?.name || ''}</div>
          <div style="color:#a5b4fc;font-weight:bold;">${formatIDR(item?.value || 0)}</div>`
        }),
        grid: { top: '12%', left: '2%', right: '4%', bottom: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['M-4', 'M-3', 'M-2', 'M-1', 'Minggu Ini'],
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#64748b', fontSize: 10, formatter: (val) => formatCompactNumber(val) }
        },
        series: [{
          name: 'Pengeluaran Mingguan',
          type: 'line',
          smooth: 0.35,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#6366f1' },
          itemStyle: { color: '#6366f1', borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: { color: createAreaGradient('#6366f1') },
          data
        }]
      }
    })

    const hasWeeklyData = computed(() => weeklyChartOption.value.series[0].data.some(d => d > 0))

    // Daily trend
    const dailyChartOption = computed(() => {
      const data = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const monday = new Date(today); monday.setDate(today.getDate() - (dayOfWeek - 1));
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const val = expenses.value.filter(e => e.date && e.date.startsWith(dateStr)).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }

      return {
        color: ['#0d9488'],
        tooltip: getModernTooltip((params) => {
          const item = Array.isArray(params) ? params[0] : params
          return `<div style="font-weight:600;margin-bottom:4px;">${item?.name || ''}</div>
          <div style="color:#2dd4bf;font-weight:bold;">${formatIDR(item?.value || 0)}</div>`
        }),
        grid: { top: '12%', left: '2%', right: '4%', bottom: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#64748b', fontSize: 10, formatter: (val) => formatCompactNumber(val) }
        },
        series: [{
          name: 'Pengeluaran',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#0d9488' },
          data
        }]
      }
    })

    const hasDailyData = computed(() => dailyChartOption.value.series[0].data.some(d => d > 0))

    // Monthly trend
    const monthlyChartOption = computed(() => {
      const data = [];
      const categories = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        categories.push(m.toLocaleDateString('id-ID', { month: 'short' }));
        const val = expenses.value.filter(e => {
          const ed = new Date(e.date);
          return ed.getFullYear() === m.getFullYear() && ed.getMonth() === m.getMonth();
        }).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }

      return {
        color: ['#ea580c'],
        tooltip: getModernTooltip((params) => {
          const item = Array.isArray(params) ? params[0] : params
          return `<div style="font-weight:600;margin-bottom:4px;">${item?.name || ''}</div>
          <div style="color:#fb923c;font-weight:bold;">${formatIDR(item?.value || 0)}</div>`
        }),
        grid: { top: '12%', left: '2%', right: '4%', bottom: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#64748b', fontSize: 10, formatter: (val) => formatCompactNumber(val) }
        },
        series: [{
          name: 'Bulanan',
          type: 'line',
          smooth: 0.35,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#ea580c' },
          itemStyle: { color: '#ea580c', borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: { color: createAreaGradient('#ea580c') },
          data
        }]
      }
    })

    const hasMonthlyData = computed(() => monthlyChartOption.value.series[0].data.some(d => d > 0))

    const getAccountName = (accountId) => {
      const acc = accounts.value.find(a => a.id === accountId)
      return acc ? acc.name : 'Akun Tidak Dikenal'
    }

    const createExpense = () => router.push('/expenses/create')

    onIonViewWillEnter(fetchAll)

    return {
      activeTab, expenses, onDelete, formatPrice, formatDate,
      addOutline, trashOutline, createOutline, pencilOutline, summary, createExpense,
      weeklyChartOption, hasWeeklyData, budget, budgetProgress,
      editingBudget, budgetDraft, startEditBudget, saveBudget, budgetCategoriesDraft,
      donutChartOption, hasDonutData, accounts, getAccountName, filterSearch,
      filterCategory, filterAccount, allCategories, filteredExpenses,
      dailyChartOption, hasDailyData, monthlyChartOption, hasMonthlyData,
      categoryPeriodMonths
    }
  }
}
</script>
