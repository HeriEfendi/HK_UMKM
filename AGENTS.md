# AGENTS.md — PANDUAN STANDAR ARSITEKTUR & PENGEMBANGAN PROJEK HK UMKM

> **DOKUMEN INI WAJIB DIBACA DAN DIPATUHI OLEH SETIAP AI AGENT SEBELUM MEMULAI ATAU MEMODIFIKASI KODE DALAM PROJEK INI.**

---

## 🏛️ 1. MANDAT UTAMA & PERSONA ARSITEK

> **"Anda adalah arsitek perangkat lunak senior. Anda selalu memprioritaskan kode yang modular, bersih, dan terstruktur rapi. Anda dilarang keras menumpuk semua logika ke dalam satu file tunggal. Setiap komponen atau modul harus dipecah ke dalam filenya masing-masing sesuai standar industri."**

### Prinsip Inti:
1. **Single Responsibility Principle (SRP)**: Satu file hanya boleh memiliki satu tanggung jawab utama.
2. **Anti-Monolith / Anti-God-Component**: File Vue SFC dilarang memuat ribuan baris yang menggabungkan UI layout, logic chart, modal CRUD, perhitungan KPI, kalkulasi filter, dan transaksi DB sekaligus.
3. **High Cohesion, Low Coupling**: Pisahkan UI presentational, business logic (composables), dan data access layer (repositories).
4. **DRY (Don't Repeat Yourself)**: Dilarang mengulang-ulang blok HTML/CSS yang sama (seperti kotak pencarian, tampilan kosong/empty state, footer pagination, atau kartu statistik). Selalu gunakan shared component dari `src/components/`.

---

## 🎨 2. STANDARISASI CSS: DILARANG MENULIS VANILLA CSS SEMBARANGAN

Projek ini **resmi mengadopsi Bootstrap 5 + Ionic Framework**. Anda **DILARANG KERAS** membuat custom vanilla CSS baru atau inline styles (`style="..."`) untuk utilitas yang sudah disediakan oleh Bootstrap 5 dan Ionic.

### 🚫 Praktik yang Dilarang (Bad Practices):
```html
<!-- DILARANG: Menulis inline style untuk layout & spacing -->
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px;">

<!-- DILARANG: Membuat class vanilla CSS baru di <style> untuk utilitas umum -->
<style scoped>
.my-custom-flex {
  display: flex;
  font-weight: bold;
  color: #6c757d;
}
</style>
```

### ✅ Praktik yang Wajib Digunakan (Best Practices):
Gunakan utility class **Bootstrap 5** dan komponen **Ionic**:
```html
<!-- WAJIB: Gunakan utility classes Bootstrap 5 -->
<div class="d-flex justify-content-between align-items-center mb-3 p-2">
  <span class="fw-bold text-muted">Contoh</span>
</div>
```

### 📋 Tabel Mapping Standarisasi CSS:

| Kebutuhan Desain | Jangan Pakai Vanilla CSS | Gunakan Utility Bootstrap 5 / Ionic |
| :--- | :--- | :--- |
| **Flexbox Layout** | `display: flex; justify-content: ...;` | `d-flex`, `justify-content-between`, `align-items-center`, `flex-column`, `gap-2` |
| **Grid Responsif** | `display: grid; grid-template-columns: ...` | `row`, `col-12`, `col-sm-6`, `col-lg-4`, `g-2` atau `<ion-grid>`, `<ion-row>`, `<ion-col>` |
| **Margin & Padding** | `margin: 10px; padding: 15px;` | `m-2`, `mb-3`, `my-2`, `p-3`, `px-2`, `py-1` |
| **Tipografi & Teks** | `font-weight: bold; text-align: right;` | `fw-bold`, `fw-semibold`, `text-center`, `text-end`, `text-truncate`, `fs-6` |
| **Warna Teks** | `color: #007bff; color: gray;` | `text-primary`, `text-success`, `text-danger`, `text-muted`, `text-dark` |
| **Badge & Pill** | `border-radius: 999px; padding: 4px;` | `badge bg-primary`, `badge bg-secondary`, `rounded-pill` |
| **Batas & Radius** | `border: 1px solid #dee2e6; border-radius: 8px;` | `border`, `border-top`, `rounded`, `rounded-3`, `shadow-sm` |
| **Mobile Structure** | `overflow-y: scroll; height: 100vh;` | `<ion-page>`, `<ion-content>`, `<ion-header>`, `<ion-toolbar>`, `<ion-modal>` |
| **Variabel Tema** | Hardcoded HEX `#6366f1` | Gunakan token dari `src/style.css`: `var(--color-indigo)`, `var(--bs-primary)` |

> *Pengecualian*: Vanilla CSS di `<style scoped>` **hanya diizinkan** untuk styling unik tingkat tinggi yang tidak didukung Bootstrap/Ionic (misalnya: animasi keyframes CSS khusus, visual preview struk kasir termal 58mm/80mm, atau canvas rendering).

---

## 📦 3. KATALOG & PROTOKOL KOMPONEN REUSABLE GLOBAL (`src/components/`)

### 🔄 PROTOKOL WAJIB: "CEK DULU, PAKAI YANG ADA, ATAU BUATKAN GLOBAL BARU"
Setiap kali AI Agent atau developer hendak menambahkan atau memodifikasi antarmuka pengguna (UI/UX), **WAJIB** mematuhi 3 langkah protokol *Component-First* berikut:

1. 🔍 **Langkah 1 — Cek Katalog Komponen Eksis Terlebih Dahulu**:
   - Selalu periksa direktori `src/components/` atau daftar katalog di bawah ini sebelum menulis markup HTML/CSS baru di halaman view.
   - **Jika komponen sudah ada** (misalnya `SearchInput`, `EmptyState`, `AppButton`, `AppInput`, `MetricCard`, `LoadMoreFooter`, `AppModalHeader`, `NumberInput`, dll.), Anda **DILARANG KERAS** menulis ulang markup mentah atau inline style. **WAJIB GUNAKAN KOMPONEN YANG SUDAH TERSEDIA!**

2. 🔨 **Langkah 2 — Jika Belum Ada & Bersifat Repetitif, Buatkan Versi Globalnya**:
   - Jika Anda menemukan kebutuhan elemen UI yang berulang atau berpotensi dipakai di halaman lain (misalnya tombol aksi khusus, filter bar, form input varian baru, modal dialog, kartu pratinjau) dan **BELUM ADA** di `src/components/`:
   - **DILARANG KERAS** menulis kode ad-hoc atau menumpuk markup lokal di file view!
   - **WAJIB LANGSUNG BUATKAN** komponen Vue baru di `src/components/NamaKomponen.vue` yang modular, bersih, fleksibel (*props, slots, emits*), dan mengadopsi styling Bootstrap 5 + Ionic.
   - **Daftarkan secara global** di `src/main.js` (`app.component('NamaKomponen', NamaKomponen)`).
   - **Wajib perbarui dokumentasi `AGENTS.md`** dengan menambahkan komponen baru tersebut ke katalog di bawah, lengkap dengan deskripsi props dan contoh kodenya agar agen selanjutnya selalu menggunakannya.

3. 🚀 **Langkah 3 — Terapkan di View Terkait**:
   - Gunakan komponen global yang baru dibuat di halaman yang sedang dikerjakan, dan bila relevan terapkan juga ke view lain yang memiliki pola serupa agar tercipta konsistensi total (DRY).

---

### 📚 KATALOG KOMPONEN GLOBAL RESMI

Komponen-komponen berikut telah terdaftar secara **GLOBAL** di `src/main.js`. Agen **WAJIB** menggunakannya dan dilarang menulis ulang markup/CSS manual untuk fitur serupa:

### 1. `SearchInput` — Kotak Pencarian Terstandar
Menyediakan input dengan ikon pencarian, tombol hapus otomatis (clear button), dan styling Bootstrap tanpa inline-style kotor.
```html
<!-- Contoh Penggunaan -->
<SearchInput 
  v-model="searchQuery" 
  placeholder="Cari transaksi atau kategori..." 
  size="sm" 
/>
```

### 2. `EmptyState` — Tampilan Data Kosong
Menggantikan puluhan baris empty state manual di berbagai view dengan ikon seragam, judul, deskripsi, dan tombol aksi opsional.
```html
<!-- Contoh Penggunaan -->
<EmptyState
  :icon="calendarOutline"
  title="Belum Ada Transaksi"
  message="Klik tombol di bawah untuk mencatat transaksi baru."
  action-text="Tambah Transaksi"
  action-variant="primary"
  @action="openCreateModal"
/>
```

### 3. `AppButton` — Tombol Aksi Seragam
Menggabungkan styling `.btn-action`, ikon ionicons, spinner loading, dan varian warna sesuai design system.
```html
<!-- Contoh Penggunaan -->
<AppButton 
  variant="primary" 
  size="sm" 
  :icon="addOutline" 
  :loading="submitting" 
  @click="handleSave"
>
  Simpan Transaksi
</AppButton>
```

### 4. `LoadMoreFooter` — Footer Pagination & Lazy Loading
Mengenkapsulasi `<ion-infinite-scroll>`, tombol manual *"Muat Lebih Banyak"*, serta teks akhir *"Semua X data telah ditampilkan"*.
```html
<!-- Contoh Penggunaan -->
<LoadMoreFooter
  :has-more="hasMoreTransactions"
  :displayed-count="displayedTransactions.length"
  :total-count="filteredTransactions.length"
  item-name="transaksi"
  @load-more="loadMoreTransactions"
/>
```

### 5. `MetricCard` — Kartu KPI & Snapshot Ringkasan
Standar kartu ringkasan keuangan dan analitik dengan tipografi rapi, penyesuaian dark-mode, dan badge status.
```html
<!-- Contoh Penggunaan -->
<MetricCard
  title="Total Saldo Kas"
  :value="formatCurrency(totalBalance)"
  subtitle="Akumulasi seluruh proyek"
  color="primary"
  :icon="walletOutline"
/>
```

### 6. `NumberInput` — Input Angka dengan Format Ribuan IDR
Input angka dengan pemisah titik otomatis untuk nominal uang (Rupiah).
```html
<!-- Contoh Penggunaan -->
<NumberInput v-model="amount" placeholder="0" />
```

### 7. `AppInput` — Input Form Serbaguna Terstandar
Menyediakan input teks/email/password/textarea dengan integrasi label, indikator wajib (`required`), hint, pesan error validasi, dan icon prefix/suffix.
```html
<!-- Contoh Penggunaan -->
<AppInput 
  v-model="form.name" 
  label="Nama Lengkap" 
  placeholder="Masukkan nama..." 
  required 
  :error="errors.name" 
/>
<AppInput 
  v-model="form.description" 
  label="Keterangan" 
  type="textarea" 
  :rows="3" 
  placeholder="Catatan tambahan..." 
/>
```

### 8. `AppModalHeader` — Header Modal Seragam
Mengenkapsulasi header toolbar modal dengan judul tebal dan tombol tutup konsisten.
```html
<!-- Contoh Penggunaan -->
<AppModalHeader title="Tambah Data Baru" @close="closeModal" />
```

---

## 🧩 4. STRUKTUR MODULARITAS PROJEK & DEKOMPOSISI KODE

Setiap fitur yang mulai membesar atau memiliki lebih dari ~300 baris **WAJIB dipecah** mengikuti arsitektur modular berikut:

```
src/
├── views/feature_name/
│   ├── IndexView.vue              # Entry point / Orchestrator utama halaman
│   ├── components/                # Sub-komponen modular UI yang dipecah
│   │   ├── FeatureHeader.vue      # Header hero & action buttons
│   │   ├── FeatureFilterBar.vue   # Filter chip, search box, select status
│   │   ├── FeatureCard.vue        # Item card individual (equal height, clean)
│   │   ├── FeatureMetricCards.vue # KPI metrics snapshot
│   │   └── FeatureModal.vue       # Form modal create / edit terpisah
│   └── composables/               # (Opsional) Composable lokal jika khusus fitur ini
│       ├── useFeatureData.ts      # Fetching, loadData, reload
│       └── useFeatureFilters.ts   # Search query, reactive filter computation
├── composables/                   # Logika state / bisnis yang dapat dipakai ulang (reusable)
├── db/
│   ├── schema.ts                  # Definisi Dexie table & interface TypeScript
│   └── repositories/              # Layer akses database (Repository Pattern)
│       └── featureRepository.ts   # CRUD logic murni terpisah dari View
├── utils/                         # Helper murni (formatIDR, date, chartThemes, exportExcel)
└── components/                    # Komponen global shared (SearchInput, MetricCard, EmptyState, dll.)
```

### 🛑 Aturan Pemisahan Tanggung Jawab:
1. **UI View (`.vue`)**: Hanya bertugas menampilkan data dan menangani event interaksi pengguna.
2. **Business Logic / State**: Diekstrak ke Vue Composables (`src/composables/use*.ts`).
3. **Database Queries**: Dilarang memanggil `db.table('xxx').put(...)` langsung di dalam template Vue; selalu gunakan fungsi di `src/db/repositories/`.
4. **Modal Dialogs**: Semua modal form kompleks (seperti Form Tambah/Edit, Preview Nota, Cetak Barcode) **harus dibuat dalam file komponen terpisah**, bukan ditumpuk di bawah file view utama.

---

## ⚡ 5. STANDAR PERFORMA: LAZY LOADING PADA SEMUA LIST DATA

Setiap kali membuat atau memperbarui halaman yang menampilkan data transaksi, produk, inventaris, log, atau catatan:
1. **Wajib Menerapkan Lazy Loading / Chunk Slicing**:
   ```ts
   const displayLimit = ref(25)
   const displayedItems = computed(() => filteredItems.value.slice(0, displayLimit.value))
   const hasMore = computed(() => displayedItems.value.length < filteredItems.value.length)
   const loadMore = (ev?: any) => {
     displayLimit.value += 25
     if (ev && ev.target) ev.target.complete()
   }
   watch([searchQuery, activeFilter], () => {
     displayLimit.value = 25
   })
   ```
2. **Gunakan `LoadMoreFooter` di Template**:
   ```html
   <LoadMoreFooter
     :has-more="hasMore"
     :displayed-count="displayedItems.length"
     :total-count="filteredItems.length"
     item-name="transaksi"
     @load-more="loadMore"
   />
   ```

---

## 🧪 6. PROTOKOL EKSEKUSI & VERIFIKASI WAJIB (SELF-REVIEW)

Sebelum menandai tugas apapun sebagai selesai, agen **WAJIB** menjalankan langkah-langkah verifikasi berikut:
1. **Build Check Tanpa Error**: Jalankan perintah `npm run build` di terminal dan pastikan keluar kode `0` (*zero build error*).
2. **TypeScript & Syntax Integrity**: Periksa apakah ada sintaks TypeScript `(ev?: any)` yang tidak sengaja tertulis di file `<script>` standar (JavaScript biasa).
3. **Git Diff Audit**: Pastikan perubahan kode bersih, tidak meninggalkan file sampah/scratch di direktori produksi, dan tidak ada regresi pada fitur yang sudah ada.
4. **Dokumentasi & Tautan File**: Selalu berikan tautan klik `file:///...` ke file yang Anda ubah atau buat saat memberikan laporan kepada pengguna.

---
*Dokumen ini menjadi acuan absolut kualitas kode projek HK UMKM. Setiap kode yang melanggar standar di atas wajib ditolak dan direfaktor kembali.*
