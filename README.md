# HK UMKM (Hasil Karya UMKM)

Aplikasi *all-in-one* multi-platform untuk produktivitas pribadi, pencatatan keuangan UMKM, kasir (POS), dan manajemen rantai pasok (*supply chain*). Dibangun dengan arsitektur **Offline-First** menggunakan **Vue 3 + Ionic 8 + Capacitor 8 + Tauri v2**, dapat berjalan optimal sebagai aplikasi mobile Android, aplikasi desktop (Linux/Windows/macOS), maupun Progressive Web App (PWA).

---

## 🚀 Ringkasan & Keunggulan

- **Offline-First & Mandiri:** Seluruh data tersimpan secara lokal di perangkat menggunakan IndexedDB (Dexie.js), tanpa ketergantungan koneksi internet atau server pihak ketiga.
- **Multi-Platform:**
  - 📱 **Mobile (Android):** Didukung penuh oleh Capacitor 8 dengan integrasi native Camera, Local Notifications, Filesystem, dan Share.
  - 💻 **Desktop (Linux/Windows/macOS):** Didukung oleh Tauri v2 dan paket distribusi Arch Linux (`PKGBUILD`).
  - 🌐 **Web & PWA:** Akses cepat via browser modern dengan performa tinggi dari Vite 7.
- **Dashboard Cerdas & Interaktif:** Dilengkapi ringkasan KPI bisnis (Penjualan Hari Ini, Estimasi Laba, Peringatan Stok Menipis, Utang/Piutang Jatuh Tempo) serta grid menu yang dapat diatur urutannya secara dinamis (*draggable & customizable*).

---

## 📱 Fitur & Modul Aplikasi

### 👤 1. Personal & Produktivitas
| Menu | Deskripsi |
|---|---|
| **Catatan (Notes)** | Catatan fleksibel ala Google Keep dengan dukungan pin, checklist/daftar tugas, kode warna, label kustom, arsip, sampah, dan pencarian cepat. |
| **To Do** | Manajemen tugas dan *to-do list* harian pribadi dengan status progres. |
| **To Do Team** | Kolaborasi task tim dengan penugasan anggota (*assignee*) dan pelacakan status kerja. |
| **Ceklok (Presensi)** | Presensi & pencatat jam kerja harian berbasis foto selfie (kamera), perhitungan durasi kerja otomatis, toleransi keterlambatan, dan histori bulanan. |
| **Pengingat (Reminders)** | Pengingat waktu dan agenda penting dengan integrasi notifikasi lokal perangkat (*local notifications*) & opsi berulang (*recurring*). |

### 💰 2. Keuangan
| Menu | Deskripsi |
|---|---|
| **Buku Kas** | Catat arus kas multi-proyek/kegiatan (bisnis, hobi, renovasi). Setiap buku kas memiliki alokasi modal, pengeluaran, pemasukan, sisa saldo, dan grafik tren tersendiri. |
| **Tabungan (Savings)** | Manajemen pos simpanan / rekening kas modal dengan pencatatan mutasi setor dan tarik saldo. |
| **Pengeluaran** | Pencatatan dana keluar terstruktur dengan kategori, tanggal, deskripsi, dan visualisasi grafik pengeluaran. |
| **Pendapatan** | Pencatatan pemasukan dan berbagai sumber dana masuk bisnis. |
| **Utang & Piutang** | Pantau kewajiban utang maupun tagihan piutang, tanggal jatuh tempo, dan status pelunasan. |

### 🏪 3. Supply Chain & Penjualan
| Menu | Deskripsi |
|---|---|
| **Kasir (POS)** | *Point of Sale* modern untuk transaksi penjualan cepat, pencarian produk, kalkulasi diskon/pembayaran/kembalian, cetak struk, dan bagikan bukti transaksi via *native share*. |
| **Manajemen Stok** | Monitor kuantitas stok produk, pencatatan mutasi stok (masuk, keluar, penyesuaian), dan riwayat perubahan stok real-time. |
| **Produk** | Manajemen master data produk (nama, harga jual, harga modal, stok minimum, kategori, dan foto produk). |
| **Kategori** | Master data klasifikasi produk untuk memudahkan pengelompokan barang. |

### ⚙️ 4. Pengaturan & Sistem
| Menu | Deskripsi |
|---|---|
| **Backup & Restore** | Ekspor seluruh database lokal ke file JSON dan impor/pulihkan data kapan saja untuk mencegah kehilangan data. |
| **Profil Usaha** | Kustomisasi identitas toko (nama toko, tagline, alamat, no. kontak, catatan struk) yang otomatis digunakan pada struk kasir dan dashboard. |
| **Users** | Manajemen data pengguna / karyawan aplikasi. |
| **Tentang Aplikasi** | Informasi detail versi aplikasi, arsitektur sistem, dan profil pengembang. |

---

## 🗄️ Arsitektur Penyimpanan Data

Semua data operasional tersimpan **secara lokal (Offline-First)** di sisi klien:

- **Database Utama:** `FinancialAppDB` (IndexedDB dikelola melalui **Dexie.js v4**)
- **Tabel / Object Stores:**
  - `projects`, `transactions` *(Buku Kas)*
  - `todos`, `team_todos` *(Task Management)*
  - `ceklok_logs`, `ceklok_settings` *(Presensi & Jam Kerja)*
  - `saving_accounts`, `saving_transactions`, `savings` *(Tabungan & Rekening)*
  - `expenses`, `incomes`, `debts`, `dailyLedger` *(Pencatatan Keuangan)*
  - `categories`, `products`, `stockMutations`, `sales` *(Supply Chain & POS)*
  - `notes`, `note_labels` *(Catatan & Tag)*
  - `reminders` *(Pengingat & Alarm)*
  - `users` *(Master Pengguna)*
- **Penyimpanan Media & Gambar Produk:**
  - **Browser & Desktop (Tauri):** Tersimpan di IndexedDB (`ProductImagesDB`).
  - **Android (Native):** Disimpan pada direktori lokal `Documents/h_dev/product/` memanfaatkan `@capacitor/filesystem`.

---

## 🧱 Teknologi yang Digunakan

| Kategori | Teknologi / Pustaka |
|---|---|
| **Frontend Framework** | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| **Build Tool** | [Vite 7](https://vitejs.dev/) |
| **Mobile Runtime** | [Capacitor 8](https://capacitorjs.com/) (`@capacitor/android`, `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/local-notifications`, `@capacitor/share`, `@capacitor/app`) |
| **Desktop Runtime** | [Tauri v2](https://tauri.app/) (Rust-based lightweight desktop app) |
| **UI Components** | [Ionic Vue 8](https://ionicframework.com/docs/vue/overview) & [CoreUI Vue](https://coreui.io/vue/) |
| **Styling & Icons** | Vanilla CSS + [Bootstrap 5](https://getbootstrap.com/) utilities + Ionicons + FontAwesome |
| **Database** | [Dexie.js v4](https://dexie.org/) & `idb` (IndexedDB Wrapper) |
| **Data Visualization** | [ApexCharts](https://apexcharts.com/) via `vue3-apexcharts` |
| **Import & Export** | [SheetJS (XLSX)](https://sheetjs.com/) |
| **State Management & Router** | Vuex 4 & Vue Router 4 / `@ionic/vue-router` |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Instalasi Dependensi

```bash
npm install
```

### 2. Jalankan Mode Development

- **Browser / Web:**
  ```bash
  npm run dev
  ```
- **Desktop (Tauri):**
  ```bash
  npm run tauri dev
  ```

### 3. Build Production

- **Web (PWA / Dist):**
  ```bash
  npm run build
  ```
- **Desktop App (Tauri):**
  ```bash
  npm run tauri build
  ```

### 4. Deploy & Build Android (Capacitor)

```bash
# 1. Build aset web
npm run build

# 2. Sinkronkan ke proyek Android
npx cap sync android

# 3. Buka Android Studio untuk build APK / App Bundle
npx cap open android
```

> 💡 **Tips Android:** Disarankan menggunakan **JDK 17** untuk kompatibilitas optimal dengan Gradle wrapper:
> ```bash
> export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
> cd android && ./gradlew assembleDebug
> ```

---

## 📦 Skrip Rilis & Sinkronisasi Versi

Proyek ini dilengkapi skrip otomatis untuk menyinkronkan nomor versi ke `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `android/app/build.gradle`, dan `PKGBUILD`:

```bash
# Sinkronkan versi ke seluruh platform
npm run version:sync 0.21.6

# Rilis otomatis (sinkronisasi versi, git tag, merge main, dan push)
npm run release 0.21.6
```

---

## 📁 Struktur Folder Utama

```
├── android/               # Proyek native Android (Capacitor)
├── src-tauri/             # Konfigurasi & source backend desktop (Tauri v2)
├── scripts/               # Helper build script (Arch Linux packaging, dll)
├── src/
│   ├── assets/            # Gambar, logo, & aset statis
│   ├── components/        # Komponen UI reusable (header, modal, chart, dll)
│   ├── composables/       # Composition logic (useProductImage, dll)
│   ├── db/                # Skema Dexie, migrasi database, & repository layer
│   │   ├── schema.js      # Definisi store & migrasi versi FinancialAppDB
│   │   ├── noteRepository.ts
│   │   ├── reminderRepository.ts
│   │   ├── ceklokRepository.ts
│   │   ├── todoRepository.ts
│   │   ├── businessProfile.ts
│   │   └── ...
│   ├── layout/            # Layout utama (AppHeader, AppSidebar, DefaultLayout)
│   ├── router/            # Definisi rute halaman (Vue Router)
│   ├── store/             # Vuex store
│   ├── utils/             # Helper format angka, tanggal, & notifikasi
│   └── views/             # Halaman modul aplikasi
│       ├── HomeView.vue       # Dashboard & ringkasan KPI bisnis
│       ├── notes/             # Catatan & Keep-style notes
│       ├── reminder/          # Pengingat & Notifikasi
│       ├── todo/              # To Do Personal & Team
│       ├── ceklok/            # Presensi & Ceklok karyawan
│       ├── buku_kas/          # Buku Kas proyek
│       ├── accounting/        # Tabungan, Pengeluaran, Pendapatan, Utang
│       ├── cashier/           # Kasir POS
│       ├── supply-chain/      # Produk, Kategori, & Mutasi Stok
│       ├── profile/           # Profil Usaha & Backup/Restore
│       ├── users/             # Master Data Pengguna
│       └── AboutView.vue      # Informasi Aplikasi & Developer
```

---

## 🔗 Informasi Pengembang & Repository

- **Repository:** [HeriEfendi/HK_UMKM](https://github.com/HeriEfendi/HK_UMKM)
- **Branch Aktif:** `dev`
- **Developer:** Ahmad Heri Efendi (hheri58@gmail.com)
