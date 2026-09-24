<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Pendapatan</ion-title>
            <ion-buttons slot="end">
              <ion-button class="btn-action primary" @click="openModal()">
                <ion-icon slot="start" :icon="addOutline" /> Tambah
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle">Pantau dan kelola sumber pendapatan pribadi Anda dengan mudah.</p>
        </div>
      </ion-toolbar>

      <div class="px-3 pb-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="dashboard">
            <ion-label>Dashboard</ion-label>
          </ion-segment-button>
          <ion-segment-button value="riwayat">
            <ion-label>Riwayat & Detail</ion-label>
          </ion-segment-button>
          <ion-segment-button value="labarugi">
            <ion-label>Laba Rugi</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- DASHBOARD TAB -->
      <div v-show="activeTab === 'dashboard'" class="ion-padding">
        <ion-grid class="mx-2">
          <ion-row>
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
            <ion-col size="12" size-md="6" size-lg="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content>
                  <small class="text-muted d-block text-xs">Bulan Ini</small>
                  <div class="fs-6 fw-black text-success mt-1">{{ formatPrice(summary.monthly) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <h6 class="fw-bold text-dark mb-3">Grafik Mingguan</h6>
                  <VueApexCharts v-if="weeklyChartSeries[0].data.some(d => d > 0)" :key="'weekly-' + incomes.length" type="area" height="240" :options="weeklyChartOptions" :series="weeklyChartSeries" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data mingguan.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <h6 class="fw-bold text-dark mb-3">Grafik Bulanan</h6>
                  <VueApexCharts v-if="monthlyChartSeries[0].data.some(d => d > 0)" :key="'monthly-' + incomes.length" type="area" height="240" :options="monthlyChartOptions" :series="monthlyChartSeries" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data bulanan.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <h6 class="fw-bold text-dark mb-3">Porsi Pendapatan per Kategori</h6>
                  <VueApexCharts v-if="donutSeries.length > 0 && donutSeries.some(d => d > 0)" :key="'donut-' + JSON.stringify(categoryTotals)" type="donut" height="240" :options="donutOptions" :series="donutSeries" />
                  <div v-else class="text-center py-5 text-muted">Belum ada pendapatan di bulan ini.</div>
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
            <div class="col-12 col-md-6">
              <input type="text" v-model="filterSearch" class="form-control form-control-sm app-control" placeholder="Cari pendapatan..." />
            </div>
            <div class="col-12 col-md-6">
              <select v-model="filterCategory" class="form-control form-control-sm app-control">
                <option value="">Semua Kategori</option>
                <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="filteredIncomes.length" class="row mx-2 mb-2">
          <div v-for="income in filteredIncomes" :key="income.id" class="col-12 col-sm-6 col-lg-4 g-2 m-0 mb-1 px-2">
            <div class="mobile-card-sm h-100 d-flex align-items-center justify-content-between p-2">
              <div class="d-flex flex-column" style="flex: 1; min-width: 0;">
                <h6 class="fw-bold text-dark mb-0 text-truncate medium w-100">{{ income.description }}</h6>
              </div>
              <div class="d-flex flex-column align-items-end text-end me-2" style="flex: 2; min-width: 0;">
                <small class="text-muted medium">{{ formatDate(income.date) }}</small>
                <span class="text-success fw-bold medium">{{ formatPrice(income.amount) }}</span>
              </div>

              <div class="d-flex align-items-center gap-1" style="flex: 0;">
                <button class="btn btn-light btn-sm text-primary me-1" @click="openModal(income.id)" title="Edit">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="btn btn-light btn-sm text-danger" @click="onDelete(income.id)" title="Hapus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5 text-muted mobile-card p-4">
          <p>Tidak ada pendapatan ditemukan.</p>
        </div>
      </div>

      <!-- LABA RUGI TAB -->
      <div v-show="activeTab === 'labarugi'" class="ion-padding">
        <!-- Periode selector -->
        <div class="d-flex gap-2 mx-2 mb-3 overflow-x-auto pb-1">
          <button
            type="button"
            class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
            :class="plPeriod === 'this_month' ? 'btn-primary' : 'btn-outline-secondary bg-white'"
            @click="plPeriod = 'this_month'"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
            :class="plPeriod === 'last_month' ? 'btn-primary' : 'btn-outline-secondary bg-white'"
            @click="plPeriod = 'last_month'"
          >
            Bulan Lalu
          </button>
          <button
            type="button"
            class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
            :class="plPeriod === 'this_year' ? 'btn-primary' : 'btn-outline-secondary bg-white'"
            @click="plPeriod = 'this_year'"
          >
            Tahun Ini
          </button>
          <button
            type="button"
            class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
            :class="plPeriod === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white'"
            @click="plPeriod = 'all'"
          >
            Semua Waktu
          </button>
        </div>

        <!-- Net Profit Hero Card -->
        <div class="mobile-card p-4 mx-2 mb-4 border-0 shadow-lg text-white position-relative overflow-hidden" :style="{ background: plData.netProfit >= 0 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }">
          <small class="text-white-50 d-block text-uppercase fw-bold">LABA / RUGI BERSIH (NET PROFIT)</small>
          <div class="fs-2 fw-black mt-1">{{ formatPrice(plData.netProfit) }}</div>
          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-white border-opacity-25 text-xs text-white-50">
            <span>Status: <strong class="text-white">{{ plData.netProfit >= 0 ? 'Surplus / Untung' : 'Defisit / Rugi' }}</strong></span>
            <span>Margin Bersih: <strong class="text-white">{{ plData.netMargin }}%</strong></span>
          </div>
        </div>

        <!-- Profit & Loss Statement Table -->
        <div class="mobile-card p-3 mx-2 mb-4">
          <h6 class="fw-bold text-dark mb-3">Laporan Laba Rugi Terpadu</h6>

          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <tbody>
                <!-- Pendapatan -->
                <tr class="table-light">
                  <th colspan="2" class="text-dark fw-bold">1. PENDAPATAN USAHA (REVENUE)</th>
                </tr>
                <tr>
                  <td class="ps-3 text-muted">Penjualan Kasir POS ({{ plData.periodSalesCount }} Transaksi)</td>
                  <td class="text-end fw-semibold text-dark">{{ formatPrice(plData.totalSalesPOS) }}</td>
                </tr>
                <tr>
                  <td class="ps-3 text-muted">Pendapatan Lain-lain</td>
                  <td class="text-end fw-semibold text-dark">{{ formatPrice(plData.totalIncomes) }}</td>
                </tr>
                <tr class="border-bottom">
                  <td class="ps-3 fw-bold text-primary">TOTAL PENDAPATAN KOTOR</td>
                  <td class="text-end fw-bold text-primary">{{ formatPrice(plData.totalRevenue) }}</td>
                </tr>

                <!-- HPP -->
                <tr class="table-light">
                  <th colspan="2" class="text-dark fw-bold">2. HARGA POKOK PENJUALAN (HPP)</th>
                </tr>
                <tr>
                  <td class="ps-3 text-muted">Beban Modal Barang Terjual Kasir</td>
                  <td class="text-end fw-semibold text-danger">-{{ formatPrice(plData.totalHPP) }}</td>
                </tr>
                <tr class="border-bottom">
                  <td class="ps-3 fw-bold text-dark">LABA KOTOR (GROSS PROFIT)</td>
                  <td class="text-end fw-bold text-success">{{ formatPrice(plData.grossProfit) }}</td>
                </tr>

                <!-- Pengeluaran Operasional -->
                <tr class="table-light">
                  <th colspan="2" class="text-dark fw-bold">3. BEBAN OPERASIONAL (EXPENSES)</th>
                </tr>
                <tr v-for="(amt, cat) in plData.expenseByCategory" :key="cat">
                  <td class="ps-3 text-muted">Biaya {{ cat }}</td>
                  <td class="text-end text-danger">-{{ formatPrice(amt) }}</td>
                </tr>
                <tr v-if="Object.keys(plData.expenseByCategory).length === 0">
                  <td class="ps-3 text-muted fst-italic">Belum ada catatan biaya operasional</td>
                  <td class="text-end text-muted">Rp 0</td>
                </tr>
                <tr class="border-bottom">
                  <td class="ps-3 fw-bold text-danger">TOTAL BEBAN OPERASIONAL</td>
                  <td class="text-end fw-bold text-danger">-{{ formatPrice(plData.totalExpenses) }}</td>
                </tr>

                <!-- Hasil Akhir -->
                <tr class="table-primary fw-black">
                  <td class="fs-6 text-dark">LABA / RUGI BERSIH AKHIR</td>
                  <td class="text-end fs-6" :class="plData.netProfit >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatPrice(plData.netProfit) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ion-content>
    
    <IncomeModal v-model:is-open="isModalOpen" :income-id="selectedIncomeId" @saved="fetchAll" />
  </ion-page>
</template>

<script>
import { ref, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { onIonViewWillEnter, IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardContent, alertController } from '@ionic/vue';
import { addOutline, trashOutline, createOutline } from 'ionicons/icons';
import { incomesRepo, salesRepo, expensesRepo } from '../../../db/repositories'
import IncomeModal from './IncomeModal.vue'

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

export default {
  name: 'AccountingIncomesListView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IncomeModal, VueApexCharts },
  setup() {
    const activeTab = ref('dashboard')
    const incomes = ref([])
    const sales = ref([])
    const expenses = ref([])
    const isModalOpen = ref(false)
    const selectedIncomeId = ref(null)
    const filterSearch = ref('')
    const filterCategory = ref('')
    const plPeriod = ref('this_month')

    watch(activeTab, (tab) => {
      if (tab === 'dashboard' || tab === 'labarugi') {
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

    const fetchAll = async () => {
      incomes.value = await incomesRepo.getAll()
      sales.value = await salesRepo.getAll()
      expenses.value = await expensesRepo.getAll()
      nextTick(() => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 100)
      })
    }
    
    const openModal = (id = null) => {
      selectedIncomeId.value = id
      isModalOpen.value = true
    }

    const onDelete = async (id) => {
      const alert = await alertController.create({
        header: 'Konfirmasi',
        message: 'Yakin ingin hapus data pendapatan ini?',
        buttons: [
          { text: 'Batal', role: 'cancel' },
          { text: 'Hapus', role: 'destructive', handler: async () => { await incomesRepo.delete(id); await fetchAll() } }
        ]
      });
      await alert.present();
    }
    
    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(price || 0))
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
    
    const summary = computed(() => {
      const total = (from) => incomes.value.filter(e => new Date(e.date) >= from).reduce((sum, e) => sum + Number(e.amount || 0), 0)
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const mondayOfWeek = new Date(today); mondayOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
      return {
        daily: total(new Date(today)),
        weekly: total(new Date(mondayOfWeek)),
        monthly: total(new Date(today.getFullYear(), today.getMonth(), 1)),
      }
    })
    
    const allCategories = computed(() => {
      const cats = incomes.value.map(e => e.category || 'Umum')
      return [...new Set(cats)]
    })

    const filteredIncomes = computed(() => {
      let result = [...incomes.value]
      if (filterSearch.value.trim()) {
        const q = filterSearch.value.toLowerCase()
        result = result.filter(e => (e.description || '').toLowerCase().includes(q))
      }
      if (filterCategory.value) {
        result = result.filter(e => (e.category || 'Umum') === filterCategory.value)
      }
      return result.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    // Charts
    const dailyChartSeries = computed(() => {
      const data = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const monday = new Date(today); monday.setDate(today.getDate() - (dayOfWeek - 1));
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const val = incomes.value.filter(e => e.date && e.date.startsWith(dateStr)).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }
      return [{ name: 'Pendapatan', data }];
    });

    const dailyChartOptions = {
      chart: { toolbar: { show: false }, type: 'bar', zoom: { enabled: false } },
      colors: ['#10b981'],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val) => val > 0 ? new Intl.NumberFormat('id-ID').format(val) : '', offsetY: -20 },
      xaxis: { categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] },
      yaxis: { labels: { formatter: (val) => new Intl.NumberFormat('id-ID').format(val) } },
      tooltip: { y: { formatter: (val) => 'Rp ' + new Intl.NumberFormat('id-ID').format(val) } }
    };

    // Weekly trend
    const weeklyChartSeries = computed(() => {
      const data = [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay() || 7;
      const daysFromMonday = dayOfWeek - 1;
      for (let i = 4; i >= 0; i--) {
        const start = new Date(today); start.setDate(today.getDate() - daysFromMonday - (i * 7));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const val = incomes.value.filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        }).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }
      return [{ name: 'Pendapatan Mingguan', data }];
    });

    const weeklyChartOptions = {
      chart: { toolbar: { show: false }, type: 'area', zoom: { enabled: false } },
      colors: ['#4f46e5'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 }
      },
      xaxis: { categories: ['M-4', 'M-3', 'M-2', 'M-1', 'Minggu Ini'] },
      yaxis: { labels: { formatter: (val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val) } },
      tooltip: { y: { formatter: (val) => 'Rp ' + new Intl.NumberFormat('id-ID').format(val) } },
      dataLabels: {
        enabled: true,
        formatter: (val) => val > 0 ? new Intl.NumberFormat('id-ID').format(val) : ''
      }
    };

    const monthlyChartSeries = computed(() => {
      const data = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = incomes.value.filter(e => {
          const ed = new Date(e.date);
          return ed.getFullYear() === m.getFullYear() && ed.getMonth() === m.getMonth();
        }).reduce((s, e) => s + Number(e.amount), 0);
        data.push(val);
      }
      return [{ name: 'Bulanan', data }];
    });

    const monthlyChartOptions = {
      chart: { toolbar: { show: false }, type: 'area', zoom: { enabled: false } },
      colors: ['#ea580c'],
      xaxis: { categories: Array.from({length: 6}, (_, i) => {
        const m = new Date();
        m.setMonth(m.getMonth() - (5 - i));
        return m.toLocaleDateString('id-ID', { month: 'short' });
      }) },
      yaxis: { labels: { formatter: (val) => new Intl.NumberFormat('id-ID').format(val) } },
      tooltip: { y: { formatter: (val) => 'Rp ' + new Intl.NumberFormat('id-ID').format(val) } },
      dataLabels: { enabled: true, formatter: (val) => val > 0 ? new Intl.NumberFormat('id-ID').format(val) : '' }
    };

    // Donut Chart
    const categoryTotals = computed(() => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthIncomes = incomes.value.filter(e => new Date(e.date) >= startOfMonth)
      const totals = {}
      for (const e of currentMonthIncomes) {
        const cat = e.category || 'Umum'
        totals[cat] = (totals[cat] || 0) + Number(e.amount || 0)
      }
      return totals
    })

    const donutSeries = computed(() => Object.values(categoryTotals.value).map(v => Number.isFinite(v) ? Number(v) : 0))
    const donutOptions = computed(() => ({
      chart: { type: 'donut', toolbar: { show: false } },
      labels: Object.keys(categoryTotals.value),
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
      legend: { position: 'bottom' },
      stroke: { width: 0 },
      tooltip: { y: { formatter: (val) => formatPrice(val) } }
    }))

    // Profit & Loss calculation
    const plData = computed(() => {
      const now = new Date()
      const isDateInPeriod = (dateStr) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        if (plPeriod.value === 'this_month') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        }
        if (plPeriod.value === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
          const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
          return d.getFullYear() === year && d.getMonth() === lastMonth
        }
        if (plPeriod.value === 'this_year') {
          return d.getFullYear() === now.getFullYear()
        }
        return true
      }

      // 1. Sales POS
      const periodSales = sales.value.filter(s => isDateInPeriod(s.createdAt))
      const totalSalesPOS = periodSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
      const totalHPP = periodSales.reduce((sum, s) => {
        if (s.totalCost) return sum + Number(s.totalCost)
        if (Array.isArray(s.items)) {
          return sum + s.items.reduce((iSum, it) => iSum + ((Number(it.costPrice) || 0) * Number(it.quantity || 1)), 0)
        }
        return sum
      }, 0)

      // 2. Incomes
      const periodIncomes = incomes.value.filter(i => isDateInPeriod(i.date))
      const totalIncomes = periodIncomes.reduce((sum, i) => sum + Number(i.amount || 0), 0)

      const totalRevenue = totalSalesPOS + totalIncomes
      const grossProfit = totalRevenue - totalHPP

      // 3. Expenses
      const periodExpenses = expenses.value.filter(e => isDateInPeriod(e.date || e.createdAt))
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

      const netProfit = grossProfit - totalExpenses
      const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

      const expenseByCategory = {}
      periodExpenses.forEach(e => {
        const cat = e.category || 'Operasional'
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0)
      })

      return {
        totalSalesPOS,
        totalIncomes,
        totalRevenue,
        totalHPP,
        grossProfit,
        totalExpenses,
        netProfit,
        netMargin,
        periodSalesCount: periodSales.length,
        expenseByCategory
      }
    })

    onIonViewWillEnter(fetchAll)
    return {
      activeTab, incomes, sales, expenses, onDelete, formatPrice, formatDate,
      addOutline, trashOutline, createOutline, summary, openModal, isModalOpen,
      selectedIncomeId, fetchAll, filterSearch, filterCategory, allCategories,
      filteredIncomes, dailyChartSeries, dailyChartOptions, monthlyChartSeries,
      monthlyChartOptions, donutSeries, donutOptions, weeklyChartSeries,
      weeklyChartOptions, plPeriod, plData
    }
  }
}
</script>


