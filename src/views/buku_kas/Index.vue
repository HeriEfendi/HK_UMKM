<script setup lang="ts">
import { ref, computed } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { db } from '@/db/schema'
import { migrateProjectTransactions, calcProjectTotals } from '@/db/bukuKasMigration'
import { IonPage, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonButtons, IonTitle, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonProgressBar, IonBadge, IonSpinner, IonAlert, IonFooter, IonSegment, IonSegmentButton } from '@ionic/vue';
import AppToast from '@/components/AppToast.vue';
import { addOutline, trashOutline, pencilOutline, arrowForwardOutline, closeOutline, trendingUpOutline, trendingDownOutline, pieChartOutline, searchOutline } from 'ionicons/icons';
import { transactionAttachmentsRepo } from '@/db/repositories';

interface Project {
  id: number
  name: string
  description: string | null
  status: string
  total_deposits: number
  total_expenses: number
  balance: number
  created_at: string
  updated_at?: string
  lastActivity?: string   // computed, tidak disimpan ke DB
  transactions: any[]
}

const router = useRouter()

const projects = ref<Project[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('ALL')
const dialogCreate = ref(false)
const dialogEdit = ref(false)
const editingId = ref<number | null>(null)
const dialogDeleteId = ref<number | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const formNew = ref({ name: '', description: '', status: 'Active' })
const formEdit = ref({ name: '', description: '', status: 'Active' })
const submitting = ref(false)

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'ALL' || p.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const totalDepositsAll = computed(() => filteredProjects.value.reduce((acc, p) => acc + p.total_deposits, 0))
const totalExpensesAll = computed(() => filteredProjects.value.reduce((acc, p) => acc + p.total_expenses, 0))
const totalBalanceAll = computed(() => totalDepositsAll.value - totalExpensesAll.value)

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function getBalancePercent(project: Project) {
  if (project.total_deposits === 0) return 0
  return Math.min(100, Math.round((project.balance / project.total_deposits) * 100))
}

function getBalanceColor(project: Project) {
  const pct = getBalancePercent(project)
  if (pct > 50) return 'success'
  if (pct > 20) return 'warning'
  return 'danger'
}

function getStatusColor(status: string) {
  if (status === 'Active' || status === 'Aktif') return 'success'
  if (status === 'Completed' || status === 'Selesai') return 'teal'
  if (status === 'Pending' || status === 'Tunda') return 'warning'
  return 'secondary'
}

async function fetchProjects() {
  loading.value = true
  try {
    if (!db.isOpen()) await db.open()
    await migrateProjectTransactions()
    const rawProjects = await db.table('projects').toArray()

    // Hitung totals dan lastActivity dari tabel transactions terpisah
    const enriched = await Promise.all(rawProjects.map(async (p) => {
      const [totals, txs] = await Promise.all([
        calcProjectTotals(p.id),
        db.table('transactions').where('project_id').equals(p.id).toArray(),
      ])

      // Cari tanggal transaksi terbaru
      const latestTxDate = txs.reduce((max: string, t: any) => {
        const d = t.updated_at || t.date || ''
        return d > max ? d : max
      }, '')

      // lastActivity = mana yang lebih baru: project sendiri atau transaksi terakhir
      const projectStamp = p.updated_at || p.created_at || ''
      const lastActivity = latestTxDate > projectStamp ? latestTxDate : projectStamp

      return {
        ...p,
        total_deposits: totals.total_deposits,
        total_expenses: totals.total_expenses,
        balance: totals.balance,
        lastActivity,
        transactions: [],
      }
    }))

    // Urutkan terbaru dulu berdasarkan lastActivity
    enriched.sort((a, b) => (b.lastActivity || '').localeCompare(a.lastActivity || ''))
    projects.value = enriched
  } catch (e) {
    showSnackbar('Gagal memuat data buku kas', 'error')
  } finally {
    loading.value = false
  }
}

async function createProject() {
  if (!formNew.value.name.trim()) return
  submitting.value = true
  try {
    if (!db.isOpen()) await db.open()
    const now = new Date().toISOString()
    const newProject: Project = {
      id: Date.now(),
      name: formNew.value.name,
      description: formNew.value.description,
      status: formNew.value.status,
      total_deposits: 0,
      total_expenses: 0,
      balance: 0,
      created_at: now,
      updated_at: now,
      lastActivity: now,
      transactions: [],
    }
    projects.value.unshift(newProject)
    // Simpan ke DB tanpa field transactions & lastActivity
    const { transactions: _tx, lastActivity: _la, ...projectToSave } = newProject as any
    await db.table('projects').put(projectToSave)
    dialogCreate.value = false
    formNew.value = { name: '', description: '', status: 'Active' }
    showSnackbar('Buku kas berhasil dibuat!', 'success')
  } catch (e) {
    showSnackbar('Gagal membuat buku kas', 'error')
  } finally {
    submitting.value = false
  }
}

async function deleteProject(id: number) {
  try {
    if (!db.isOpen()) await db.open()
    projects.value = projects.value.filter(p => p.id !== id)
    await db.table('projects').delete(id)
    // Hapus juga semua transaksi dan lampirannya terkait project ini
    const txIds = await db.table('transactions').where('project_id').equals(id).primaryKeys()
    await db.table('transactions').bulkDelete(txIds)
    for (const txId of txIds) {
      await transactionAttachmentsRepo.deleteByTransactionId(Number(txId))
    }
    dialogDeleteId.value = null
    showSnackbar('Buku kas berhasil dihapus', 'success')
  } catch (e) {
    showSnackbar('Gagal menghapus buku kas', 'error')
  }
}

function showSnackbar(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
}

function goToDetail(id: number) {
  router.push(`/buku_kas/${id}`)
}

function openEditProject(p: Project) {
  editingId.value = p.id
  formEdit.value = { name: p.name, description: p.description || '', status: p.status }
  dialogEdit.value = true
}

async function updateProject() {
  
  if (!editingId.value || !formEdit.value.name.trim()) return;
  submitting.value = true
  try {
    if (!db.isOpen()) await db.open()
    const pIndex = projects.value.findIndex(p => p.id === editingId.value)
    if (pIndex !== -1) {
      const now = new Date().toISOString()
      const updatedProject = { ...projects.value[pIndex], ...formEdit.value, updated_at: now, lastActivity: now };
      projects.value[pIndex] = { ...updatedProject };
      // Re-sort setelah update agar card langsung naik ke atas
      projects.value = [...projects.value].sort((a, b) =>
        (b.lastActivity || '').localeCompare(a.lastActivity || '')
      )
      // Simpan tanpa field transactions & lastActivity
      const { transactions: _tx, lastActivity: _la, ...toSave } = updatedProject as any
      await db.table('projects').put(toSave)
      dialogEdit.value = false
      showSnackbar('Buku kas berhasil diupdate!', 'success')
      closeModal()
    } else {
      console.error('Project not found in local state');
    }
  } catch (e) {
    showSnackbar('Gagal mengupdate buku kas', 'error')
  } finally {
    submitting.value = false
  }
}

function closeModal() {
  dialogCreate.value = false
  dialogEdit.value = false
  editingId.value = null
}

const activeProject = computed(() => dialogEdit.value ? formEdit.value : formNew.value)
onIonViewWillEnter(fetchProjects)
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Buku Kas</ion-title>
            <ion-buttons style="margin: 0;">
              <button class="btn btn-action primary btn-md" @click="dialogCreate = true">
                <ion-icon :icon="addOutline" class="me-1" /> Tambah
              </button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Kelola modal, pengeluaran, dan sisa dana untuk bisnis, hobi, atau renovasi.</p>
        </div>
      </ion-toolbar>

      <!-- Search & Filters Segment -->
      <div class="px-3 py-1">
        <div class="search-input-wrap mb-2 position-relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control form-control-sm app-control" 
            style="padding-left: 30px;" 
            placeholder="Cari buku kas..." 
          />
          <ion-icon 
            :icon="searchOutline" 
            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #94a3b8;" 
          />
        </div>
        
        <ion-segment v-model="statusFilter" class="custom-segment">
          <ion-segment-button value="ALL">
            <ion-label>Semua</ion-label>
          </ion-segment-button>
          <ion-segment-button value="Active">
            <ion-label>Aktif</ion-label>
          </ion-segment-button>
          <ion-segment-button value="Pending">
            <ion-label>Tunda</ion-label>
          </ion-segment-button>
          <ion-segment-button value="Completed">
            <ion-label>Selesai</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content fullscreen class="app-content-wrap">
        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Total Modal</small>
                  <div class="fs-6 fw-black text-success mt-1">{{ formatCurrency(totalDepositsAll) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="4" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Total Pengeluaran</small>
                  <div class="fs-6 fw-black text-danger mt-1">{{ formatCurrency(totalExpensesAll) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-sm="4" size-md="6" size-lg="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Total Sisa Saldo</small>
                  <div class="fs-6 fw-black text-primary mt-1">{{ formatCurrency(totalBalanceAll) }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div v-if="loading" class="loading-state">
          <ion-spinner />
          <p>Memuat buku kas...</p>
        </div>

        <div v-else-if="filteredProjects.length === 0" class="empty-state text-center py-5 text-muted">
          <p>Tidak ada buku kas yang ditemukan</p>
        </div>

        <ion-grid v-else class="mx-2">
          <ion-row>
            <ion-col v-for="project in filteredProjects" :key="project.id" size="12" size-sm="6" size-lg="4">
              <ion-card class="mobile-card m-0 mb-3" @click="goToDetail(project.id)">
                <ion-card-header>
                  <div class="mobile-card-top">
                    <span v-if="project" class="pill-badge" :class="getStatusColor(project.status)">{{ project.status }}</span>
                    <div class="d-flex gap-2">
                      <button class="btn btn-light btn-md text-primary" @click.stop="openEditProject(project)" title="Edit">
                        <ion-icon :icon="pencilOutline" />
                      </button>
                      <button class="btn btn-light btn-md text-danger" @click.stop="dialogDeleteId = project.id" title="Hapus">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </div>
                  <ion-card-title class="mobile-card-title mt-2">{{ project.name }}</ion-card-title>
                  <ion-card-subtitle class="mobile-card-subtitle mt-1">{{ project.description || 'Tidak ada deskripsi' }}</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content class="project-card-body pt-0">
                  <div class="metric-row d-flex justify-content-between my-1">
                    <span class="metric-label">Modal</span>
                    <span class="metric-value text-success">{{ formatCurrency(project.total_deposits || 0) }}</span>
                  </div>
                  <div class="metric-row d-flex justify-content-between my-1">
                    <span class="metric-label">Pengeluaran</span>
                    <span class="metric-value text-danger">{{ formatCurrency(project.total_expenses || 0) }}</span>
                  </div>
                  <div class="metric-row d-flex justify-content-between my-1">
                    <span class="metric-label">Sisa Dana</span>
                    <span :class="`metric-value text-${getBalanceColor(project)}`">{{ getBalancePercent(project) }}%</span>
                  </div>

                  <ion-progress-bar
                    :value="Math.max(0, (getBalancePercent(project) || 0) / 100)"
                    :color="getBalanceColor(project)"
                    class="thick-progress my-2"
                  />

                  <div class="mobile-card-footer d-flex justify-content-between align-items-center mt-3">
                    <span :class="`balance-pill text-${getBalanceColor(project)} fw-black fs-6`">{{ formatCurrency(project.balance || 0) }}</span>
                    <button class="btn btn-light btn-md text-primary" @click.stop="goToDetail(project.id)" title="Buka Detail">
                      <ion-icon :icon="arrowForwardOutline" />
                    </button>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
        <AppToast 
          :is-open="snackbar.show" 
          :message="snackbar.text" 
          :color="snackbar.color as any" 
          @dismiss="snackbar.show = false" 
        />
        <ion-alert
          :is-open="dialogDeleteId !== null"
          header="Konfirmasi Hapus"
          message="Apakah anda yakin ingin menghapus buku kas ini?"
          :buttons="[
            { text: 'Batal', role: 'cancel', handler: () => dialogDeleteId = null },
            { text: 'Hapus', role: 'destructive', handler: () => dialogDeleteId !== null && deleteProject(dialogDeleteId) }
          ]"
          @didDismiss="dialogDeleteId = null"
        />
    </ion-content>

    <ion-modal :is-open="dialogCreate || dialogEdit" @didDismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ dialogEdit ? 'Edit Buku Kas' : 'Tambah Buku Kas' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-content">
        <div class="form-container mb-4">
          <div class="form-section">
            <label class="form-label">Nama</label>
            <input type="text" v-model="activeProject.name" class="form-control app-control" />
          </div>
          <div class="form-section">
            <label class="form-label">Status</label>
            <select v-model="activeProject.status" class="form-control app-control">
              <option value="Active">Aktif</option>
              <option value="Completed">Selesai</option>
              <option value="Pending">Tunda</option>
            </select>
          </div>
          <div class="form-section">
            <label class="form-label">Deskripsi</label>
            <input type="text" v-model="activeProject.description" class="form-control app-control form-control-textarea" />
          </div>
        </div>
      </ion-content>
      <ion-footer>
        <div class="form-actions p-3">
          <button type="button" class="btn btn-action light w-100" @click="closeModal">Cancel</button>
          <button type="button" class="btn btn-action primary w-100 mt-2" @click="dialogEdit ? updateProject() : createProject()">Save Changes</button>
        </div>
      </ion-footer>
    </ion-modal>

  </ion-page>
</template>
