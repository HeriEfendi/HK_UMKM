<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">To Do Team</ion-title>
            <ion-buttons style="margin: 0;">
              <button class="btn btn-action primary btn-md" @click="openModal()">
                <ion-icon :icon="addOutline" class="me-1" /> Tambah
              </button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Kelola tugas tim, pantau deadline, prioritas, dan status secara real-time.</p>
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

    <ion-content fullscreen class="app-content-wrap">
      <!-- DASHBOARD TAB CONTENT -->
      <div v-show="activeTab === 'dashboard'">
        <!-- Metrics Grid -->
        <div class="mx-3 mb-4 mt-3">
          <div class="row row-cols-2 row-cols-sm-3 row-cols-md-5 g-2">
            <div class="col">
              <div class="mobile-card h-100 p-3">
                <small class="text-muted d-block text-xs">Total Task</small>
                <div class="fs-6 fw-black text-indigo mt-1">{{ metrics.total }}</div>
                <small class="text-muted mt-1 d-block small">Jumlah semua task</small>
              </div>
            </div>
            <div class="col">
              <div class="mobile-card h-100 p-3">
                <small class="text-muted d-block text-xs">Overdue</small>
                <div class="fs-6 fw-black text-danger mt-1">{{ metrics.overdue }}</div>
                <small class="text-muted mt-1 d-block small">Deadline terlewat</small>
              </div>
            </div>
            <div class="col">
              <div class="mobile-card h-100 p-3">
                <small class="text-muted d-block text-xs">Due Hari Ini</small>
                <div class="fs-6 fw-black text-warning mt-1">{{ metrics.dueToday }}</div>
                <small class="text-muted mt-1 d-block small">Tugas mendesak</small>
              </div>
            </div>
            <div class="col">
              <div class="mobile-card h-100 p-3">
                <small class="text-muted d-block text-xs">Done</small>
                <div class="fs-6 fw-black text-success mt-1">{{ metrics.done }}</div>
                <small class="text-muted mt-1 d-block small">Tugas selesai</small>
              </div>
            </div>
            <div class="col">
              <div class="mobile-card h-100 p-3">
                <small class="text-muted d-block text-xs">Avg Points</small>
                <div class="fs-6 fw-black text-teal mt-1">{{ metrics.avgPoints }}</div>
                <small class="text-muted mt-1 d-block small">Story points rata-rata</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <ion-grid class="mx-2 mb-4">
          <ion-row>
            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Distribusi Status</h6>
                    <span class="badge bg-light text-muted border small">Task</span>
                  </div>
                  <div v-if="tasks.length > 0 && statusChartSeries.some(v => v > 0)">
                    <VueApexCharts type="donut" height="260" :options="chartOptions" :series="statusChartSeries" />
                  </div>
                  <div v-else class="text-center py-4 text-muted">Tidak ada data task.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Prioritas Task</h6>
                    <span class="badge bg-light text-muted border small">Count</span>
                  </div>
                  <div v-if="tasks.length > 0 && priorityChartSeries[0].data.some(v => v > 0)">
                    <VueApexCharts type="bar" height="260" :options="priorityChartOptions" :series="priorityChartSeries" />
                  </div>
                  <div v-else class="text-center py-4 text-muted">Tidak ada data prioritas.</div>
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
                placeholder="Cari task, assignee, label..."
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
              :class="activeFilter === opt.value ? 'pill-badge primary' : 'pill-badge secondary'"
              @click="activeFilter = opt.value"
              style="margin: 0;"
            >
              {{ opt.label }}
              <ion-badge slot="end" class="ms-2 small-badge">{{ filterCount(opt.value) }}</ion-badge>
            </button>
            <button class="btn btn-action outline chip-btn btn-md" style="margin: 0;" @click="refreshTasks">Refresh</button>
            <button class="btn btn-action success chip-btn btn-md" style="margin: 0;" @click="exportExcel">Export</button>
          </div>
        </div>
        <div v-if="loading" class="loading-state">
          <ion-spinner />
          <p>Memuat task...</p>
        </div>

        <div v-else-if="filteredTasks.length === 0" class="empty-state text-center py-5 mobile-card container-padded mx-3 mt-3">
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
                      <button class="btn btn-light btn-md text-primary" @click.stop="openModal(task)" title="Edit">
                        <ion-icon :icon="pencilOutline" />
                      </button>
                      <button class="btn btn-light btn-md text-danger" @click.stop="confirmDelete(task.id)" title="Hapus">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </div>
                  <ion-card-title class="mobile-card-title mt-2" :class="{'text-decoration-line-through': task.status === 'DONE'}">
                    {{ task.title }}
                  </ion-card-title>
                  <ion-card-subtitle class="mobile-card-subtitle mt-1">{{ task.label || 'Tanpa label' }}</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content class="pt-0 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <div class="row gx-2 gy-2 mt-1">
                      <div class="col-6">
                        <div class="metric-label">Assignee</div>
                        <div class="metric-value">{{ task.assignee?.name || 'Unassigned' }}</div>
                      </div>
                      <div class="col-6">
                        <div class="metric-label">Reporter</div>
                        <div class="metric-value">{{ task.reporter?.name || 'Unknown' }}</div>
                      </div>
                      <div class="col-6">
                        <div class="metric-label">Due Date</div>
                        <div class="metric-value">{{ formatDate(task.due_date) }}</div>
                      </div>
                      <div class="col-6">
                        <div class="metric-label">Story Points</div>
                        <div class="metric-value">{{ task.story_points || 0 }}</div>
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
    <ion-modal :is-open="modalVisible" @didDismiss="modalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ isEdit ? 'Edit Todo Team' : 'Buat Todo Team' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="modalVisible = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <FormView ref="formRef" :task="form" @save="saveTask" @cancel="modalVisible = false" />
      </ion-content>
      <ion-footer>
        <div style="padding: 12px; background-color: #ecf3fd;">
          <div class="form-actions gap-2">
            <button type="button" class="btn btn-action light w-100" @click="modalVisible = false">Cancel</button>
            <button type="button" class="btn btn-action primary w-100 mt-2" @click="submitForm">Save Changes</button>
          </div>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Confirmation Delete Alert -->
    <ion-alert
      :is-open="deleteId !== null"
      header="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus tugas tim ini?"
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: () => deleteId = null },
        { text: 'Hapus', role: 'destructive', handler: performDelete }
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

<script lang="ts">
import { ref, computed, onMounted, reactive, defineAsyncComponent, watch, nextTick } from 'vue'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonModal, IonButtons, IonCheckbox, IonSpinner, IonBadge, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton, IonLabel, IonAlert, IonFooter, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, trashOutline, closeOutline, searchOutline, calendarOutline, pencilOutline, ellipseOutline, timeOutline, checkmarkCircle } from 'ionicons/icons';
import { TeamTodoRepository } from '../../db/teamTodoRepository'
import { UsersRepository } from '../../db/usersRepository'
import FormView from './FormView.vue'
import AppToast from '@/components/AppToast.vue';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

export default {
  name: 'TodoListView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonModal, IonButtons, IonCheckbox, IonSpinner, IonBadge, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, FormView, VueApexCharts, IonSegment, IonSegmentButton, IonLabel, IonAlert, IonFooter, AppToast },
  setup() {
    const tasks = ref<any[]>([])
    const loading = ref(false)
    const activeFilter = ref('ALL')
    const modalVisible = ref(false)
    const isEdit = ref(false)
    const users = ref<any[]>([])
    const searchQuery = ref('')
    const deleteId = ref<number | null>(null)
    const confirmRevertTask = ref<any>(null)
    const formRef = ref<any>(null)
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
    const showToast = (text: string, color = 'success') => {
      snackbar.value = { show: true, text, color }
    }

    const loadUsers = async () => { users.value = await UsersRepository.getAll() }
    loadUsers()

    const form = reactive({
      id: null,
      title: '',
      assignee_id: null,
      reporter_id: null,
      story_points: 1,
      priority: 'Medium',
      status: 'TO DO',
      due_date: '',
      label: '',
      description: '',
    })

    const openModal = (task: any = null) => {
      isEdit.value = !!task
      if (task) Object.assign(form, task)
      else Object.assign(form, { id: null, title: '', assignee_id: null, reporter_id: null, story_points: 1, priority: 'Medium', status: 'TO DO', due_date: '', label: '', description: '' })
      modalVisible.value = true
    }

    const saveTask = async (taskData: any) => {
      if (!taskData.title.trim()) {
        showToast('Judul task wajib diisi!', 'error')
        return
      }
      try {
        if (isEdit.value && form.id !== null) {
          await TeamTodoRepository.update(form.id, taskData)
          showToast('Task tim berhasil diperbarui', 'success')
        } else {
          await TeamTodoRepository.add(taskData)
          showToast('Task tim berhasil ditambahkan', 'success')
        }
        modalVisible.value = false
        await fetchTasks()
      } catch (error) {
        showToast('Gagal menyimpan task tim', 'error')
      }
    }

    const submitForm = () => {
      if (formRef.value) {
        formRef.value.submit()
      }
    }

    const statusFilterOptions = [
      { label: 'Semua', value: 'ALL' },
      { label: 'To Do', value: 'TO DO' },
      { label: 'In Progress', value: 'IN PROGRESS' },
      { label: 'Done', value: 'DONE' },
      { label: 'Overdue', value: 'OVERDUE' },
    ]

    const filterCount = (status: string) => {
      const today = new Date().toISOString().split('T')[0]
      if (status === 'ALL') return tasks.value.length
      if (status === 'OVERDUE') return tasks.value.filter((t: any) => t.due_date && t.status !== 'DONE' && t.due_date < today).length
      return tasks.value.filter((t: any) => t.status === status).length
    }

    const filteredTasks = computed(() => {
      const filter = activeFilter.value
      const query = searchQuery.value.trim().toLowerCase()
      const today = new Date().toISOString().split('T')[0]

      return tasks.value
        .filter((task: any) => {
          if (filter === 'OVERDUE') {
            if (!task.due_date || task.status === 'DONE') return false
            return task.due_date < today
          }
          if (filter !== 'ALL' && task.status !== filter) return false

          if (!query) return true
          return [task.title, task.description, task.label, task.assignee?.name, task.reporter?.name]
            .filter(Boolean)
            .some((value: any) => String(value).toLowerCase().includes(query))
        })
        .sort((a: any, b: any) => {
          if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
          if (a.due_date) return -1
          if (b.due_date) return 1
          return 0
        })
    })

    const fetchTasks = async () => {
      loading.value = true
      try {
        tasks.value = await TeamTodoRepository.getAll()
        nextTick(() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
          }, 100)
        })
      } finally {
        loading.value = false
      }
    }

    const updateStatus = async (task: any) => {
      try {
        await TeamTodoRepository.updateStatus(task.id, task.status)
        showToast('Status task tim diperbarui', 'success')
        await fetchTasks()
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

    const performDelete = async () => {
      if (deleteId.value === null) return
      try {
        await TeamTodoRepository.delete(deleteId.value)
        showToast('Task tim berhasil dihapus', 'success')
        deleteId.value = null
        await fetchTasks()
      } catch (error) {
        showToast('Gagal menghapus task tim', 'error')
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

    const metrics = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      const overdue = tasks.value.filter(task => task.due_date && task.due_date < today && task.status !== 'DONE').length
      const dueToday = tasks.value.filter(task => task.due_date === today && task.status !== 'DONE').length
      const done = tasks.value.filter(task => task.status === 'DONE').length
      const totalPoints = tasks.value.reduce((sum, task) => sum + Number(task.story_points || 0), 0)
      const avgPoints = tasks.value.length ? Math.round(totalPoints / tasks.value.length) : 0
      return { total: tasks.value.length, overdue, dueToday, done, avgPoints }
    })

    const statusChartSeries = computed(() => {
      const groups: Record<string, number> = { 'TO DO': 0, 'IN PROGRESS': 0, DONE: 0, OVERDUE: 0 }
      const today = new Date().toISOString().split('T')[0]
      tasks.value.forEach(task => {
        if (task.due_date && task.due_date < today && task.status !== 'DONE') {
          groups.OVERDUE += 1
        } else {
          groups[task.status] = (groups[task.status] || 0) + 1
        }
      })
      return [groups['TO DO'], groups['IN PROGRESS'], groups.DONE, groups.OVERDUE]
    })

    const priorityChartSeries = computed(() => {
      const counts: Record<string, number> = { Highest: 0, High: 0, Medium: 0, Low: 0 }
      tasks.value.forEach(task => { counts[task.priority || 'Medium'] = (counts[task.priority || 'Medium'] || 0) + 1 })
      return [{ name: 'Prioritas', data: [counts.Highest, counts.High, counts.Medium, counts.Low] }]
    })

    const chartOptions = computed(() => ({
      chart: { type: 'donut' as const, toolbar: { show: false } },
      labels: ['TO DO', 'IN PROGRESS', 'DONE', 'OVERDUE'],
      legend: { position: 'bottom' as const, horizontalAlign: 'center' as const },
      colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
      dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
      responsive: [{ breakpoint: 768, options: { chart: { width: '100%' as const }, legend: { position: 'bottom' as const } } }]
    }))

    const priorityChartOptions = computed(() => ({
      chart: { type: 'bar' as const, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8 } },
      xaxis: { categories: ['Highest', 'High', 'Medium', 'Low'] },
      colors: ['#6366f1'],
      dataLabels: { enabled: false },
      yaxis: { labels: { formatter: (val: number) => `${val}` } }
    }))

    const refreshTasks = async () => {
      await fetchTasks()
      showToast('Daftar task diperbarui', 'success')
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
          showToast('Tidak ada task untuk diekspor.', 'error')
          return
        }
        const rows = tasks.value.map(task => ({
          ID: task.id,
          Judul: task.title,
          Status: task.status,
          'Due Date': formatDate(task.due_date),
          Prioritas: task.priority,
          Assignee: task.assignee?.name || 'Unassigned',
          Reporter: task.reporter?.name || 'Unknown',
          'Story Points': task.story_points,
          Label: task.label || '',
          Deskripsi: task.description || ''
        }))
        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'TodoTeam')
        const filename = `Laporan_Todo_Team_${new Date().toISOString().split('T')[0]}.xlsx`
        await saveWorkbook(workbook, filename)
        showToast('Ekspor tugas berhasil.', 'success')
      } catch (error) {
        console.error('Export error:', error)
        showToast('Gagal mengekspor tugas.', 'error')
      }
    }

    onMounted(fetchTasks)
    onIonViewWillEnter(fetchTasks)

    return {
      activeTab,
      tasks,
      loading,
      activeFilter,
      filteredTasks,
      statusFilterOptions,
      filterCount,
      openModal,
      saveTask,
      updateStatus,
      confirmDelete,
      deleteId,
      performDelete,
      getStatusClass,
      getPriorityClass,
      isEdit,
      modalVisible,
      form,
      addOutline,
      trashOutline,
      closeOutline,
      searchOutline,
      calendarOutline,
      pencilOutline,
      ellipseOutline,
      timeOutline,
      checkmarkCircle,
      confirmRevertTask,
      getStatusIcon,
      cycleStatus,
      performRevert,
      metrics,
      statusChartSeries,
      priorityChartSeries,
      chartOptions,
      priorityChartOptions,
      refreshTasks,
      formatDate,
      exportExcel,
      searchQuery,
      formRef,
      submitForm,
      snackbar
    }
  }
}
</script>

<style scoped>
.search-input-wrap { position: relative; }
.metric-label { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; }
.metric-value { font-size: 0.92rem; font-weight: 700; color: #111827; }
.empty-state { min-height: 220px; display: flex; align-items: center; justify-content: center; flex-direction: column; }
.btn-action.outline { border: 1px solid #ced4da; background-color: white; color: #212529; }

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
