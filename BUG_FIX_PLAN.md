# 📋 Rencana Eksekusi Perbaikan Bug (Bug Fix Checklist)

Dokumen ini berisi daftar lengkap perbaikan bug dan optimasi kode proyek **HK UMKM (HDEV-Mobile)** yang telah diselesaikan.

---

## 🔴 Fase 1: Bug Kritis & Potensi Crash (High Priority)

- [x] **1. Fix Null Pointer Dereference pada Buku Kas Details**
  - **File:** `src/views/buku_kas/Details.vue`
  - **Status:** Selesai. Ditambahkan safe optional chaining pada `(project.value as any)?.panen_total || 0` dan `project.value?.total_expenses || 0`.

- [x] **2. Fix Crash `openWhatsApp` Saat Nomor HP Kosong**
  - **File:** `src/views/users/ListView.vue`
  - **Status:** Selesai. Ditambahkan guard `if (!phone) return` dan `String(phone).replace(...)`.

- [x] **3. Fix `window.open` Null Crash pada Cetak Struk Kasir & Barcode Produk**
  - **File 1:** `src/views/cashier/CashierView.vue`
  - **File 2:** `src/views/supply-chain/products/ListView.vue`
  - **Status:** Selesai. Ditambahkan fallback aman `if (!popupWin) { window.print(); return; }`.

---

## 🟡 Fase 2: Bug Logika & UX (Medium Priority)

- [x] **4. Fix Form Kontak Silent Fail Saat Email Tidak Diisi**
  - **File:** `src/views/users/EditView.vue`
  - **Status:** Selesai. Validasi disederhanakan menjadi `if (!user.value.name?.trim()) return` sehingga email bersifat opsional sesuai form.

- [x] **5. Fix Missing Drawable Icon pada Pengingat Android**
  - **File:** `src/utils/reminderNotifications.ts`
  - **Status:** Selesai. Properti `smallIcon` non-existent dihapus agar default ke icon aplikasi bawaan (`ic_launcher`).

- [x] **6. Fix Potensi Tampilan `NaN.00 Jam` pada Dashboard Ceklok**
  - **File:** `src/views/ceklok/CeklokView.vue`
  - **Status:** Selesai. Ditambahkan fallback default `sum + (log.totalWorkHours || 0)`.

---

## 🔵 Fase 3: Pembersihan Kode & Sanitasi (Low Priority)

- [x] **7. Hapus File Database Duplikat Tidak Terpakai**
  - **File:** `src/db/db.js`
  - **Status:** Selesai. File dihapus, proyek bersih dari inisialisasi DB lama `sme_ledger_db`.

- [x] **8. Fallback Properti `name` pada Daftar Pemasukan**
  - **File:** `src/views/accounting/incomes/ListView.vue`
  - **Status:** Selesai. Kartu menampilkan `{{ income.description || income.name || '-' }}`.

---

## ✅ Status Eksekusi: 100% Selesai
* `npm run build`: **Lolos tanpa error (Built in ~9s)**
* `npx cap sync android`: **Tersinkronisasi 100%**
