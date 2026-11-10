<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Kategori Produk</ion-title>
            <ion-buttons slot="end">
              <ion-button class="btn-action primary" @click="createCategory">
                <ion-icon slot="start" :icon="addOutline" /> Tambah
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle">Kelola klasifikasi produk Anda, pantau jumlah item dan total nilai aset per kategori.</p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap bg-light">
      <!-- Summary Cards -->
      <div class="row g-2 m-2">
        <div class="col-6">
          <MetricCard 
            title="Total Kategori" 
            :value="categories.length" 
            subtitle="Kelompok produk" 
            color="primary" 
          />
        </div>
        <div class="col-6">
          <MetricCard 
            title="Total Nilai Inventaris" 
            :value="formatPrice(totalInventoryValue)" 
            :subtitle="`${totalProductCount} variasi produk`" 
            color="success" 
          />
        </div>
      </div>

      <div class="px-2 pt-1">
        <EmptyState
          v-if="categories.length === 0"
          :icon="listOutline"
          title="Belum Ada Kategori"
          message="Belum ada kategori yang dibuat. Buat kategori baru untuk mulai mengelompokkan produk."
          action-text="Tambah Kategori"
          action-variant="primary"
          @action="createCategory"
        />

        <div v-else class="mobile-card p-3 mb-4">
          <h6 class="fw-bold text-dark mb-3">Daftar Kategori & Statistik Produk</h6>
          <div class="list-group list-group-flush">
            <div 
              v-for="cat in displayedCategories" 
              :key="cat.id" 
              class="list-group-item d-flex justify-content-between align-items-center py-3 px-1 border-bottom-dashed"
            >
              <div class="d-flex align-items-center gap-3">
                <div class="cat-icon-badge" :style="{ background: (cat.color || '#10b981') + '18', color: cat.color || '#10b981' }">
                  <ion-icon :icon="getCatIcon(cat.icon)" />
                </div>
                <div>
                  <h6 class="fw-bold text-dark mb-1">{{ cat.name }}</h6>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge bg-secondary text-xs" style="font-size: 0.68rem;">
                      {{ cat.productCount }} Produk
                    </span>
                    <span class="badge bg-light text-dark border text-xs" style="font-size: 0.68rem;">
                      {{ cat.stockCount }} Unit Stok
                    </span>
                    <span class="text-xs text-muted" v-if="cat.assetValue > 0">
                      Aset: <strong>{{ formatPrice(cat.assetValue) }}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2 align-items-center">
                <button class="btn btn-light btn-sm text-primary py-1 px-2 border" @click="editCategory(cat.id)" title="Edit">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="btn btn-light btn-sm text-danger py-1 px-2 border" @click="confirmDelete(cat.id)" title="Hapus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>

          <LoadMoreFooter
            :has-more="hasMoreCategories"
            :displayed-count="displayedCategories.length"
            :total-count="enrichedCategories.length"
            item-name="kategori"
            @load-more="loadMoreCategories"
          />
        </div>
      </div>

      <ion-alert
        :is-open="deleteId !== null"
        header="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak bisa dibatalkan."
        :buttons="[
          { text: 'Batal', role: 'cancel', handler: () => { deleteId = null } },
          { text: 'Hapus', role: 'destructive', handler: () => { remove() } }
        ]"
        @didDismiss="deleteId = null"
      />
      
      <CategoryModal 
        :isOpen="modalVisible" 
        :categoryId="selectedCategoryId" 
        @update:isOpen="modalVisible = $event" 
        @saved="fetch" 
      />
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { CategoryRepository, ProductRepository } from '../../../db/repositories'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons, IonAlert, toastController, onIonViewWillEnter, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/vue';
import {
  addOutline, trashOutline, createOutline, listOutline,
  fastFoodOutline, cafeOutline, shirtOutline, colorPaletteOutline,
  sparklesOutline, basketOutline, pricetagOutline
} from 'ionicons/icons';
import CategoryModal from './CategoryModal.vue'

export default {
  name: 'CategoriesListView',
  components: { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, 
    IonButtons, IonAlert, CategoryModal, IonInfiniteScroll, IonInfiniteScrollContent 
  },
  setup() {
    const categories = ref([])
    const products = ref([])
    const deleteId = ref(null)
    const modalVisible = ref(false)
    const selectedCategoryId = ref(null)

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0)

    const fetch = async () => {
      categories.value = await CategoryRepository.getAll()
      products.value = await ProductRepository.getAll()
    }

    const enrichedCategories = computed(() => {
      return categories.value.map(cat => {
        const catProducts = products.value.filter(p => p.categoryId === cat.id)
        const productCount = catProducts.length
        const stockCount = catProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0)
        const assetValue = catProducts.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.price || 0)), 0)

        return {
          ...cat,
          productCount,
          stockCount,
          assetValue
        }
      })
    })

    const categoryLimit = ref(25)
    const displayedCategories = computed(() => {
      return enrichedCategories.value.slice(0, categoryLimit.value)
    })
    const hasMoreCategories = computed(() => {
      return displayedCategories.value.length < enrichedCategories.value.length
    })
    const loadMoreCategories = (ev) => {
      categoryLimit.value += 25
      if (ev && ev.target) ev.target.complete()
    }

    const totalProductCount = computed(() => products.value.length)
    const totalInventoryValue = computed(() => {
      return products.value.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.price || 0)), 0)
    })

    const getCatIcon = (iconName) => {
      const map = {
        food: fastFoodOutline,
        drink: cafeOutline,
        fashion: shirtOutline,
        craft: colorPaletteOutline,
        retail: basketOutline,
        featured: sparklesOutline,
        tag: pricetagOutline
      }
      return map[iconName] || pricetagOutline
    }

    const editCategory = (id) => {
      selectedCategoryId.value = id
      modalVisible.value = true
    }

    const createCategory = () => {
      selectedCategoryId.value = null
      modalVisible.value = true
    }
    
    const confirmDelete = (id) => {
      deleteId.value = id
    }

    const remove = async () => {
      if (deleteId.value !== null) {
        await CategoryRepository.delete(deleteId.value)
        const toast = await toastController.create({
          message: 'Kategori berhasil dihapus!',
          duration: 2000,
          color: 'success',
          position: 'top'
        })
        await toast.present()
        deleteId.value = null
        await fetch()
      }
    }

    onMounted(fetch)
    onIonViewWillEnter(fetch)

    return {
      categories, products, enrichedCategories, displayedCategories, hasMoreCategories, loadMoreCategories, totalProductCount, totalInventoryValue,
      deleteId, editCategory, createCategory, confirmDelete, remove,
      addOutline, trashOutline, createOutline, listOutline,
      modalVisible, selectedCategoryId, fetch, formatPrice, getCatIcon
    }
  }
}
</script>

<style scoped>
.cat-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.border-bottom-dashed {
  border-bottom: 1px dashed rgba(0,0,0,0.08) !important;
}
.border-bottom-dashed:last-child {
  border-bottom: none !important;
}
</style>
