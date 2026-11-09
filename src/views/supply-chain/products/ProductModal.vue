<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? 'Edit Produk' : 'Tambah Produk' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('close')"><ion-icon :icon="closeOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap bg-light">
      <div class="mobile-card p-4">
        <div class="form-stack">
          <div class="field-group mb-3">
            <label class="field-label">Nama Produk</label>
            <input type="text" v-model="product.name" class="form-control app-control" placeholder="Contoh: Es Teh Manis" />
          </div>

          <div class="field-group mb-3">
            <label class="field-label">Kategori</label>
            <select v-model="product.categoryId" class="form-select app-control">
              <option :value="null" disabled>Pilih Kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="row mb-3">
            <div class="col-6">
              <div class="field-group">
                <label class="field-label fw-bold text-dark">Harga Jual (IDR)</label>
                <NumberInput v-model="product.price" placeholder="0" />
              </div>
            </div>
            <div class="col-6">
              <div class="field-group">
                <label class="field-label fw-bold text-dark">Harga Modal / HPP</label>
                <NumberInput v-model="product.costPrice" placeholder="0" />
              </div>
            </div>
          </div>

          <!-- Profit Margin Preview Badge -->
          <div v-if="product.price > 0" class="p-2 mb-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
            <div class="text-xs">
              <span class="text-muted d-block">Estimasi Laba Kotor:</span>
              <strong class="text-success fs-6">
                {{ formatPrice((product.price || 0) - (product.costPrice || 0)) }}
              </strong>
            </div>
            <span class="badge" :class="calcMarginPercent(product) >= 20 ? 'bg-success' : (calcMarginPercent(product) > 0 ? 'bg-warning text-dark' : 'bg-danger')">
              {{ calcMarginPercent(product) }}% Margin
            </span>
          </div>

          <div class="row mb-3">
            <div class="col-6">
              <div class="field-group">
                <label class="field-label">Stok</label>
                <NumberInput v-model="product.stock" placeholder="0" />
              </div>
            </div>
            <div class="col-6">
              <div class="field-group">
                <label class="field-label">Kode SKU / Barcode</label>
                <input type="text" v-model="product.sku" class="form-control app-control" placeholder="PRD-001" />
              </div>
            </div>
          </div>

          <div class="field-group mb-3">
            <label class="field-label d-flex justify-content-between">
              <span>Tanggal Kedaluwarsa (Expired Date)</span>
              <small class="text-muted">M-04 (Opsional)</small>
            </label>
            <input type="date" v-model="product.expiryDate" class="form-control app-control" />
          </div>

          <div class="field-group mb-3">
            <label class="field-label">Deskripsi</label>
            <textarea v-model="product.description" class="form-control app-control form-control-textarea" rows="3" placeholder="Tulis deskripsi produk di sini..."></textarea>
          </div>

          <div class="field-group mb-4">
            <label class="field-label">Foto Produk</label>
            <div class="img-upload-preview mb-3">
              <img v-if="previewUrl" :src="previewUrl" class="img-preview" />
              <div v-else class="img-placeholder">
                <ion-icon :icon="imageOutline" style="font-size: 2.8rem;" />
                <span>Belum ada foto</span>
              </div>
              <div v-if="isProcessing" class="img-processing-overlay">
                <ion-spinner name="crescent" />
              </div>
            </div>
            <div class="img-source-buttons">
              <button type="button" class="btn-img-source" @click="openCamera" :disabled="isProcessing"><ion-icon :icon="cameraOutline" /><span>Kamera</span></button>
              <button type="button" class="btn-img-source" @click="openGallery" :disabled="isProcessing"><ion-icon :icon="imagesOutline" /><span>Galeri</span></button>
            </div>
            <small class="text-muted d-block mt-2">Gambar akan di-crop otomatis menjadi 500×500 px dan disimpan sebagai WebP.</small>
          </div>

          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="product.isFeatured" id="featuredCheck">
            <label class="form-check-label text-dark fw-semibold" for="featuredCheck">
              Produk Unggulan (Tampilkan di halaman depan)
            </label>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <div class="p-3">
        <button class="btn btn-action primary w-100 py-3 fw-bold fs-6" @click="save" :disabled="isProcessing">
          Simpan Perubahan
        </button>
      </div>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter, IonSpinner } from '@ionic/vue';
import { 
    closeOutline, cameraOutline, imagesOutline, folderOpenOutline, 
    imageOutline, checkmarkCircleOutline, sparklesOutline 
} from 'ionicons/icons';
import { ref, onMounted, watch } from 'vue';
import { 
    captureFromCamera, pickFromGallery, cropAndConvertToWebP, readProductImage, saveProductImageFromBase64 
} from '../../../composables/useProductImage';

const props = defineProps<{ isOpen: boolean, isEdit: boolean, product: any, categories: any[] }>();
const emit = defineEmits(['close', 'save']);

const fileInput = ref(null); // ponytail: Hapus saat refactoring template tuntas
const previewUrl = ref(null);
const isProcessing = ref(false);

const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0);

const calcMarginPercent = (p: any) => {
  if (!p || !p.price || p.price <= 0) return 0;
  const margin = ((p.price - (p.costPrice || 0)) / p.price) * 100;
  return Math.round(margin);
};

const applyBase64 = (base64: string) => {
    props.product.pendingBase64 = base64;
    previewUrl.value = `data:image/webp;base64,${base64}`;
};

const openCamera = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    const base64 = await captureFromCamera();
    if (base64) {
      applyBase64(base64);
    }
  } catch (error: any) {
    const msg = error?.message ?? '';
    if (
      !msg.includes('cancelled') &&
      !msg.includes('User cancelled') &&
      !msg.includes('No image picked')
    ) {
      console.error('Camera error:', error);
      alert('Gagal membuka kamera: ' + msg);
    }
  } finally {
    isProcessing.value = false;
  }
};

const openGallery = async () => {
    isProcessing.value = true;
    try {
        const base64 = await pickFromGallery();
        if (base64) {
          applyBase64(base64);
        }
    } catch (err: any) {
        console.error('Gagal membuka galeri:', err);
        alert(err?.message || 'Gagal membuka galeri. Pastikan izin penyimpanan telah diberikan.');
    } finally { isProcessing.value = false; }
};

const handleFileInput = async (e: any) => {
    const f = e.target.files[0];
    if (!f) return;
    isProcessing.value = true;
    try {
        const base64 = await cropAndConvertToWebP(f);
        const fileName = await saveProductImageFromBase64(base64, Date.now());
        props.product.image = fileName;
        applyBase64(base64);
    } catch (err) { console.error(err); } finally { isProcessing.value = false; }
};

const save = () => {
    if (props.product) {
        props.product.featured = props.product.isFeatured ? 1 : 0;
    }
    emit('save', props.product);
};

onMounted(async () => {
  if (props.product) {
    if (props.product.featured === 1 && props.product.isFeatured === undefined) {
      props.product.isFeatured = true;
    }
    if (props.product.image) {
      if (typeof props.product.image === 'string' && props.product.image.startsWith('data:')) {
        previewUrl.value = props.product.image;
      } else if (typeof props.product.image === 'string') {
        previewUrl.value = await readProductImage(props.product.image);
      } else {
        previewUrl.value = URL.createObjectURL(props.product.image);
      }
    }
  }
});

watch(() => props.isOpen, async (val) => {
    if (val && props.product) {
        if (props.product.featured === 1 && props.product.isFeatured === undefined) {
            props.product.isFeatured = true;
        }
        if (props.product.image) {
            previewUrl.value = await readProductImage(props.product.image);
        } else {
            previewUrl.value = null;
        }
    } else {
        previewUrl.value = null;
    }
});
</script>


<style scoped>
.img-upload-preview { position: relative; width: 160px; height: 160px; border-radius: 14px; border: 2px dashed #b39ddb; background: #f5f3ff; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.img-preview { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #b39ddb; font-size: 0.75rem; }
.img-processing-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.82); display: flex; align-items: center; justify-content: center; }
.img-source-buttons { display: flex; gap: 10px; }
.btn-img-source { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 10px 6px; border: 1.5px solid #d1c4e9; border-radius: 12px; background: #fff; color: #5e35b1; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: background 0.18s, border-color 0.18s, transform 0.12s; }
.btn-img-source ion-icon { font-size: 1.4rem; }
</style>
