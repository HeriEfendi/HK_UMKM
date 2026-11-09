<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <ion-title class="app-hero-title" style="padding:0;">Pengingat</ion-title>
            <ion-buttons style="margin:0;" class="d-flex gap-2">
              <button class="btn btn-action secondary btn-md" @click="templateModalOpen = true" title="Gunakan template pengingat usaha siap pakai">
                <ion-icon :icon="sparklesOutline" class="me-1" /> Template UMKM
              </button>
              <button class="btn btn-action light btn-md" @click="testNotification" title="Kirim notifikasi uji coba ke perangkat">
                <ion-icon :icon="notificationsOutline" class="me-1" /> Tes Notif
              </button>
              <button class="btn btn-action primary btn-md" @click="openDialog()">
                <ion-icon :icon="addOutline" class="me-1" /> Tambah
              </button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle" style="margin:0;">Catat hari-hari penting, atur pengulangan, dan dapatkan notifikasi otomatis.</p>
        </div>
      </ion-toolbar>

      <!-- Search + filter -->
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mt-1">
        <div class="w-100 px-3 py-1">
          <div class="position-relative">
            <input type="text" v-model="searchQuery" class="form-control form-control-sm app-control" style="padding-left:30px;" placeholder="Cari pengingat..." />
            <ion-icon :icon="searchOutline" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:1rem;color:#94a3b8;" />
          </div>
        </div>
        <div class="mx-3 my-2 d-flex gap-2 overflow-x-auto" style="scrollbar-width:none;">
          <button v-for="opt in filterOptions" :key="opt.value"
            class="btn btn-action primary chip-btn btn-md"
            :class="activeFilter === opt.value ? 'pill-badge primary' : 'pill-badge secondary'"
            @click="activeFilter = opt.value" style="margin:0;white-space:nowrap;">
            {{ opt.label }}
          </button>
        </div>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- Metric cards -->
      <ion-grid class="mx-2 mt-2 mb-3">
        <ion-row>
          <ion-col size="6" size-sm="3">
            <ion-card class="mobile-card m-0 h-100">
              <ion-card-content class="py-3">
                <small class="text-muted d-block text-xs">Total</small>
                <div class="fs-6 fw-black text-primary mt-1">{{ reminders.length }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-sm="3">
            <ion-card class="mobile-card m-0 h-100">
              <ion-card-content class="py-3">
                <small class="text-muted d-block text-xs">Hari Ini</small>
                <div class="fs-6 fw-black text-warning mt-1">{{ todayCount }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-sm="3">
            <ion-card class="mobile-card m-0 h-100">
              <ion-card-content class="py-3">
                <small class="text-muted d-block text-xs">7 Hari</small>
                <div class="fs-6 fw-black text-success mt-1">{{ week7Count }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-sm="3">
            <ion-card class="mobile-card m-0 h-100">
              <ion-card-content class="py-3">
                <small class="text-muted d-block text-xs">Berulang</small>
                <div class="fs-6 fw-black text-indigo mt-1">{{ recurringCount }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Empty -->
      <div v-if="filteredReminders.length === 0" class="empty-state text-center py-5 mobile-card container-padded mx-3 mt-2">
        <ion-icon :icon="calendarOutline" style="font-size:3rem;" class="mb-2 text-muted" />
        <p class="text-muted">Belum ada pengingat. Tambah sekarang!</p>
      </div>

      <!-- List -->
      <ion-grid v-else class="mx-2">
        <ion-row>
          <ion-col v-for="r in filteredReminders" :key="r.id" size="12" size-sm="6" size-lg="4">
            <ion-card class="mobile-card m-0 mb-3 h-100 reminder-card" :class="getUrgencyClass(r)">
              <ion-card-header class="mobile-card-header">
                <div class="mobile-card-top">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="reminder-emoji">{{ r.emoji || '📅' }}</span>
                    <span :class="['pill-badge', getCategoryClass(r.category)]">{{ r.category || 'Umum' }}</span>
                    <span v-if="r.recurringType !== 'none'" class="pill-badge secondary">
                      🔁 {{ recurringLabel(r) }}
                    </span>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-light btn-md text-primary" @click.stop="startEdit(r)"><ion-icon :icon="pencilOutline" /></button>
                    <button class="btn btn-light btn-md text-danger" @click.stop="confirmDelete(r.id)"><ion-icon :icon="trashOutline" /></button>
                  </div>
                </div>
                <ion-card-title class="mobile-card-title mt-2">{{ r.title }}</ion-card-title>
                <ion-card-subtitle class="mobile-card-subtitle mt-1">{{ formatDisplayDate(r) }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content class="pt-0">
                <div class="row gx-2 gy-1 mt-1">
                  <div class="col-6">
                    <div class="metric-label">Berikutnya</div>
                    <div class="metric-value">{{ getNextOccurrence(r) ?? r.date }}</div>
                  </div>
                  <div class="col-6">
                    <div class="metric-label">Sisa Hari</div>
                    <div class="metric-value" :class="getDaysClass(r)">{{ getDaysLabel(r) }}</div>
                  </div>
                </div>
                <div class="row gx-2 gy-1 mt-1">
                  <div class="col-12">
                    <div class="metric-label">Notifikasi</div>
                    <div class="metric-value" style="font-size:0.8rem;">
                      <ion-icon :icon="notificationsOutline" class="me-1" />{{ notifyModeLabel(r.notifyMode) }}
                      <span v-if="r.notifyTime" class="ms-1 text-muted">• {{ r.notifyTime }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="r.notes" class="mt-2 text-muted" style="font-size:0.83rem;font-style:italic;">"{{ r.notes }}"</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>

    <!-- ── FORM MODAL ───────────────────────────────────────── -->
    <ion-modal :is-open="dialogVisible" @didDismiss="closeDialog">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editMode ? 'Edit Pengingat' : 'Tambah Pengingat' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDialog"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding modal-content">
        <div class="form-container mb-4">

          <!-- Judul + Emoji -->
          <div class="form-section">
            <div class="row g-2">
              <div class="col-8">
                <label class="form-label">Judul <span class="text-danger">*</span></label>
                <input v-model="form.title" class="form-control app-control" placeholder="Cth: Ulang tahun Mama" />
              </div>
              <div class="col-4">
                <label class="form-label">Emoji</label>
                <input v-model="form.emoji" class="form-control app-control text-center" placeholder="🎂" maxlength="4" style="font-size:1.4rem;" />
              </div>
            </div>
          </div>

          <!-- Kategori + Tanggal -->
          <div class="form-section">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label">Kategori</label>
                <select v-model="form.category" class="form-select app-control">
                  <option>Bisnis</option>
                  <option>Keuangan</option>
                  <option>Stok</option>
                  <option>Operasional</option>
                  <option>Ulang Tahun</option>
                  <option>Pertemuan</option>
                  <option>Deadline</option>
                  <option>Liburan</option>
                  <option>Kesehatan</option>
                  <option>Umum</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Tanggal <span class="text-danger">*</span></label>
                <input type="date" v-model="form.date" class="form-control app-control" />
              </div>
            </div>
          </div>

          <!-- Tipe Pengulangan -->
          <div class="form-section">
            <label class="form-label">Pengulangan</label>
            <div class="recurring-grid">
              <button
                v-for="opt in recurringOptions" :key="opt.value"
                type="button"
                class="recurring-btn"
                :class="{ active: form.recurringType === opt.value }"
                @click="form.recurringType = opt.value"
              >
                <span class="recurring-icon">{{ opt.icon }}</span>
                <span class="recurring-label">{{ opt.label }}</span>
              </button>
            </div>

            <!-- Sub-opsi daily: pilih hari -->
            <div v-if="form.recurringType === 'daily'" class="mt-3">
              <label class="form-label text-xs">Pilih hari (kosong = setiap hari)</label>
              <div class="day-picker">
                <button
                  v-for="d in DAYS_OF_WEEK" :key="d.value"
                  type="button"
                  class="day-btn"
                  :class="{ active: form.recurringDays.includes(d.value) }"
                  @click="toggleDay(d.value)"
                >{{ d.label }}</button>
              </div>
            </div>

            <!-- Sub-opsi monthly: pilih tanggal -->
            <div v-if="form.recurringType === 'monthly'" class="mt-3">
              <label class="form-label text-xs">Tanggal setiap bulan</label>
              <input type="number" v-model="form.recurringDayOfMonth" class="form-control app-control" min="1" max="31" placeholder="1–31" />
            </div>
          </div>

          <!-- Pengaturan Notifikasi -->
          <div class="form-section">
            <label class="form-label">Mulai Mengingatkan</label>
            <div class="notify-mode-group">
              <label
                v-for="opt in notifyModeOptions" :key="opt.value"
                class="notify-mode-item"
                :class="{ active: form.notifyMode === opt.value }"
              >
                <input type="radio" :value="opt.value" v-model="form.notifyMode" class="d-none" />
                <span class="notify-icon">{{ opt.icon }}</span>
                <span>{{ opt.label }}</span>
              </label>
            </div>
            <div class="mt-2">
              <label class="form-label text-xs">Jam Notifikasi</label>
              <input type="time" v-model="form.notifyTime" class="form-control app-control" />
            </div>
          </div>

          <!-- Catatan -->
          <div class="form-section">
            <label class="form-label">Catatan</label>
            <textarea v-model="form.notes" class="form-control app-control form-control-textarea" rows="2" placeholder="Keterangan tambahan..." />
          </div>
        </div>
      </ion-content>

      <ion-footer>
        <div style="padding:12px;background-color:#ecf3fd;">
          <div class="form-actions gap-2">
            <button type="button" class="btn btn-action light w-100 m-0" @click="closeDialog">Batal</button>
            <button type="button" class="btn btn-action primary w-100 m-0" @click="saveReminder">Simpan</button>
          </div>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Template Pengingat Siap Pakai Modal (M-09) -->
    <ion-modal :is-open="templateModalOpen" @didDismiss="templateModalOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Template Pengingat UMKM</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="templateModalOpen = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="app-content-wrap ion-padding bg-light">
        <p class="text-muted small mb-3">Pilih salah satu template agenda bisnis di bawah ini untuk langsung mengisi dan mengaktifkan pengingat otomatis:</p>

        <div class="d-flex flex-column gap-3">
          <div 
            v-for="tpl in businessTemplates" 
            :key="tpl.title" 
            class="mobile-card p-3 cursor-pointer clickable-card border hover-shadow"
            @click="applyBusinessTemplate(tpl)"
          >
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-3 p-3 text-center fs-2" :style="{ background: tpl.bg || '#eff6ff' }">
                {{ tpl.emoji }}
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <h6 class="fw-bold text-dark mb-0 fs-6">{{ tpl.title }}</h6>
                  <span class="badge bg-primary text-xs">{{ tpl.recurrenceLabel }}</span>
                </div>
                <p class="text-muted text-xs mb-1">{{ tpl.description }}</p>
                <small class="text-indigo fw-semibold">⏰ Jam Notifikasi: {{ tpl.time }}</small>
              </div>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Delete Alert -->
    <ion-alert
      :is-open="deleteId !== null"
      header="Hapus Pengingat"
      message="Yakin ingin menghapus pengingat ini?"
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: () => deleteId = null },
        { text: 'Hapus', role: 'destructive', handler: doDelete }
      ]"
      @didDismiss="deleteId = null"
    />

    <AppToast :is-open="toast.show" :message="toast.text" :color="toast.color" @dismiss="toast.show = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  IonModal, IonAlert, IonFooter, IonGrid, IonRow, IonCol
} from '@ionic/vue'
import { addOutline, pencilOutline, trashOutline, closeOutline, searchOutline, calendarOutline, notificationsOutline, sparklesOutline } from 'ionicons/icons'
import {
  ReminderRepository, getNextOccurrence, daysUntil,
  recurringLabel, notifyModeLabel,
  type ReminderItem, type RecurringType, type NotifyMode
} from '@/db/reminderRepository'
import { scheduleReminderNotifications, triggerTestNotification } from '@/utils/reminderNotifications'
import AppToast from '@/components/AppToast.vue'

async function testNotification() {
  const success = await triggerTestNotification()
  if (success) {
    toast.value = { show: true, text: 'Notifikasi uji coba berhasil dikirim! 🔔', color: 'success' }
  } else {
    toast.value = { show: true, text: 'Pastikan izin notifikasi telah diberikan di pengaturan perangkat/browser.', color: 'error' }
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = [
  { label: 'Min', value: 0 }, { label: 'Sen', value: 1 }, { label: 'Sel', value: 2 },
  { label: 'Rab', value: 3 }, { label: 'Kam', value: 4 }, { label: 'Jum', value: 5 }, { label: 'Sab', value: 6 }
]

const recurringOptions = [
  { label: 'Sekali',   value: 'none',    icon: '1️⃣' },
  { label: 'Harian',   value: 'daily',   icon: '📆' },
  { label: 'Mingguan', value: 'weekly',  icon: '🗓️' },
  { label: 'Bulanan',  value: 'monthly', icon: '📅' },
  { label: 'Tahunan',  value: 'yearly',  icon: '🎊' },
]

const notifyModeOptions = [
  { label: 'Hanya hari H',       value: 'on_day',  icon: '📍' },
  { label: 'Mulai 3 hari sebelum', value: '3_days', icon: '⏰' },
  { label: 'Mulai 7 hari sebelum', value: '7_days', icon: '📣' },
]

const filterOptions = [
  { label: 'Semua',   value: 'Semua'   },
  { label: 'Hari Ini', value: 'Hari Ini'},
  { label: '7 Hari',  value: '7 Hari'  },
  { label: '30 Hari', value: '30 Hari' },
  { label: 'Berulang', value: 'Berulang'},
]

// ── State ─────────────────────────────────────────────────────────────────────
const reminders = ref<ReminderItem[]>([])
const dialogVisible = ref(false)
const templateModalOpen = ref(false)
const editMode = ref(false)
const editId = ref<number | null>(null)
const deleteId = ref<number | null>(null)
const searchQuery = ref('')
const activeFilter = ref('Semua')
const toast = ref({ show: false, text: '', color: 'success' })

const businessTemplates = [
  {
    title: 'Setor & Lapor Pajak UMKM (PPN / PPh Final)',
    emoji: '🏛️',
    bg: '#fef3c7',
    category: 'Bisnis',
    recurrenceLabel: 'Bulanan (Tgl 15)',
    description: 'Kewajiban pembayaran pajak UMKM bulanan sebelum tanggal 15 agar bebas denda administrasi.',
    recurringType: 'monthly' as const,
    recurringDayOfMonth: 15,
    time: '09:00',
    notifyMode: '3_days' as const
  },
  {
    title: 'Stock Opname & Cek Fisik Barang',
    emoji: '📦',
    bg: '#eff6ff',
    category: 'Stok',
    recurrenceLabel: 'Mingguan (Senin)',
    description: 'Penghitungan fisik stok barang toko vs catatan sistem untuk mendeteksi barang hilang atau rusak.',
    recurringType: 'weekly' as const,
    recurringDays: [1], // Senin
    time: '08:30',
    notifyMode: 'on_day' as const
  },
  {
    title: 'Bayar Tagihan Listrik, Air & Wi-Fi Toko',
    emoji: '💡',
    bg: '#f0fdf4',
    category: 'Operasional',
    recurrenceLabel: 'Bulanan (Tgl 20)',
    description: 'Pelunasan tagihan listrik pascabayar/token, air PDAM, dan internet toko sebelum batas akhir.',
    recurringType: 'monthly' as const,
    recurringDayOfMonth: 20,
    time: '10:00',
    notifyMode: '3_days' as const
  },
  {
    title: 'Tutup Buku & Evaluasi Laba Rugi Bulanan',
    emoji: '📊',
    bg: '#faf5ff',
    category: 'Keuangan',
    recurrenceLabel: 'Bulanan (Tgl 28)',
    description: 'Analisis omset penjualan, margin keuntungan, dan evaluasi biaya operasional bulan berjalan.',
    recurringType: 'monthly' as const,
    recurringDayOfMonth: 28,
    time: '17:00',
    notifyMode: 'on_day' as const
  },
  {
    title: 'Penagihan Piutang & Kasbon Pelanggan',
    emoji: '📥',
    bg: '#fff7ed',
    category: 'Keuangan',
    recurrenceLabel: 'Mingguan (Jumat)',
    description: 'Follow-up ramah via WhatsApp kepada pelanggan yang memiliki catatan kasbon jatuh tempo.',
    recurringType: 'weekly' as const,
    recurringDays: [5], // Jumat
    time: '14:00',
    notifyMode: 'on_day' as const
  }
]

function applyBusinessTemplate(tpl: typeof businessTemplates[0]) {
  const today = new Date()
  let dateStr = ''
  if (tpl.recurringType === 'weekly' && tpl.recurringDays && tpl.recurringDays.length > 0) {
    const targetDay = tpl.recurringDays[0]
    const diff = (targetDay - today.getDay() + 7) % 7
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + diff)
    const y = nextDate.getFullYear()
    const m = String(nextDate.getMonth() + 1).padStart(2, '0')
    const d = String(nextDate.getDate()).padStart(2, '0')
    dateStr = `${y}-${m}-${d}`
  } else {
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    dateStr = `${year}-${month}-${String(tpl.recurringDayOfMonth || 15).padStart(2, '0')}`
  }

  form.value = {
    title: tpl.title,
    emoji: tpl.emoji,
    category: tpl.category,
    date: dateStr,
    notes: tpl.description,
    recurringType: tpl.recurringType,
    recurringDays: tpl.recurringDays ? [...tpl.recurringDays] : [],
    recurringDayOfMonth: tpl.recurringDayOfMonth,
    notifyMode: tpl.notifyMode,
    notifyTime: tpl.time
  }

  editMode.value = false
  editId.value = null
  templateModalOpen.value = false
  dialogVisible.value = true
}

const defaultForm = (): Omit<ReminderItem, 'id'|'createdAt'> => ({
  title: '', emoji: '📅', category: 'Umum', date: '',
  notes: '', recurringType: 'none', recurringDays: [],
  recurringDayOfMonth: undefined, notifyMode: 'on_day', notifyTime: '08:00'
})
const form = ref(defaultForm())

// ── Computed ──────────────────────────────────────────────────────────────────
const effectiveDate = (r: ReminderItem) => getNextOccurrence(r) ?? r.date

const filteredReminders = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return reminders.value
    .filter(r => {
      const next = getNextOccurrence(r)
      const days = next ? daysUntil(next) : -999
      if (activeFilter.value === 'Hari Ini' && days !== 0) return false
      if (activeFilter.value === '7 Hari' && (days < 0 || days > 7)) return false
      if (activeFilter.value === '30 Hari' && (days < 0 || days > 30)) return false
      if (activeFilter.value === 'Berulang' && r.recurringType === 'none') return false
      if (q && !r.title.toLowerCase().includes(q) && !(r.notes || '').toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)))
})

const todayCount  = computed(() => reminders.value.filter(r => { const n = getNextOccurrence(r); return n ? daysUntil(n) === 0 : false }).length)
const week7Count  = computed(() => reminders.value.filter(r => { const n = getNextOccurrence(r); if (!n) return false; const d = daysUntil(n); return d >= 0 && d <= 7 }).length)
const recurringCount = computed(() => reminders.value.filter(r => r.recurringType !== 'none').length)

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDaysLabel(r: ReminderItem) {
  const next = getNextOccurrence(r)
  if (!next) return 'Sudah lewat'
  const d = daysUntil(next)
  if (d === 0) return 'Hari ini! 🎉'
  if (d === 1) return 'Besok!'
  if (d < 0)   return `${Math.abs(d)} hari lalu`
  return `${d} hari lagi`
}

function getDaysClass(r: ReminderItem) {
  const next = getNextOccurrence(r)
  if (!next) return 'text-muted'
  const d = daysUntil(next)
  if (d === 0)  return 'text-warning fw-black'
  if (d < 0)    return 'text-muted'
  if (d <= 3)   return 'text-danger fw-black'
  if (d <= 7)   return 'text-warning fw-bold'
  return 'text-success'
}

function getUrgencyClass(r: ReminderItem) {
  const next = getNextOccurrence(r)
  if (!next) return ''
  const d = daysUntil(next)
  if (d === 0) return 'urgency-today'
  if (d > 0 && d <= 3) return 'urgency-soon'
  return ''
}

function getCategoryClass(cat?: string) {
  const map: Record<string, string> = {
    'Bisnis': 'primary', 'Stok': 'info', 'Operasional': 'warning',
    'Ulang Tahun': 'primary', 'Pertemuan': 'progress', 'Deadline': 'todo',
    'Liburan': 'done', 'Kesehatan': 'secondary', 'Keuangan': 'high', 'Umum': 'secondary'
  }
  return map[cat ?? ''] || 'secondary'
}

function formatDisplayDate(r: ReminderItem) {
  const d = getNextOccurrence(r) ?? r.date
  const parts = String(d).split('-').map(Number)
  const dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(d)
  return dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function toggleDay(day: number) {
  const days = form.value.recurringDays ?? []
  const idx = days.indexOf(day)
  if (idx >= 0) days.splice(idx, 1)
  else days.push(day)
  days.sort((a, b) => a - b)
  form.value.recurringDays = [...days]
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function load() {
  reminders.value = await ReminderRepository.getAll()
}

function openDialog() {
  editMode.value = false; editId.value = null
  form.value = defaultForm()
  dialogVisible.value = true
}

function startEdit(r: ReminderItem) {
  editMode.value = true; editId.value = r.id!
  form.value = {
    ...defaultForm(),
    ...r,
    recurringDays: [...(r.recurringDays ?? [])],
  }
  dialogVisible.value = true
}

function closeDialog() { dialogVisible.value = false }

async function saveReminder() {
  if (!form.value.title.trim() || !form.value.date) {
    toast.value = { show: true, text: 'Judul dan Tanggal wajib diisi!', color: 'error' }
    return
  }
  try {
    // Sanitize: konversi reactive proxy ke plain object agar Dexie bisa menyimpan
    const payload = JSON.parse(JSON.stringify(form.value))
    if (editMode.value && editId.value) {
      await ReminderRepository.update(editId.value, payload)
    } else {
      await ReminderRepository.add(payload)
    }
    await load()
    closeDialog()
    toast.value = { show: true, text: 'Pengingat disimpan ✓', color: 'success' }
    // Jadwalkan notif secara non-blocking (tidak mempengaruhi hasil save)
    scheduleReminderNotifications(reminders.value).catch(e => console.warn('Notif gagal:', e))
  } catch (e: any) {
    console.error('[saveReminder] error:', e)
    toast.value = { show: true, text: `Gagal menyimpan: ${e?.message ?? e}`, color: 'error' }
  }
}

function confirmDelete(id?: number) { if (id) deleteId.value = id }

async function doDelete() {
  if (deleteId.value === null) return
  await ReminderRepository.delete(deleteId.value)
  deleteId.value = null
  await load()
  await scheduleReminderNotifications(reminders.value)
  toast.value = { show: true, text: 'Pengingat dihapus', color: 'success' }
}

onMounted(load)
</script>

<style scoped>
/* ── Cards ─────────────────────────────────────────────── */
.reminder-card { transition: box-shadow 0.2s; }
.urgency-today { border-left: 4px solid #f59e0b !important; }
.urgency-soon  { border-left: 4px solid #ef4444 !important; }
.reminder-emoji { font-size: 1.4rem; }
.metric-label  { font-size: 0.75rem; color: #6b7280; margin-bottom: 2px; }
.metric-value  { font-size: 0.9rem; font-weight: 700; color: #111827; }
.empty-state   { min-height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column; }

/* ── Recurring type buttons ────────────────────────────── */
.recurring-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.recurring-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.72rem;
  color: #64748b;
}
.recurring-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(59,130,246,0.15);
}
.recurring-icon { font-size: 1.3rem; }
.recurring-label { font-size: 0.7rem; white-space: nowrap; }

/* ── Day picker ────────────────────────────────────────── */
.day-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.day-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.day-btn.active {
  background: #3b82f6;
  border-color: #2563eb;
  color: white;
}

/* ── Notify mode ───────────────────────────────────────── */
.notify-mode-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notify-mode-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.88rem;
  color: #374151;
  transition: all 0.15s;
}
.notify-mode-item.active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 700;
}
.notify-icon { font-size: 1.1rem; }
</style>
