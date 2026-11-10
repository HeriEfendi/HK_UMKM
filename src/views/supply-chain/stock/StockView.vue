<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Manajemen Stok</ion-title>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Pantau stok barang dan riwayat mutasi presisi.</p>
        </div>
      </ion-toolbar>

      <div class="p-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="monitoring">
            <ion-label>Monitoring</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mutasi">
            <ion-label>Mutasi</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap bg-light">

      <!-- TAB 1: MONITORING STOK -->
      <div v-if="activeTab === 'monitoring'" class="ion-padding">
        <!-- Stock Metrics Dashboard -->
        <div class="project-actions d-grid gap-2 m-2">
          <div class="mb-2 clickable-card">
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Total Produk</small>
              <div class="fs-3 fw-black text-indigo mt-1">{{ products.length }} <span class="fs-6 fw-normal">Item</span></div>
              <small class="text-muted mt-1 d-block small">Variasi produk terdaftar</small>
            </div>
          </div>
          <div class="mb-2 clickable-card">
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Total Stok Item</small>
              <div class="fs-3 fw-black text-teal mt-1">{{ totalStockCount }} <span class="fs-6 fw-normal">Unit</span></div>
              <small class="text-muted mt-1 d-block small">Seluruh inventaris</small>
            </div>
          </div>
          <div class="mb-2 clickable-card">
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Stok Tipis</small>
              <div class="fs-3 fw-black text-danger mt-1">{{ lowStockCount }} <span class="fs-6 fw-normal">Item</span></div>
              <small class="text-muted mt-1 d-block small">Segera butuh restock</small>
            </div>
          </div>
          <div class="mb-2 clickable-card">
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Total Nilai Stok</small>
              <div class="fs-6 fw-black text-amber mt-1 text-truncate">{{ formatPrice(totalStockValue) }}</div>
              <small class="text-muted mt-1 d-block small">Nilai aset total</small>
            </div>
          </div>
        </div>

        <!-- Filters & Search -->
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mb-3">
          <!-- Search input -->
          <div class="w-100 px-3 py-1 search-container">
            <SearchInput 
              v-model="searchQuery" 
              placeholder="Cari produk..." 
              size="sm" 
            />
          </div>

          <!-- Filter chips -->
          <div class="mx-3 my-2 d-flex gap-2 overflow-x-auto" style="scrollbar-width: none;">
            <button
              class="btn btn-action btn-md" 
              :class="statusFilter === 'all' ? 'pill-badge primary' : 'pill-badge secondary'" 
              @click="statusFilter = 'all'"
            >
              Semua <ion-badge slot="end" class="ms-2 small-badge">{{ products.length }}</ion-badge>
            </button>
            <button
              class="btn btn-action btn-md" 
              :class="statusFilter === 'low' ? 'pill-badge warning' : 'pill-badge secondary'" 
              @click="statusFilter = 'low'"
            >
              Stok Tipis <ion-badge slot="end" class="ms-2 small-badge">{{ lowStockCount }}</ion-badge>
            </button>
            <button
              class="btn btn-action btn-md" 
              :class="statusFilter === 'out' ? 'pill-badge danger' : 'pill-badge secondary'" 
              @click="statusFilter = 'out'"
            >
              Habis <ion-badge slot="end" class="ms-2 small-badge">{{ outOfStockCount }}</ion-badge>
            </button>
          </div>
        </div>

        <!-- Products List for stock adjustment -->
        <EmptyState
          v-if="filteredProducts.length === 0"
          :icon="basketOutline"
          title="Tidak Ada Produk"
          message="Tidak ada produk yang sesuai dengan filter atau kata kunci."
        />

        <div v-else class="row mx-2">
          <div 
            v-for="prod in displayedProducts" 
            :key="prod.id" 
            class="col-12 col-md-6 g-2"
          >
            <div 
              class="mobile-card-sm p-2 mb-2 cursor-pointer clickable-card h-100"
              @click="openAdjustment(prod)"
            >
              <div class="d-flex align-items-center justify-content-between h-100">
                <div class="d-flex align-items-center gap-3" style="max-width: 65%;">
                  <div class="rounded-3 bg-light overflow-hidden flex-shrink-0" style="width: 50px; height: 50px; display: grid; place-items: center;">
                    <img v-if="prod.imageURL" :src="prod.imageURL" :alt="prod.name" style="width: 100%; height: 100%; object-fit: cover;" />
                    <ion-icon v-else :icon="basketOutline" style="font-size: 1.5rem; color: #adb5bd;" />
                  </div>
                  <div class="text-truncate">
                    <h6 class="fw-bold text-dark mb-1 text-truncate medium">{{ prod.name }}</h6>
                    <span class="badge bg-secondary mb-0 small">{{ getCategoryName(prod.categoryId) }}</span>
                  </div>
                </div>

                <div class="text-end">
                  <span class="text-muted small fw-bold d-block mb-1">Nilai: {{ formatPrice(prod.price * prod.stock) }}</span>
                  <span v-if="prod.stock === 0" class="badge bg-danger fs-6 px-2 py-1">Habis</span>
                  <span v-else-if="prod.stock <= 5" class="badge bg-warning text-dark fs-6 px-2 py-1">Tipis ({{ prod.stock }})</span>
                  <span v-else class="badge bg-success medium px-2 py-1">Stok: {{ prod.stock }}</span>
                </div>
              </div>
            </div>
          </div>

          <LoadMoreFooter
            v-if="activeTab === 'monitoring'"
            :has-more="hasMoreProducts"
            :displayed-count="displayedProducts.length"
            :total-count="filteredProducts.length"
            item-name="produk"
            @load-more="loadMoreProducts"
          />
        </div>
      </div>

      <!-- TAB 2: RIWAYAT MUTASI -->
      <div v-if="activeTab === 'mutasi'" class="ion-padding">
        <!-- Actions & Export -->
        <div class="d-flex justify-content-between align-items-center mx-3 mb-3">
          <div></div>
          <button class="btn btn-action success btn-sm" @click="exportExcel">
            <ion-icon :icon="downloadOutline" class="me-1" /> Export Excel
          </button>
        </div>

        <!-- Filters & Search -->
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mb-3">
          <!-- Search input -->
          <div class="w-100 px-3 py-1 search-container">
            <SearchInput 
              v-model="historySearchQuery" 
              placeholder="Filter nama produk..." 
              size="sm" 
            />
          </div>
        </div>

        <EmptyState
          v-if="filteredMutations.length === 0"
          :icon="calendarOutline"
          title="Belum Ada Riwayat Mutasi"
          message="Belum ada riwayat mutasi stok barang yang tercatat."
        />

        <!-- Mutation Logs Cards -->
        <div v-else>
          <div 
            v-for="log in displayedMutations" 
            :key="log.id" 
            class="mobile-card container-padded mb-3"
            :class="getMutationBorderClass(log.changeQuantity)"
          >
            <div class="d-flex justify-content-between align-items-center mb-1">
              <div>
                <h6 class="fw-bold text-dark mb-0">{{ getProductName(log.productId) }}</h6>
                <small class="text-muted">{{ formatDateTime(log.createdAt) }}</small>
              </div>
              <div class="text-end">
                <span class="badge" :class="getMutationBadgeClass(log.changeQuantity)" style="font-size: 0.9rem;">
                  {{ log.changeQuantity > 0 ? '+' : '' }}{{ log.changeQuantity }}
                </span>
                <small class="text-muted d-block mt-1">Stok: {{ log.beforeStock }} ➜ {{ log.afterStock }}</small>
              </div>
            </div>
            <div class="text-muted small mt-2 p-2 bg-light rounded" style="font-size: 0.8rem; font-style: italic;">
              Keterangan: {{ log.notes || 'Penyesuaian stok' }}
            </div>
          </div>

          <LoadMoreFooter
            v-if="activeTab === 'mutasi'"
            :has-more="hasMoreMutations"
            :displayed-count="displayedMutations.length"
            :total-count="filteredMutations.length"
            item-name="riwayat mutasi"
            @load-more="loadMoreMutations"
          />
        </div>
      </div>
    </ion-content>

    <!-- ADJUST STOCK MODAL -->
    <ion-modal ref="adjustModal" :is-open="adjustModalVisible" @didDismiss="adjustModalVisible = false">
      <AppModalHeader title="Penyesuaian Stok" @close="adjustModalVisible = false" />

      <ion-content class="ion-padding bg-light" v-if="selectedProduct">
        <div class="mobile-card container-padded mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded bg-light overflow-hidden" style="width: 60px; height: 60px; display: grid; place-items: center;">
              <img v-if="selectedProduct.imageURL" :src="selectedProduct.imageURL" :alt="selectedProduct.name" style="width: 100%; height: 100%; object-fit: cover;" />
              <ion-icon v-else :icon="basketOutline" style="font-size: 1.5rem; color: #adb5bd;" />
            </div>
            <div>
              <h6 class="fw-bold text-dark mb-1">{{ selectedProduct.name }}</h6>
              <span class="badge bg-secondary">{{ getCategoryName(selectedProduct.categoryId) }}</span>
            </div>
          </div>
          <hr />
          <div class="d-flex justify-content-between align-items-center text-dark">
            <span>Stok Saat Ini:</span>
            <span class="fs-6 fw-black text-indigo">{{ selectedProduct.stock }} unit</span>
          </div>
        </div>

        <div class="mobile-card container-padded mb-3">
          <h6 class="fw-bold text-dark mb-3">Form Penyesuaian</h6>
          
          <div class="form-stack">
            <div class="field-group mb-3">
              <label class="field-label">Tipe Penyesuaian</label>
              <select v-model="adjustmentType" class="form-select app-control">
                <option value="add">Tambah Stok (Barang Masuk)</option>
                <option value="reduce">Kurangi Stok (Barang Keluar/Rusak)</option>
              </select>
            </div>

            <div class="field-group mb-3">
              <label class="field-label">Jumlah Unit</label>
              <input type="number" class="form-control app-control fw-bold text-dark" v-model.number="adjustmentQty" min="1" />
            </div>

            <div class="field-group mb-3">
              <label class="field-label">Alasan</label>
              <select v-model="adjustmentReason" class="form-select app-control">
                <option v-if="adjustmentType === 'add'" value="Barang Masuk">Barang Masuk / Pembelian</option>
                <option v-if="adjustmentType === 'add'" value="Opname Stok">Kelebihan Stok (Opname)</option>
                <option v-if="adjustmentType === 'reduce'" value="Barang Rusak">Barang Rusak / Cacat</option>
                <option v-if="adjustmentType === 'reduce'" value="Kadaluarsa">Kadaluarsa</option>
                <option v-if="adjustmentType === 'reduce'" value="Penyusutan">Penyusutan / Selisih Opname</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div class="field-group mb-3">
              <label class="field-label">Catatan Tambahan (Opsional)</label>
              <input type="text" class="form-control app-control" v-model="adjustmentNotes" placeholder="Contoh: Audit stok bulanan" />
            </div>
          </div>
        </div>

        <div class="">
          <button 
            class="btn btn-action primary w-100 py-3 fw-bold fs-6" 
            :disabled="adjustmentQty <= 0" 
            @click="saveAdjustment"
          >
            Simpan Penyesuaian
          </button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { ProductRepository, CategoryRepository, stockMutationsRepo } from '../../../db/repositories'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonButtons, IonBackButton, IonModal, IonBadge, toastController, onIonViewWillEnter, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/vue';
import { basketOutline, addOutline, removeOutline, downloadOutline, calendarOutline, documentTextOutline, searchOutline } from 'ionicons/icons';
import { readProductImage } from '../../../composables/useProductImage';
import * as XLSX from 'xlsx';
import { exportWorkbookToExcel } from '../../../utils/excelExport';

export default {
  name: 'StockView',
  components: {
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonButtons, IonBackButton, IonModal, IonBadge,
    IonInfiniteScroll, IonInfiniteScrollContent
  },
  setup() {
    const activeTab = ref('monitoring')
    const products = ref([])
    const categories = ref([])
    const mutations = ref([])

    // Filters
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const historySearchQuery = ref('')

    // Adjustment Modal
    const adjustModalVisible = ref(false)
    const selectedProduct = ref(null)
    const adjustmentType = ref('add')
    const adjustmentQty = ref(1)
    const adjustmentReason = ref('Barang Masuk')
    const adjustmentNotes = ref('')

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

    const getCategoryName = (catId) => {
      const cat = categories.value.find(c => c.id === catId)
      return cat ? cat.name : 'Lainnya'
    }

    const getProductName = (prodId) => {
      const prod = products.value.find(p => p.id === prodId)
      return prod ? prod.name : 'Produk Terhapus'
    }

    const loadData = async () => {
      categories.value = await CategoryRepository.getAll()
      const data = await ProductRepository.getAll()
      await Promise.all(data.map(async (p) => {
        if (p.image) {
          p.imageURL = await readProductImage(p.image)
        } else {
          p.imageURL = null
        }
      }))
      products.value = data
      mutations.value = (await stockMutationsRepo.getAll()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    onMounted(loadData)
    onIonViewWillEnter(loadData)

    // Global Metrics
    const totalStockCount = computed(() => products.value.reduce((sum, p) => sum + p.stock, 0))
    const totalStockValue = computed(() => products.value.reduce((sum, p) => sum + (p.price * p.stock), 0))
    const lowStockCount = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= 5).length)
    const outOfStockCount = computed(() => products.value.filter(p => p.stock === 0).length)

    // Filter products
    const filteredProducts = computed(() => {
      return products.value.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        let matchesStatus = true
        if (statusFilter.value === 'low') {
          matchesStatus = p.stock > 0 && p.stock <= 5
        } else if (statusFilter.value === 'out') {
          matchesStatus = p.stock === 0
        }
        return matchesSearch && matchesStatus
      })
    })

    // Filter mutations
    const filteredMutations = computed(() => {
      return mutations.value.filter(m => {
        const prodName = getProductName(m.productId).toLowerCase()
        return prodName.includes(historySearchQuery.value.toLowerCase())
      })
    })

    // Lazy load state for monitoring products
    const productLimit = ref(24)
    const displayedProducts = computed(() => {
      return filteredProducts.value.slice(0, productLimit.value)
    })
    const hasMoreProducts = computed(() => {
      return displayedProducts.value.length < filteredProducts.value.length
    })
    const loadMoreProducts = (ev) => {
      productLimit.value += 24
      if (ev && ev.target) ev.target.complete()
    }

    // Lazy load state for mutations history
    const mutationLimit = ref(25)
    const displayedMutations = computed(() => {
      return filteredMutations.value.slice(0, mutationLimit.value)
    })
    const hasMoreMutations = computed(() => {
      return displayedMutations.value.length < filteredMutations.value.length
    })
    const loadMoreMutations = (ev) => {
      mutationLimit.value += 25
      if (ev && ev.target) ev.target.complete()
    }

    watch([searchQuery, statusFilter], () => {
      productLimit.value = 24
    })
    watch(historySearchQuery, () => {
      mutationLimit.value = 25
    })

    const showToast = async (msg, color = 'success') => {
      const toast = await toastController.create({
        message: msg,
        duration: 2000,
        color: color,
        position: 'top'
      })
      await toast.present()
    }

    const openAdjustment = (product) => {
      selectedProduct.value = product
      adjustmentType.value = 'add'
      adjustmentQty.value = 1
      adjustmentReason.value = 'Barang Masuk'
      adjustmentNotes.value = ''
      adjustModalVisible.value = true
    }

    const saveAdjustment = async () => {
      if (adjustmentQty.value <= 0) {
        showToast('Jumlah unit penyesuaian harus lebih dari 0!', 'danger')
        return
      }

      const prod = selectedProduct.value
      const beforeStock = prod.stock
      const changeQty = adjustmentType.value === 'add' ? adjustmentQty.value : -adjustmentQty.value
      const afterStock = beforeStock + changeQty

      if (afterStock < 0) {
        showToast('Stok akhir tidak boleh negatif!', 'danger')
        return
      }

      // Update product stock
      await ProductRepository.update(prod.id, { ...prod, stock: afterStock })

      // Log stock mutation
      await stockMutationsRepo.add({
        productId: prod.id,
        type: adjustmentType.value === 'add' ? 'addition' : 'reduction',
        changeQuantity: changeQty,
        beforeStock: beforeStock,
        afterStock: afterStock,
        notes: adjustmentReason.value + (adjustmentNotes.value ? `: ${adjustmentNotes.value}` : '')
      })

      showToast('Penyesuaian stok berhasil disimpan!', 'success')
      adjustModalVisible.value = false
      await loadData()
    }

    // Styles helper
    const getMutationBorderClass = (qty) => {
      if (qty > 0) return 'border-success'
      if (qty < 0 && Math.abs(qty) >= 10) return 'border-danger'
      return 'border-warning'
    }

    const getMutationBadgeClass = (qty) => {
      if (qty > 0) return 'bg-success'
      return 'bg-danger'
    }

    const formatDateTime = (isoString) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    // Export Excel
    const exportExcel = async () => {
      if (mutations.value.length === 0) {
        showToast('Tidak ada data mutasi untuk diekspor!', 'warning')
        return
      }

      const rows = mutations.value.map(m => ({
        'Nama Produk': getProductName(m.productId),
        'Tipe Mutasi': m.changeQuantity > 0 ? 'Penambahan' : 'Pengurangan',
        'Jumlah Perubahan': m.changeQuantity,
        'Stok Sebelum': m.beforeStock,
        'Stok Sesudah': m.afterStock,
        'Tanggal Log': formatDateTime(m.createdAt),
        'Keterangan / Alasan': m.notes || ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mutasi_Stok')

      worksheet['!cols'] = Array(7).fill({ wch: 18 })

      await exportWorkbookToExcel(workbook, `Laporan_Mutasi_Stok_SME_${new Date().toISOString().split('T')[0]}.xlsx`)
      showToast('Laporan Mutasi Excel berhasil diunduh!', 'success')
    }

    return {
      activeTab,
      products,
      categories,
      mutations,
      searchQuery,
      statusFilter,
      historySearchQuery,
      adjustModalVisible,
      selectedProduct,
      adjustmentType,
      adjustmentQty,
      adjustmentReason,
      adjustmentNotes,
      formatPrice,
      getCategoryName,
      getProductName,
      totalStockCount,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      filteredProducts,
      displayedProducts,
      hasMoreProducts,
      loadMoreProducts,
      filteredMutations,
      displayedMutations,
      hasMoreMutations,
      loadMoreMutations,
      openAdjustment,
      saveAdjustment,
      getMutationBorderClass,
      getMutationBadgeClass,
      formatDateTime,
      exportExcel,
      readProductImage,
      basketOutline,
      addOutline,
      removeOutline,
      downloadOutline,
      calendarOutline,
      documentTextOutline,
      searchOutline
    }
  }
}
</script>

