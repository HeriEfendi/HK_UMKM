<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Catatan</ion-title>
            <div class="d-flex align-items-center gap-2">
              <button 
                type="button"
                class="btn btn-action light btn-md d-flex align-items-center gap-1"
                :class="{ active: !isGridView }"
                @click.prevent.stop="toggleViewMode"
                :title="isGridView ? 'Beralih ke Tampilan List' : 'Beralih ke Tampilan Grid'"
              >
                <ion-icon :icon="isGridView ? listOutline : gridOutline" />
                <span class="d-none d-sm-inline">{{ isGridView ? 'Grid' : 'List' }}</span>
              </button>

              <button class="btn btn-action light btn-md d-flex align-items-center gap-1" @click="openManageLabelsModal">
                <ion-icon :icon="pricetagOutline" />
                <span class="d-none d-sm-inline">Kelola Label</span>
              </button>
            </div>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Catat ide, daftar tugas, sesuaikan font & warna catatan</p>
        </div>
      </ion-toolbar>

      <!-- Search & Filters -->
      <div class="px-3 pt-2 pb-1">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-6">
            <SearchInput 
              v-model="searchQuery" 
              placeholder="Cari di catatan..." 
              size="sm" 
            />
          </div>

          <div class="col-12 col-md-6">
            <div class="filter-chips-container">
              <button 
                class="filter-chip" 
                :class="{ active: activeFilter === 'all' }"
                @click="activeFilter = 'all'"
              >
                📁 Semua ({{ activeNotesCount }})
              </button>
              
              <button 
                class="filter-chip" 
                :class="{ active: activeFilter === 'pinned' }"
                @click="activeFilter = 'pinned'"
              >
                📌 Disematkan ({{ pinnedCount }})
              </button>

              <button 
                class="filter-chip" 
                :class="{ active: activeFilter === 'checklist' }"
                @click="activeFilter = 'checklist'"
              >
                ☑️ Checklist
              </button>

              <button 
                v-for="l in availableLabels" 
                :key="l.id"
                class="filter-chip"
                :class="{ active: activeFilter === 'label:' + l.name }"
                @click="activeFilter = 'label:' + l.name"
              >
                🏷️ {{ l.name }}
              </button>

              <button 
                class="filter-chip" 
                :class="{ active: activeFilter === 'archived' }"
                @click="activeFilter = 'archived'"
              >
                📦 Arsip ({{ archivedCount }})
              </button>

              <button 
                class="filter-chip danger" 
                :class="{ active: activeFilter === 'trashed' }"
                @click="activeFilter = 'trashed'"
              >
                🗑️ Sampah ({{ trashedCount }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap ">
      <!-- Quick Inline Note Input Trigger -->
      <div class="quick-keep-container my-3">
        <div class="quick-keep-box mx-3" @click="openCreateModal('text')">
          <div class="quick-placeholder">
            <ion-icon :icon="createOutline" class="me-2 text-primary" />
            <span>Tulis catatan...</span>
          </div>
          <div class="quick-actions" @click.stop>
            <button class="quick-btn" title="Checklist Baru" @click="openCreateModal('checklist')">
              <ion-icon :icon="checkboxOutline" />
            </button>
            <button class="quick-btn" title="Catatan Teks" @click="openCreateModal('text')">
              <ion-icon :icon="documentTextOutline" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="filteredNotes.length === 0"
        :icon="journalOutline"
        title="Belum Ada Catatan"
        :message="searchQuery ? 'Tidak ada catatan yang cocok dengan pencarian.' : 'Klik tombol di bawah untuk membuat catatan baru.'"
        action-text="Buat Catatan Baru"
        action-variant="primary"
        @action="openCreateModal('text')"
      />

      <div v-else class="notes-content-wrapper px-3 pb-5">
        <!-- ── PINNED SECTION ───────────────────────────────────────── -->
        <div v-if="activeFilter === 'all' && pinnedNotesList.length > 0" class="notes-section mb-4">
          <div class="section-label mb-2">
            <span>📌 DISEMATKAN ({{ pinnedNotesList.length }})</span>
          </div>
          <div :class="isGridView ? 'notes-grid' : 'notes-list'">
            <div 
              v-for="note in pinnedNotesList" 
              :key="note.id" 
              class="note-card"
              :class="['color-' + (note.color || 'default'), { 'is-checklist': note.type === 'checklist' }]"
              @click="openEditModal(note.id!)"
            >
              <button 
                class="btn-pin-corner active" 
                title="Lepas Sematan" 
                @click.stop="togglePin(note)"
              >
                <ion-icon :icon="pin" />
              </button>

              <div class="note-card-body">
                <h3 
                  v-if="note.title" 
                  class="note-title"
                  :style="{ fontFamily: getCssFont(note.fontFamily), fontSize: getCssSize(note.fontSize) }"
                >
                  {{ note.title }}
                </h3>

                <p 
                  v-if="note.type === 'text' && note.content" 
                  class="note-preview-text"
                  :style="{ fontFamily: getCssFont(note.fontFamily), fontSize: getCssSize(note.fontSize) }"
                >
                  {{ truncateText(note.content, 220) }}
                </p>

                <div v-if="note.type === 'checklist' && note.checklist?.length" class="note-checklist-preview">
                  <div 
                    v-for="(item, idx) in note.checklist.slice(0, 5)" 
                    :key="item.id || idx"
                    class="checklist-preview-item"
                    @click.stop="toggleChecklistItem(note, item)"
                  >
                    <ion-icon :icon="item.completed ? checkmarkDoneCircle : ellipseOutline" :class="item.completed ? 'text-success' : 'text-muted'" />
                    <span :class="{ 'completed-item': item.completed }">{{ item.text }}</span>
                  </div>
                  <div v-if="note.checklist.length > 5" class="checklist-more-count">
                    +{{ note.checklist.length - 5 }} item lainnya
                  </div>
                </div>

                <div v-if="note.labels && note.labels.length" class="note-labels-wrap mt-2">
                  <span v-for="lbl in note.labels" :key="lbl" class="note-label-chip">
                    {{ lbl }}
                  </span>
                </div>
              </div>

              <!-- Card Footer Toolbar -->
              <div class="note-card-footer" @click.stop>
                <span class="note-time">{{ formatTimeAgo(note.updatedAt) }}</span>
                <div class="note-actions">
                  <button class="card-act-btn" title="Edit Catatan" @click="openEditModal(note.id!)">
                    <ion-icon :icon="colorPaletteOutline" />
                  </button>
                  <button class="card-act-btn" title="Salin Teks" @click="copyNoteText(note)">
                    <ion-icon :icon="copyOutline" />
                  </button>
                  <button class="card-act-btn" title="Arsipkan" @click="toggleArchive(note)">
                    <ion-icon :icon="archiveOutline" />
                  </button>
                  <button class="card-act-btn danger" title="Hapus" @click="deleteNote(note)">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── OTHERS SECTION ───────────────────────────────────────── -->
        <div class="notes-section">
          <div v-if="activeFilter === 'all' && pinnedNotesList.length > 0" class="section-label mb-2">
            <span>📝 LAINNYA</span>
          </div>
          <div :class="isGridView ? 'notes-grid' : 'notes-list'">
            <div 
              v-for="note in displayedNotes" 
              :key="note.id" 
              class="note-card"
              :class="['color-' + (note.color || 'default'), { 'is-checklist': note.type === 'checklist' }]"
              @click="openEditModal(note.id!)"
            >
              <button 
                class="btn-pin-corner" 
                :class="{ active: note.isPinned }"
                :title="note.isPinned ? 'Lepas Sematan' : 'Sematkan'" 
                @click.stop="togglePin(note)"
              >
                <ion-icon :icon="note.isPinned ? pin : pinOutline" />
              </button>

              <div class="note-card-body">
                <h3 
                  v-if="note.title" 
                  class="note-title"
                  :style="{ fontFamily: getCssFont(note.fontFamily), fontSize: getCssSize(note.fontSize) }"
                >
                  {{ note.title }}
                </h3>

                <p 
                  v-if="note.type === 'text' && note.content" 
                  class="note-preview-text"
                  :style="{ fontFamily: getCssFont(note.fontFamily), fontSize: getCssSize(note.fontSize) }"
                >
                  {{ truncateText(note.content, 220) }}
                </p>

                <div v-if="note.type === 'checklist' && note.checklist?.length" class="note-checklist-preview">
                  <div 
                    v-for="(item, idx) in note.checklist.slice(0, 5)" 
                    :key="item.id || idx"
                    class="checklist-preview-item"
                    @click.stop="toggleChecklistItem(note, item)"
                  >
                    <ion-icon :icon="item.completed ? checkmarkDoneCircle : ellipseOutline" :class="item.completed ? 'text-success' : 'text-muted'" />
                    <span :class="{ 'completed-item': item.completed }">{{ item.text }}</span>
                  </div>
                  <div v-if="note.checklist.length > 5" class="checklist-more-count">
                    +{{ note.checklist.length - 5 }} item lainnya
                  </div>
                </div>

                <div v-if="note.labels && note.labels.length" class="note-labels-wrap mt-2">
                  <span v-for="lbl in note.labels" :key="lbl" class="note-label-chip">
                    {{ lbl }}
                  </span>
                </div>
              </div>

              <!-- Card Footer Toolbar -->
              <div class="note-card-footer" @click.stop>
                <span class="note-time">{{ formatTimeAgo(note.updatedAt) }}</span>
                <div class="note-actions">
                  <button v-if="note.isTrashed" class="card-act-btn success" title="Pulihkan" @click="restoreNote(note)">
                    <ion-icon :icon="refreshOutline" />
                  </button>
                  <button v-else class="card-act-btn" title="Edit Catatan" @click="openEditModal(note.id!)">
                    <ion-icon :icon="colorPaletteOutline" />
                  </button>
                  <button class="card-act-btn" title="Salin Teks" @click="copyNoteText(note)">
                    <ion-icon :icon="copyOutline" />
                  </button>
                  <button v-if="!note.isTrashed" class="card-act-btn" title="Arsipkan" @click="toggleArchive(note)">
                    <ion-icon :icon="note.isArchived ? openOutline : archiveOutline" />
                  </button>
                  <button class="card-act-btn danger" :title="note.isTrashed ? 'Hapus Permanen' : 'Hapus'" @click="deleteNote(note)">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <LoadMoreFooter
            :has-more="hasMoreNotes"
            :displayed-count="displayedNotes.length"
            :total-count="primaryNotesList.length"
            item-name="catatan"
            @load-more="loadMoreNotes"
          />
        </div>
      </div>
    </ion-content>

    <!-- MANAGE LABELS MODAL -->
    <ion-modal :is-open="manageLabelsVisible" @didDismiss="manageLabelsVisible = false">
      <AppModalHeader title="Kelola Label" @close="manageLabelsVisible = false" />

      <ion-content class="ion-padding bg-light">
        <div class="mobile-card p-3 my-2">
          <div class="mb-4">
            <label class="form-label fw-bold">Tambah Label Baru</label>
            <div class="d-flex gap-2">
              <input 
                type="text" 
                v-model="newManageLabelName" 
                class="form-control app-control" 
                placeholder="Cth: Proyek A" 
                @keydown.enter.prevent="addManageLabel"
              />
              <button class="btn btn-action primary btn-md text-nowrap" @click="addManageLabel">Tambah</button>
            </div>
          </div>

          <div class="labels-list-manage">
            <label class="form-label text-xs fw-bold text-muted mb-2">DAFTAR LABEL</label>
            <div 
              v-for="lbl in availableLabels" 
              :key="lbl.id"
              class="d-flex align-items-center justify-content-between py-2 border-bottom"
            >
              <div class="d-flex align-items-center gap-2">
                <ion-icon :icon="pricetagOutline" class="text-muted" />
                <span class="fw-semibold">{{ lbl.name }}</span>
              </div>
              <button class="btn btn-light btn-sm text-danger" @click="deleteManageLabel(lbl.id)">
                <ion-icon :icon="trashOutline" />
              </button>
            </div>
            <div v-if="availableLabels.length === 0" class="text-muted text-sm text-center py-3">
              Belum ada label. Tambahkan label baru di atas.
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <AppToast :is-open="toast.show" :message="toast.text" :color="toast.color" @dismiss="toast.show = false" />

    <!-- Note Form Modal -->
    <NoteFormModal
      :is-open="formModalOpen"
      :note-id="editingNoteId"
      :initial-type="newNoteType"
      :available-labels="availableLabels"
      @dismiss="formModalOpen = false"
      @saved="onFormSaved"
      @deleted="onFormDeleted"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonModal, IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/vue'
import {
  journalOutline, gridOutline, listOutline, addOutline, searchOutline, closeCircleOutline,
  createOutline, checkboxOutline, documentTextOutline, pin, pinOutline,
  colorPaletteOutline, pricetagOutline, copyOutline, archiveOutline, trashOutline,
  closeOutline, checkmarkDoneCircle, ellipseOutline, refreshOutline,
  openOutline
} from 'ionicons/icons'

import {
  NoteRepository, FONT_FAMILIES, FONT_SIZES,
  type NoteItem, type NoteLabel, type ChecklistItem
} from '@/db/noteRepository'
import AppToast from '@/components/AppToast.vue'
import NoteFormModal from '@/views/notes/FormView.vue'

const notes = ref<NoteItem[]>([])
const availableLabels = ref<NoteLabel[]>([])
const isGridView = ref(localStorage.getItem('notes_view_mode') !== 'list')
const searchQuery = ref('')
const activeFilter = ref('all')
const toast = ref({ show: false, text: '', color: 'success' })

function toggleViewMode() {
  isGridView.value = !isGridView.value
  localStorage.setItem('notes_view_mode', isGridView.value ? 'grid' : 'list')
}

const manageLabelsVisible = ref(false)
const newManageLabelName = ref('')

const activeNotesCount = computed(() => notes.value.filter(n => !n.isArchived && !n.isTrashed).length)
const pinnedCount = computed(() => notes.value.filter(n => n.isPinned && !n.isArchived && !n.isTrashed).length)
const archivedCount = computed(() => notes.value.filter(n => n.isArchived && !n.isTrashed).length)
const trashedCount = computed(() => notes.value.filter(n => n.isTrashed).length)

const filteredNotes = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return notes.value.filter(note => {
    if (q) {
      const matchTitle = note.title.toLowerCase().includes(q)
      const matchContent = note.content.toLowerCase().includes(q)
      const matchChecklist = note.checklist?.some(c => c.text.toLowerCase().includes(q))
      const matchLabel = note.labels?.some(l => l.toLowerCase().includes(q))
      if (!matchTitle && !matchContent && !matchChecklist && !matchLabel) return false
    }

    if (activeFilter.value === 'all') return !note.isArchived && !note.isTrashed
    if (activeFilter.value === 'pinned') return note.isPinned && !note.isArchived && !note.isTrashed
    if (activeFilter.value === 'checklist') return note.type === 'checklist' && !note.isArchived && !note.isTrashed
    if (activeFilter.value === 'archived') return note.isArchived && !note.isTrashed
    if (activeFilter.value === 'trashed') return note.isTrashed
    if (activeFilter.value.startsWith('label:')) {
      const lbl = activeFilter.value.replace('label:', '')
      return note.labels?.includes(lbl) && !note.isArchived && !note.isTrashed
    }

    return true
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const pinnedNotesList = computed(() => filteredNotes.value.filter(n => n.isPinned))
const otherNotesList = computed(() => filteredNotes.value.filter(n => !n.isPinned))

const notesLimit = ref(24)
const primaryNotesList = computed(() => {
  return activeFilter.value === 'all' && pinnedNotesList.value.length > 0
    ? otherNotesList.value
    : filteredNotes.value
})
const displayedNotes = computed(() => {
  return primaryNotesList.value.slice(0, notesLimit.value)
})
const hasMoreNotes = computed(() => {
  return displayedNotes.value.length < primaryNotesList.value.length
})
const loadMoreNotes = (ev?: any) => {
  notesLimit.value += 24
  if (ev && ev.target) ev.target.complete()
}
watch([searchQuery, activeFilter], () => {
  notesLimit.value = 24
})

function getCssFont(fontId?: string) {
  const item = FONT_FAMILIES.find(f => f.id === fontId)
  return item ? item.cssFont : FONT_FAMILIES[0].cssFont
}

function getCssSize(sizeId?: string) {
  const item = FONT_SIZES.find(s => s.id === sizeId)
  return item ? item.cssSize : '1rem'
}

function truncateText(txt: string, max: number) {
  if (!txt) return ''
  return txt.length > max ? txt.substring(0, max) + '...' : txt
}

function formatTimeAgo(isoStr: string) {
  if (!isoStr) return ''
  const date = new Date(isoStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins}m lalu`
  if (diffHours < 24) return `${diffHours}j lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays}h lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

async function loadData() {
  notes.value = await NoteRepository.getAll()
  availableLabels.value = await NoteRepository.getLabels()
}

// ── Form Modal state ──────────────────────────────────────────────────────
const formModalOpen = ref(false)
const editingNoteId = ref<number | null>(null)
const newNoteType = ref<'text' | 'checklist'>('text')

function openCreateModal(type: 'text' | 'checklist' = 'text') {
  editingNoteId.value = null
  newNoteType.value = type
  formModalOpen.value = true
}

function openEditModal(id: number) {
  editingNoteId.value = id
  newNoteType.value = 'text'
  formModalOpen.value = true
}

async function onFormSaved() {
  await loadData()
  toast.value = { show: true, text: 'Catatan disimpan ✓', color: 'success' }
}

async function onFormDeleted() {
  await loadData()
  toast.value = { show: true, text: 'Catatan dipindahkan ke sampah 🗑️', color: 'success' }
}

async function togglePin(note: NoteItem) {
  await NoteRepository.togglePin(note.id!, note.isPinned)
  await loadData()
  toast.value = { 
    show: true, 
    text: note.isPinned ? 'Lepas sematan' : 'Disematkan di atas 📌', 
    color: 'success' 
  }
}

async function toggleArchive(note: NoteItem) {
  await NoteRepository.toggleArchive(note.id!, note.isArchived)
  await loadData()
  toast.value = { 
    show: true, 
    text: note.isArchived ? 'Diuraikan dari Arsip' : 'Catatan diarsipkan 📦', 
    color: 'success' 
  }
}

async function deleteNote(note: NoteItem) {
  await NoteRepository.delete(note.id!)
  await loadData()
  toast.value = { 
    show: true, 
    text: note.isTrashed ? 'Catatan dihapus permanen' : 'Dipindahkan ke sampah 🗑️', 
    color: 'success' 
  }
}

async function restoreNote(note: NoteItem) {
  await NoteRepository.restore(note.id!)
  await loadData()
  toast.value = { show: true, text: 'Catatan dipulihkan', color: 'success' }
}

async function toggleChecklistItem(note: NoteItem, item: ChecklistItem) {
  item.completed = !item.completed
  const plainChecklist = JSON.parse(JSON.stringify(note.checklist))
  await NoteRepository.update(note.id!, { checklist: plainChecklist })
}

function copyNoteText(note: NoteItem) {
  let textToCopy = note.title ? `${note.title}\n\n` : ''
  if (note.type === 'checklist') {
    textToCopy += note.checklist?.map(i => `${i.completed ? '☑' : '☐'} ${i.text}`).join('\n') || ''
  } else {
    textToCopy += note.content
  }

  navigator.clipboard.writeText(textToCopy)
  toast.value = { show: true, text: 'Teks catatan disalin ke clipboard 📋', color: 'success' }
}

function openManageLabelsModal() {
  manageLabelsVisible.value = true
}

async function addManageLabel() {
  if (!newManageLabelName.value.trim()) return
  await NoteRepository.addLabel(newManageLabelName.value.trim())
  newManageLabelName.value = ''
  availableLabels.value = await NoteRepository.getLabels()
  toast.value = { show: true, text: 'Label berhasil ditambahkan', color: 'success' }
}

async function deleteManageLabel(id: number) {
  await NoteRepository.deleteLabel(id)
  availableLabels.value = await NoteRepository.getLabels()
  toast.value = { show: true, text: 'Label dihapus', color: 'success' }
}

onMounted(loadData)
</script>

<style scoped>
.keep-logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
}

.search-input {
  padding-left: 34px !important;
  padding-right: 30px !important;
  border-radius: 20px !important;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.1rem;
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
}

.filter-chips-container {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #ffffff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.filter-chip:hover {
  background: #f1f5f9;
}

.filter-chip.active {
  background: #eab308;
  border-color: #ca8a04;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.3);
}

.filter-chip.danger.active {
  background: #ef4444;
  border-color: #dc2626;
  color: #ffffff;
}

.quick-keep-container {
  max-width: 600px;
  margin-left: auto !important;
  margin-right: auto !important;
}

.quick-keep-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.quick-keep-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.quick-placeholder {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.quick-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #475569;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.quick-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #64748b;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-list .note-card {
  width: 100%;
  max-width: 100%;
  padding: 14px 18px;
}

@media (min-width: 640px) {
  .notes-list .note-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .notes-list .note-card-body {
    flex: 1;
    min-width: 0;
  }

  .notes-list .note-card-footer {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
}

.note-card {
  position: relative;
  border-radius: 18px;
  padding: 16px;
  border: 1.5px solid #e2e8f0;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.note-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.btn-pin-corner {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  color: #94a3b8;
  display: grid;
  place-items: center;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s;
}

.note-card:hover .btn-pin-corner,
.btn-pin-corner.active {
  opacity: 1;
}

.btn-pin-corner.active {
  color: #eab308;
  background: #fef9c3;
}

.note-title {
  margin: 0 24px 8px 0;
  font-weight: 700;
  line-height: 1.3;
  color: #0f172a;
}

.note-preview-text {
  margin: 0;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.checklist-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  margin-bottom: 4px;
  color: #334155;
}

.completed-item {
  text-decoration: line-through;
  color: #94a3b8;
}

.checklist-more-count {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 4px;
}

.note-labels-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.note-label-chip {
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.06);
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
}

.note-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0,0,0,0.08);
}

.note-time {
  font-size: 0.72rem;
  color: #94a3b8;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.card-act-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #64748b;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  cursor: pointer;
}

.card-act-btn:hover {
  background: rgba(0,0,0,0.08);
  color: #0f172a;
}

.card-act-btn.danger:hover {
  color: #ef4444;
  background: #fee2e2;
}

.card-act-btn.success:hover {
  color: #10b981;
  background: #d1fae5;
}

.color-default { background-color: #ffffff !important; border-color: #cbd5e1 !important; }
.color-coral   { background-color: #faebd7 !important; border-color: #f3d5b5 !important; }
.color-peach   { background-color: #ffe4c4 !important; border-color: #f7c59f !important; }
.color-yellow  { background-color: #fef08a !important; border-color: #fde047 !important; }
.color-mint    { background-color: #d1fae5 !important; border-color: #a7f3d0 !important; }
.color-teal    { background-color: #ccfbf1 !important; border-color: #99f6e4 !important; }
.color-sky     { background-color: #e0f2fe !important; border-color: #bae6fd !important; }
.color-purple  { background-color: #f3e8ff !important; border-color: #e9d5ff !important; }
.color-pink    { background-color: #fce7f3 !important; border-color: #fbcfe8 !important; }
.color-gray    { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; }

[data-theme="dark"] .color-default { background-color: #1e293b !important; border-color: #334155 !important; color: #f8fafc; }
[data-theme="dark"] .color-coral   { background-color: #451a1a !important; border-color: #782a2a !important; color: #fecdd3; }
[data-theme="dark"] .color-peach   { background-color: #432818 !important; border-color: #7c4424 !important; color: #ffedd5; }
[data-theme="dark"] .color-yellow  { background-color: #423b0c !important; border-color: #716415 !important; color: #fef9c3; }
[data-theme="dark"] .color-mint    { background-color: #0c3b2e !important; border-color: #156952 !important; color: #d1fae5; }
[data-theme="dark"] .color-teal    { background-color: #0f3938 !important; border-color: #1a605f !important; color: #ccfbf1; }
[data-theme="dark"] .color-sky     { background-color: #0c2d48 !important; border-color: #174e7c !important; color: #e0f2fe; }
[data-theme="dark"] .color-purple  { background-color: #3b1c54 !important; border-color: #64318e !important; color: #f3e8ff; }
[data-theme="dark"] .color-pink    { background-color: #4d1933 !important; border-color: #842e5a !important; color: #fce7f3; }
[data-theme="dark"] .color-gray    { background-color: #1f2937 !important; border-color: #374151 !important; color: #f3f4f6; }
</style>
