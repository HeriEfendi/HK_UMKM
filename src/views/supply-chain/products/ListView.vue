<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title style="padding: 0; font-size: 1.25rem;">Manajemen Produk</ion-title>
            <ion-buttons style="margin: 0;">
              <ion-button class="btn-action primary" @click="openCreate">
                <ion-icon slot="start" :icon="addOutline" /> Tambah
              </ion-button>
            </ion-buttons>
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #6c757d;">Kelola daftar produk, stok, dan kategori untuk operasional bisnis Anda.</p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap bg-light">
      <!-- Search Bar -->
      <div class="px-3 pt-3">
        <div class="search-bar-wrap mb-3">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control app-control" 
            placeholder="Cari nama produk..." 
          />
        </div>

        <!-- Category Filter Chips -->
        <div class="filter-chips--mobile mb-2">
          <button 
            type="button" 
            class="btn btn-action btn-sm me-1"
            :class="selectedCategory === 'all' ? 'primary' : 'light'"
            @click="selectedCategory = 'all'"
          >
            Semua Kategori
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            type="button" 
            class="btn btn-action btn-sm me-1"
            :class="selectedCategory === cat.id ? 'primary' : 'light'"
            @click="selectedCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Status Filter Chips (M-04) -->
        <div class="filter-chips--mobile mb-3">
          <button 
            type="button" 
            class="btn btn-xs rounded-pill me-1"
            :class="statusFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'"
            @click="statusFilter = 'all'"
          >
            Semua Status
          </button>
          <button 
            type="button" 
            class="btn btn-xs rounded-pill me-1"
            :class="statusFilter === 'low_stock' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
            @click="statusFilter = 'low_stock'"
          >
            ⚠️ Stok Menipis
          </button>
          <button 
            type="button" 
            class="btn btn-xs rounded-pill me-1"
            :class="statusFilter === 'near_expired' ? 'btn-danger' : 'btn-outline-danger'"
            @click="statusFilter = 'near_expired'"
          >
            ⏳ Mendekati / Lewat Expired
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="empty-state text-center py-5">
        <ion-icon :icon="basketOutline" style="font-size: 3rem;" class="text-muted mb-2" />
        <p class="text-muted">Tidak ada produk ditemukan.</p>
      </div>

      <!-- Product Grid -->
      <ion-grid class="mx-2">
        <ion-row>
          <ion-col v-for="product in filteredProducts" :key="product.id" size="6" size-sm="4" size-md="3">
            <ion-card class="mobile-card m-0 h-100 d-flex flex-column">
              <ion-card-content class="p-2 d-flex flex-column h-100">
                <div class="position-relative text-center rounded-3 overflow-hidden mb-2" style="height: 100px; background: #f0edff;">
                  <img v-if="product.imageURL" :src="product.imageURL" class="w-100 h-100" style="object-fit: cover;" />
                  <div v-else class="d-flex h-100 align-items-center justify-content-center text-muted"><ion-icon :icon="basketOutline" style="font-size:2rem;" /></div>
                  <span v-if="product.featured === 1" class="badge bg-warning text-dark position-absolute top-0 start-0 m-1" style="font-size: 0.6rem;">Unggulan</span>
                  <span v-if="product.sku" class="badge bg-dark text-white position-absolute top-0 end-0 m-1" style="font-size: 0.55rem;">{{ product.sku }}</span>
                </div>
                <div class="flex-grow-1">
                  <span class="badge bg-secondary mb-1" style="font-size: 0.6rem;">{{ getCategoryName(product.categoryId) }}</span>
                  <h6 class="fw-bold mb-1 text-dark text-truncate" style="font-size: 0.85rem;">{{ product.name }}</h6>
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="text-indigo fw-bold" style="font-size: 0.85rem;">{{ formatPrice(product.price) }}</span>
                    <small v-if="product.costPrice" class="text-muted" style="font-size: 0.65rem;">HPP: {{ formatPrice(product.costPrice) }}</small>
                  </div>
                  <div v-if="product.price && product.costPrice" class="mb-2">
                    <span class="badge bg-success-subtle text-success border" style="font-size: 0.62rem; padding: 2px 5px;">
                      +{{ formatPrice(product.price - product.costPrice) }} ({{ Math.round(((product.price - product.costPrice) / product.price) * 100) }}%)
                    </span>
                  </div>
                </div>
                <div class="border-top pt-2 mt-auto">
                  <div class="mb-1">
                      <span v-if="product.stock === 0" class="badge bg-danger w-100">Habis</span>
                      <span v-else-if="product.stock <= 5" class="badge bg-warning text-dark w-100" style="font-size: 0.7rem;">Stok: {{ product.stock }}</span>
                      <span v-else class="badge bg-success w-100" style="font-size: 0.7rem;">Stok: {{ product.stock }}</span>
                  </div>

                  <!-- Expired Date Indicator (M-04) -->
                  <div v-if="product.expiryDate" class="mb-2">
                    <span v-if="isExpired(product.expiryDate)" class="badge bg-danger w-100" style="font-size: 0.65rem;">
                      ❌ Kadaluwarsa
                    </span>
                    <span v-else-if="isNearExpired(product.expiryDate)" class="badge bg-warning text-dark w-100" style="font-size: 0.65rem;">
                      ⏳ Exp: {{ getDaysToExpiry(product.expiryDate) }} hr lagi
                    </span>
                    <span v-else class="badge bg-light text-muted border w-100" style="font-size: 0.62rem;">
                      Exp: {{ product.expiryDate }}
                    </span>
                  </div>

                  <div class="d-flex gap-1">
                    <button class="btn btn-light btn-sm flex-fill text-primary" @click="openEdit(product)" title="Edit Produk"><ion-icon :icon="createOutline" /></button>
                    <button class="btn btn-light btn-sm flex-fill text-info" @click="duplicateProduct(product)" title="Duplikat Produk (B-07)"><ion-icon :icon="copyOutline" /></button>
                    <button class="btn btn-light btn-sm flex-fill text-dark" @click="openLabelModal(product)" title="Cetak Barcode (B-03)"><ion-icon :icon="barcodeOutline" /></button>
                    <button class="btn btn-light btn-sm flex-fill text-danger" @click="confirmDelete(product.id)" title="Hapus"><ion-icon :icon="trashOutline" /></button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Barcode / QR Label Modal (B-03) -->
      <ion-modal :is-open="labelModalOpen" @didDismiss="labelModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Cetak Label Barcode</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="labelModalOpen = false"><ion-icon :icon="closeOutline" /></ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding bg-light">
          <div v-if="labelProduct" class="mobile-card p-4 mx-auto text-center" style="max-width: 320px;">
            <div id="label-print-area" class="p-3 border rounded bg-white" style="font-family: Arial, sans-serif;">
              <div class="fw-bold text-xs text-muted text-uppercase mb-1">{{ storeProfile.storeName }}</div>
              <h6 class="fw-black text-dark mb-1 text-truncate">{{ labelProduct.name }}</h6>
              
              <!-- Barcode Visual Pattern -->
              <div class="barcode-visual my-2 py-2 d-flex justify-content-center align-items-center">
                <div class="barcode-bars">
                  <span class="b-thin"></span><span class="b-thick"></span><span class="b-thin"></span><span class="b-thick"></span>
                  <span class="b-space"></span>
                  <span class="b-thick"></span><span class="b-thin"></span><span class="b-thick"></span><span class="b-thin"></span>
                  <span class="b-space"></span>
                  <span class="b-thin"></span><span class="b-thick"></span><span class="b-thin"></span><span class="b-thick"></span>
                  <span class="b-thick"></span><span class="b-thin"></span><span class="b-thin"></span><span class="b-thick"></span>
                  <span class="b-space"></span>
                  <span class="b-thin"></span><span class="b-thick"></span><span class="b-thin"></span><span class="b-thick"></span>
                </div>
              </div>
              <div class="fw-bold text-xs font-monospace text-dark">{{ labelProduct.sku || ('PRD-' + String(labelProduct.id).padStart(4, '0')) }}</div>

              <div class="fs-5 fw-black text-indigo mt-2">{{ formatPrice(labelProduct.price) }}</div>
            </div>

            <div class="mt-4 d-flex flex-column gap-2">
              <button class="btn btn-action primary py-2 fw-bold d-flex align-items-center justify-content-center gap-2" @click="printBarcodeLabel">
                <ion-icon :icon="printOutline" /> Cetak Label Stiker
              </button>
              <button class="btn btn-action light py-2" @click="labelModalOpen = false">
                Tutup
              </button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Delete Alert -->
      <ion-alert
        :is-open="deleteId !== null"
        header="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan."
        :buttons="[
          { text: 'Batal', role: 'cancel', handler: () => { deleteId = null } },
          { text: 'Hapus', role: 'destructive', handler: () => { deleteProduct() } }
        ]"
        @didDismiss="deleteId = null"
      />

      <ProductModal 
        :is-open="dialogCreate || dialogEdit" 
        :is-edit="dialogEdit"
        :product="activeProduct"
        :categories="categories"
        @close="closeModal"
        @save="saveProduct"
      />
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted, computed, toRaw } from 'vue'
import { ProductRepository, CategoryRepository } from '../../../db/repositories'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert, IonCard, IonCardContent, IonModal, toastController, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, trashOutline, createOutline, basketOutline, closeOutline, copyOutline, barcodeOutline, printOutline } from 'ionicons/icons';
import { readProductImage, saveProductImageFromBase64, deleteProductImage } from '../../../composables/useProductImage';
import { businessProfile } from '../../../db/businessProfile';
import ProductModal from './ProductModal.vue';

export default {
  name: 'ProductsListView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert, IonCard, IonCardContent, IonModal, ProductModal },
  setup() {
    const products = ref([])
    const categories = ref([])
    const searchQuery = ref('')
    const selectedCategory = ref('all')
    const statusFilter = ref('all') // 'all' | 'low_stock' | 'near_expired'
    const deleteId = ref(null)
    const storeProfile = businessProfile

    const labelModalOpen = ref(false)
    const labelProduct = ref(null)

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

    const getCategoryName = (catId) => {
      const cat = categories.value.find(c => c.id === catId)
      return cat ? cat.name : 'Tanpa Kategori'
    }

    const isExpired = (d) => {
      if (!d) return false
      const exp = new Date(d).setHours(0,0,0,0)
      const today = new Date().setHours(0,0,0,0)
      return exp < today
    }

    const isNearExpired = (d) => {
      if (!d) return false
      const exp = new Date(d).setHours(0,0,0,0)
      const today = new Date().setHours(0,0,0,0)
      const diffDays = Math.round((exp - today) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 30
    }

    const getDaysToExpiry = (d) => {
      if (!d) return null
      const exp = new Date(d).setHours(0,0,0,0)
      const today = new Date().setHours(0,0,0,0)
      return Math.round((exp - today) / (1000 * 60 * 60 * 24))
    }

    const fetchData = async () => {
      categories.value = await CategoryRepository.getAll()
      const data = await ProductRepository.getAll()
      await Promise.all(data.map(async (product) => {
        if (product.image) {
          product.imageURL = await readProductImage(product.image)
        } else {
          product.imageURL = null
        }
      }))
      products.value = data
    }

    onMounted(fetchData)
    onIonViewWillEnter(fetchData)

    const filteredProducts = computed(() => {
      return products.value.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || (product.sku && product.sku.toLowerCase().includes(searchQuery.value.toLowerCase()))
        const matchesCategory = selectedCategory.value === 'all' || product.categoryId === selectedCategory.value
        
        let matchesStatus = true
        if (statusFilter.value === 'low_stock') {
          matchesStatus = (product.stock || 0) <= 5
        } else if (statusFilter.value === 'near_expired') {
          matchesStatus = isExpired(product.expiryDate) || isNearExpired(product.expiryDate)
        }

        return matchesSearch && matchesCategory && matchesStatus
      })
    })

    const deleteProduct = async () => {
      if (deleteId.value !== null) {
        await ProductRepository.delete(deleteId.value)
        const toast = await toastController.create({
          message: 'Produk berhasil dihapus!',
          duration: 2000,
          color: 'success',
          position: 'top'
        })
        await toast.present()
        deleteId.value = null
        await fetchData()
      }
    }

    const dialogCreate = ref(false)
    const dialogEdit = ref(false)
    const activeProduct = ref({ name: '', price: 0, stock: 0, categoryId: null, featured: 0, isFeatured: false })

    const openCreate = () => {
        activeProduct.value = { name: '', price: 0, stock: 0, categoryId: categories.value[0]?.id || null, featured: 0, isFeatured: false }
        dialogCreate.value = true
    }

    const openEdit = (product) => {
        activeProduct.value = { ...product, isFeatured: product.featured === 1 || !!product.isFeatured }
        dialogEdit.value = true
    }

    const duplicateProduct = (product) => {
      activeProduct.value = {
        ...product,
        id: undefined,
        name: `${product.name} (Salinan)`,
        sku: product.sku ? `${product.sku}-COPY` : '',
        stock: 0,
        pendingBase64: null,
        imageURL: null,
        image: null,
        isFeatured: false,
        featured: 0
      }
      dialogEdit.value = false
      dialogCreate.value = true
    }

    const openLabelModal = (product) => {
      labelProduct.value = product
      labelModalOpen.value = true
    }

    const printBarcodeLabel = () => {
      const printContent = document.getElementById('label-print-area')
      if (printContent) {
        const popupWin = window.open('', '_blank', 'width=350,height=350')
        if (!popupWin) {
          window.print()
          return
        }
        popupWin.document.open()
        popupWin.document.write(`
          <html>
            <head>
              <title>Label Barcode</title>
              <style>
                @page { size: 50mm 35mm; margin: 0; }
                body { margin: 0; padding: 4mm; font-family: Arial, sans-serif; text-align: center; }
                .barcode-bars span { display: inline-block; background: #000; height: 35px; vertical-align: middle; margin-right: 1.5px; }
                .b-thin { width: 1.5px; }
                .b-thick { width: 3.5px; }
                .b-space { width: 4px; background: transparent !important; }
              </style>
            </head>
            <body onload="window.print();window.close();">
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        popupWin.document.close()
      }
    }

    const confirmDelete = (id) => {
      deleteId.value = id
    }

    const closeModal = () => {
        dialogCreate.value = false
        dialogEdit.value = false
    }

    const showToast = async (message, color = 'danger') => {
        const toast = await toastController.create({
            message,
            duration: 2000,
            color,
            position: 'top'
        })
        await toast.present()
    }

    const saveProduct = async (product) => {
        try {
            const rawProduct = toRaw(product)
            rawProduct.featured = (rawProduct.featured === 1 || rawProduct.isFeatured) ? 1 : 0
            
            // Handle image
            if (rawProduct.pendingBase64) {
                if (rawProduct.image) await deleteProductImage(rawProduct.image)
                rawProduct.image = await saveProductImageFromBase64(rawProduct.pendingBase64, rawProduct.id || Date.now())
                delete rawProduct.pendingBase64
            }

            if (dialogCreate.value) await ProductRepository.add(rawProduct)
            else await ProductRepository.update(rawProduct.id, rawProduct)
            
            await showToast('Produk berhasil disimpan!', 'success')
            closeModal()
            await fetchData()
        } catch (e) {
            console.error('Error saving product:', e)
            await showToast('Gagal menyimpan produk.')
        }
    }

    return {
      products,
      categories,
      searchQuery,
      selectedCategory,
      statusFilter,
      filteredProducts,
      deleteId,
      dialogCreate,
      dialogEdit,
      activeProduct,
      formatPrice,
      getCategoryName,
      openCreate,
      openEdit,
      duplicateProduct,
      openLabelModal,
      printBarcodeLabel,
      labelModalOpen,
      labelProduct,
      storeProfile,
      isExpired,
      isNearExpired,
      getDaysToExpiry,
      closeModal,
      saveProduct,
      confirmDelete,
      deleteProduct,
      addOutline,
      trashOutline,
      createOutline,
      basketOutline,
      closeOutline,
      copyOutline,
      barcodeOutline,
      printOutline
    }
  }
}
</script>

<style scoped>
.product-img-wrap {
  height: 120px;
  background: #f0edff;
  display: grid;
  place-items: center;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b0a0e0;
  width: 100%;
  height: 100%;
}
.barcode-bars span {
  display: inline-block;
  background: #1e293b;
  height: 36px;
  vertical-align: middle;
  margin-right: 1.5px;
}
.b-thin { width: 1.5px; }
.b-thick { width: 3.5px; }
.b-space { width: 4px; background: transparent !important; }
</style>
