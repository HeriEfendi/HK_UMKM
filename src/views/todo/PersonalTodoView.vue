<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Personal Todo</ion-title>
            <ion-buttons style="margin: 0;">
              <button class="btn btn-action primary btn-md" @click="openDialog()">
                <ion-icon :icon="addOutline" class="me-1" /> Tambah
              </button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Atur tugas pribadi dengan ringkasan, deadline, dan status yang jelas.</p>
        </div>
      </ion-toolbar>

      <!-- Main Tab Segment -->
      <div class="px-3 pt-2">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="dashboard">
            <ion-label>Dashboard</ion-label>
          </ion-segment-button>
          <ion-segment-button value="tasks">
            <ion-label>Daftar Tugas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- DASHBOARD TAB CONTENT -->
      <div v-show="activeTab === 'dashboard'">
        <!-- Metrics Grid -->
        <ion-grid class="mx-2 mb-4 mt-2">
          <ion-row>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Total Task</small>
                  <div class="fs-6 fw-black text-indigo mt-1">{{ metrics.total }}</div>
                  <small class="text-muted mt-1 d-block small">Semua tugas pribadi</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Sedang Berjalan</small>
                  <div class="fs-6 fw-black text-warning mt-1">{{ metrics.inProgress }}</div>
                  <small class="text-muted mt-1 d-block small">Tugas aktif</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Selesai</small>
                  <div class="fs-6 fw-black text-success mt-1">{{ metrics.done }}</div>
                  <small class="text-muted mt-1 d-block small">Tugas selesai</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Due Hari Ini</small>
                  <div class="fs-6 fw-black text-danger mt-1">{{ metrics.dueToday }}</div>
                  <small class="text-muted mt-1 d-block small">Tugas mendesak</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Charts Grid -->
        <ion-grid class="mx-2 mb-4">
          <ion-row>
            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Pembagian Status</h6>
                  </div>
                  <div v-if="tasks.length > 0 && statusChartSeries.some(v => v > 0)">
                    <VueApexCharts type="donut" height="240" :options="statusChartOptions" :series="statusChartSeries" />
                  </div>
                  <div v-else class="text-center py-4 text-muted">Belum ada data task.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Prioritas Task</h6>
                  </div>
                  <div v-if="tasks.length > 0 && priorityChartSeries[0].data.some(v => v > 0)">
                    <VueApexCharts type="bar" height="240" :options="priorityChartOptions" :series="priorityChartSeries" />
                  </div>
                  <div v-else class="text-center py-4 text-muted">Belum ada data prioritas.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- TASKS LIST TAB CONTENT -->
      <div v-show="activeTab === 'tasks'">
        <!-- Search & Filter Bar -->
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mt-2">
          <!-- Search input -->
          <div class="w-100 px-3 py-1 search-container">
            <div class="search-input-wrap position-relative">
              <input
                type="text"
                v-model="searchQuery"
                class="form-control form-control-sm app-control"
                style="padding-left: 30px;"
                placeholder="Cari task, target, atau status..."
              />
              <ion-icon
                :icon="searchOutline"
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #94a3b8;"
              />
            </div>
          </div>

          <!-- Filter chips -->
          <div class="mx-3 my-2 d-flex gap-2 overflow-x-auto" style="scrollbar-width: none;">
            <button
              v-for="opt in statusFilterOptions"
              :key="opt.value"
              class="btn btn-action primary chip-btn btn-md"
              :class="filterStatus === opt.value ? 'pill-badge primary' : 'pill-badge secondary'"
              @click="filterStatus = opt.value"
              style="margin: 0;"
            >
              {{ opt.label }}
              <ion-badge slot="end" class="ms-2 small-badge">{{ filterCount(opt.value) }}</ion-badge>
            </button>
            <button class="btn btn-action outline chip-btn btn-md" style="margin: 0;" @click="refreshTasks">Refresh</button>
            <button class="btn btn-action success chip-btn btn-md" style="margin: 0;" @click="exportExcel">Export</button>
          </div>
        </div>
        <!-- Empty State -->
        <div v-if="filteredTasks.length === 0" class="empty-state text-center py-5 mobile-card container-padded mx-3 mt-3">
          <ion-icon :icon="calendarOutline" style="font-size: 3rem;" class="mb-2 text-muted" />
          <p class="text-muted">Tidak ada task sesuai filter.</p>
        </div>

        <!-- Task Grid (Matching Buku Kas Index.vue Equal Height) -->
        <ion-grid v-else class="mx-2">
          <ion-row>
            <ion-col v-for="task in filteredTasks" :key="task.id" size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 mb-3 h-100 d-flex flex-column">
                <ion-card-header class="mobile-card-header">
                  <div class="mobile-card-top">
                    <div class="d-flex align-items-center gap-2">
                      <div class="status-indicator-btn" @click.stop="cycleStatus(task)" style="display: flex; align-items: center; cursor: pointer;">
                        <ion-icon :icon="getStatusIcon(task.status)" :class="['status-icon', getStatusClass(task.status)]" />
                      </div>
                      <span :class="['pill-badge', getStatusClass(task.status)]">{{ task.status }}</span>
                      <span :class="['pill-badge', getPriorityClass(task.priority)]">{{ task.priority || 'Medium' }}</span>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-light btn-md text-primary" @click.stop="startEdit(task)" title="Edit">
                        <ion-icon :icon="pencilOutline" />
                      </button>
                      <button class="btn btn-light btn-md text-danger" @click.stop="confirmDelete(task.id)" title="Hapus">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </div>
                  <ion-card-title class="mobile-card-title mt-2" :class="{'text-decoration-line-through': task.status === 'DONE'}">{{ task.title }}</ion-card-title>
                  <ion-card-subtitle class="mobile-card-subtitle mt-1">{{ task.target_time || 'Target belum diisi' }}</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content class="pt-0 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <div class="row gx-2 gy-2 mt-1">
                      <div class="col-6">
                        <div class="metric-label">Target</div>
                        <div class="metric-value">{{ task.target_time || '-' }}</div>
                      </div>
                      <div class="col-6">
                        <div class="metric-label">Due Date</div>
                        <div class="metric-value">{{ formatDate(task.due_date) }}</div>
                      </div>
                    </div>

                    <!-- Description -->
                    <div v-if="task.description" class="task-description mt-3 text-muted" style="font-size: 0.88rem; font-style: italic;">
                      "{{ task.description }}"
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>

    <!-- FORM MODAL -->
    <ion-modal :is-open="dialogVisible" @didDismiss="closeDialog">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editMode ? 'Edit Todo Pribadi' : 'Tambah Todo Pribadi' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDialog"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-content">
        <div class="form-container mb-4">
          <div class="form-section">
            <label class="form-label">Judul Task <span class="text-danger">*</span></label>
            <input v-model="newTask.title" class="form-control app-control" placeholder="Judul tugas..." required />
          </div>
          
          <div class="form-section">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label">Target</label>
                <input v-model="newTask.target_time" class="form-control app-control" placeholder="Contoh: 2 hari" />
              </div>
              <div class="col-6">
                <label class="form-label">Due Date</label>
                <input type="date" v-model="newTask.due_date" class="form-control app-control" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label">Prioritas</label>
                <select v-model="newTask.priority" class="form-select app-control">
                  <option>Highest</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Status</label>
                <select v-model="newTask.status" class="form-select app-control">
                  <option>TO DO</option>
                  <option>IN PROGRESS</option>
                  <option>DONE</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">Deskripsi</label>
            <textarea v-model="newTask.description" class="form-control app-control form-control-textarea" rows="3" placeholder="Detail tugas..."></textarea>
          </div>
        </div>
      </ion-content>
      <ion-footer>
        <div style="padding: 12px; background-color: #ecf3fd;">
          <div class="form-actions gap-2">
            <button type="button" class="btn btn-action light w-100 m-0" @click="closeDialog">Batal</button>
            <button type="button" class="btn btn-action primary w-100 m-0" @click="saveTodo">Simpan</button>
          </div>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Confirmation Delete Alert -->
    <ion-alert
      :is-open="deleteId !== null"
      header="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus tugas pribadi ini?"
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: () => deleteId = null },
        { text: 'Hapus', role: 'destructive', handler: deleteTodo }
      ]"
      @didDismiss="deleteId = null"
    />

    <!-- Revert Confirmation Alert -->
    <ion-alert
      :is-open="confirmRevertTask !== null"
      header="Kembalikan Status"
      message="Apakah Anda yakin ingin mengembalikan tugas ini ke status TO DO?"
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: () => confirmRevertTask = null },
        { text: 'Ya, Kembalikan', handler: performRevert }
      ]"
      @didDismiss="confirmRevertTask = null"
    />

    <!-- Global AppToast Notification -->
    <AppToast 
      :is-open="snackbar.show" 
      :message="snackbar.text" 
      :color="snackbar.color as any" 
      @dismiss="snackbar.show = false" 
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, watch, nextTick } from 'vue'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonModal, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonAlert, IonFooter, IonGrid, IonRow, IonCol, IonBadge, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, trashOutline, closeOutline, searchOutline, calendarOutline, pencilOutline, ellipseOutline, timeOutline, checkmarkCircle } from 'ionicons/icons';
import { TodoRepository } from '@/db/todoRepository'
import AppToast from '@/components/AppToast.vue';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

const tasks = ref<any[]>([])
const dialogVisible = ref(false)
const editMode = ref(false)
const editTaskId = ref<number | null>(null)
const filterStatus = ref('ALL')
const searchQuery = ref('')
const deleteId = ref<number | null>(null)
const confirmRevertTask = ref<any>(null)
const activeTab = ref('dashboard')

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

const snackbar = ref({ show: false, text: '', color: 'success' })
const showToast = (text: string, color: 'success' | 'error' = 'success') => {
  snackbar.value = { show: true, text, color }
}

const newTask = ref({ title: '', target_time: '', due_date: '', priority: 'Medium', status: 'TO DO', description: '' })

const loadTasks = async () => {
  const allTasks = await TodoRepository.getAll()
  tasks.value = allTasks.filter(t => t.type === 'PERSONAL')
  updateMetrics()
  updateCharts()
  nextTick(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  })
}

const metrics = ref({ total: 0, inProgress: 0, done: 0, dueToday: 0 })
const statusChartSeries = ref([0, 0, 0])
const priorityChartSeries = ref([{ name: 'Prioritas', data: [0, 0, 0, 0] }])

const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const updateMetrics = () => {
  const today = getLocalDateString()
  metrics.value = {
    total: tasks.value.length,
    inProgress: tasks.value.filter(task => task.status === 'IN PROGRESS').length,
    done: tasks.value.filter(task => task.status === 'DONE').length,
    dueToday: tasks.value.filter(task => task.due_date === today && task.status !== 'DONE').length
  }
}

const updateCharts = () => {
  const statusCount = { 'TO DO': 0, 'IN PROGRESS': 0, DONE: 0 }
  const priorityCount = { Highest: 0, High: 0, Medium: 0, Low: 0 }
  tasks.value.forEach(task => {
    statusCount[task.status] = (statusCount[task.status] || 0) + 1
    priorityCount[task.priority || 'Medium'] = (priorityCount[task.priority || 'Medium'] || 0) + 1
  })
  statusChartSeries.value = [statusCount['TO DO'], statusCount['IN PROGRESS'], statusCount.DONE]
  priorityChartSeries.value = [{ name: 'Prioritas', data: [priorityCount.Highest, priorityCount.High, priorityCount.Medium, priorityCount.Low] }]
}

const filteredTasks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const today = getLocalDateString()
  return tasks.value.filter(task => {
    if (filterStatus.value !== 'ALL') {
      if (filterStatus.value === 'OVERDUE') {
        if (!task.due_date || task.status === 'DONE') return false
        if (task.due_date >= today) return false
      } else if (task.status !== filterStatus.value) return false
    }
    if (!query) return true
    return [task.title, task.target_time, task.due_date, task.priority, task.description]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  }).sort((a, b) => {
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })
})

const statusFilterOptions = [
  { label: 'Semua', value: 'ALL' },
  { label: 'To Do', value: 'TO DO' },
  { label: 'In Progress', value: 'IN PROGRESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Overdue', value: 'OVERDUE' },
]

const filterCount = (status: string) => {
  const today = getLocalDateString()
  if (status === 'ALL') return tasks.value.length
  if (status === 'OVERDUE') return tasks.value.filter(t => t.due_date && t.status !== 'DONE' && t.due_date < today).length
  return tasks.value.filter(t => t.status === status).length
}

const statusChartOptions = {
  chart: { type: 'donut', toolbar: { show: false } },
  labels: ['TO DO', 'IN PROGRESS', 'DONE'],
  legend: { position: 'bottom', horizontalAlign: 'center' },
  colors: ['#3b82f6', '#f59e0b', '#10b981'],
  dataLabels: { enabled: true, formatter: (val: any) => `${Math.round(val)}%` }
}

const priorityChartOptions = {
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 8 } },
  xaxis: { categories: ['Highest', 'High', 'Medium', 'Low'] },
  colors: ['#6366f1'],
  dataLabels: { enabled: false },
  yaxis: { labels: { formatter: (val: any) => `${val}` } }
}

const openDialog = () => {
  editMode.value = false
  editTaskId.value = null
  newTask.value = { title: '', target_time: '', due_date: '', priority: 'Medium', status: 'TO DO', description: '' }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const saveTodo = async () => {
  if (!newTask.value.title.trim()) {
    showToast('Judul task wajib diisi!', 'error')
    return
  }
  const data = { ...newTask.value, type: 'PERSONAL' }
  try {
    if (editMode.value && editTaskId.value) {
      await TodoRepository.update(editTaskId.value, data)
      showToast('Task pribadi berhasil diperbarui', 'success')
    } else {
      await TodoRepository.add(data)
      showToast('Task pribadi berhasil ditambahkan', 'success')
    }
    await refreshTasks()
    closeDialog()
  } catch (error) {
    showToast('Gagal menyimpan task', 'error')
  }
}

const startEdit = (task: any) => {
  editMode.value = true
  editTaskId.value = task.id
  newTask.value = { ...task }
  dialogVisible.value = true
}

const updateStatus = async (task: any) => {
  try {
    await TodoRepository.update(task.id, { status: task.status })
    showToast('Status task diperbarui', 'success')
    await refreshTasks()
  } catch (error) {
    showToast('Gagal memperbarui status', 'error')
  }
}

const getStatusIcon = (status: string) => {
  if (status === 'DONE') return checkmarkCircle
  if (status === 'IN PROGRESS') return timeOutline
  return ellipseOutline
}

const cycleStatus = async (task: any) => {
  if (task.status === 'TO DO') {
    task.status = 'IN PROGRESS'
    await updateStatus(task)
  } else if (task.status === 'IN PROGRESS') {
    task.status = 'DONE'
    await updateStatus(task)
  } else if (task.status === 'DONE') {
    confirmRevertTask.value = task
  }
}

const performRevert = async () => {
  if (!confirmRevertTask.value) return
  const task = confirmRevertTask.value
  task.status = 'TO DO'
  await updateStatus(task)
  confirmRevertTask.value = null
}

const confirmDelete = (id: number) => {
  deleteId.value = id
}

const deleteTodo = async () => {
  if (deleteId.value === null) return
  try {
    await TodoRepository.delete(deleteId.value)
    showToast('Task pribadi berhasil dihapus', 'success')
    deleteId.value = null
    await refreshTasks()
  } catch (error) {
    showToast('Gagal menghapus task', 'error')
  }
}

const refreshTasks = async () => {
  await loadTasks()
}

const formatDate = (value: string) => value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const saveWorkbook = async (wb: any, fileName: string) => {
  if (Capacitor.isNativePlatform()) {
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const path = `temp_${fileName}`;
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    });
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });
    await Share.share({
      title: 'Download Excel',
      files: [uri],
      dialogTitle: 'Simpan file',
    });
    return;
  }
  XLSX.writeFile(wb, fileName)
}

const exportExcel = async () => {
  try {
    if (!tasks.value.length) {
      showToast('Tidak ada data task untuk diekspor', 'error')
      return
    }
    const rows = tasks.value.map(task => ({
      ID: task.id,
      Judul: task.title,
      Status: task.status,
      'Due Date': formatDate(task.due_date),
      Prioritas: task.priority,
      Target: task.target_time,
      Deskripsi: task.description || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PersonalTodo')
    const filename = `Laporan_Personal_Todo_${new Date().toISOString().split('T')[0]}.xlsx`
    await saveWorkbook(workbook, filename)
    showToast('Ekspor data berhasil', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showToast('Gagal mengekspor data', 'error')
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    'TO DO': 'todo',
    'IN PROGRESS': 'progress',
    'DONE': 'done'
  }
  return map[status] || ''
}

const getPriorityClass = (priority: string) => {
  const map: Record<string, string> = {
    'Highest': 'highest',
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low'
  }
  return map[priority] || 'medium'
}

onMounted(async () => {
  await refreshTasks()
})

onIonViewWillEnter(async () => {
  await refreshTasks()
})
</script>

<style scoped>
.search-input-wrap { position: relative; }
.metric-label { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; }
.metric-value { font-size: 0.92rem; font-weight: 700; color: #111827; }
.empty-state { min-height: 220px; display: flex; align-items: center; justify-content: center; flex-direction: column; }

.status-icon {
  font-size: 1.4rem;
  transition: transform 0.2s ease, color 0.2s ease;
}
.status-icon:hover {
  transform: scale(1.15);
}
.status-icon.todo {
  color: #64748b;
}
.status-icon.progress {
  color: #f59e0b;
}
.status-icon.done {
  color: #10b981;
}
</style>
