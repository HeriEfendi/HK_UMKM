<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Backup &amp; Restore</ion-title>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Ekspor seluruh data database ke Excel atau Impor kembali kapan saja.</p>
        </div>
      </ion-toolbar>
    </ion-header> 

    <ion-content class="app-content-wrap ion-padding">
      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-card shadow-soft text-center p-4">
          <ion-spinner name="crescent" color="primary" />
          <p class="mt-3 fw-bold text-dark">{{ loadingMessage }}</p>
          <small class="text-muted">Jangan keluar dari halaman atau menutup aplikasi.</small>
        </div>
      </div>

      <!-- Action Grid -->
      <div class="backup-grid m-2">
        <!-- Card 1: Backup -->
        <ion-card class="mobile-card action-card shadow-soft mb-2">
          <div class="card-glow-bg backup-glow"></div>
          <ion-card-header class="mobile-card-header">
            <div class="icon-circle bg-emerald-light">
              <ion-icon :icon="cloudDownloadOutline" class="text-emerald" />
            </div>
            <ion-card-title class="mobile-card-title mt-3">Backup Database</ion-card-title>
            <ion-card-subtitle class="mobile-card-subtitle">
              Ekspor data dari tabel yang dipilih ke dalam satu file Excel (.xlsx).
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="d-flex flex-column gap-3">
            <div class="info-alert">
              <ion-icon :icon="informationCircleOutline" />
              <span>Setiap tabel database akan disimpan sebagai lembar sheet terpisah di file Excel.</span>
            </div>

            <!-- Table Selection for Backup -->
            <div class="table-select-box">
              <div class="table-select-header">
                <span class="table-select-title">
                  <ion-icon :icon="listOutline" />
                  Pilih Tabel ({{ backupSelectedTables.length }}/{{ allTableNames.length }})
                </span>
                <div class="select-actions">
                  <button class="sel-btn" @click="selectAllBackup">Semua</button>
                  <button class="sel-btn" @click="deselectAllBackup">Hapus</button>
                </div>
              </div>
              <div class="table-list">
                <label
                  v-for="tbl in allTableNames"
                  :key="'bk-' + tbl"
                  class="table-item"
                  :class="{ checked: backupSelectedTables.includes(tbl) }"
                >
                  <input
                    type="checkbox"
                    :value="tbl"
                    v-model="backupSelectedTables"
                    class="hidden-cb"
                  />
                  <span class="cb-box">
                    <ion-icon v-if="backupSelectedTables.includes(tbl)" :icon="checkmarkOutline" class="cb-check" />
                  </span>
                  <span class="tbl-name">{{ tbl }}</span>
                </label>
              </div>
            </div>

            <ion-button
              class="btn-action success w-100"
              expand="block"
              style="margin: 0;"
              :disabled="backupSelectedTables.length === 0"
              @click="handleBackup"
            >
              <ion-icon :icon="cloudDownloadOutline" slot="start" /> Ekspor ke Excel
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Card 2: Restore -->
        <ion-card class="mobile-card action-card shadow-soft mb-2 mt-0">
          <div class="card-glow-bg restore-glow"></div>
          <ion-card-header class="mobile-card-header">
            <div class="icon-circle bg-indigo-light">
              <ion-icon :icon="cloudUploadOutline" class="text-indigo" />
            </div>
            <ion-card-title class="mobile-card-title mt-3">Restore Database</ion-card-title>
            <ion-card-subtitle class="mobile-card-subtitle">
              Pilih file Excel hasil backup sebelumnya untuk memperbarui data database lokal Anda.
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="d-flex flex-column gap-3">
            <div class="info-alert warning">
              <ion-icon :icon="alertCircleOutline" />
              <span>PENTING: Seluruh data pada tabel yang dipilih akan DIHAPUS dan digantikan dengan data dari file Excel.</span>
            </div>

            <!-- Table Selection for Restore -->
            <div class="table-select-box indigo">
              <div class="table-select-header">
                <span class="table-select-title">
                  <ion-icon :icon="listOutline" />
                  Pilih Tabel ({{ restoreSelectedTables.length }}/{{ allTableNames.length }})
                </span>
                <div class="select-actions">
                  <button class="sel-btn indigo" @click="selectAllRestore">Semua</button>
                  <button class="sel-btn indigo" @click="deselectAllRestore">Hapus</button>
                </div>
              </div>
              <div class="table-list">
                <label
                  v-for="tbl in allTableNames"
                  :key="'rs-' + tbl"
                  class="table-item indigo"
                  :class="{ checked: restoreSelectedTables.includes(tbl) }"
                >
                  <input
                    type="checkbox"
                    :value="tbl"
                    v-model="restoreSelectedTables"
                    class="hidden-cb"
                  />
                  <span class="cb-box indigo">
                    <ion-icon v-if="restoreSelectedTables.includes(tbl)" :icon="checkmarkOutline" class="cb-check" />
                  </span>
                  <span class="tbl-name">{{ tbl }}</span>
                </label>
              </div>
            </div>

            <!-- Custom File Upload Button -->
            <div class="file-upload-container">
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx"
                class="hidden-file-input"
                @change="handleFileChange"
              />
              <ion-button
                class="btn-action warning w-100"
                expand="block"
                style="margin: 0;"
                :disabled="restoreSelectedTables.length === 0"
                @click="triggerFileSelect"
              >
                <ion-icon :icon="cloudUploadOutline" slot="start" /> Pilih File Excel &amp; Restore
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- App Toast for info -->
      <app-toast
        :is-open="toast.show"
        :message="toast.text"
        :color="toast.color === 'danger' ? 'error' : toast.color"
        @dismiss="toast.show = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonBackButton,
} from '@ionic/vue';
import {
  cloudDownloadOutline,
  cloudUploadOutline,
  informationCircleOutline,
  alertCircleOutline,
  downloadOutline,
  documentTextOutline,
  settingsOutline,
  listOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { db } from '@/db/schema';
import * as XLSX from 'xlsx';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import AppToast from '@/components/AppToast.vue';

const fileInput = ref(null);
const loading = ref(false);
const loadingMessage = ref('');

const toast = ref({
  show: false,
  text: '',
  color: 'success',
});

// ── Table selection state ──────────────────────────────────────────────────────
const allTableNames = ref([]);
const backupSelectedTables = ref([]);
const restoreSelectedTables = ref([]);

onMounted(async () => {
  if (!db.isOpen()) await db.open();
  allTableNames.value = db.tables.map((t) => t.name);
  // Default: semua tabel tercentang
  backupSelectedTables.value = [...allTableNames.value];
  restoreSelectedTables.value = [...allTableNames.value];
});

// Select All / Deselect All helpers
function selectAllBackup() {
  backupSelectedTables.value = [...allTableNames.value];
}
function deselectAllBackup() {
  backupSelectedTables.value = [];
}
function selectAllRestore() {
  restoreSelectedTables.value = [...allTableNames.value];
}
function deselectAllRestore() {
  restoreSelectedTables.value = [];
}
// ──────────────────────────────────────────────────────────────────────────────

function showToast(text, color = 'success') {
  toast.value = { show: true, text, color };
}

function triggerFileSelect() {
  fileInput.value?.click();
}

/**
 * HELPER: Save Workbook (Supporting Native Share & Web Download like Details.vue)
 */
async function saveWorkbook(wb, fileName) {
  const XLSX = await import('xlsx');
  if (Capacitor.isNativePlatform()) {
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const path = `backup_${fileName}`;
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
      title: 'Backup Database',
      files: [uri],
      dialogTitle: 'Simpan file Backup',
    });
    return;
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * BACKUP DATABASE
 * Export selected Dexie tables to a single Excel file
 */
// Excel hard limit per cell is 32,767 characters
const EXCEL_CELL_LIMIT = 32000;

/**
 * Sanitize a single cell value so it never exceeds Excel's 32,767-char limit.
 * Objects/arrays are JSON-serialised; oversized strings are truncated.
 */
function sanitizeCellValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    let str = JSON.stringify(val);
    if (str.length > EXCEL_CELL_LIMIT) {
      str = str.slice(0, EXCEL_CELL_LIMIT) + '…[TRUNCATED]';
    }
    return str;
  }
  if (typeof val === 'string' && val.length > EXCEL_CELL_LIMIT) {
    return val.slice(0, EXCEL_CELL_LIMIT) + '…[TRUNCATED]';
  }
  return val;
}

async function handleBackup() {
  if (backupSelectedTables.value.length === 0) {
    showToast('Pilih minimal satu tabel untuk di-backup.', 'warning');
    return;
  }

  loading.value = true;
  loadingMessage.value = 'Mempersiapkan ekspor...';
  const skippedTables = [];
  try {
    const XLSX = await import('xlsx');
    if (!db.isOpen()) await db.open();

    const wb = XLSX.utils.book_new();
    const tables = db.tables.filter((t) => backupSelectedTables.value.includes(t.name));

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      loadingMessage.value = `Mengekspor tabel ${i + 1}/${tables.length}: ${table.name}…`;
      try {
        const data = await table.toArray();

        // Sanitize every cell – no value may exceed EXCEL_CELL_LIMIT chars
        const cleanedData = data.map((row) => {
          const cleaned = { ...row };
          for (const key of Object.keys(cleaned)) {
            cleaned[key] = sanitizeCellValue(cleaned[key]);
          }
          return cleaned;
        });

        const ws =
          cleanedData.length > 0
            ? XLSX.utils.json_to_sheet(cleanedData)
            : XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(wb, ws, table.name);
      } catch (tableErr) {
        console.warn(`Tabel "${table.name}" dilewati karena error:`, tableErr);
        skippedTables.push(table.name);
        // Still add an empty sheet so the sheet count stays consistent
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['ERROR: ' + tableErr.message]]), table.name);
      }
    }

    loadingMessage.value = 'Menyimpan file…';
    const fileName = `HK-UMKM_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    await saveWorkbook(wb, fileName);

    if (skippedTables.length > 0) {
      showToast(`Backup selesai (${skippedTables.length} tabel dilewati: ${skippedTables.join(', ')})`, 'warning');
    } else {
      showToast(`Berhasil mengekspor ${tables.length} tabel ke backup database!`, 'success');
    }
  } catch (err) {
    console.error('Export failed:', err);
    showToast('Gagal mengekspor database: ' + err.message, 'danger');
  } finally {
    loading.value = false;
  }
}

// Map for renamed tables to maintain backward compatibility
const TABLE_NAME_MAP = {
  capitalCosts: 'savings',
};

/**
 * RESTORE DATABASE
 * Import only selected tables from chosen Excel file
 */
async function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (restoreSelectedTables.value.length === 0) {
    showToast('Pilih minimal satu tabel untuk di-restore.', 'warning');
    e.target.value = '';
    return;
  }

  // Ask for confirmation
  const confirmRestore = confirm(
    `Apakah Anda yakin ingin melakukan restore pada ${restoreSelectedTables.value.length} tabel berikut?\n\n${restoreSelectedTables.value.join(', ')}\n\nData pada tabel tersebut akan DIHAPUS dan digantikan sepenuhnya.`
  );
  if (!confirmRestore) {
    e.target.value = ''; // Reset file input
    return;
  }

  loading.value = true;
  loadingMessage.value = 'Membaca file & merestore database...';

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const XLSX = await import('xlsx');
      if (!db.isOpen()) await db.open();

      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames.length) {
        throw new Error('File Excel kosong atau tidak valid.');
      }

      let restoredTables = [];
      let totalRecords = 0;

      // Wrap the restore operation in a write transaction covering all stores
      await db.transaction('rw', db.tables, async () => {
        for (const sheetName of workbook.SheetNames) {
          const targetTableName = TABLE_NAME_MAP[sheetName] || sheetName;

          // Only restore tables that are selected by the user
          if (!restoreSelectedTables.value.includes(targetTableName)) continue;

          const table = db.tables.find((t) => t.name === targetTableName);
          if (!table) continue;

          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet);

          // 1. Wipe table
          await table.clear();

          // 2. Parse and insert new rows if any
          if (rows.length > 0) {
            const cleanedRows = rows.map((row) => {
              const cleaned = { ...row };
              delete cleaned.__rowNum__;

              for (const key of Object.keys(cleaned)) {
                const val = cleaned[key];
                if (typeof val === 'string') {
                  if (
                    (val.startsWith('[') && val.endsWith(']')) ||
                    (val.startsWith('{') && val.endsWith('}'))
                  ) {
                    try {
                      cleaned[key] = JSON.parse(val);
                      continue;
                    } catch {
                      // ignore
                    }
                  }

                  const isIdField = key === 'id' || key.endsWith('Id') || key.endsWith('_id');
                  const isNumericField = /price|stock|amount|qty|quantity|discount|balance|total|sum|count|hours|minutes|rate/i.test(key);

                  if (isIdField || isNumericField) {
                    const num = Number(val);
                    if (!isNaN(num) && val.trim() !== '') {
                      cleaned[key] = num;
                    }
                  }
                }
              }
              return cleaned;
            });

            await table.bulkAdd(cleanedRows);
          }

          restoredTables.push(targetTableName);
          totalRecords += rows.length;
        }
      });

      showToast(`Restore berhasil! Memulihkan ${restoredTables.length} tabel (${totalRecords} baris data).`, 'success');
    } catch (err) {
      console.error('Restore failed:', err);
      showToast('Gagal memulihkan database: ' + err.message, 'danger');
    } finally {
      loading.value = false;
      e.target.value = ''; // Reset file input
    }
  };

  reader.onerror = (err) => {
    console.error(err);
    showToast('Gagal membaca file.', 'danger');
    loading.value = false;
    e.target.value = ''; // Reset file input
  };

  reader.readAsArrayBuffer(file);
}
</script>

<style scoped>
/* Gradient and premium hero styles */
.backup-hero {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.25) !important;
  padding: 24px 20px !important;
}

.custom-back-btn {
  --color: #ffffff;
  margin-left: -8px;
}

/* Grid Layout */
.backup-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .backup-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Premium Card aesthetics */
.action-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08) !important;
}

.card-glow-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.12;
  pointer-events: none;
}

.backup-glow {
  background: #10b981;
}

.restore-glow {
  background: #4f46e5;
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle ion-icon {
  font-size: 1.6rem;
}

.bg-emerald-light {
  background: #ecfdf5;
}

.text-emerald {
  color: #059669;
}

.bg-indigo-light {
  background: #eef2ff;
}

.text-indigo {
  color: #4f46e5;
}

/* Alert Boxes */
.info-alert {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  line-height: 1.4;
}

.info-alert ion-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  color: #64748b;
}

.info-alert.warning {
  background: #fffbeb;
  border-color: #fef3c7;
  color: #92400e;
}

.info-alert.warning ion-icon {
  color: #d97706;
}

/* Hidden inputs */
.hidden-file-input {
  display: none;
}

/* ── Table Selection Box ───────────────────────────────────────────────────── */
.table-select-box {
  border: 1.5px solid #d1fae5;
  border-radius: 14px;
  background: #f0fdf4;
  overflow: hidden;
}

.table-select-box.indigo {
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.table-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid #d1fae5;
  background: #ecfdf5;
}

.table-select-box.indigo .table-select-header {
  border-color: #c7d2fe;
  background: #ede9fe;
}

.table-select-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #065f46;
  letter-spacing: 0.3px;
}

.table-select-box.indigo .table-select-title {
  color: #3730a3;
}

.table-select-title ion-icon {
  font-size: 1rem;
}

.select-actions {
  display: flex;
  gap: 6px;
}

.sel-btn {
  background: #d1fae5;
  color: #065f46;
  border: none;
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.sel-btn:hover {
  background: #a7f3d0;
  transform: scale(1.04);
}

.sel-btn.indigo {
  background: #c7d2fe;
  color: #3730a3;
}

.sel-btn.indigo:hover {
  background: #a5b4fc;
}

/* Scrollable table list */
.table-list {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
  padding: 6px 8px;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: #a7f3d0 transparent;
}

.table-select-box.indigo .table-list {
  scrollbar-color: #a5b4fc transparent;
}

/* Individual table item */
.table-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.table-item:hover {
  background: rgba(16, 185, 129, 0.08);
}

.table-item.indigo:hover {
  background: rgba(99, 102, 241, 0.08);
}

.table-item.checked {
  background: rgba(16, 185, 129, 0.12);
}

.table-item.checked.indigo {
  background: rgba(99, 102, 241, 0.1);
}

.hidden-cb {
  display: none;
}

/* Custom checkbox box */
.cb-box {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 5px;
  border: 2px solid #6ee7b7;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.table-item.checked .cb-box {
  background: #10b981;
  border-color: #10b981;
}

.cb-box.indigo {
  border-color: #a5b4fc;
}

.table-item.checked .cb-box.indigo {
  background: #6366f1;
  border-color: #6366f1;
}

.cb-check {
  font-size: 0.7rem;
  color: #fff;
  font-weight: 800;
}

.tbl-name {
  font-size: 0.8rem;
  color: #1e293b;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}
/* ─────────────────────────────────────────────────────────────────────────── */

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-card {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
