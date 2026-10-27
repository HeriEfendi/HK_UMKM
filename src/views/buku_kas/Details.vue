<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent, watch, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import { useRoute } from 'vue-router'
import { db } from '@/db/schema'
import { migrateProjectTransactions, getTransactionsByProject, calcProjectTotals } from '@/db/bukuKasMigration'
import { IonPage, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonButtons, IonTitle, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonProgressBar, IonBadge, IonSpinner, IonList, IonListHeader, IonAlert, IonFooter, IonSegment, IonSegmentButton, IonBackButton } from '@ionic/vue';
import { addOutline, trashOutline, pencilOutline, closeOutline, cloudUploadOutline, cloudDownloadOutline, listOutline, checkmarkCircleOutline, searchOutline, arrowBackOutline, cameraOutline, imageOutline, eyeOutline, documentAttachOutline } from 'ionicons/icons';
import { CHART_PALETTE, formatIDR, formatCompactNumber, getModernTooltip, getDonutTooltip } from '@/utils/chartThemes'
import AppToast from '@/components/AppToast.vue'
import { compressReceiptImage, capturePhotoFromCamera, pickPhotoFromGallery } from '@/utils/attachmentHelper'
import { transactionAttachmentsRepo } from '@/db/repositories'

interface Transaction {
  id: number
  project_id: number
  type: 'DEPOSIT' | 'EXPENSE'
  category: string
  amount: number
  date: string
  description: string | null
  hasAttachment?: boolean
}

interface Project {
  id: number
  name: string
  description: string | null
  status: string
  total_deposits: number
  total_expenses: number
  balance: number
  transactions: Transaction[]
  created_at: string
}

const route = useRoute()


const project = ref<Project | null>(null)
const loading = ref(false)
const activeTab = ref('dashboard')
const chartKey = ref(0)
const isChartMounted = ref(false)

watch(activeTab, (newTab) => {
  if (newTab === 'dashboard') {
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
const txSearchQuery = ref('')
const dialogTransaction = ref(false)
const dialogDeleteTxId = ref<number | null>(null)
const submitting = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const editingTxId = ref<number | null>(null)
const filterType = ref('SEMUA')
const filterOptions = ref([
  { label: 'Semua', value: 'SEMUA' },
  { label: 'Modal', value: 'MODAL' },
  { label: 'Pengeluaran', value: 'EXPENSE' },
  { label: 'Pendapatan', value: 'PENDAPATAN' },
])

const filterCount = (filter: string) => {
  if (filter === 'SEMUA') return project.value?.transactions.length || 0
  if (filter === 'MODAL') return project.value?.transactions.filter(t => t.type === 'DEPOSIT' && categories.DEPOSIT_MODAL.includes(t.category)).length || 0
  if (filter === 'EXPENSE') return project.value?.transactions.filter(t => t.type === 'EXPENSE').length || 0
  if (filter === 'PENDAPATAN') return project.value?.transactions.filter(t => t.type === 'DEPOSIT' && categories.DEPOSIT_PENDAPATAN.includes(t.category)).length || 0
  return 0
}
const maxWidth = '100%'

const categories = {
  DEPOSIT_MODAL: ['Modal Awal', 'Pinjaman', 'Investor', 'Lainnya'],
  DEPOSIT_PENDAPATAN: ['Penjualan Panen', 'Keuntungan', 'Transfer'],
  EXPENSE: ['Material / Bahan', 'Bibit / Benih', 'Upah / Tenaga Kerja', 'Peralatan', 'Transportasi', 'Operasional', 'Administrasi', 'Tak Terduga', 'Lainnya'],
}

const formTx = ref({
  type: 'EXPENSE' as 'DEPOSIT' | 'EXPENSE',
  category: '',
  amount: 0,
  date: new Date().toISOString().substring(0, 10),
  description: '',
})

const filteredTransactions = computed(() => {
  if (!project.value) return []
  let txs = [...(project.value.transactions || [])]
  
  if (filterType.value === 'MODAL') {
    txs = txs.filter(t => t.type === 'DEPOSIT' && categories.DEPOSIT_MODAL.includes(t.category))
  } else if (filterType.value === 'PENDAPATAN') {
    txs = txs.filter(t => t.type === 'DEPOSIT' && categories.DEPOSIT_PENDAPATAN.includes(t.category))
  } else if (filterType.value === 'EXPENSE') {
    txs = txs.filter(t => t.type === 'EXPENSE')
  }

  if (txSearchQuery.value.trim()) {
    const q = txSearchQuery.value.toLowerCase()
    txs = txs.filter(t => 
      (t.category || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }
  
  return txs.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff
    const typeA = a.type === 'EXPENSE' ? -1 : 1
    const typeB = b.type === 'EXPENSE' ? -1 : 1
    return typeA - typeB
  })
})

const netProfit = computed(() => (((project.value as any)?.panen_total || 0) - (project.value?.total_expenses || 0)))
const roi = computed(() => {
  const modal = (project.value as any)?.modal_total || 0
  if (modal <= 0) return 0
  return Math.floor((netProfit.value / modal) * 100) || 0
})

const profitPercent = computed(() => {
  const sales = (project.value as any)?.panen_total || 0
  if (sales <= 0) return 0
  return Math.floor((netProfit.value / sales) * 100) || 0
})

function getFinancialColor(value: number, positiveColor = '#1565c0') {
  return value < 0 ? '#c62828' : positiveColor
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getStatusColor(status: string) {
  if (status === 'Active' || status === 'Aktif') return 'success'
  if (status === 'Completed' || status === 'Selesai') return 'teal'
  if (status === 'Pending' || status === 'Tunda') return 'warning'
  return 'secondary'
}

// Attachment state for form dialog
const attachmentFileInputRef = ref<HTMLInputElement | null>(null)
const attachmentBlob = ref<Blob | null>(null)
const attachmentMime = ref('image/webp')
const attachmentFileName = ref('')
const attachmentSize = ref(0)
const attachmentDimensions = ref('')
const attachmentFormat = ref('WEBP')
const attachmentPreviewUrl = ref<string | null>(null)
const attachmentChanged = ref(false)
const compressing = ref(false)
const showZoomModal = ref(false)

// Quick receipt preview from transaction list
const selectedReceipt = ref<any>(null)
const showReceiptModal = ref(false)

function clearAttachmentPreview() {
  if (attachmentPreviewUrl.value) {
    URL.revokeObjectURL(attachmentPreviewUrl.value)
    attachmentPreviewUrl.value = null
  }
}

function setAttachmentData(compressedResult: any, fileName = '') {
  clearAttachmentPreview()
  attachmentBlob.value = compressedResult.blob
  attachmentMime.value = compressedResult.mimeType
  attachmentSize.value = compressedResult.size
  attachmentDimensions.value = `${compressedResult.width}×${compressedResult.height}px`
  attachmentFormat.value = (compressedResult.mimeType.split('/')[1] || 'webp').toUpperCase()
  attachmentFileName.value = fileName || `nota_${Date.now()}.${compressedResult.mimeType === 'image/jpeg' ? 'jpg' : 'webp'}`
  attachmentPreviewUrl.value = URL.createObjectURL(compressedResult.blob)
  attachmentChanged.value = true
}

async function handleCameraCapture() {
  try {
    compressing.value = true
    const result = await capturePhotoFromCamera()
    if (result) {
      setAttachmentData(result, `nota_kamera_${Date.now()}.webp`)
    }
  } catch (err: any) {
    console.warn('Camera capture error, fallback to file input:', err)
    attachmentFileInputRef.value?.click()
  } finally {
    compressing.value = false
  }
}

async function handleGalleryPick() {
  try {
    compressing.value = true
    const result = await pickPhotoFromGallery()
    if (result) {
      setAttachmentData(result, `nota_galeri_${Date.now()}.webp`)
    }
  } catch (err: any) {
    console.warn('Gallery pick error, fallback to file input:', err)
    attachmentFileInputRef.value?.click()
  } finally {
    compressing.value = false
  }
}

async function onFileInputChange(event: any) {
  const file = event.target?.files?.[0]
  if (!file) return

  try {
    compressing.value = true
    const result = await compressReceiptImage(file, 1200, 0.75)
    const ext = result.mimeType === 'image/jpeg' ? 'jpg' : 'webp'
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'nota'
    setAttachmentData(result, `${baseName}.${ext}`)
  } catch (err: any) {
    console.error('File compression error:', err)
    alert('Gagal mengompres gambar: ' + (err?.message || 'Error'))
  } finally {
    compressing.value = false
    event.target.value = ''
  }
}

function removeAttachment() {
  clearAttachmentPreview()
  attachmentBlob.value = null
  attachmentSize.value = 0
  attachmentDimensions.value = ''
  attachmentFileName.value = ''
  attachmentChanged.value = true
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  const kb = bytes / 1024
  if (kb < 1024) return kb.toFixed(1) + ' KB'
  return (kb / 1024).toFixed(2) + ' MB'
}

async function viewReceipt(tx: Transaction) {
  try {
    const att = await transactionAttachmentsRepo.getByTransactionId(tx.id)
    if (att && att.blob instanceof Blob) {
      if (selectedReceipt.value?.url) {
        URL.revokeObjectURL(selectedReceipt.value.url)
      }
      selectedReceipt.value = {
        url: URL.createObjectURL(att.blob),
        fileName: att.fileName || 'Nota.webp',
        size: att.blob.size,
        txCategory: tx.category,
        txAmount: tx.amount,
        txType: tx.type,
        txDescription: tx.description
      }
      showReceiptModal.value = true
    } else {
      showSnackbar('Lampiran nota tidak ditemukan', 'warning')
    }
  } catch (err) {
    console.error('Failed to load transaction receipt:', err)
  }
}

function closeReceiptModal() {
  if (selectedReceipt.value?.url) {
    URL.revokeObjectURL(selectedReceipt.value.url)
  }
  selectedReceipt.value = null
  showReceiptModal.value = false
}

onUnmounted(() => {
  clearAttachmentPreview()
  closeReceiptModal()
})

async function fetchProject(silent = false) {
  if (!silent) loading.value = true
  try {
    if (!db.isOpen()) await db.open()
    const projectId = Number(route.params.id)
    const found = await db.table('projects').get(projectId)
    
    if (found) {
      // Baca transaksi dari tabel terpisah
      const [txs, allAtts] = await Promise.all([
        getTransactionsByProject(projectId),
        transactionAttachmentsRepo.getAll()
      ])
      const attTxIds = new Set(allAtts.map((a: any) => a.transactionId))
      found.transactions = txs.map((t: any) => ({
        ...t,
        hasAttachment: Boolean(t.hasAttachment || attTxIds.has(t.id))
      }))

      // Hitung totals dari tabel transactions terpisah
      const totals = await calcProjectTotals(projectId)
      found.total_deposits = totals.total_deposits
      found.total_expenses = totals.total_expenses
      found.balance = totals.balance
      ;(found as any).modal_total = totals.modal_total
      ;(found as any).panen_total = totals.panen_total
    }
    project.value = found || null
    chartKey.value++
    nextTick(() => {
      setTimeout(() => {
        isChartMounted.value = true
        window.dispatchEvent(new Event('resize'))
      }, 150)
    })
  } catch(e) {
    console.error("Failed to fetch project:", e);
    showSnackbar('Gagal memuat data projek', 'error')
  } finally {
    if (!silent) loading.value = false
  }
}

async function saveTransaction() {
  if (!formTx.value.type || !formTx.value.date) {
    showSnackbar('Tipe dan Tanggal wajib diisi!', 'warning')
    return
  }
  submitting.value = true

  if (!formTx.value.category) {
    formTx.value.category = availableCategories.value[0] || 'Lainnya'
  }

  try {
    if (!db.isOpen()) await db.open()
    const projectId = project.value!.id
    let txId = editingTxId.value

    if (txId) {
      // Update transaksi yang sudah ada
      const existing = await db.table('transactions').get(txId)
      if (existing) {
        await db.table('transactions').put({
          ...existing,
          ...formTx.value,
          project_id: projectId,
          hasAttachment: Boolean(attachmentBlob.value)
        })
      }

      if (attachmentChanged.value) {
        await transactionAttachmentsRepo.deleteByTransactionId(txId)
        if (attachmentBlob.value) {
          await transactionAttachmentsRepo.add({
            transactionId: txId,
            blob: attachmentBlob.value,
            mimeType: attachmentMime.value || 'image/webp',
            fileName: attachmentFileName.value || `nota_tx_${txId}.webp`,
            createdAt: new Date().toISOString()
          })
        }
      }
    } else {
      // Tambah transaksi baru
      txId = Date.now()
      const newTx: Transaction = {
        id: txId,
        project_id: projectId,
        ...formTx.value,
        hasAttachment: Boolean(attachmentBlob.value)
      }
      await db.table('transactions').put(newTx)

      if (attachmentBlob.value) {
        await transactionAttachmentsRepo.add({
          transactionId: txId,
          blob: attachmentBlob.value,
          mimeType: attachmentMime.value || 'image/webp',
          fileName: attachmentFileName.value || `nota_tx_${txId}.webp`,
          createdAt: new Date().toISOString()
        })
      }
    }

    // Hitung ulang totals dan update di project
    const totals = await calcProjectTotals(projectId)
    const projectRecord = await db.table('projects').get(projectId)
    if (projectRecord) {
      projectRecord.total_deposits = totals.total_deposits
      projectRecord.total_expenses = totals.total_expenses
      projectRecord.balance = totals.balance
      await db.table('projects').put(projectRecord)
    }

    await fetchProject(true)
    closeDialog()
    showSnackbar('Transaksi berhasil disimpan!', 'success')
  } catch (e) {
    console.error(e)
    showSnackbar('Gagal menyimpan transaksi', 'error')
  } finally {
    submitting.value = false
  }
}

async function deleteTransaction(id: number) {
    try {
        if (!db.isOpen()) await db.open()
        const projectId = project.value!.id

        await db.table('transactions').delete(id)
        await transactionAttachmentsRepo.deleteByTransactionId(id)

        // Hitung ulang totals dan update di project
        const totals = await calcProjectTotals(projectId)
        const projectRecord = await db.table('projects').get(projectId)
        if (projectRecord) {
          projectRecord.total_deposits = totals.total_deposits
          projectRecord.total_expenses = totals.total_expenses
          projectRecord.balance = totals.balance
          await db.table('projects').put(projectRecord)
        }

        dialogDeleteTxId.value = null
        await fetchProject(true)
        showSnackbar('Transaksi berhasil dihapus', 'success')
    } catch {
        showSnackbar('Gagal menghapus transaksi', 'error');
    }
}

function openCreateDialog() {
  editingTxId.value = null
  clearAttachmentPreview()
  attachmentBlob.value = null
  attachmentSize.value = 0
  attachmentDimensions.value = ''
  attachmentFileName.value = ''
  attachmentChanged.value = false

  formTx.value = {
    type: 'EXPENSE',
    category: '',
    amount: 0,
    date: new Date().toISOString().substring(0, 10),
    description: '',
  }
  dialogTransaction.value = true
}

async function openEditDialog(tx: Transaction) {
  editingTxId.value = tx.id
  clearAttachmentPreview()
  attachmentBlob.value = null
  attachmentSize.value = 0
  attachmentDimensions.value = ''
  attachmentFileName.value = ''
  attachmentChanged.value = false

  formTx.value = {
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    date: tx.date.substring(0, 10),
    description: tx.description || '',
  }

  try {
    const existingAtt = await transactionAttachmentsRepo.getByTransactionId(tx.id)
    if (existingAtt && existingAtt.blob instanceof Blob) {
      attachmentBlob.value = existingAtt.blob
      attachmentMime.value = existingAtt.mimeType || existingAtt.blob.type || 'image/webp'
      attachmentFileName.value = existingAtt.fileName || 'nota.webp'
      attachmentSize.value = existingAtt.blob.size
      attachmentFormat.value = (attachmentMime.value.split('/')[1] || 'webp').toUpperCase()
      attachmentPreviewUrl.value = URL.createObjectURL(existingAtt.blob)
    }
  } catch (err) {
    console.error('Failed to load transaction attachment:', err)
  }

  dialogTransaction.value = true
}

function closeDialog() {
  clearAttachmentPreview()
  dialogTransaction.value = false
  editingTxId.value = null
}

function showSnackbar(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
  setTimeout(() => {
    snackbar.value.show = false
  }, 3000)
}

const fileInput = ref<HTMLInputElement | null>(null)
function handleImport() { fileInput.value?.click() }

async function processImportFile(result: ArrayBuffer) {
  try {
    const workbook = XLSX.read(result, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet) as any[]

    if (!json.length) {
      showSnackbar('File tidak memiliki data transaksi.', 'warning')
      return
    }

    const validCategories = [...categories.DEPOSIT_MODAL, ...categories.DEPOSIT_PENDAPATAN, ...categories.EXPENSE]

    // ── Validasi semua baris dulu sebelum menyimpan apapun ──────────────────
    const parsedRows: Transaction[] = []
    const validationErrors: string[] = []

    for (let index = 0; index < json.length; index++) {
      const row = json[index] as any
      const rowNumber = index + 2
      const type = String(row['Tipe'] || '').trim()
      const category = String(row['Kategori'] || '').trim()
      const amount = Number(row['Nominal'])
      const rawDate = row['Tanggal (DD/MM/YYYY)'] || row['Tanggal']

      if (type !== 'DEPOSIT' && type !== 'EXPENSE') {
        validationErrors.push(`Baris ${rowNumber}: Tipe harus DEPOSIT atau EXPENSE (dapat: "${type}")`)
        continue
      }
      if (!validCategories.includes(category)) {
        validationErrors.push(`Baris ${rowNumber}: Kategori tidak valid ("${category}")`)
        continue
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        validationErrors.push(`Baris ${rowNumber}: Nominal tidak valid`)
        continue
      }
      if (!rawDate) {
        validationErrors.push(`Baris ${rowNumber}: Tanggal wajib diisi`)
        continue
      }

      // ID belum di-set di sini, akan di-assign saat insert
      parsedRows.push({
        id: 0, // placeholder, diganti di bawah
        project_id: project.value!.id,
        type,
        category,
        amount,
        date: parseDate(rawDate),
        description: row['Deskripsi'] || ''
      })
    }

    if (validationErrors.length > 0) {
      console.warn('[Import] Validation errors:', validationErrors)
      showSnackbar(
        `${validationErrors.length} baris gagal validasi, ${parsedRows.length} baris siap disimpan.`,
        'warning'
      )
      if (parsedRows.length === 0) return
    }

    if (!project.value) return
    if (!db.isOpen()) await db.open()
    const projectId = project.value.id

    // ── Ambil max ID yang sudah ada agar ID baru tidak pernah bentrok ───────
    // Aman untuk integer hingga Number.MAX_SAFE_INTEGER (9 * 10^15)
    const allExisting = await db.table('transactions').toCollection().primaryKeys()
    const maxExistingId: number = allExisting.length > 0
      ? Math.max(...(allExisting as number[]))
      : 0
    
    // ── Insert satu per satu secara berurutan ────────────────────────────────
    let savedCount = 0
    const insertErrors: string[] = []

    for (let i = 0; i < parsedRows.length; i++) {
      const tx = { ...parsedRows[i], id: maxExistingId + i + 1 }
      try {
        await db.table('transactions').add(tx) // add (bukan put) → error jika ID sudah ada
        savedCount++
      } catch (insertErr: any) {
        insertErrors.push(`Baris ${i + 2}: ${insertErr.message}`)
        console.error(`[Import] Gagal insert baris ${i + 2}:`, insertErr)
      }
    }

    // ── Update totals project ────────────────────────────────────────────────
    const totals = await calcProjectTotals(projectId)
    const projectRecord = await db.table('projects').get(projectId)
    if (projectRecord) {
      projectRecord.total_deposits = totals.total_deposits
      projectRecord.total_expenses = totals.total_expenses
      projectRecord.balance = totals.balance
      await db.table('projects').put(projectRecord)
    }

    await fetchProject(true)

    if (insertErrors.length > 0) {
      showSnackbar(
        `${savedCount} tersimpan, ${insertErrors.length} gagal. Cek console untuk detail.`,
        'warning'
      )
    } else {
      showSnackbar(`${savedCount} transaksi berhasil diimpor!`, 'success')
    }

  } catch (e) {
    console.error(e)
    showSnackbar('Gagal memproses file: ' + (e as Error).message, 'error')
  }
}

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  const file = target.files[0]
  const reader = new FileReader()
  reader.onload = (ev) => {
    processImportFile(ev.target?.result as ArrayBuffer)
  }
  reader.onerror = () => showSnackbar('Gagal membaca file.', 'error')
  reader.readAsArrayBuffer(file)
  target.value = '' // reset agar file sama bisa dipilih lagi
}


function getGuideData() {
  return [
    ['Tipe', 'Kategori'],
    ...categories.DEPOSIT_MODAL.map(c => ['DEPOSIT', c]),
    ...categories.DEPOSIT_PENDAPATAN.map(c => ['DEPOSIT', c]),
    ...categories.EXPENSE.map(c => ['EXPENSE', c]),
    [],
    ['Format Info'],
    ['Tanggal', 'DD/MM/YYYY (Contoh: 01/07/2026)'],
    ['Nominal', 'Angka bulat tanpa titik/koma (Contoh: 1000000)']
  ]
}

import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

async function saveWorkbook(wb: XLSX.WorkBook, fileName: string) {
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

async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['Tipe', 'Kategori', 'Nominal', 'Tanggal (DD/MM/YYYY)', 'Deskripsi'],
    ['DEPOSIT', 'Modal Awal', 1000000, '01/07/2026', 'Modal Awal'],
    ['EXPENSE', 'Material / Bahan', 500000, '02/07/2026', 'Semen']
  ])
  ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 30 }]
  
  const wsGuide = XLSX.utils.aoa_to_sheet(getGuideData())
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 40 }]
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan')
  await saveWorkbook(wb, 'Template Buku Kas.xlsx')
}

async function exportToExcel() {
  const XLSX = await import('xlsx');
  const data = project.value!.transactions.map(t => ({


    Tipe: t.type,
    Kategori: t.category,
    Nominal: t.amount,
    Tanggal: t.date.split('-').reverse().join('/'),
    Deskripsi: t.description
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }]
  
  const wsGuide = XLSX.utils.aoa_to_sheet(getGuideData())
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 40 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan')
  await saveWorkbook(wb, `Buku Kas - ${project.value!.name}.xlsx`)
}

function parseDate(d: any): string {
    if (!d) return new Date().toISOString().substring(0, 10)
    const str = String(d)
    
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    
    // Check DD/MM/YYYY
    const parts = str.split('/')
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    
    return new Date().toISOString().substring(0, 10)
}

const availableCategories = computed(() => {
  if (formTx.value.type === 'DEPOSIT') return [...categories.DEPOSIT_MODAL, ...categories.DEPOSIT_PENDAPATAN]
  return categories.EXPENSE
})

const categoryTotals = computed(() => {
  const totals: Record<string, number> = {}
  project.value?.transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount
  })
  return totals
})

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
    series: [
      {
        name: 'Kategori Pengeluaran',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%'
          }
        },
        data
      }
    ]
  }
})

const chartDonutReady = computed(() =>
  Object.values(categoryTotals.value).some(v => v > 0)
)

const cashFlowData = computed(() => {
  if (!project.value) return { months: [], income: [], expense: [] }
  
  const monthsSet = new Set<string>()
  const sortedTxs = [...project.value.transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  sortedTxs.forEach(t => {
    const month = new Date(t.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    monthsSet.add(month)
  })
  
  const months = Array.from(monthsSet)
  const incomeMap: Record<string, number> = {}
  const expenseMap: Record<string, number> = {}
  
  months.forEach(m => {
    incomeMap[m] = 0
    expenseMap[m] = 0
  })
  
  sortedTxs.forEach(t => {
    const month = new Date(t.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    if (t.type === 'DEPOSIT') {
      incomeMap[month] = (incomeMap[month] || 0) + t.amount
    } else {
      expenseMap[month] = (expenseMap[month] || 0) + t.amount
    }
  })
  
  return {
    months,
    income: months.map(m => incomeMap[m]),
    expense: months.map(m => expenseMap[m])
  }
})

const barChartOption = computed(() => {
  return {
    color: ['#10b981', '#ef4444'],
    tooltip: getModernTooltip((params: any) => {
      let res = `<div style="font-weight:600;margin-bottom:6px;">${params[0]?.name || ''}</div>`
      params.forEach((item: any) => {
        res += `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:6px;"></span>${item.seriesName}:</span>
          <span style="font-weight:600;">${formatIDR(item.value)}</span>
        </div>`
      })
      return res
    }),
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 11 }
    },
    grid: {
      top: '12%',
      left: '2%',
      right: '2%',
      bottom: '14%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: cashFlowData.value.months,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        formatter: (val: number) => formatCompactNumber(val)
      }
    },
    series: [
      {
        name: 'Uang Masuk',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: cashFlowData.value.income.map(v => (Number.isFinite(v) ? v : 0))
      },
      {
        name: 'Uang Keluar',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: cashFlowData.value.expense.map(v => (Number.isFinite(v) ? v : 0))
      }
    ]
  }
})

const chartBarReady = computed(() =>
  cashFlowData.value.months.length > 0
)

onMounted(async () => {
  // Jalankan migrasi data lama (idempotent — aman dijalankan berulang)
  await migrateProjectTransactions()
  await fetchProject()
})


const chartCarousel = ref(null)
let interval: any = null

onMounted(() => {
  if (window.innerWidth < 992) { // Use 'lg' breakpoint
    let active = 0
    interval = setInterval(() => {
      active = active === 0 ? 1 : 0
      if (chartCarousel.value) {
        (chartCarousel.value as any).scrollTo({
          left: active * (chartCarousel.value as any).offsetWidth,
          behavior: 'smooth'
        })
      }
    }, 5000)
  }
})

onUnmounted(() => clearInterval(interval))
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">
              {{ project?.name || 'Detail Buku Kas' }}
            </ion-title>
            <span v-if="project" class="pill-badge" :class="getStatusColor(project.status)">{{ project.status }}</span>

          </div>
          <div class="d-flex justify-content-between align-items-center">
            <p class="app-hero-subtitle" style="margin: 0;">{{ project?.description || 'Tidak ada deskripsi.' }}</p>
              <button class="btn btn-action primary btn-md" @click="openCreateDialog">
                <ion-icon :icon="addOutline" class="me-1" /> Tambah
              </button>
          </div>
        </div>
      </ion-toolbar>

      <!-- Tabs Segment -->
      <div class="px-3 pb-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="dashboard">
            <ion-label>Dashboard</ion-label>
          </ion-segment-button>
          <ion-segment-button value="transaksi">
            <ion-label>Transaksi</ion-label>
          </ion-segment-button>
          <ion-segment-button value="tools">
            <ion-label>Aksi</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <input ref="fileInput" type="file" @change="onFileChange" accept=".xlsx" style="display: none;" />
      
      <div v-if="loading" class="loading-state text-center py-5">
        <ion-spinner />
        <p>Memuat detail...</p>
      </div>

      <div v-else-if="project">
        
        <!-- ==================== TAB 1: DASHBOARD ==================== -->
        <div v-show="activeTab === 'dashboard'" class="ion-padding">
          
          <!-- Summary Grid -->
          <ion-grid class="mx-2">
            <ion-row>
              <ion-col size="6" size-sm="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="py-3">
                    <small class="text-muted d-block text-xs">Modal</small>
                    <div class="fs-6 fw-black text-success mt-1">{{ formatCurrency((project as any).modal_total || 0) }}</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-sm="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="py-3">
                    <small class="text-muted d-block text-xs">Pengeluaran</small>
                    <div class="fs-6 fw-black text-danger mt-1">{{ formatCurrency(project.total_expenses) }}</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-sm="6" size-md="3" v-if="(project as any).panen_total > 0">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="py-3">
                    <small class="text-muted d-block text-xs">Pendapatan</small>
                    <div class="fs-6 fw-black text-success mt-1">{{ formatCurrency((project as any).panen_total || 0) }}</div>
                    <div class="d-flex justify-content-between align-items-center border-top mt-2 pt-2">
                      <div class="d-flex flex-column align-items-start">
                        <small class="text-muted text-xs">Margin</small>
                        <span class="fw-bold mt-1 text-xs" :class="profitPercent >= 0 ? 'text-success' : 'text-danger'">{{ profitPercent }}%</span>
                      </div>
                      <div class="d-flex flex-column align-items-end">
                        <small class="text-muted text-xs">ROI</small>
                        <span class="fw-bold mt-1 text-xs" :class="roi >= 0 ? 'text-success' : 'text-danger'">{{ roi }}%</span>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-sm="6" size-md="3">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="py-3">
                    <div v-if="(project as any).panen_total > 0" class="mb-2">
                      <small class="text-muted d-block text-xs">Keuntungan</small>
                      <div class="fs-6 fw-black mt-1" :style="{ color: getFinancialColor(netProfit) }">{{ formatCurrency(netProfit) }}</div>
                      <div class="border-bottom my-2"></div>
                    </div>
                    <small class="text-muted d-block text-xs">Sisa Saldo</small>
                    <div class="fs-6 fw-black text-primary mt-1">{{ formatCurrency(project.balance) }}</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-sm="6" size-md="3" v-if="(project as any).panen_total <= 0">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="py-3">
                    <small class="text-muted d-block text-xs">Total Transaksi</small>
                    <div class="fs-6 fw-black text-primary mt-1">{{ (project.transactions || []).length }}</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Charts -->
          <ion-grid class="mx-2">
            <ion-row>
              <ion-col size="12" size-sm="6" size-lg="6" v-if="chartBarReady">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="container-padded" style="min-height: 280px;">
                    <h6 class="fw-bold text-dark mb-2">Arus Kas Bulanan</h6>
                    <v-chart
                      v-if="isChartMounted"
                      :key="`bar-${chartKey}`"
                      :option="barChartOption"
                      autoresize
                      style="height: 240px; width: 100%;"
                    />
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col size="12" size-sm="6" size-lg="6" v-if="chartDonutReady">
                <ion-card class="mobile-card m-0 h-100">
                  <ion-card-content class="container-padded" style="min-height: 280px;">
                    <h6 class="fw-bold text-dark mb-2">Pengeluaran per Kategori</h6>
                    <v-chart
                      v-if="isChartMounted"
                      :key="`donut-${chartKey}`"
                      :option="donutChartOption"
                      autoresize
                      style="height: 240px; width: 100%;"
                    />
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

        </div>

        <!-- ==================== TAB 2: TRANSAKSI ==================== -->
        <div v-show="activeTab === 'transaksi'" class="ion-padding px-1">
          
          <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between">
            <!-- Search input -->
            <div class="w-100 px-3 py-1 search-container">
              <div class="search-input-wrap position-relative">
                <input 
                  type="text" 
                  v-model="txSearchQuery" 
                  class="form-control form-control-sm app-control" 
                  style="padding-left: 30px;" 
                  placeholder="Cari transaksi..." 
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
                v-for="opt in filterOptions" 
                :key="opt.value"
                class="btn btn-action primary chip-btn btn-md " 
                :class="filterType === opt.value ? 'pill-badge primary' : 'pill-badge secondary'" 
                @click="filterType = opt.value" 
                size="small"
                style="margin: 0;"
              >
                {{ opt.label }} 
                <ion-badge slot="end" class="ms-2 small-badge">{{ filterCount(opt.value) }}</ion-badge>
              </button>
            </div>
          </div>

          <!-- Transactions list -->
          <div class="px-3 py-2">
            <div v-if="filteredTransactions.length === 0" class="text-center text-muted py-5">
              <p>Tidak ada transaksi ditemukan</p>
            </div>

            <div class="transaction-scroll pb-2">
            <div class="transaction-list d-flex flex-column gap-1">
              <template v-for="tx in filteredTransactions" :key="tx.id">
                <ion-card class="transaction-card">
                <div class="transaction-inner d-flex align-items-center" :class="tx.type === 'DEPOSIT' ? 'deposit-bg' : 'expense-bg'">
                  <div class="transaction-meta ms-2">
                    <span class="fw-bold" :class="{ 'text-success': tx.type === 'DEPOSIT', 'text-danger': tx.type === 'EXPENSE' }">
                      {{ tx.type === 'DEPOSIT' ? '▲ In' : '▼ Out' }}
                    </span>
                    <small class="text-muted d-block">{{ formatDate(tx.date) }}</small>
                  </div>
                  <div class="transaction-main text-truncate px-1">
                    <div class="d-flex align-items-center gap-1 text-truncate">
                      <span class="fw-bold text-truncate">{{ tx.category }}</span>
                      <button
                        v-if="tx.hasAttachment"
                        type="button"
                        class="badge bg-success border-0 text-white d-inline-flex align-items-center gap-1 cursor-pointer py-1 px-2 flex-shrink-0"
                        style="font-size: 9px; cursor: pointer;"
                        @click.stop="viewReceipt(tx)"
                        title="Lihat Foto Nota"
                      >
                        <ion-icon :icon="documentAttachOutline" /> Nota
                      </button>
                    </div>
                    <div class="text-muted text-truncate">{{ tx.description || '-' }}</div>
                  </div>
                  <div class="transaction-amount text-end fw-bold me-2" :class="{ 'text-success': tx.type === 'DEPOSIT', 'text-danger': tx.type === 'EXPENSE' }">
                    {{ tx.type === 'DEPOSIT' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                  </div>
                  <div class="transaction-actions flex-shrink-0 d-flex justify-content-end gap-2">
                    <button class="btn btn-light btn-md text-primary" @click="openEditDialog(tx)" title="Edit">
                      <ion-icon :icon="pencilOutline" />
                    </button>
                    <button class="btn btn-light btn-md text-danger" @click="dialogDeleteTxId = tx.id" title="Hapus">
                      <ion-icon :icon="trashOutline" />
                    </button>
                  </div>
                </div>
              </ion-card>
              </template>
            </div>
          </div>
          


          </div>

        </div>

        <!-- ==================== TAB 3: TOOLS / AKSI ==================== -->
        <div v-if="activeTab === 'tools'" class="ion-padding">
          <div class="mobile-card p-4 text-center mb-3 mx-3">
            <h6 class="fw-bold mb-2">Import / Export Excel</h6>
            <p class="text-muted small mb-4">Unggah data transaksi menggunakan file Excel atau unduh semua riwayat transaksi buku kas ini ke file Excel.</p>
            
            <div class="row g-2">
              <div class="col-12 col-md-4">
                <ion-button class="btn-action warning w-100" expand="block" style="margin: 0;" @click="handleImport">
                  <ion-icon :icon="cloudUploadOutline" slot="start" /> Import
                </ion-button>
              </div>
              <div class="col-12 col-md-4">
                <ion-button class="btn-action info w-100" expand="block" style="margin: 0;" @click="downloadTemplate">
                  <ion-icon :icon="listOutline" slot="start" /> Template
                </ion-button>
              </div>
              <div class="col-12 col-md-4">
                <ion-button class="btn-action success w-100" expand="block" style="margin: 0;" @click="exportToExcel">
                  <ion-icon :icon="cloudDownloadOutline" slot="start" /> Export
                </ion-button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="d-flex justify-content-center align-items-center h-100">
        Buku kas tidak ditemukan.
      </div>

      <ion-alert
        :is-open="dialogDeleteTxId !== null"
        header="Konfirmasi Hapus"
        message="Apakah anda yakin ingin menghapus transaksi ini?"
        :buttons="[
          { text: 'Batal', role: 'cancel', handler: () => dialogDeleteTxId = null },
          { text: 'Hapus', role: 'destructive', handler: () => dialogDeleteTxId !== null && deleteTransaction(dialogDeleteTxId) }
        ]"
        @didDismiss="dialogDeleteTxId = null"
      />
    </ion-content>

    <!-- Dialogs -->
    <ion-modal :is-open="dialogTransaction" @didDismiss="closeDialog">
        <ion-header>
            <ion-toolbar>
                <ion-title>{{ editingTxId ? 'Edit Transaksi' : 'Tambah Transaksi' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="closeDialog"><ion-icon :icon="closeOutline" /></ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding modal-content">
            <div class="form-container">
                <div class="form-section">
                    <label class="form-label">Tipe</label>
                    <select v-model="formTx.type" class="form-control app-control">
                        <option value="DEPOSIT">Modal/Pendapatan</option>
                        <option value="EXPENSE">Pengeluaran</option>
                    </select>
                </div>
                <div class="form-section">
                    <label class="form-label">Kategori</label>
                    <select v-model="formTx.category" class="form-control app-control">
                        <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                </div>
                <div class="form-section">
                    <label class="form-label">Tanggal</label>
                    <input type="date" v-model="formTx.date" class="form-control app-control"/>
                </div>
                <div class="form-section">
                    <label class="form-label">Nominal</label>
                    <NumberInput v-model="formTx.amount" />
                </div>
                <div class="form-section">
                    <label class="form-label">Deskripsi</label>
                    <input type="text" v-model="formTx.description" class="form-control app-control form-control-textarea" />
                </div>

                <!-- LAMPIRAN NOTA / BUKTI BAYAR -->
                <div class="form-section mt-2">
                  <label class="form-label d-flex justify-content-between align-items-center mb-1">
                    <span>Lampiran Nota / Bukti (Opsional)</span>
                    <span v-if="attachmentBlob" class="badge bg-success text-white" style="font-size: 11px;">
                      {{ attachmentFormat }} • {{ formatFileSize(attachmentSize) }}
                    </span>
                  </label>

                  <!-- Upload buttons if no attachment -->
                  <div v-if="!attachmentPreviewUrl && !compressing" class="attachment-actions-box">
                    <div class="d-flex gap-2">
                      <button
                        type="button"
                        class="btn btn-outline-primary flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                        @click="handleCameraCapture"
                      >
                        <ion-icon :icon="cameraOutline" style="font-size: 1.2rem;" />
                        <span class="fw-semibold" style="font-size: 13px;">Kamera</span>
                      </button>

                      <button
                        type="button"
                        class="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                        @click="handleGalleryPick"
                      >
                        <ion-icon :icon="imageOutline" style="font-size: 1.2rem;" />
                        <span class="fw-semibold" style="font-size: 13px;">Galeri</span>
                      </button>
                    </div>

                    <!-- Hidden file input for web/desktop fallback -->
                    <input
                      type="file"
                      ref="attachmentFileInputRef"
                      accept="image/*"
                      class="d-none"
                      @change="onFileInputChange"
                    />

                    <small class="text-muted d-block mt-2" style="font-size: 11px;">
                      ⚡ Otomatis di-resize &amp; kompres ke format <strong>WebP</strong> (ringan di DB dan tetap jernih).
                    </small>
                  </div>

                  <!-- Compressing Loading State -->
                  <div v-else-if="compressing" class="text-center p-3 border rounded bg-light">
                    <ion-spinner name="crescent" color="primary" />
                    <p class="text-xs text-muted mb-0 mt-2">Mengompres &amp; mengoptimalkan nota ke WebP...</p>
                  </div>

                  <!-- Preview Card if attachment exists -->
                  <div v-else class="attachment-preview-card border rounded p-2 bg-light">
                    <div class="d-flex align-items-center gap-3">
                      <img
                        :src="attachmentPreviewUrl"
                        alt="Preview Nota"
                        class="rounded border shadow-sm cursor-pointer"
                        style="width: 64px; height: 64px; object-fit: cover; background: #fff;"
                        @click="showZoomModal = true"
                      />
                      <div class="flex-grow-1" style="min-width: 0;">
                        <div class="fw-bold text-dark text-truncate" style="font-size: 12px;">
                          {{ attachmentFileName || 'Nota_Transaksi.webp' }}
                        </div>
                        <div class="text-muted" style="font-size: 11px;">
                          Ukuran: <strong class="text-success">{{ formatFileSize(attachmentSize) }}</strong>
                          <span v-if="attachmentDimensions"> • {{ attachmentDimensions }}</span>
                        </div>
                        <div class="mt-1 d-flex gap-2">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-0 px-2"
                            style="font-size: 11px;"
                            @click="showZoomModal = true"
                          >
                            <ion-icon :icon="eyeOutline" /> Lihat
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-0 px-2"
                            style="font-size: 11px;"
                            @click="removeAttachment"
                          >
                            <ion-icon :icon="trashOutline" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </ion-content>
        <ion-footer>
          <div class="form-actions p-3">
            <button type="button" class="btn btn-action light w-100" @click="closeDialog">Cancel</button>
            <button type="button" class="btn btn-action primary w-100 mt-2" @click="saveTransaction">Save Changes</button>
          </div>
        </ion-footer>
    </ion-modal>

    <!-- Quick Receipt Preview Modal for transactions list -->
    <ion-modal :is-open="showReceiptModal" @didDismiss="closeReceiptModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Lampiran Nota Transaksi</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeReceiptModal">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding text-center">
        <div v-if="selectedReceipt" class="d-flex flex-column align-items-center justify-content-center h-100">
          <div class="mb-3 text-start w-100 p-2 bg-light rounded border">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold text-dark fs-6">{{ selectedReceipt.txCategory }}</span>
              <span :class="selectedReceipt.txType === 'DEPOSIT' ? 'text-success fw-bold' : 'text-danger fw-bold'">
                {{ selectedReceipt.txType === 'DEPOSIT' ? '+' : '-' }}{{ formatCurrency(selectedReceipt.txAmount) }}
              </span>
            </div>
            <div v-if="selectedReceipt.txDescription" class="text-muted text-xs mt-1">
              {{ selectedReceipt.txDescription }}
            </div>
          </div>
          <img
            :src="selectedReceipt.url"
            alt="Foto Nota"
            style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
          />
          <div class="mt-2 text-muted" style="font-size: 11px;">
            {{ selectedReceipt.fileName || 'Nota' }} • {{ formatFileSize(selectedReceipt.size) }}
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Zoom Modal for Form Dialog -->
    <ion-modal :is-open="showZoomModal" @didDismiss="showZoomModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Lampiran Nota</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showZoomModal = false">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding text-center">
        <div class="d-flex flex-column align-items-center justify-content-center h-100">
          <img
            :src="attachmentPreviewUrl || ''"
            alt="Nota Lengkap"
            style="max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
          />
          <div class="mt-3 text-muted text-xs">
            {{ attachmentFileName }} • {{ attachmentFormat }} • {{ formatFileSize(attachmentSize) }}
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <AppToast 
        :is-open="snackbar.show" 
        :message="snackbar.text" 
        :color="snackbar.color as any" 
        @dismiss="snackbar.show = false" 
    />
  </ion-page>
</template>