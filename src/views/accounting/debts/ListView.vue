<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Utang & Piutang</ion-title>
            <ion-buttons slot="end">
              <ion-button class="btn-action primary" @click="openModal()">
                <ion-icon slot="start" :icon="addOutline" /> Tambah Catatan
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle">Pantau kewajiban utang usaha dan piutang kasbon pelanggan dalam satu tempat terpadu.</p>
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
          <ion-segment-button value="analisa">
            <ion-label>Analisa & Grafik</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <ion-spinner />
        <p class="text-muted mt-2">Memuat data utang...</p>
      </div>

      <div v-else>
        <!-- ==================== TAB 1: DASHBOARD ==================== -->
        <div v-show="activeTab === 'dashboard'" class="ion-padding">
          <!-- Summary Cards Grid -->
          <ion-grid class="mx-2">
            <ion-row>
              <!-- Total Pokok Utang -->
              <ion-col size="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="p-3">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <ion-icon :icon="walletOutline" class="text-primary fs-5" />
                      <small class="text-muted text-xs fw-bold text-uppercase">Total Utang</small>
                    </div>
                    <div class="fs-6 fw-black text-dark mt-1">{{ formatPrice(summary.total) }}</div>
                    <small class="text-muted text-xs">{{ debts.length }} catatan utang</small>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Sisa Belum Lunas -->
              <ion-col size="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100 border-start border-4 border-warning">
                  <ion-card-content class="p-3">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <ion-icon :icon="alertCircleOutline" class="text-warning fs-5" />
                      <small class="text-muted text-xs fw-bold text-uppercase">Sisa Belum Lunas</small>
                    </div>
                    <div class="fs-6 fw-black text-warning mt-1">{{ formatPrice(summary.remaining) }}</div>
                    <small class="text-muted text-xs">{{ summary.unpaidCount }} utang aktif</small>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Sudah Dibayar / Dicicil -->
              <ion-col size="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100 border-start border-4 border-success">
                  <ion-card-content class="p-3">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <ion-icon :icon="checkmarkCircleOutline" class="text-success fs-5" />
                      <small class="text-muted text-xs fw-bold text-uppercase">Telah Terbayar</small>
                    </div>
                    <div class="fs-6 fw-black text-success mt-1">{{ formatPrice(summary.paid) }}</div>
                    <small class="text-muted text-xs">{{ summary.paidCount }} utang lunas penuh</small>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Jatuh Tempo Segera -->
              <ion-col size="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100 border-start border-4 border-danger">
                  <ion-card-content class="p-3">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <ion-icon :icon="timeOutline" class="text-danger fs-5" />
                      <small class="text-muted text-xs fw-bold text-uppercase">Jatuh Tempo (&le;7h)</small>
                    </div>
                    <div class="fs-6 fw-black text-danger mt-1">{{ formatPrice(summary.dueSoonAmount) }}</div>
                    <small class="text-danger fw-semibold text-xs">{{ summary.dueSoonCount }} perlu perhatian</small>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Alert Banner for Overdue -->
          <div v-if="overdueDebtsCount > 0" class="mx-3 my-3 alert alert-danger d-flex align-items-center justify-content-between rounded-3 shadow-sm border-0">
            <div class="d-flex align-items-center gap-2">
              <ion-icon :icon="alertCircleOutline" class="fs-4" />
              <div>
                <strong class="d-block text-sm">Peringatan Jatuh Tempo!</strong>
                <span class="text-xs">Ada {{ overdueDebtsCount }} utang yang telah melewati tanggal jatuh tempo dan belum lunas.</span>
              </div>
            </div>
            <button class="btn btn-sm btn-light text-danger fw-bold ms-2 text-nowrap" @click="activeTab = 'riwayat'; statusFilter = 'overdue';">
              Lihat Utang
            </button>
          </div>

          <!-- Progress / Settlement Bar -->
          <div class="mobile-card p-3 mx-3 mb-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-xs fw-bold text-muted text-uppercase">Tingkat Pelunasan Akumulatif</span>
              <span class="badge" :class="paidPercentage >= 100 ? 'bg-success' : 'bg-primary'">
                {{ paidPercentage }}% Terbayar
              </span>
            </div>
            <div class="progress" style="height: 12px; border-radius: 6px;">
              <div 
                class="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                :style="{ width: paidPercentage + '%' }" 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
            <div class="d-flex justify-content-between text-xs text-muted mt-2">
              <span>Dibayar: <strong>{{ formatPrice(summary.paid) }}</strong></span>
              <span>Sisa Kewajiban: <strong class="text-danger">{{ formatPrice(summary.remaining) }}</strong></span>
            </div>
          </div>

          <!-- Active Installment Schedules Widget -->
          <div v-if="scheduledDebts.length > 0" class="mobile-card p-3 mx-3 mb-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <ion-icon :icon="calendarOutline" class="text-primary" />
                Jadwal Cicilan Aktif
              </h6>
              <span class="badge bg-light-primary text-primary text-xs">{{ scheduledDebts.length }} Jadwal</span>
            </div>
            <div class="d-flex flex-column gap-2 mt-2">
              <div
                v-for="item in scheduledDebts.slice(0, 4)"
                :key="item.id"
                class="p-2 px-3 bg-light rounded-3 border d-flex justify-content-between align-items-center"
              >
                <div>
                  <div class="fw-bold text-dark text-sm">{{ item.lender }}</div>
                  <div class="text-xs text-muted">
                    <span class="badge bg-info text-white me-1">{{ getScheduleLabel(item) }}</span>
                    <span v-if="item.installmentAmount">Est: {{ formatPrice(item.installmentAmount) }} • </span>
                    Sisa: <span class="text-danger fw-semibold">{{ formatPrice(getRemainingAmount(item)) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary fw-bold text-xs px-2 py-1"
                  @click="openPaymentModal(item)"
                >
                  <ion-icon :icon="cashOutline" class="me-1" />
                  Bayar
                </button>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <ion-grid class="mx-2">
            <ion-row>
              <!-- Bar Chart: 5 Utang Terbesar -->
              <ion-col size="12" size-md="7">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="container-padded">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="fw-bold text-dark mb-0">5 Utang Terbesar (Sisa Pokok)</h6>
                      <span class="badge bg-light text-muted border text-xs">Pemberi Utang</span>
                    </div>
                    <VueApexCharts 
                      v-if="topDebtsChartSeries[0].data.some(v => v > 0)"
                      :key="'top-' + debts.length"
                      type="bar" 
                      height="240" 
                      :options="topDebtsChartOptions" 
                      :series="topDebtsChartSeries" 
                    />
                    <div v-else class="text-center py-4 text-muted text-sm">Belum ada data utang aktif untuk ditampilkan.</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Donut Chart: Status Breakdown -->
              <ion-col size="12" size-md="5">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="container-padded">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="fw-bold text-dark mb-0">Status Pelunasan</h6>
                      <span class="badge bg-light text-muted border text-xs">Proporsi</span>
                    </div>
                    <VueApexCharts 
                      v-if="statusDonutSeries.some(v => v > 0)"
                      :key="'donut-' + debts.length"
                      type="donut" 
                      height="240" 
                      :options="statusDonutOptions" 
                      :series="statusDonutSeries" 
                    />
                    <div v-else class="text-center py-4 text-muted text-sm">Belum ada data status.</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- ==================== TAB 2: RIWAYAT & DETAIL ==================== -->
        <div v-show="activeTab === 'riwayat'" class="ion-padding">
          <!-- Type Filter Chips (Semua / Piutang / Utang) -->
          <div class="d-flex gap-2 mx-3 mb-2 overflow-x-auto pb-1">
            <button 
              type="button" 
              class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
              :class="typeFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white'"
              @click="typeFilter = 'all'"
            >
              Semua ({{ debts.length }})
            </button>
            <button 
              type="button" 
              class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
              :class="typeFilter === 'receivable' ? 'btn-success text-white' : 'btn-outline-secondary bg-white'"
              @click="typeFilter = 'receivable'"
            >
              📥 Piutang Kasbon ({{ debts.filter(d => d.type === 'receivable').length }})
            </button>
            <button 
              type="button" 
              class="btn btn-sm fw-bold px-3 py-1 rounded-pill"
              :class="typeFilter === 'payable' ? 'btn-primary text-white' : 'btn-outline-secondary bg-white'"
              @click="typeFilter = 'payable'"
            >
              📤 Utang Saya ({{ debts.filter(d => (d.type || 'payable') === 'payable').length }})
            </button>
          </div>

          <!-- Filter & Search Controls -->
          <div class="mobile-card p-3 mb-3 mx-3 shadow-sm">
            <div class="row g-2 align-items-center">
              <div class="col-12 col-md-5">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="form-control app-control" 
                  placeholder="Cari nama pemberi utang / catatan..." 
                />
              </div>

              <div class="col-6 col-md-4">
                <select v-model="statusFilter" class="form-select app-control">
                  <option value="all">Semua Status ({{ debts.length }})</option>
                  <option value="unpaid">Belum Lunas ({{ summary.unpaidCount }})</option>
                  <option value="installment">Sedang Dicicil ({{ summary.installmentCount }})</option>
                  <option value="paid">Sudah Lunas ({{ summary.paidCount }})</option>
                  <option value="overdue">Terlewat Jatuh Tempo ({{ overdueDebtsCount }})</option>
                  <option value="scheduled">Memiliki Jadwal Cicilan ({{ scheduledDebts.length }})</option>
                </select>
              </div>

              <div class="col-6 col-md-3">
                <select v-model="sortBy" class="form-select app-control">
                  <option value="dueDateAsc">Jatuh Tempo (Terdekat)</option>
                  <option value="amountDesc">Sisa Utang (Terbesar)</option>
                  <option value="newest">Terbaru</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Debt Items List -->
          <div v-if="filteredDebts.length > 0" class="row mx-2">
            <div v-for="debt in filteredDebts" :key="debt.id" class="col-12 col-sm-6 col-lg-4 g-2 m-0 mb-3 px-2">
              <div 
                class="mobile-card-sm h-100 p-3 d-flex flex-column justify-content-between border-start border-4 shadow-sm"
                :class="getCardBorderClass(debt)"
              >
                <div>
                  <!-- Card Header: Status & Due Info -->
                  <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                    <div class="d-flex align-items-center gap-1">
                      <span class="badge text-xs" :class="debt.type === 'receivable' ? 'bg-success text-white' : 'bg-primary text-white'">
                        {{ debt.type === 'receivable' ? '📥 Piutang' : '📤 Utang' }}
                      </span>
                      <span class="badge text-xs" :class="getStatusBadgeClass(debt)">
                        {{ getStatusText(debt) }}
                      </span>
                    </div>

                    <span class="text-xs fw-semibold" :class="getDueDateColorClass(debt)">
                      <ion-icon :icon="calendarOutline" class="me-1 align-text-bottom" />
                      {{ debt.dueDate ? formatDate(debt.dueDate) : 'Tanpa Jatuh Tempo' }}
                    </span>
                  </div>

                  <!-- Lender & Amount -->
                  <div class="mb-2">
                    <h6 class="fw-bold text-dark m-0 text-truncate" :title="debt.lender">{{ debt.lender }}</h6>
                    
                    <div class="d-flex justify-content-between align-items-baseline mt-1">
                      <div>
                        <small class="text-muted text-xs d-block">Sisa Tagihan:</small>
                        <span class="fs-5 fw-black" :class="isDebtPaid(debt) ? 'text-success' : 'text-danger'">
                          {{ formatPrice(getRemainingAmount(debt)) }}
                        </span>
                      </div>
                      <div class="text-end">
                        <small class="text-muted text-xs d-block">Total Pokok:</small>
                        <span class="text-xs fw-bold text-secondary">{{ formatPrice(debt.amount) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Progress Bar -->
                  <div class="mb-2">
                    <div class="d-flex justify-content-between text-xs text-muted mb-1">
                      <span>Terbayar: {{ formatPrice(getPaidAmount(debt)) }}</span>
                      <span class="fw-bold">{{ getProgressPercent(debt) }}%</span>
                    </div>
                    <div class="progress" style="height: 6px; border-radius: 3px;">
                      <div
                        class="progress-bar bg-success"
                        role="progressbar"
                        :style="{ width: getProgressPercent(debt) + '%' }"
                      ></div>
                    </div>
                  </div>

                  <!-- Schedule & Countdown Badges -->
                  <div class="d-flex flex-wrap gap-1 mb-2">
                    <!-- Schedule Tag -->
                    <span v-if="getScheduleLabel(debt)" class="badge bg-light-info text-info border text-xs fw-normal">
                      <ion-icon :icon="calendarOutline" class="me-1" />
                      {{ getScheduleLabel(debt) }}
                    </span>

                    <!-- Countdown Tag if due date exists -->
                    <span v-if="!isDebtPaid(debt) && debt.dueDate" class="badge bg-light text-dark border text-xs fw-normal">
                      {{ getDueDateCountdown(debt.dueDate) }}
                    </span>

                    <!-- Notes preview if any -->
                    <span v-if="debt.notes" class="badge bg-light text-secondary border text-xs fw-normal text-truncate" style="max-width: 100%;">
                      {{ debt.notes }}
                    </span>
                  </div>
                </div>

                <!-- Footer Actions -->
                <div class="pt-2 border-top mt-2">
                  <div class="d-flex align-items-center justify-content-between gap-1">
                    <!-- Primary Payment Button -->
                    <button 
                      class="btn btn-sm text-xs fw-bold px-2 py-1 flex-grow-1"
                      :class="isDebtPaid(debt) ? 'btn-outline-secondary' : (debt.type === 'receivable' ? 'btn-success text-white' : 'btn-primary')"
                      @click="openPaymentModal(debt)"
                    >
                      <ion-icon :icon="cashOutline" class="me-1" />
                      {{ isDebtPaid(debt) ? 'Riwayat' : (debt.type === 'receivable' ? 'Terima Pelunasan' : 'Bayar / Cicil') }}
                    </button>

                    <!-- WhatsApp Reminder for Receivables -->
                    <button
                      v-if="debt.type === 'receivable' && !isDebtPaid(debt)"
                      class="btn btn-sm btn-outline-success text-xs fw-bold px-2 py-1"
                      @click="remindViaWhatsApp(debt)"
                      title="Kirim pengingat via WhatsApp"
                    >
                      <ion-icon :icon="logoWhatsapp" />
                    </button>

                    <!-- Quick Full Pay Toggle -->
                    <button 
                      class="btn btn-sm text-xs fw-bold px-2 py-1"
                      :class="isDebtPaid(debt) ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="togglePaidStatus(debt)"
                      :title="isDebtPaid(debt) ? 'Batal Lunas' : 'Tandai Langsung Lunas'"
                    >
                      <ion-icon :icon="isDebtPaid(debt) ? closeCircleOutline : checkmarkDoneOutline" />
                    </button>

                    <!-- Edit & Delete -->
                    <button class="btn btn-light btn-sm text-primary px-2 py-1" @click="openModal(debt.id)" title="Edit Utang">
                      <ion-icon :icon="pencilOutline" />
                    </button>
                    <button class="btn btn-light btn-sm text-danger px-2 py-1" @click="onDelete(debt.id)" title="Hapus Utang">
                      <ion-icon :icon="trashOutline" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-5 text-muted mobile-card p-4 mx-3 shadow-sm">
            <ion-icon :icon="walletOutline" style="font-size: 3.5rem; color: #cbd5e1;" />
            <h6 class="fw-bold mt-3 text-secondary">Tidak Ada Data Utang</h6>
            <p class="text-sm">
              {{ searchQuery ? 'Tidak ada data utang yang cocok dengan filter atau kata kunci.' : 'Klik "Tambah Utang" untuk mencatat kewajiban utang baru.' }}
            </p>
            <button class="btn btn-action primary btn-sm mt-2" @click="openModal()">
              <ion-icon :icon="addOutline" class="me-1" /> Tambah Utang Pertama
            </button>
          </div>
        </div>

        <!-- ==================== TAB 3: ANALISA & GRAFIK ==================== -->
        <div v-show="activeTab === 'analisa'" class="ion-padding">
          <ion-grid class="mx-2">
            <ion-row>
              <!-- Timeline/Trend Chart -->
              <ion-col size="12" size-lg="8">
                <ion-card class="mobile-card m-0 h-100 shadow-sm">
                  <ion-card-content class="container-padded">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 class="fw-bold text-dark mb-0">Trend Jadwal Jatuh Tempo Utang</h6>
                        <small class="text-muted text-xs">Distribusi akumulasi utang berdasarkan bulan jatuh tempo</small>
                      </div>
                    </div>
                    <VueApexCharts 
                      v-if="dueTrendChartSeries[0].data.some(v => v > 0)"
                      :key="'trend-' + debts.length"
                      type="area" 
                      height="260" 
                      :options="dueTrendChartOptions" 
                      :series="dueTrendChartSeries" 
                    />
                    <div v-else class="text-center py-4 text-muted text-sm">Belum ada data trend jatuh tempo.</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Recommendations & Health Card -->
              <ion-col size="12" size-lg="4">
                <ion-card class="mobile-card m-0 h-100 shadow-sm">
                  <ion-card-content class="container-padded">
                    <h6 class="fw-bold text-dark mb-3">Analisis Kesehatan Utang</h6>
                    
                    <div class="mb-3">
                      <div class="d-flex justify-content-between text-xs mb-1">
                        <span class="text-muted">Total Pokok Utang</span>
                        <span class="fw-bold text-dark">{{ formatPrice(summary.total) }}</span>
                      </div>
                      <div class="d-flex justify-content-between text-xs mb-1">
                        <span class="text-muted">Telah Dilunasi / Dicicil</span>
                        <span class="fw-bold text-success">{{ formatPrice(summary.paid) }}</span>
                      </div>
                      <div class="d-flex justify-content-between text-xs mb-1">
                        <span class="text-muted">Sisa Tunggakan Aktif</span>
                        <span class="fw-bold text-danger">{{ formatPrice(summary.remaining) }}</span>
                      </div>
                    </div>

                    <hr class="my-3" />

                    <h6 class="fw-bold text-dark text-xs text-uppercase mb-2">Panduan Pengelolaan</h6>
                    <ul class="ps-3 text-xs text-muted mb-0 d-flex flex-column gap-2">
                      <li>Prioritaskan pelunasan utang yang <strong>terlewat batas jatuh tempo</strong> untuk menghindari denda atau beban tambahan.</li>
                      <li>Gunakan fitur <strong>Jadwal Cicilan</strong> (Bulanan / 3 Bulan / 6 Bulan / 1 Tahun) untuk mengatur pengeluaran rutin secara disiplin.</li>
                      <li>Gunakan tombol <strong>Bayar / Cicil</strong> untuk mencatat pembayaran bertahap atau langsung melunasi seluruh sisa tagihan.</li>
                    </ul>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>
      </div>
    </ion-content>

    <!-- Modal Form Utang (Tambah / Edit) -->
    <DebtModal v-model:is-open="isModalOpen" :debt-id="selectedDebtId" @saved="fetchAll" />

    <!-- Modal Pembayaran & Cicilan -->
    <DebtPaymentModal
      v-model:is-open="isPaymentModalOpen"
      :debt="selectedDebtForPayment"
      @saved="fetchAll"
    />
  </ion-page>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { 
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, 
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonSpinner, 
  alertController 
} from '@ionic/vue'
import { 
  addOutline, trashOutline, createOutline, pencilOutline, 
  checkmarkCircleOutline, timeOutline, alertCircleOutline, walletOutline, 
  calendarOutline, checkmarkDoneOutline, closeCircleOutline, cashOutline, logoWhatsapp
} from 'ionicons/icons'
import { debtsRepo } from '../../../db/repositories'
import { businessProfile } from '../../../db/businessProfile'
import DebtModal from './DebtModal.vue'
import DebtPaymentModal from './DebtPaymentModal.vue'

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"))

export default {
  name: 'AccountingDebtsListView',
  components: { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
    IonIcon, IonButtons, IonSegment, IonSegmentButton, IonLabel, 
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonSpinner, 
    DebtModal, DebtPaymentModal, VueApexCharts 
  },
  setup() {
    const activeTab = ref('dashboard')
    const loading = ref(false)
    const debts = ref([])
    
    watch(activeTab, (tab) => {
      if (tab === 'dashboard' || tab === 'analisa') {
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

    // Modals
    const isModalOpen = ref(false)
    const selectedDebtId = ref(null)
    const isPaymentModalOpen = ref(false)
    const selectedDebtForPayment = ref(null)

    // Filters & Search
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const typeFilter = ref('all')
    const sortBy = ref('dueDateAsc')

    const fetchAll = async () => {
      loading.value = true
      try {
        const data = await debtsRepo.getAll()
        debts.value = data || []
        
        // If payment modal is open, refresh selectedDebtForPayment with updated item
        if (selectedDebtForPayment.value) {
          const updated = debts.value.find(d => d.id === selectedDebtForPayment.value.id)
          if (updated) selectedDebtForPayment.value = updated
        }
        nextTick(() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
          }, 100)
        })
      } catch (err) {
        console.error('Error fetching debts:', err)
      } finally {
        loading.value = false
      }
    }

    const openModal = (id = null) => {
      selectedDebtId.value = id
      isModalOpen.value = true
    }

    const openPaymentModal = (debt) => {
      selectedDebtForPayment.value = debt
      isPaymentModalOpen.value = true
    }

    const onDelete = async (id) => {
      const alert = await alertController.create({
        header: 'Konfirmasi Hapus',
        message: 'Yakin ingin menghapus data utang ini beserta riwayat pembayarannya?',
        buttons: [
          { text: 'Batal', role: 'cancel' },
          { 
            text: 'Hapus', 
            role: 'destructive', 
            handler: async () => { 
              await debtsRepo.delete(id)
              await fetchAll() 
            } 
          }
        ]
      })
      await alert.present()
    }

    // Calculations
    const getPaidAmount = (debt) => {
      if (!debt) return 0
      if (Array.isArray(debt.installments) && debt.installments.length > 0) {
        return debt.installments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      }
      if (debt.status === 'Lunas' || debt.status === 'Paid') {
        return Number(debt.amount || 0)
      }
      return Number(debt.paidAmount || 0)
    }

    const getRemainingAmount = (debt) => {
      if (!debt) return 0
      const total = Number(debt.amount || 0)
      const paid = getPaidAmount(debt)
      const rem = total - paid
      return rem > 0 ? rem : 0
    }

    const getProgressPercent = (debt) => {
      if (!debt || Number(debt.amount || 0) <= 0) return 0
      const pct = Math.round((getPaidAmount(debt) / Number(debt.amount)) * 100)
      return pct > 100 ? 100 : pct
    }

    const isDebtPaid = (debt) => {
      if (!debt) return false
      return getRemainingAmount(debt) <= 0 || debt.status === 'Lunas' || debt.status === 'Paid'
    }

    const isPartiallyPaid = (debt) => {
      if (!debt) return false
      return !isDebtPaid(debt) && getPaidAmount(debt) > 0
    }

    const togglePaidStatus = async (debt) => {
      const currentlyPaid = isDebtPaid(debt)
      let updatedDebt = { ...debt }

      if (currentlyPaid) {
        // Mark unpaid
        updatedDebt.status = 'Belum Lunas'
        updatedDebt.paidAmount = 0
        updatedDebt.installments = []
      } else {
        // Mark full paid
        const total = Number(debt.amount || 0)
        updatedDebt.status = 'Lunas'
        updatedDebt.paidAmount = total
        const newInstallment = {
          id: Date.now(),
          amount: getRemainingAmount(debt),
          date: new Date().toISOString().slice(0, 10),
          notes: 'Pelunasan Cepat'
        }
        updatedDebt.installments = [...(debt.installments || []), newInstallment]
      }

      await debtsRepo.update(debt.id, updatedDebt)
      await fetchAll()
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
      }).format(Number(price || 0))
    }

    const formatDate = (d) => {
      if (!d) return '-'
      const date = new Date(d)
      if (isNaN(date.getTime())) return d
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const getDueDateDiffDays = (dueDateStr) => {
      if (!dueDateStr) return 999
      const due = new Date(dueDateStr)
      if (isNaN(due.getTime())) return 999
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      due.setHours(0, 0, 0, 0)
      const diffMs = due.getTime() - today.getTime()
      return Math.round(diffMs / (1000 * 60 * 60 * 24))
    }

    const getDueDateCountdown = (dueDateStr) => {
      if (!dueDateStr) return '-'
      const diff = getDueDateDiffDays(dueDateStr)
      if (diff === 999) return '-'
      if (diff < 0) return `Terlewat ${Math.abs(diff)} hari`
      if (diff === 0) return 'Jatuh tempo hari ini!'
      return `${diff} hari lagi`
    }

    const getScheduleLabel = (debt) => {
      if (!debt || debt.paymentType !== 'installment') return null
      const freq = debt.installmentFrequency
      const day = debt.payDayOfMonth || 5
      if (freq === 'monthly') return `Tgl ${day} tiap bulan`
      if (freq === 'quarterly') return `Tiap 3 bln (tgl ${day})`
      if (freq === 'biannual') return `Tiap 6 bln (tgl ${day})`
      if (freq === 'annual') return `Tiap 1 thn (tgl ${day})`
      if (freq === 'custom') return 'Cicilan Fleksibel'
      return 'Cicilan Terjadwal'
    }

    const getStatusText = (debt) => {
      if (isDebtPaid(debt)) return 'Lunas'
      if (isPartiallyPaid(debt)) return `Dicicil (${getProgressPercent(debt)}%)`
      return 'Belum Lunas'
    }

    const getCardBorderClass = (debt) => {
      if (isDebtPaid(debt)) return 'border-success'
      if (debt.dueDate) {
        const diff = getDueDateDiffDays(debt.dueDate)
        if (diff < 0) return 'border-danger'
        if (diff <= 7) return 'border-warning'
      }
      if (isPartiallyPaid(debt)) return 'border-info'
      return 'border-primary'
    }

    const getStatusBadgeClass = (debt) => {
      if (isDebtPaid(debt)) return 'bg-success text-white'
      if (debt.dueDate && getDueDateDiffDays(debt.dueDate) < 0) return 'bg-danger text-white'
      if (isPartiallyPaid(debt)) return 'bg-info text-white'
      return 'bg-warning text-dark'
    }

    const getDueDateColorClass = (debt) => {
      if (isDebtPaid(debt)) return 'text-muted'
      if (!debt.dueDate) return 'text-muted'
      const diff = getDueDateDiffDays(debt.dueDate)
      if (diff < 0) return 'text-danger fw-bold'
      if (diff <= 7) return 'text-warning fw-bold'
      return 'text-muted'
    }

    // Summary calculations
    const summary = computed(() => {
      let total = 0
      let paid = 0
      let remaining = 0
      let paidCount = 0
      let unpaidCount = 0
      let installmentCount = 0
      let dueSoonAmount = 0
      let dueSoonCount = 0

      debts.value.forEach(d => {
        const amt = Number(d.amount || 0)
        const pAmt = getPaidAmount(d)
        const rAmt = getRemainingAmount(d)
        
        total += amt
        paid += pAmt
        remaining += rAmt

        if (isDebtPaid(d)) {
          paidCount++
        } else {
          unpaidCount++
          if (isPartiallyPaid(d)) installmentCount++
          if (d.dueDate) {
            const diff = getDueDateDiffDays(d.dueDate)
            if (diff >= 0 && diff <= 7) {
              dueSoonAmount += rAmt
              dueSoonCount++
            }
          }
        }
      })

      return {
        total, paid, remaining, paidCount, unpaidCount, installmentCount, dueSoonAmount, dueSoonCount
      }
    })

    const overdueDebtsCount = computed(() => {
      return debts.value.filter(d => !isDebtPaid(d) && d.dueDate && getDueDateDiffDays(d.dueDate) < 0).length
    })

    const paidPercentage = computed(() => {
      if (!summary.value.total) return 0
      return Math.min(100, Math.round((summary.value.paid / summary.value.total) * 100))
    })

    const scheduledDebts = computed(() => {
      return debts.value.filter(d => !isDebtPaid(d) && d.paymentType === 'installment')
    })

    // Filtered & Sorted Debts
    const filteredDebts = computed(() => {
      const q = searchQuery.value.toLowerCase().trim()
      let list = debts.value.filter(d => {
        if (q) {
          const matchLender = (d.lender || '').toLowerCase().includes(q)
          const matchNotes = (d.notes || '').toLowerCase().includes(q)
          if (!matchLender && !matchNotes) return false
        }
        if (typeFilter.value !== 'all') {
          const itemType = d.type || 'payable'
          if (itemType !== typeFilter.value) return false
        }
        if (statusFilter.value === 'unpaid') return !isDebtPaid(d)
        if (statusFilter.value === 'installment') return isPartiallyPaid(d)
        if (statusFilter.value === 'paid') return isDebtPaid(d)
        if (statusFilter.value === 'overdue') return !isDebtPaid(d) && d.dueDate && getDueDateDiffDays(d.dueDate) < 0
        if (statusFilter.value === 'scheduled') return d.paymentType === 'installment'
        return true
      })

      return list.sort((a, b) => {
        if (sortBy.value === 'dueDateAsc') {
          // Put items with due date first, items without due date last
          if (!a.dueDate && b.dueDate) return 1
          if (a.dueDate && !b.dueDate) return -1
          if (!a.dueDate && !b.dueDate) return 0
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (sortBy.value === 'amountDesc') {
          return getRemainingAmount(b) - getRemainingAmount(a)
        }
        // newest default
        return (b.id || 0) - (a.id || 0)
      })
    })

    // Chart 1: Top 5 Highest Remaining Debts (Bar)
    const topDebtsChartSeries = computed(() => {
      const top5 = [...debts.value]
        .filter(d => !isDebtPaid(d))
        .sort((a, b) => getRemainingAmount(b) - getRemainingAmount(a))
        .slice(0, 5)

      return [{
        name: 'Sisa Utang',
        data: top5.map(d => getRemainingAmount(d))
      }]
    })

    const topDebtsChartOptions = computed(() => {
      const top5 = [...debts.value]
        .filter(d => !isDebtPaid(d))
        .sort((a, b) => getRemainingAmount(b) - getRemainingAmount(a))
        .slice(0, 5)

      return {
        chart: { toolbar: { show: false } },
        colors: ['#3b82f6'],
        plotOptions: { bar: { borderRadius: 6, horizontal: true } },
        dataLabels: { enabled: false },
        xaxis: {
          categories: top5.map(d => d.lender || 'Tanpa Nama'),
          labels: {
            formatter: (val) => 'Rp' + (val / 1000).toLocaleString('id-ID') + 'k'
          }
        },
        tooltip: {
          y: { formatter: (val) => formatPrice(val) }
        }
      }
    })

    // Chart 2: Status Donut
    const statusDonutSeries = computed(() => {
      return [
        summary.value.unpaidCount - summary.value.installmentCount,
        summary.value.installmentCount,
        summary.value.paidCount,
        overdueDebtsCount.value
      ]
    })

    const statusDonutOptions = computed(() => ({
      chart: { type: 'donut' },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      labels: ['Belum Dicicil', 'Sedang Dicicil', 'Sudah Lunas', 'Terlewat'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    }))

    // Chart 3: Due Date Trend (Area)
    const dueTrendChartSeries = computed(() => {
      const monthMap = {}
      debts.value.forEach(d => {
        if (!d.dueDate) return
        const date = new Date(d.dueDate)
        if (isNaN(date.getTime())) return
        const key = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        monthMap[key] = (monthMap[key] || 0) + getRemainingAmount(d)
      })

      const categories = Object.keys(monthMap)
      const data = categories.map(k => monthMap[k])

      return [{
        name: 'Target Pelunasan',
        data
      }]
    })

    const dueTrendChartOptions = computed(() => {
      const monthMap = {}
      debts.value.forEach(d => {
        if (!d.dueDate) return
        const date = new Date(d.dueDate)
        if (isNaN(date.getTime())) return
        const key = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        monthMap[key] = (monthMap[key] || 0) + getRemainingAmount(d)
      })

      return {
        chart: { type: 'area', toolbar: { show: false } },
        colors: ['#6366f1'],
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', colors: ['#6366f1'], gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
        xaxis: { categories: Object.keys(monthMap) },
        yaxis: { labels: { formatter: (val) => 'Rp' + (val / 1000).toLocaleString('id-ID') + 'k' } },
        tooltip: { y: { formatter: (val) => formatPrice(val) } }
      }
    })

    const remindViaWhatsApp = (debt) => {
      const store = businessProfile.value
      const rem = getRemainingAmount(debt)
      const dueDateStr = debt.dueDate ? formatDate(debt.dueDate) : 'secepatnya'
      let msg = `Halo ${debt.lender},\n\nIni pengingat dari *${store.storeName}* terkait catatan kasbon sebesar *${formatPrice(rem)}* (jatuh tempo: ${dueDateStr}).\n`
      if (debt.notes) msg += `Rincian: ${debt.notes}\n`
      msg += `\nMohon konfirmasi atau pelunasan dapat diserahkan ke toko kami. Terima kasih banyak! 🙏`

      let cleanPhone = (debt.phone || '').replace(/\D/g, '')
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1)

      const url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
    }

    onMounted(fetchAll)

    return {
      activeTab, loading, debts, isModalOpen, selectedDebtId,
      isPaymentModalOpen, selectedDebtForPayment,
      searchQuery, statusFilter, typeFilter, sortBy, filteredDebts,
      summary, overdueDebtsCount, paidPercentage, scheduledDebts,
      topDebtsChartSeries, topDebtsChartOptions,
      statusDonutSeries, statusDonutOptions,
      dueTrendChartSeries, dueTrendChartOptions,
      fetchAll, openModal, openPaymentModal, onDelete, togglePaidStatus,
      isDebtPaid, isPartiallyPaid, getPaidAmount, getRemainingAmount, getProgressPercent,
      getCardBorderClass, getStatusBadgeClass, getStatusText, getDueDateColorClass,
      getDueDateCountdown, getScheduleLabel, remindViaWhatsApp,
      formatPrice, formatDate,
      addOutline, trashOutline, createOutline, pencilOutline,
      walletOutline, alertCircleOutline, checkmarkCircleOutline, timeOutline,
      calendarOutline, checkmarkDoneOutline, closeCircleOutline, cashOutline, logoWhatsapp
    }
  }
}
</script>

<style scoped>
.bg-light-primary {
  background-color: rgba(59, 130, 246, 0.08);
}
.bg-light-info {
  background-color: rgba(6, 182, 212, 0.08);
}
</style>
