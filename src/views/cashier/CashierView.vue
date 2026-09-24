<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Kasir (POS)</ion-title>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Lakukan transaksi penjualan cepat dan pantau arus kas secara real-time.</p>
        </div>
      </ion-toolbar>
    </ion-header> 

    <ion-content class="app-content-wrap bg-light">
      <!-- Tabs Segment -->
      <div class="px-3 pt-3 mb-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="pos">
            <ion-label>POS / Kasir</ion-label>
          </ion-segment-button>
          <ion-segment-button value="dashboard">
            <ion-label>Monitoring</ion-label>
          </ion-segment-button>
          <ion-segment-button value="riwayat">
            <ion-label>Riwayat</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- TAB 1: POS / KASIR -->
      <div v-show="activeTab === 'pos'" class="ion-padding">

        <div class="row g-1">
          <!-- Right side: Shopping Cart -->
          <ion-col size="12" size-lg="4" class="mt-3">
            <div class="mobile-card container-padded">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-dark mb-0">Keranjang Belanja</h5>
                <button v-if="cart.length > 0" class="btn btn-light btn-sm text-danger" @click="clearCart">
                  Kosongkan
                </button>
              </div>

              <!-- Cart Item List -->
              <div v-if="cart.length === 0" class="text-center py-5 text-muted">
                <ion-icon :icon="cartOutline" style="font-size: 3rem;" class="mb-2" />
                <p>Keranjang belanja masih kosong.</p>
              </div>

              <div v-else class="cart-items-wrap mb-3">
                <div v-for="item in cart" :key="item.id" class="cart-item-card mb-2 p-2 border rounded d-flex justify-content-between align-items-center">
                  <div class="cart-item-info">
                    <h6 class="fw-bold text-dark mb-0 text-truncate" style="max-width: 140px;">{{ item.name }}</h6>
                    <small class="text-muted">{{ formatPrice(item.price) }}</small>
                  </div>
                  <div class="cart-item-qty d-flex align-items-center gap-1">
                    <button class="btn btn-outline-secondary btn-sm p-1 px-2" @click="updateQty(item.id, -1)">
                      <ion-icon :icon="removeOutline" />
                    </button>
                    <span class="fw-bold mx-1">{{ item.quantity }}</span>
                    <button class="btn btn-outline-secondary btn-sm p-1 px-2" @click="updateQty(item.id, 1)">
                      <ion-icon :icon="addOutline" />
                    </button>
                    <button class="btn btn-link text-danger btn-sm p-1 ms-1" @click="removeFromCart(item.id)">
                      <ion-icon :icon="trashOutline" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Summary & Checkout Button -->
              <div v-if="cart.length > 0" class="border-top pt-3">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Subtotal</span>
                  <span class="fw-bold">{{ formatPrice(subtotal) }}</span>
                </div>

                <!-- Discount Section with % / Rp Toggle & Presets (M-02) -->
                <div class="mb-2 p-2 bg-white rounded border">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-muted small fw-semibold">Diskon Nota</span>
                    <div class="btn-group btn-group-sm" role="group">
                      <button 
                        type="button" 
                        class="btn btn-xs py-0 px-2" 
                        :class="discountType === 'percent' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="discountType = 'percent'"
                      >%</button>
                      <button 
                        type="button" 
                        class="btn btn-xs py-0 px-2" 
                        :class="discountType === 'fixed' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="discountType = 'fixed'"
                      >Rp</button>
                    </div>
                  </div>

                  <div class="d-flex gap-2 align-items-center mb-1">
                    <div class="input-group input-group-sm">
                      <span class="input-group-text bg-light">{{ discountType === 'percent' ? '%' : 'Rp' }}</span>
                      <input 
                        type="number" 
                        min="0" 
                        :max="discountType === 'percent' ? 100 : subtotal" 
                        v-model.number="discountValue" 
                        class="form-control form-control-sm text-end fw-bold" 
                        placeholder="0" 
                      />
                    </div>
                    <button v-if="discountValue > 0" class="btn btn-sm btn-light border text-danger px-2" @click="discountValue = 0" title="Hapus Diskon">✕</button>
                  </div>

                  <!-- Quick Discount Presets -->
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    <template v-if="discountType === 'percent'">
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 5">5%</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 10">10%</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 15">15%</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 20">20%</button>
                    </template>
                    <template v-else>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 5000">5k</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 10000">10k</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 20000">20k</button>
                      <button type="button" class="btn btn-light btn-xs border py-0 px-1 text-xs" @click="discountValue = 50000">50k</button>
                    </template>
                  </div>
                </div>

                <div v-if="discountAmount > 0" class="d-flex justify-content-between text-danger mb-1 small fw-bold">
                  <span>Potongan Diskon</span>
                  <span>-{{ formatPrice(discountAmount) }}</span>
                </div>

                <!-- Pajak / PPN Otomatis dari Pengaturan Toko -->
                <div v-if="storeProfile.enableTax && currentTaxRate > 0" class="d-flex justify-content-between align-items-center mb-1 text-muted small">
                  <span class="d-flex align-items-center gap-1">
                    <span>Pajak / PPN ({{ currentTaxRate }}%)</span>
                    <span class="badge bg-light text-secondary border px-1" style="font-size: 0.65rem;" title="Otomatis diterapkan dari Profil Toko">Otomatis</span>
                  </span>
                  <span class="fw-semibold text-dark">{{ formatPrice(tax) }}</span>
                </div>

                <div class="d-flex justify-content-between fs-5 fw-black text-indigo border-top pt-2 mt-2">
                  <span>Total Bayar</span>
                  <span>{{ formatPrice(grandTotal) }}</span>
                </div>

                <div class="mt-3">
                  <textarea v-model="notes" class="form-control form-control-sm mb-2" rows="2" placeholder="Catatan transaksi (opsional)..."></textarea>
                  <button class="btn btn-action primary w-100 py-2 fs-6" @click="openCheckout">
                    Bayar Sekarang
                  </button>
                </div>
              </div>

            </div>
          </ion-col>

          <!-- Left side: Products catalog -->
          <ion-col size="12" size-lg="8">
            
        <!-- Filters & Search -->
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mb-3">
          <!-- Search input -->
          <div class="w-100 px-3 py-1 search-container">
            <div class="search-input-wrap position-relative">
              <input 
                type="text" 
                v-model="searchQuery" 
                class="form-control form-control-sm app-control" 
                style="padding-left: 30px;" 
                placeholder="Cari produk..." 
              />
              <ion-icon 
                :icon="searchOutline" 
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #94a3b8;" 
              />
            </div>
          </div>

          <!-- Category filter chips -->
          <div class="mx-3 my-2 d-flex gap-2 overflow-x-auto" style="scrollbar-width: none;">
            <button
              class="btn btn-action btn-md" 
              :class="selectedCategory === 'all' ? 'pill-badge primary' : 'pill-badge secondary'" 
              @click="selectedCategory = 'all'"
              style="white-space: nowrap;"
            >
              Semua
            </button>
            <button
              v-for="cat in categories" 
              :key="cat.id"
              class="btn btn-action btn-md" 
              :class="selectedCategory === cat.id ? 'pill-badge primary' : 'pill-badge secondary'" 
              @click="selectedCategory = cat.id"
              style="white-space: nowrap;"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

            <!-- Products Grid -->
            <div v-if="filteredProducts.length === 0" class="empty-state text-center py-5 mobile-card container-padded">
              <ion-icon :icon="basketOutline" style="font-size: 3rem;" class="text-muted mb-2" />
              <p class="text-muted">Tidak ada produk tersedia.</p>
            </div>

            <div v-else class="row mx-1">
              <div 
                v-for="product in filteredProducts" 
                :key="product.id" 
                class="col-12 col-md-6 mb-2 px-1"
              >
                <div 
                  class="mobile-card p-2 h-100 cursor-pointer clickable-card"
                  :class="{ 'opacity-50': product.stock === 0 }"
                  @click="product.stock > 0 && addToCart(product)"
                >
                  <div class="d-flex align-items-center justify-content-between h-100">
                    <div class="d-flex align-items-center gap-3" style="max-width: 65%;">
                      <div class="rounded-3 bg-light overflow-hidden flex-shrink-0" style="width: 50px; height: 50px; display: grid; place-items: center;">
                        <img v-if="product.imageURL" :src="product.imageURL" :alt="product.name" style="width: 100%; height: 100%; object-fit: cover;" />
                        <ion-icon v-else :icon="basketOutline" style="font-size: 1.5rem; color: #adb5bd;" />
                      </div>
                      <div class="text-truncate">
                        <h6 class="fw-bold text-dark mb-1 text-truncate medium">{{ product.name }}</h6>
                        <span class="badge bg-secondary mb-0 small">{{ getCategoryName(product.categoryId) }}</span>
                      </div>
                    </div>

                    <div class="text-end">
                      <span class="text-indigo fw-bold d-block mb-1" style="font-size: 0.85rem;">{{ formatPrice(product.price) }}</span>
                      <span v-if="product.stock === 0" class="badge bg-danger fs-6 px-2 py-1">Habis</span>
                      <span v-else-if="product.stock <= 5" class="badge bg-warning text-dark fs-6 px-2 py-1">Sisa {{ product.stock }}</span>
                      <span v-else class="badge bg-success medium px-2 py-1">Stok: {{ product.stock }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ion-col>
        </div>
      </div>

      <!-- TAB 2: MONITORING / DASHBOARD -->
      <div v-show="activeTab === 'dashboard'" class="ion-padding">
        <!-- Dashboard Metrics KPI Card -->
        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Penjualan Hari Ini</small>
                  <div class="fs-6 fw-black text-indigo mt-1">{{ formatPrice(kpiMetrics.salesToday) }}</div>
                  <small class="text-muted small mt-1 d-block">{{ kpiMetrics.countToday }} Transaksi</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Pendapatan Bulan Ini</small>
                  <div class="fs-6 fw-black text-teal mt-1">{{ formatPrice(kpiMetrics.salesMonth) }}</div>
                  <small class="text-muted small mt-1 d-block">{{ kpiMetrics.countMonth }} Transaksi</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Transaksi Total</small>
                  <div class="fs-6 fw-black text-amber mt-1">{{ salesHistory.length }}</div>
                  <small class="text-muted small mt-1 d-block">Seluruh transaksi</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Rata-rata Keranjang</small>
                  <div class="fs-6 fw-black text-primary mt-1">{{ formatPrice(kpiMetrics.avgBasket) }}</div>
                  <small class="text-muted small mt-1 d-block">Per transaksi</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-grid class="mx-2">
          <ion-row>
            <!-- Sales Trend Chart -->
            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <h6 class="fw-bold text-dark mb-3">Grafik Penjualan 7 Hari Terakhir</h6>
                  <div v-if="chartSeries[0].data.some(v => v > 0)">
                    <VueApexCharts :key="'sales-chart-' + salesHistory.length" type="area" height="260" :options="chartOptions" :series="chartSeries" />
                  </div>
                  <div v-else class="text-center py-4 text-muted">
                    Belum ada data penjualan 7 hari terakhir.
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <!-- Top Selling Products -->
            <ion-col size="12" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <h6 class="fw-bold text-dark mb-3">Produk Terlaris</h6>
                  <div v-if="topProducts.length === 0" class="text-center py-3 text-muted">
                    Belum ada data produk terjual.
                  </div>
                  <div v-else class="list-group list-group-flush">
                    <div v-for="(p, index) in topProducts" :key="index" class="list-group-item d-flex justify-content-between align-items-center py-2 px-1">
                      <div>
                        <span class="fw-black text-indigo me-2 medium">#{{ index + 1 }}</span>
                        <span class="text-dark fw-bold medium">{{ p.name }}</span>
                      </div>
                      <div class="text-end">
                        <span class="pill-badge done small border me-2">{{ p.qtySold }} terjual</span>
                        <span class="fw-semibold text-muted medium">{{ formatPrice(p.revenue) }}</span>
                      </div>
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- TAB 3: RIWAYAT TRANSAKSI -->
      <div v-if="activeTab === 'riwayat'" class="ion-padding">
        <!-- Actions & Export -->
        <div class="d-flex justify-content-between align-items-center mx-4 mb-3">
          <h6 class="fw-bold text-dark mb-0">Daftar Transaksi</h6>
          <button class="btn btn-action success btn-sm" @click="exportExcel">
            <ion-icon :icon="downloadOutline" class="me-1" /> Export Excel
          </button>
        </div>

        <div v-if="salesHistory.length === 0" class="d-flex justify-content-between align-items-center mx-3 mb-3">
          <ion-icon :icon="calendarOutline" style="font-size: 3rem;" class="mb-2" />
          <p>Belum ada riwayat transaksi penjualan.</p>
        </div>

        <!-- Transaction Cards -->
        <div v-else class="row mx-2 mb-2">
          <div 
            v-for="sale in salesHistory" 
            :key="sale.id" 
            class="col-12 col-sm-6 col-lg-4 g-0 m-0 mb-3"
          >
            <div class="mobile-card container-padded h-100 border-start border-4 border-teal mx-2">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge bg-indigo mb-1 me-1">INV-{{ sale.id }}</span>
                  <span class="badge bg-secondary mb-1">{{ formatPaymentMethod(sale.paymentMethod) }}</span>
                  <h6 class="fw-bold text-dark mb-0">{{ formatDateTime(sale.createdAt) }}</h6>
                </div>
                <div class="d-flex gap-1">
                  <button class="btn btn-light btn-sm text-primary" @click="openReceipt(sale)" title="Lihat Struk">
                    <ion-icon :icon="documentTextOutline" /> Detail
                  </button>
                  <button class="btn btn-light btn-sm text-danger" @click="confirmDeleteSale(sale.id)" title="Hapus">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </div>
              </div>

              <div class="mt-2 text-muted small">
                <strong>Item:</strong>
                <div v-for="(item, idx) in sale.items" :key="idx" class="d-flex justify-content-between">
                  <span>{{ item.name }} x{{ item.quantity }}</span>
                  <span>{{ formatPrice(item.price * item.quantity) }}</span>
                </div>
              </div>

              <div class="d-flex justify-content-between fw-bold text-dark border-top pt-2 mt-2" style="font-size: 0.95rem;">
                <span>Total Akhir:</span>
                <span class="text-indigo">{{ formatPrice(sale.totalAmount) }}</span>
              </div>

              <div v-if="sale.notes" class="mt-2 p-2 bg-light rounded text-muted" style="font-size: 0.8rem; font-style: italic;">
                "{{ sale.notes }}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- CHECKOUT PAYMENT MODAL -->
    <ion-modal ref="checkoutModal" :is-open="checkoutModalVisible" @didDismiss="checkoutModalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Pembayaran POS</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="checkoutModalVisible = false">Batal</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding bg-light">
        <div class="mobile-card p-3 mb-4">
          <div class="text-center py-3">
            <small class="text-muted d-block">TOTAL PEMBAYARAN</small>
            <div class="fs-2 fw-black text-indigo">{{ formatPrice(grandTotal) }}</div>
          </div>
        </div>

        <div class="mobile-card p-3 mb-4">
          <h6 class="fw-bold text-dark mb-3">Metode Pembayaran (M-01)</h6>
          <div class="row g-2 mb-4">
            <div class="col-6 col-md-3">
              <button 
                type="button" 
                class="btn w-100 btn-outline-teal py-2"
                :class="{ 'active': paymentMethod === 'cash' }"
                @click="paymentMethod = 'cash'; amountPaid = grandTotal"
              >💵 Tunai</button>
            </div>
            <div class="col-6 col-md-3">
              <button 
                type="button" 
                class="btn w-100 btn-outline-teal py-2"
                :class="{ 'active': paymentMethod === 'qris' }"
                @click="paymentMethod = 'qris'; amountPaid = grandTotal"
              >📱 QRIS</button>
            </div>
            <div class="col-6 col-md-3">
              <button 
                type="button" 
                class="btn w-100 btn-outline-teal py-2"
                :class="{ 'active': paymentMethod === 'transfer' }"
                @click="paymentMethod = 'transfer'; amountPaid = grandTotal"
              >🏦 Transfer</button>
            </div>
            <div class="col-6 col-md-3">
              <button 
                type="button" 
                class="btn w-100 btn-outline-teal py-2"
                :class="{ 'active': paymentMethod === 'card' }"
                @click="paymentMethod = 'card'; amountPaid = grandTotal"
              >💳 Debit/Kartu</button>
            </div>
          </div>

          <div v-if="paymentMethod === 'cash'">
            <div class="form-section px-0 mb-3">
              <label class="form-label">Uang Diterima (Tunai)</label>
              <NumberInput v-model="amountPaid" input-class="form-control app-control fs-6 fw-bold text-dark" />
            </div>

            <!-- Enhanced Quick Cash Buttons (B-02) -->
            <div class="mb-3">
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-primary btn-sm fw-bold px-3" @click="amountPaid = grandTotal">Uang Pas</button>
                <button type="button" class="btn btn-warning btn-sm fw-bold" @click="roundUpCash">Bulatkan</button>
                <button type="button" class="btn btn-light btn-sm border" @click="addQuickCash(10000)">+10k</button>
                <button type="button" class="btn btn-light btn-sm border" @click="addQuickCash(20000)">+20k</button>
                <button type="button" class="btn btn-light btn-sm border" @click="addQuickCash(50000)">+50k</button>
                <button type="button" class="btn btn-light btn-sm border" @click="amountPaid = 50000">50k</button>
                <button type="button" class="btn btn-light btn-sm border" @click="amountPaid = 100000">100k</button>
                <button type="button" class="btn btn-light btn-sm border" @click="amountPaid = 200000">200k</button>
              </div>
            </div>

            <!-- Change display -->
            <div class="d-flex justify-content-between align-items-center p-3 rounded" :class="changeAmount >= 0 ? 'bg-success-light' : 'bg-danger-light'">
              <span class="fw-semibold text-dark">Kembalian:</span>
              <span class="fs-6 fw-black" :class="changeAmount >= 0 ? 'text-success' : 'text-danger'">
                {{ changeAmount >= 0 ? formatPrice(changeAmount) : 'Kurang ' + formatPrice(Math.abs(changeAmount)) }}
              </span>
            </div>
          </div>

          <div v-else class="alert-info-box mt-2">
            <div class="d-flex gap-2">
              <span>💳</span>
              <div style="font-size: 0.78rem; color: #1e40af; line-height: 1.45;">
                <strong>QRIS atau Kartu:</strong> Nominal pembayaran akan disamakan secara otomatis sesuai tagihan ({{ formatPrice(grandTotal) }}). Pastikan pembayaran eksternal telah berhasil sebelum menekan tombol Selesai.
              </div>
            </div>
          </div>
        </div>

        <div class="p-3">
          <button 
            class="btn btn-action primary w-100 py-3 fw-bold fs-6" 
            :disabled="amountPaid < grandTotal" 
            @click="completeCheckout"
          >
            Selesaikan Transaksi
          </button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- DETAILED RECEIPT / STRUK MODAL -->
    <ion-modal ref="receiptModal" :is-open="receiptModalVisible" @didDismiss="receiptModalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Struk Penjualan</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="receiptModalVisible = false">Tutup</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding bg-light">
        <!-- Paper Size Selector (B-01) -->
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom mx-2">
          <span class="small text-muted fw-semibold">Format Lebar Kertas Struk:</span>
          <div class="btn-group btn-group-sm">
            <button 
              type="button" 
              class="btn btn-xs py-1 px-3"
              :class="selectedPaperWidth === '58mm' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedPaperWidth = '58mm'"
            >58mm (Kecil)</button>
            <button 
              type="button" 
              class="btn btn-xs py-1 px-3"
              :class="selectedPaperWidth === '80mm' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedPaperWidth = '80mm'"
            >80mm (Lebar)</button>
          </div>
        </div>

        <div v-if="activeSale" class="receipt-box-card mobile-card p-4 mx-2">
          <!-- Receipt Print Header -->
          <div class="text-center border-bottom pb-3 mb-3">
            <h4 class="fw-black mb-1 text-dark">{{ storeProfile.storeName }}</h4>
            <p class="text-muted small mb-0">{{ storeProfile.address }}</p>
            <p class="text-muted small mb-0" v-if="storeProfile.phone">Telp/WA: {{ storeProfile.phone }}</p>
            <div class="badge bg-indigo mt-1">INV-{{ activeSale.id }}</div>
          </div>

          <!-- Invoice Details -->
          <div class="mb-3 small text-dark">
            <div class="d-flex justify-content-between mb-1">
              <span>Tanggal:</span>
              <span class="fw-semibold">{{ formatDateTime(activeSale.createdAt) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span>Metode:</span>
              <span class="fw-semibold">{{ formatPaymentMethod(activeSale.paymentMethod) }}</span>
            </div>
          </div>

          <!-- Items list -->
          <div class="border-bottom pb-2 mb-3">
            <div v-for="item in activeSale.items" :key="item.productId" class="d-flex justify-content-between py-1 text-dark" style="font-size: 0.9rem;">
              <div>
                <span class="fw-bold">{{ item.name }}</span>
                <div class="text-muted small">{{ formatPrice(item.price) }} x {{ item.quantity }}</div>
              </div>
              <span class="fw-semibold">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>

          <!-- Calculation -->
          <div class="mb-3 text-dark" style="font-size: 0.92rem;">
            <div class="d-flex justify-content-between mb-1">
              <span>Subtotal:</span>
              <span>{{ formatPrice(activeSale.subtotal || getSaleSubtotal(activeSale)) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1 text-danger" v-if="activeSale.discountAmount > 0 || getSaleDiscount(activeSale) > 0">
              <span>Diskon ({{ activeSale.discount || 0 }}%):</span>
              <span>-{{ formatPrice(activeSale.discountAmount || getSaleDiscount(activeSale)) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1" v-if="(activeSale.taxAmount || getSaleTax(activeSale)) > 0">
              <span>Pajak ({{ activeSale.taxRate !== undefined ? activeSale.taxRate : (storeProfile.enableTax ? storeProfile.taxRate : 0) }}%):</span>
              <span>{{ formatPrice(activeSale.taxAmount || getSaleTax(activeSale)) }}</span>
            </div>
            <div class="d-flex justify-content-between border-top pt-2 fw-black fs-5">
              <span>Total Akhir:</span>
              <span class="text-indigo">{{ formatPrice(activeSale.totalAmount) }}</span>
            </div>
            <div class="d-flex justify-content-between text-muted mt-2 small">
              <span>Bayar:</span>
              <span>{{ formatPrice(activeSale.amountPaid) }}</span>
            </div>
            <div class="d-flex justify-content-between text-muted small">
              <span>Kembali:</span>
              <span>{{ formatPrice(activeSale.changeAmount) }}</span>
            </div>
          </div>

          <div v-if="activeSale.notes" class="alert-info-box mb-3 py-2 px-3">
            <small class="d-block text-muted">Catatan:</small>
            <span class="text-dark small">"{{ activeSale.notes }}"</span>
          </div>

          <!-- Footer -->
          <div class="text-center pt-3 border-top text-muted small">
            <p class="mb-0 fw-semibold">{{ storeProfile.receiptHeader || 'Terima Kasih atas Kunjungan Anda!' }}</p>
            <p>{{ storeProfile.receiptFooter || 'Barang yang sudah dibeli tidak dapat ditukar.' }}</p>
          </div>
        </div>

        <div class="px-2 pb-4 d-flex flex-column gap-2">
          <div class="input-group">
            <span class="input-group-text bg-white text-muted text-xs">No. WA (Opsional)</span>
            <input type="tel" v-model="customerWaNumber" class="form-control app-control" placeholder="08123456789" />
          </div>
          <button class="btn btn-action success w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" @click="shareReceiptWhatsApp">
            <ion-icon :icon="logoWhatsapp" /> Kirim Struk ke WhatsApp
          </button>
          <button class="btn btn-action primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" @click="printReceipt">
            <ion-icon :icon="printOutline" /> Cetak Struk
          </button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Hapus Sale Alert -->
    <ion-alert
      :is-open="deleteSaleId !== null"
      header="Hapus Transaksi"
      message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Stok tidak akan dikembalikan otomatis."
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: cancelDeleteSale },
        { text: 'Hapus', role: 'destructive', handler: deleteSale }
      ]"
      @didDismiss="cancelDeleteSale"
    />

    <!-- Hidden Receipt Print Div -->
    <div id="print-section" class="d-none">
      <div v-if="activeSale" :style="{ fontFamily: 'monospace', width: selectedPaperWidth === '58mm' ? '210px' : '300px', padding: selectedPaperWidth === '58mm' ? '8px' : '18px', color: 'black', background: 'white', fontSize: selectedPaperWidth === '58mm' ? '10px' : '12px', lineHeight: '1.3' }">
        <div style="text-align: center; border-bottom: 1px dashed black; padding-bottom: 8px; margin-bottom: 8px;">
          <h3 :style="{ margin: '0 0 4px', fontSize: selectedPaperWidth === '58mm' ? '13px' : '16px' }">{{ storeProfile.storeName.toUpperCase() }}</h3>
          <p style="margin: 0;">{{ storeProfile.address }}</p>
          <p style="margin: 0;" v-if="storeProfile.phone">Telp/WA: {{ storeProfile.phone }}</p>
          <p style="margin: 4px 0 0;">INV-{{ activeSale.id }}</p>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Tgl:</span>
            <span>{{ formatDateTime(activeSale.createdAt) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Kasir:</span>
            <span>Administrator</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Cara Bayar:</span>
            <span>{{ formatPaymentMethod(activeSale.paymentMethod) }}</span>
          </div>
        </div>

        <div style="border-bottom: 1px dashed black; padding-bottom: 10px; margin-bottom: 10px;">
          <div v-for="item in activeSale.items" :key="item.productId" style="margin-bottom: 8px;">
            <div style="font-weight: bold;">{{ item.name }}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>{{ formatPrice(item.price) }} x{{ item.quantity }}</span>
              <span>{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
        </div>

        <div style="border-bottom: 1px dashed black; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>{{ formatPrice(activeSale.subtotal || getSaleSubtotal(activeSale)) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: red;" v-if="activeSale.discountAmount > 0 || getSaleDiscount(activeSale) > 0">
            <span>Diskon ({{ activeSale.discount || 0 }}%):</span>
            <span>-{{ formatPrice(activeSale.discountAmount || getSaleDiscount(activeSale)) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;" v-if="(activeSale.taxAmount || getSaleTax(activeSale)) > 0">
            <span>Pajak ({{ activeSale.taxRate !== undefined ? activeSale.taxRate : (storeProfile.enableTax ? storeProfile.taxRate : 0) }}%):</span>
            <span>{{ formatPrice(activeSale.taxAmount || getSaleTax(activeSale)) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>{{ formatPrice(activeSale.totalAmount) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <span>Bayar:</span>
            <span>{{ formatPrice(activeSale.amountPaid) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Kembali:</span>
            <span>{{ formatPrice(activeSale.changeAmount) }}</span>
          </div>
        </div>

        <div v-if="activeSale.notes" style="margin-bottom: 10px; font-style: italic; border-bottom: 1px dashed black; padding-bottom: 5px;">
          Catatan: "{{ activeSale.notes }}"
        </div>

        <div style="text-align: center;">
          <p style="margin: 0; font-weight: bold;">Terima Kasih!</p>
          <p style="margin: 0;">Barang yang sudah dibeli tidak dapat ditukar.</p>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script>
import { ref, onMounted, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { ProductRepository, CategoryRepository, salesRepo, stockMutationsRepo } from '../../db/repositories'
import { businessProfile, BusinessProfileRepository } from '../../db/businessProfile'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonButtons, IonBackButton, IonModal, IonAlert, toastController, IonGrid, IonRow, IonCol, IonCard, IonCardContent, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, removeOutline, trashOutline, cartOutline, basketOutline, printOutline, downloadOutline, calendarOutline, documentTextOutline, logoWhatsapp, searchOutline as searchIcon } from 'ionicons/icons';
import { readProductImage } from '../../composables/useProductImage';
import * as XLSX from 'xlsx';

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

export default {
  name: 'CashierView',
  components: { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, 
    IonSegment, IonSegmentButton, IonLabel, IonButtons, IonBackButton, IonModal, IonAlert, VueApexCharts,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent
  },
  setup() {
    const activeTab = ref('pos')
    const products = ref([])
    const categories = ref([])
    const salesHistory = ref([])
    
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

    // POS/Cart states
    const searchQuery = ref('')
    const selectedCategory = ref('all')
    // expose icon for template
    const searchOutline = searchIcon;
    const cart = ref([])
    const discountType = ref('percent') // 'percent' | 'fixed'
    const discountValue = ref(0)
    const discount = discountValue // backward compat
    const notes = ref('')

    // Checkout modal states
    const checkoutModalVisible = ref(false)
    const paymentMethod = ref('cash')
    const amountPaid = ref(0)

    // Detailed receipt modal states
    const receiptModalVisible = ref(false)
    const activeSale = ref(null)
    const deleteSaleId = ref(null)

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

    const getCategoryName = (catId) => {
      const cat = categories.value.find(c => c.id === catId)
      return cat ? cat.name : 'Lainnya'
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
      salesHistory.value = (await salesRepo.getAll()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      nextTick(() => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 100)
      })
    }

    onMounted(loadData)

    // POS Products Filter
    const filteredProducts = computed(() => {
      return products.value.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesCategory = selectedCategory.value === 'all' || p.categoryId === selectedCategory.value
        return matchesSearch && matchesCategory
      })
    })

    const storeProfile = businessProfile
    const currentTaxRate = computed(() => (storeProfile.value?.enableTax ? (storeProfile.value.taxRate || 0) : 0))
    const selectedPaperWidth = ref(storeProfile.value.receiptPaperWidth || '58mm')
    const customerWaNumber = ref('')

    // Cart Calculations
    const cartCount = computed(() => cart.value.reduce((total, item) => total + item.quantity, 0))
    const subtotal = computed(() => cart.value.reduce((total, item) => total + (item.price * item.quantity), 0))
    const discountAmount = computed(() => {
      if (discountType.value === 'percent') {
        const pct = Math.min(Math.max(discountValue.value || 0, 0), 100)
        return Math.round((subtotal.value * pct) / 100)
      } else {
        return Math.min(Math.max(discountValue.value || 0, 0), subtotal.value)
      }
    })
    const tax = computed(() => Math.round((subtotal.value - discountAmount.value) * (currentTaxRate.value / 100)))
    const grandTotal = computed(() => Math.max(0, subtotal.value - discountAmount.value + tax.value))
    const changeAmount = computed(() => amountPaid.value - grandTotal.value)

    const roundUpCash = () => {
      if (grandTotal.value <= 0) return
      const step = grandTotal.value >= 100000 ? 50000 : 10000
      amountPaid.value = Math.ceil(grandTotal.value / step) * step
    }

    const showToast = async (msg, color = 'success') => {
      const toast = await toastController.create({
        message: msg,
        duration: 2000,
        color: color,
        position: 'top'
      })
      await toast.present()
    }

    const addToCart = (product, isIncreaseOnly = false) => {
      const existing = cart.value.find(item => item.id === product.id)
      const currentQty = existing ? existing.quantity : 0
      
      if (currentQty + 1 > product.stock) {
        showToast(`Stok tidak mencukupi! Hanya tersedia ${product.stock} unit.`, 'warning')
        return
      }

      if (existing) {
        existing.quantity++
      } else {
        cart.value.push({
          id: product.id,
          name: product.name,
          price: product.price,
          costPrice: product.costPrice || 0,
          stock: product.stock,
          quantity: 1
        })
      }
    }

    const clearCart = () => {
      cart.value = []
      discountValue.value = 0
      notes.value = ''
    }

    const updateQty = (productId, delta) => {
      const item = cart.value.find(c => c.id === productId)
      if (!item) return
      if (delta > 0) {
        if (item.quantity + 1 > item.stock) {
          showToast(`Stok tidak mencukupi! Hanya tersedia ${item.stock} unit.`, 'warning')
          return
        }
        item.quantity++
      } else {
        item.quantity--
        if (item.quantity <= 0) {
          removeFromCart(item.id)
        }
      }
    }

    const decreaseQty = (item) => {
      const existing = cart.value.find(c => c.id === (item?.id || item))
      if (existing) {
        existing.quantity--
        if (existing.quantity <= 0) {
          removeFromCart(existing.id)
        }
      }
    }

    const removeFromCart = (itemOrId) => {
      const id = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId.id : itemOrId
      cart.value = cart.value.filter(c => c.id !== id)
    }

    const openCheckout = () => {
      if (cart.value.length === 0) {
        showToast('Keranjang belanja masih kosong!', 'warning')
        return
      }
      paymentMethod.value = 'cash'
      amountPaid.value = grandTotal.value
      checkoutModalVisible.value = true
    }

    const addQuickCash = (amt) => {
      amountPaid.value += amt
    }

    const completeCheckout = async () => {
      if (amountPaid.value < grandTotal.value) {
        showToast('Jumlah uang dibayarkan kurang!', 'danger')
        return
      }

      // Check stock once more
      for (const item of cart.value) {
        const prod = await ProductRepository.getById(item.id)
        if (!prod || prod.stock < item.quantity) {
          showToast(`Stok ${item.name} tidak mencukupi untuk diselesaikan!`, 'danger')
          return
        }
      }

      // Save transaction first
      const totalCostCalc = cart.value.reduce((sum, c) => sum + ((c.costPrice || 0) * c.quantity), 0)
      const saleRecord = {
        items: cart.value.map(c => ({
          productId: c.id,
          name: c.name,
          price: c.price,
          costPrice: c.costPrice || 0,
          quantity: c.quantity
        })),
        subtotal: subtotal.value,
        discount: discountValue.value,
        discountType: discountType.value,
        discountAmount: discountAmount.value,
        taxAmount: tax.value,
        taxRate: currentTaxRate.value,
        totalAmount: grandTotal.value,
        totalCost: totalCostCalc,
        profit: grandTotal.value - totalCostCalc,
        paymentMethod: paymentMethod.value,
        amountPaid: amountPaid.value,
        changeAmount: changeAmount.value,
        notes: notes.value,
        paperWidth: selectedPaperWidth.value
      }

      const savedSale = await salesRepo.add(saleRecord)
      activeSale.value = savedSale

      // Deduct stock and log mutation
      for (const item of cart.value) {
        const prod = await ProductRepository.getById(item.id)
        const newStock = prod.stock - item.quantity
        await ProductRepository.update(item.id, { ...prod, stock: newStock })

        await stockMutationsRepo.add({
          productId: item.id,
          type: 'sale',
          changeQuantity: -item.quantity,
          beforeStock: prod.stock,
          afterStock: newStock,
          notes: `Penjualan POS INV-${savedSale.id}`
        })
      }

      // Clear POS cart states
      cart.value = []
      discountValue.value = 0
      notes.value = ''
      amountPaid.value = 0

      checkoutModalVisible.value = false
      await loadData()
      showToast('Transaksi berhasil disimpan!', 'success')
      
      // Auto open receipt printed
      receiptModalVisible.value = true
    }

    const openReceipt = (sale) => {
      activeSale.value = sale
      receiptModalVisible.value = true
    }

    const getSaleSubtotal = (sale) => sale.subtotal || sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const getSaleDiscount = (sale) => sale.discountAmount || Math.round((getSaleSubtotal(sale) * (sale.discount || 0)) / 100)
    const getSaleTax = (sale) => {
      if (sale.taxAmount !== undefined && sale.taxAmount !== null) return sale.taxAmount
      if (sale.taxRate && sale.taxRate > 0) {
        return Math.round((getSaleSubtotal(sale) - getSaleDiscount(sale)) * (sale.taxRate / 100))
      }
      return 0
    }

    const printReceipt = () => {
      // Show hidden print div for printing, run print, then hide it
      const printSection = document.getElementById('print-section')
      if (printSection) {
        const printContent = printSection.innerHTML
        const is58 = selectedPaperWidth.value === '58mm'
        const printWidth = is58 ? '58mm' : '80mm'
        const bodyWidth = is58 ? '48mm' : '72mm'
        const fontSize = is58 ? '10px' : '12px'
        
        const popupWin = window.open('', '_blank', 'width=380,height=600')
        popupWin.document.open()
        popupWin.document.write(`
          <html>
            <head>
              <title>Print Receipt</title>
              <style>
                @page { size: ${printWidth} auto; margin: 0; }
                body { 
                  margin: 0 auto; 
                  padding: 8px; 
                  width: ${bodyWidth}; 
                  font-family: 'Courier New', Courier, monospace; 
                  font-size: ${fontSize}; 
                  line-height: 1.3;
                  color: #000;
                }
                @media print { 
                  body { margin: 0 auto; padding: 4px; } 
                }
              </style>
            </head>
            <body onload="window.print();window.close();">
              ${printContent}
            </body>
          </html>
        `)
        popupWin.document.close()
      }
    }

    const shareReceiptWhatsApp = () => {
      if (!activeSale.value) return
      const s = activeSale.value
      const store = storeProfile.value
      let text = `🧾 *STRUK PEMBAYARAN*\n`
      text += `🏪 *${store.storeName}*\n`
      if (store.address) text += `📍 ${store.address}\n`
      if (store.phone) text += `📞 Telp/WA: ${store.phone}\n`
      text += `--------------------------------\n`
      text += `No. Nota: INV-${s.id}\n`
      text += `Tanggal : ${formatDateTime(s.createdAt)}\n`
      text += `Metode  : ${formatPaymentMethod(s.paymentMethod)}\n`
      text += `--------------------------------\n`
      s.items.forEach(it => {
        text += `• ${it.name}\n  ${it.quantity} x ${formatPrice(it.price)} = ${formatPrice(it.quantity * it.price)}\n`
      })
      text += `--------------------------------\n`
      text += `Subtotal : ${formatPrice(s.subtotal || getSaleSubtotal(s))}\n`
      if ((s.discountAmount || 0) > 0) text += `Diskon   : -${formatPrice(s.discountAmount)}\n`
      if ((s.taxAmount || 0) > 0) text += `Pajak (${s.taxRate !== undefined ? s.taxRate : (store.taxRate || 0)}%): ${formatPrice(s.taxAmount)}\n`
      text += `*TOTAL   : ${formatPrice(s.totalAmount)}*\n`
      text += `Bayar    : ${formatPrice(s.amountPaid)}\n`
      text += `Kembali  : ${formatPrice(s.changeAmount)}\n`
      text += `--------------------------------\n`
      if (store.receiptFooter) text += `${store.receiptFooter}\n`

      let cleanPhone = (customerWaNumber.value || '').replace(/\D/g, '')
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1)

      const url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
    }

    const confirmDeleteSale = (id) => {
      deleteSaleId.value = id
    }

    const cancelDeleteSale = () => {
      deleteSaleId.value = null
    }

    const deleteSale = async () => {
      if (deleteSaleId.value !== null) {
        await salesRepo.delete(deleteSaleId.value)
        deleteSaleId.value = null
        await loadData()
        showToast('Transaksi berhasil dihapus.', 'warning')
      }
    }

    const formatPaymentMethod = (method) => {
      if (method === 'cash') return 'Tunai'
      if (method === 'qris') return 'QRIS'
      if (method === 'transfer') return 'Transfer Bank'
      if (method === 'card') return 'Debit/Kartu'
      return method
    }

    const formatDateTime = (isoString) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    // Monitoring KPI Analytics Computations
    const kpiMetrics = computed(() => {
      const todayStr = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const todaySales = salesHistory.value.filter(s => s.createdAt.startsWith(todayStr))
      const monthSales = salesHistory.value.filter(s => {
        const d = new Date(s.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      const salesTodaySum = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)
      const salesMonthSum = monthSales.reduce((sum, s) => sum + s.totalAmount, 0)

      const totalRevenue = salesHistory.value.reduce((sum, s) => sum + s.totalAmount, 0)
      const avgBasketVal = salesHistory.value.length > 0 ? Math.round(totalRevenue / salesHistory.value.length) : 0

      return {
        salesToday: salesTodaySum,
        countToday: todaySales.length,
        salesMonth: salesMonthSum,
        countMonth: monthSales.length,
        avgBasket: avgBasketVal
      }
    })

    // Top Selling Products Calculation
    const topProducts = computed(() => {
      const map = {}
      salesHistory.value.forEach(sale => {
        sale.items.forEach(item => {
          if (!map[item.name]) {
            map[item.name] = { name: item.name, qtySold: 0, revenue: 0 }
          }
          map[item.name].qtySold += item.quantity
          map[item.name].revenue += item.price * item.quantity
        })
      })

      return Object.values(map)
        .sort((a, b) => b.qtySold - a.qtySold)
        .slice(0, 5)
    })

    // Trend Chart Options and Data
    const chartSeries = computed(() => {
      // Daily revenue for last 7 days
      const seriesData = []
      const today = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        
        const daySales = salesHistory.value.filter(s => s.createdAt && s.createdAt.startsWith(dateStr))
        const dayTotal = daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
        
        seriesData.push(Number.isFinite(dayTotal) ? dayTotal : 0)
      }

      return [{
        name: 'Omset Penjualan',
        data: seriesData
      }]
    })

    const chartOptions = computed(() => {
      const categoriesData = []
      const today = new Date()

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        categoriesData.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }))
      }

      return {
        chart: {
          id: 'sales-trend',
          type: 'area',
          toolbar: { show: false },
          sparkline: { enabled: false },
          zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          colors: ['#6366f1'],
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: categoriesData,
          labels: { style: { colors: '#64748b', fontWeight: 600 } }
        },
        yaxis: {
          labels: {
            formatter: (val) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(val),
            style: { colors: '#64748b', fontWeight: 600 }
          }
        },
        tooltip: {
          y: {
            formatter: (val) => formatPrice(val)
          }
        },
        colors: ['#6366f1']
      }
    })

    // Export Sales History report to Excel
    const exportExcel = () => {
      if (salesHistory.value.length === 0) {
        showToast('Tidak ada data transaksi untuk diekspor!', 'warning')
        return
      }

      const rows = []
      salesHistory.value.forEach(sale => {
        sale.items.forEach(item => {
          rows.push({
            'ID Transaksi': 'INV-' + sale.id,
            'Tanggal': formatDateTime(sale.createdAt),
            'Cara Bayar': formatPaymentMethod(sale.paymentMethod),
            'Nama Produk': item.name,
            'Harga Satuan': item.price,
            'Jumlah': item.quantity,
            'Subtotal Item': item.price * item.quantity,
            'Diskon Transaksi (%)': sale.discount || 0,
            'Diskon Transaksi (IDR)': sale.discountAmount || 0,
            'Pajak Transaksi (PPN)': sale.taxAmount || 0,
            'Tarif Pajak (%)': sale.taxRate !== undefined ? sale.taxRate : 0,
            'Total Akhir Transaksi': sale.totalAmount,
            'Uang Diterima': sale.amountPaid,
            'Uang Kembalian': sale.changeAmount,
            'Catatan': sale.notes || ''
          })
        })
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan_Kasir')

      // Set columns widths
      const max_width = rows.reduce((w, r) => Math.max(w, Object.keys(r).length), 10)
      worksheet['!cols'] = Array(max_width).fill({ wch: 18 })

      XLSX.writeFile(workbook, `Laporan_Kasir_SME_${new Date().toISOString().split('T')[0]}.xlsx`)
      showToast('Laporan Excel berhasil diunduh!', 'success')
    }

    onMounted(loadData)
    onIonViewWillEnter(loadData)

    return {
      activeTab,
      products,
      categories,
      salesHistory,
      searchQuery,
      selectedCategory,
      cart,
      discount,
      discountType,
      discountValue,
      roundUpCash,
      selectedPaperWidth,
      notes,
      checkoutModalVisible,
      paymentMethod,
      amountPaid,
      receiptModalVisible,
      activeSale,
      deleteSaleId,
      formatPrice,
      getCategoryName,
      filteredProducts,
      cartCount,
      subtotal,
      discountAmount,
      tax,
      taxAmount: tax,
      grandTotal,
      totalAmount: grandTotal,
      changeAmount,
      addToCart,
      clearCart,
      updateQty,
      decreaseQty,
      removeFromCart,
      openCheckout,
      openCheckoutModal: openCheckout,
      addQuickCash,
      completeCheckout,
      openReceipt,
      getSaleSubtotal,
      getSaleDiscount,
      getSaleTax,
      printReceipt,
      confirmDeleteSale,
      cancelDeleteSale,
      deleteSale,
      formatPaymentMethod,
      formatDateTime,
      kpiMetrics,
      topProducts,
      chartSeries,
      chartOptions,
      exportExcel,
      addOutline,
      removeOutline,
      trashOutline,
      cartOutline,
      basketOutline,
      printOutline,
      downloadOutline,
      calendarOutline,
      documentTextOutline,
      searchOutline,
      storeProfile,
      currentTaxRate,
      customerWaNumber,
      shareReceiptWhatsApp,
      logoWhatsapp
    }
  }
}
</script>

<style scoped>
.pos-product-card {
  transition: transform 0.15s ease;
}
.pos-product-card:active {
  transform: scale(0.96);
}
.sticky-cart {
  position: sticky;
  top: 15px;
}
.bg-success-light {
  background-color: #d1e7dd !important;
}
.bg-danger-light {
  background-color: #f8d7da !important;
}
.text-success {
  color: #0f5132 !important;
}
.text-danger {
  color: #842029 !important;
}
.receipt-box-card {
  font-family: 'Courier New', Courier, monospace;
}
</style>
