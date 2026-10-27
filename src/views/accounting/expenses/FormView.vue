<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div>
            <ion-title class="app-hero-title">{{ isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}</ion-title>
            <p class="app-hero-subtitle">Catat pengeluaran Anda dan potong saldo akun bank secara otomatis.</p>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap">
      <div v-if="!loaded" class="loading-state text-center py-5">
        <ion-spinner />
        <p>Memuat data...</p>
      </div>

      <ion-card v-else class="mobile-card mx-3">
        <ion-card-content>
          <div class="form-stack">
            <div class="field-group">
              <label class="field-label">Deskripsi / Keperluan</label>
              <input type="text" v-model="form.description" class="form-control app-control" placeholder="Contoh: Beli Bahan Baku, Bayar Listrik Toko" />
            </div>
            
            <div class="field-group">
              <label class="field-label">Jumlah (Rp)</label>
              <NumberInput v-model="form.amount" placeholder="0" />
            </div>

            <div class="field-group">
              <label class="field-label">Tanggal</label>
              <input type="date" v-model="form.date" class="form-control app-control" />
            </div>

            <div class="field-group">
              <label class="field-label">Kategori Biaya (M-05)</label>
              <select v-model="selectedCategoryChoice" class="form-control app-control" @change="onCategoryChange">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                <option value="__custom__">+ Kategori Kustom Baru...</option>
              </select>
            </div>

            <div v-if="selectedCategoryChoice === '__custom__'" class="field-group">
              <label class="field-label text-primary">Tulis Nama Kategori Kustom</label>
              <input type="text" v-model="customCategoryText" class="form-control app-control" placeholder="Contoh: Pemeliharaan Mesin, Iklan IG" />
            </div>

            <div class="field-group">
              <label class="field-label">Sumber Dana / Rekening</label>
              <select v-model="form.accountId" class="form-control app-control">
                <option :value="null">-- Tanpa Potong Saldo (Hanya Catat) --</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
              <small class="text-muted" v-if="form.accountId">Memilih akun bank akan otomatis memotong saldo tabungan terkait.</small>
            </div>

            <!-- LAMPIRAN NOTA / BUKTI BAYAR -->
            <div class="field-group mt-2">
              <label class="field-label d-flex justify-content-between align-items-center mb-1">
                <span>Lampiran Nota / Struk (Opsional)</span>
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
                    <ion-icon :icon="cameraOutline" style="font-size: 1.25rem;" />
                    <span class="fw-semibold">Jepret Kamera</span>
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                    @click="handleGalleryPick"
                  >
                    <ion-icon :icon="imageOutline" style="font-size: 1.25rem;" />
                    <span class="fw-semibold">Pilih Galeri</span>
                  </button>
                </div>

                <!-- Fallback file input for web/desktop -->
                <input
                  type="file"
                  ref="fileInputRef"
                  accept="image/*"
                  class="d-none"
                  @change="onFileInputChange"
                />

                <small class="text-muted d-block mt-2" style="font-size: 11px;">
                  ⚡ Otomatis di-resize &amp; kompres ke format <strong>WebP</strong> (ringan di DB, hemat memori, dan tetap jernih).
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
                    style="width: 70px; height: 70px; object-fit: cover; background: #fff;"
                    @click="showZoomModal = true"
                  />
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="fw-bold text-dark text-truncate" style="font-size: 13px;">
                      {{ attachmentFileName || 'Nota_Pengeluaran.webp' }}
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
                        <ion-icon :icon="eyeOutline" /> Lihat Penuh
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

          <div class="mobile-card-footer mt-4">
            <ion-button class="btn-action light" router-link="/expenses">Batal</ion-button>
            <ion-button class="btn-action primary" @click="onSubmit" :disabled="!form.description || form.amount <= 0 || compressing">
              {{ isEdit ? 'Simpan Perubahan' : 'Simpan' }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Zoom Modal -->
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
              :src="attachmentPreviewUrl"
              alt="Nota Lengkap"
              style="max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
            />
            <div class="mt-3 text-muted text-xs">
              {{ attachmentFileName }} • {{ attachmentFormat }} • {{ formatFileSize(attachmentSize) }}
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { computed, ref, onBeforeUnmount } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { expensesRepo, savingAccountsRepo, savingTransactionsRepo, expenseAttachmentsRepo } from '../../../db/repositories'
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonIcon,
  IonModal,
  IonButtons
} from '@ionic/vue'
import {
  cameraOutline,
  imageOutline,
  trashOutline,
  eyeOutline,
  closeOutline
} from 'ionicons/icons'
import {
  compressReceiptImage,
  capturePhotoFromCamera,
  pickPhotoFromGallery
} from '../../../utils/attachmentHelper'

export default {
  name: 'AccountingExpensesFormView',
  components: {
    IonPage,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonIcon,
    IonModal,
    IonButtons
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loaded = ref(false)
    const accounts = ref([])
    const fileInputRef = ref(null)

    // Attachment state
    const attachmentBlob = ref(null)
    const attachmentMime = ref('image/webp')
    const attachmentFileName = ref('')
    const attachmentSize = ref(0)
    const attachmentDimensions = ref('')
    const attachmentFormat = ref('WEBP')
    const attachmentPreviewUrl = ref(null)
    const attachmentChanged = ref(false)
    const compressing = ref(false)
    const showZoomModal = ref(false)
    
    const categories = [
      'Makanan & Minuman',
      'Transportasi & Bensin',
      'Perawatan & Servis Kendaraan',
      'Kebutuhan Rumah Tangga',
      'Amal & Sosial',
      'Hiburan & Liburan',
      'Tagihan & Utilitas',
      'Sewa Tempat / Kios',
      'Listrik, Air & Internet',
      'Perlengkapan Toko',
      'Bahan Baku / Modal Kulakan',
      'Pemasaran & Promosi',
      'Pajak & Retribusi Usaha',
      'Lain-lain'
    ]

    const selectedCategoryChoice = ref('Makanan & Minuman')
    const customCategoryText = ref('')

    const form = ref({
      description: '',
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      category: 'Makanan & Minuman',
      accountId: null,
      savingTxId: null
    })

    const onCategoryChange = () => {
      if (selectedCategoryChoice.value !== '__custom__') {
        form.value.category = selectedCategoryChoice.value
      }
    }

    const isEdit = computed(() => Boolean(route.params.id))

    const clearAttachmentPreview = () => {
      if (attachmentPreviewUrl.value) {
        URL.revokeObjectURL(attachmentPreviewUrl.value)
        attachmentPreviewUrl.value = null
      }
    }

    const setAttachmentData = (compressedResult, fileName = '') => {
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

    const handleCameraCapture = async () => {
      try {
        compressing.value = true
        const result = await capturePhotoFromCamera()
        if (result) {
          setAttachmentData(result, `nota_kamera_${Date.now()}.webp`)
        }
      } catch (err) {
        console.warn('Camera capture error, fallback to file input:', err)
        // If native camera fails or denied, trigger standard input
        fileInputRef.value?.click()
      } finally {
        compressing.value = false
      }
    }

    const handleGalleryPick = async () => {
      try {
        compressing.value = true
        const result = await pickPhotoFromGallery()
        if (result) {
          setAttachmentData(result, `nota_galeri_${Date.now()}.webp`)
        }
      } catch (err) {
        console.warn('Gallery pick error, fallback to file input:', err)
        fileInputRef.value?.click()
      } finally {
        compressing.value = false
      }
    }

    const onFileInputChange = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        compressing.value = true
        const result = await compressReceiptImage(file, 1200, 0.75)
        const ext = result.mimeType === 'image/jpeg' ? 'jpg' : 'webp'
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'nota'
        setAttachmentData(result, `${baseName}.${ext}`)
      } catch (err) {
        console.error('File compression error:', err)
        alert('Gagal mengompres gambar: ' + err.message)
      } finally {
        compressing.value = false
        event.target.value = ''
      }
    }

    const removeAttachment = () => {
      clearAttachmentPreview()
      attachmentBlob.value = null
      attachmentSize.value = 0
      attachmentDimensions.value = ''
      attachmentFileName.value = ''
      attachmentChanged.value = true
    }

    const formatFileSize = (bytes) => {
      if (!bytes || bytes <= 0) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      const kb = bytes / 1024
      if (kb < 1024) return kb.toFixed(1) + ' KB'
      return (kb / 1024).toFixed(2) + ' MB'
    }

    const resetForm = () => {
      selectedCategoryChoice.value = 'Makanan & Minuman'
      customCategoryText.value = ''
      form.value = {
        description: '',
        amount: null,
        date: new Date().toISOString().slice(0, 10),
        category: 'Makanan & Minuman',
        accountId: null,
        savingTxId: null
      }
      removeAttachment()
      attachmentChanged.value = false
    }

    const load = async () => {
      loaded.value = false
      try {
        accounts.value = await savingAccountsRepo.getAll()
        
        if (!isEdit.value) {
          resetForm()
          loaded.value = true
          return
        }

        const data = await expensesRepo.getById(Number(route.params.id))
        if (!data) return router.push('/expenses')

        const cat = data.category || 'Lain-lain'
        if (categories.includes(cat)) {
          selectedCategoryChoice.value = cat
          customCategoryText.value = ''
        } else {
          selectedCategoryChoice.value = '__custom__'
          customCategoryText.value = cat
        }

        form.value = {
          description: data.description || '',
          amount: data.amount || 0,
          date: (data.date || new Date().toISOString()).slice(0, 10),
          category: cat,
          accountId: data.accountId || null,
          savingTxId: data.savingTxId || null
        }

        // Load existing attachment from DB if present
        clearAttachmentPreview()
        attachmentBlob.value = null
        attachmentChanged.value = false

        const existingAtt = await expenseAttachmentsRepo.getByExpenseId(Number(route.params.id))
        if (existingAtt && existingAtt.blob instanceof Blob) {
          attachmentBlob.value = existingAtt.blob
          attachmentMime.value = existingAtt.mimeType || existingAtt.blob.type || 'image/webp'
          attachmentFileName.value = existingAtt.fileName || 'nota.webp'
          attachmentSize.value = existingAtt.blob.size
          attachmentFormat.value = (attachmentMime.value.split('/')[1] || 'webp').toUpperCase()
          attachmentPreviewUrl.value = URL.createObjectURL(existingAtt.blob)
        }
      } catch (err) {
        console.error('Failed to load expense form data:', err)
      } finally {
        loaded.value = true
      }
    }

    const onSubmit = async () => {
      const finalCat = selectedCategoryChoice.value === '__custom__'
        ? (customCategoryText.value.trim() || 'Lain-lain')
        : selectedCategoryChoice.value

      const payload = {
        ...form.value,
        category: finalCat,
        amount: Number(form.value.amount),
        accountId: form.value.accountId ? Number(form.value.accountId) : null,
        hasAttachment: Boolean(attachmentBlob.value)
      }

      try {
        let expenseId = null

        if (isEdit.value) {
          expenseId = Number(route.params.id)

          // If previously had a linked saving transaction
          if (payload.savingTxId) {
            if (payload.accountId) {
              await savingTransactionsRepo.update(payload.savingTxId, {
                accountId: payload.accountId,
                amount: payload.amount,
                date: payload.date,
                description: `Pengeluaran: ${payload.description}`
              })
            } else {
              await savingTransactionsRepo.delete(payload.savingTxId)
              payload.savingTxId = null
            }
          } else if (payload.accountId) {
            const tx = await savingTransactionsRepo.add({
              accountId: payload.accountId,
              type: 'WITHDRAWAL',
              amount: payload.amount,
              date: payload.date,
              category: 'Pengeluaran',
              description: `Pengeluaran: ${payload.description}`
            })
            payload.savingTxId = tx.id
          }

          await expensesRepo.update(expenseId, payload)

          // Handle attachment changes
          if (attachmentChanged.value) {
            await expenseAttachmentsRepo.deleteByExpenseId(expenseId)
            if (attachmentBlob.value) {
              await expenseAttachmentsRepo.add({
                expenseId,
                blob: attachmentBlob.value,
                mimeType: attachmentMime.value || 'image/webp',
                fileName: attachmentFileName.value || `nota_${expenseId}.webp`
              })
            }
          }
        } else {
          // Create new expense
          if (payload.accountId) {
            const tx = await savingTransactionsRepo.add({
              accountId: payload.accountId,
              type: 'WITHDRAWAL',
              amount: payload.amount,
              date: payload.date,
              category: 'Pengeluaran',
              description: `Pengeluaran: ${payload.description}`
            })
            payload.savingTxId = tx.id
          }

          const created = await expensesRepo.add(payload)
          expenseId = created.id

          if (attachmentBlob.value && expenseId) {
            await expenseAttachmentsRepo.add({
              expenseId,
              blob: attachmentBlob.value,
              mimeType: attachmentMime.value || 'image/webp',
              fileName: attachmentFileName.value || `nota_${expenseId}.webp`
            })
          }
        }

        await router.push('/expenses')
      } catch (err) {
        console.error('Failed to save expense:', err)
        alert('Gagal menyimpan pengeluaran: ' + err.message)
      }
    }

    onIonViewWillEnter(load)

    onBeforeUnmount(() => {
      clearAttachmentPreview()
    })

    return {
      form,
      onSubmit,
      loaded,
      isEdit,
      categories,
      accounts,
      selectedCategoryChoice,
      customCategoryText,
      onCategoryChange,
      // Attachment returns
      attachmentBlob,
      attachmentFileName,
      attachmentSize,
      attachmentDimensions,
      attachmentFormat,
      attachmentPreviewUrl,
      compressing,
      showZoomModal,
      fileInputRef,
      handleCameraCapture,
      handleGalleryPick,
      onFileInputChange,
      removeAttachment,
      formatFileSize,
      // Icons
      cameraOutline,
      imageOutline,
      trashOutline,
      eyeOutline,
      closeOutline
    }
  }
}
</script>

<style scoped>
.attachment-actions-box button {
  border-radius: 8px;
  font-size: 13px;
}
.attachment-preview-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
