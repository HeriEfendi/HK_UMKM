<template>
  <ion-page class="app-page">
    <!-- Header -->
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Tabungan & Aset</ion-title>
            <!-- <div class="d-flex gap-2">
              <ion-button class="btn-action secondary btn-sm" @click="openTransferModal">
                <ion-icon slot="start" :icon="swapHorizontalOutline" /> Transfer
              </ion-button>
              <ion-button class="btn-action primary btn-sm" @click="openTxModal('DEPOSIT')">
                <ion-icon slot="start" :icon="addOutline" /> Setor/Tarik
              </ion-button>
            </div> -->
          </div>
          <p class="app-hero-subtitle">Kelola akun bank, simpanan, dan mutasi aset keuangan Anda.</p>
        </div>
      </ion-toolbar>

      <!-- Tabs Segment -->
      <div class="px-3 pb-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="akun">
            <ion-label>Daftar Akun</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mutasi">
            <ion-label>Mutasi Rekening</ion-label>
          </ion-segment-button>
          <ion-segment-button value="analisa">
            <ion-label>Analisa & Grafik</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header>

    <ion-content class="app-content-wrap">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state text-center py-5">
        <ion-spinner />
        <p>Memproses data tabungan...</p>
      </div>

      <div v-else>
        <!-- ==================== TAB 1: ACCOUNTS LIST ==================== -->
        <div v-if="activeTab === 'akun'" class="ion-padding">
          <div class="d-flex justify-content-between align-items-center mb-3 mx-3">
            <h6 class="fw-bold text-dark m-0">Rekening & Aset Anda</h6>
            <button class="btn btn-action primary btn-sm" @click="openAccountModal()">
              <ion-icon :icon="addOutline" class="me-1" /> Tambah Akun
            </button>
          </div>

          <!-- Total Wealth Banner -->
          <div class="mobile-card p-4 mb-4 bg-teal text-white border-0 shadow-lg position-relative overflow-hidden mx-3">
            <div style="position: absolute; right: -20px; bottom: -20px; font-size: 6rem; opacity: 0.15;">
              <ion-icon :icon="walletOutline" />
            </div>
            <small class="text-white-50 d-block text-uppercase fw-bold tracking-wider">Total Kekayaan Bersih (Net Worth)</small>
            <div class="fs-4 fw-black mt-1">{{ formatPrice(totalNetWorth) }}</div>
            <div class="mt-2 text-white-50 small d-flex justify-content-between">
              <span>Aktif: {{ accounts.length }} Akun</span>
              <span>Terakhir Update: {{ lastUpdatedDate }}</span>
            </div>
          </div>

          <!-- Accounts Cards Grid -->
          <div class="row mx-0 mb-2">
            <div v-for="acc in accountsWithBalance" :key="acc.id" class="col-12 col-sm-6 col-lg-4 g-0 m-0 mb-3">
              <div class="mobile-card container-padded h-100 border-start border-4" :class="getCategoryBorderClass(acc.category)">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="pill-badge mb-1 d-inline-block text-xs" :class="getCategoryBadgeClass(acc.category)">{{ acc.category }}</span>
                    <h5 class="fw-bold text-dark m-0 mt-1">{{ acc.name }}</h5>
                    <small class="text-muted d-block mt-1" v-if="acc.accountNumber">Rek: {{ acc.accountNumber }}</small>
                  </div>
                  <div class="text-end">
                    <div class="fs-6 fw-black text-primary">{{ formatPrice(acc.balance) }}</div>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                  <div class="d-flex gap-1">
                    <button class="btn btn-action secondary btn-sm px-2 py-1 text-xs" @click="openTxModal('DEPOSIT', acc.id)">
                      <ion-icon :icon="arrowDownOutline" class="me-1" /> Setor
                    </button>
                    <button class="btn btn-action light btn-sm px-2 py-1 text-xs" @click="openTxModal('WITHDRAWAL', acc.id)">
                      <ion-icon :icon="arrowUpOutline" class="me-1" /> Tarik
                    </button>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-light btn-sm text-secondary" @click="openAccountModal(acc)">
                      <ion-icon :icon="pencilOutline" />
                    </button>
                    <button class="btn btn-light btn-sm text-danger" @click="onDeleteAccount(acc.id)">
                      <ion-icon :icon="trashOutline" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="accounts.length === 0" class="text-center py-5 text-muted mobile-card p-4">
            <ion-icon :icon="walletOutline" style="font-size: 3rem; color: #cbd5e1;" />
            <h6 class="fw-bold mt-3">Belum Ada Akun Tabungan</h6>
            <p class="text-sm">Mulai dengan menambahkan akun bank, e-wallet, atau aset logam mulia Anda.</p>
          </div>
        </div>

        <!-- ==================== TAB 2: TRANSACTIONS LIST ==================== -->
        <div v-show="activeTab === 'mutasi'" class="ion-padding">
          <!-- Filters & Search -->
          <div class="mobile-card p-3 mb-3 mx-3">
            <div class="row g-2">
              <div class="col-12 col-md-4">
                <input type="text" v-model="filterSearch" class="form-control app-control" placeholder="Cari deskripsi mutasi..." />
              </div>
              <div class="col-6 col-md-4">
                <select v-model="filterAccount" class="form-control app-control">
                  <option value="">Semua Akun</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                </select>
              </div>
              <div class="col-6 col-md-4">
                <select v-model="filterType" class="form-control app-control">
                  <option value="">Semua Tipe</option>
                  <option value="DEPOSIT">Setoran (Masuk)</option>
                  <option value="WITHDRAWAL">Penarikan (Keluar)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Transaction Items -->
          <div v-for="tx in filteredTransactions" :key="tx.id" class="mobile-card p-3 mx-3 mb-3 border-start border-4" :class="tx.type === 'DEPOSIT' ? 'border-success' : 'border-danger'">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-bold text-dark">{{ getAccountName(tx.accountId) }}</span>
                  <span class="badge text-xs" :class="tx.type === 'DEPOSIT' ? 'bg-success' : 'bg-danger'">
                    {{ tx.type === 'DEPOSIT' ? 'Setor' : 'Tarik' }}
                  </span>
                </div>
                <div class="text-xs text-muted mt-1">{{ tx.category }} &bull; {{ formatDate(tx.date) }}</div>
                <div class="text-sm text-dark mt-2" v-if="tx.description">{{ tx.description }}</div>
              </div>
              <div class="text-end">
                <div class="fw-black fs-6" :class="tx.type === 'DEPOSIT' ? 'text-success' : 'text-danger'">
                  {{ tx.type === 'DEPOSIT' ? '+' : '-' }}{{ formatPrice(tx.amount) }}
                </div>
                <button class="btn btn-link btn-sm text-danger mt-2 p-0" @click="onDeleteTransaction(tx.id)">
                  <ion-icon :icon="trashOutline" /> Hapus
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredTransactions.length === 0" class="text-center py-5 text-muted mobile-card p-4">
            <p>Tidak ada riwayat mutasi transaksi ditemukan.</p>
          </div>
        </div>

        <!-- ==================== TAB 3: ANALYTICS & REPORTS ==================== -->
        <div v-show="activeTab === 'analisa'" class="ion-padding">
          <!-- Quick Statistics -->
          <div class="project-actions d-grid gap-2 mx-2 mb-3">
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Setoran Bulan Ini</small>
              <div class="fs-6 fw-black text-success mt-1">{{ formatPrice(stats.depositsThisMonth) }}</div>
            </div>
            <div class="mobile-card p-3 h-100">
              <small class="text-muted d-block">Penarikan Bulan Ini</small>
              <div class="fs-6 fw-black text-danger mt-1">{{ formatPrice(stats.withdrawalsThisMonth) }}</div>
            </div>
          </div>

          <!-- Trend Area Chart -->
          <div class="mobile-card container-padded mb-3">
            <h6 class="fw-bold text-dark mb-3">Grafik Perkembangan Aset (6 Bulan Terakhir)</h6>
            <VueApexCharts v-if="trendChartSeries[0].data.some(d => d > 0)" type="area" height="240" :options="trendChartOptions" :series="trendChartSeries" />
            <div v-else class="text-center py-5 text-muted">Belum ada mutasi dana untuk menampilkan grafik perkembangan.</div>
          </div>

          <!-- Distribution Donut Chart -->
          <div class="mobile-card container-padded mb-3">
            <h6 class="fw-bold text-dark mb-3">Distribusi Aset Tabungan</h6>
            <VueApexCharts v-if="distributionChartSeries.length > 0 && distributionChartSeries.some(d => d > 0)" type="donut" height="240" :options="distributionChartOptions" :series="distributionChartSeries" />
            <div v-else class="text-center py-5 text-muted">Tambahkan saldo di akun Anda untuk melihat distribusi aset.</div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- ==================== MODALS ==================== -->

    <!-- Modal 1: Manage Account (Add / Edit) -->
    <ion-modal :is-open="showAccountModal" @didDismiss="showAccountModal = false">
      <ion-header>
        <ion-toolbar class="app-toolbar">
          <ion-title class="fw-black text-dark">{{ editingAccount ? 'Edit Akun Tabungan' : 'Tambah Akun Tabungan' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showAccountModal = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="app-content-wrap ion-padding">
        <div class="form-stack px-3">
          <div class="field-group">
            <label class="field-label">Nama Akun / Bank</label>
            <input type="text" v-model="accountForm.name" class="form-control app-control" placeholder="Contoh: BCA Tabungan, E-Wallet Shopee, Emas Antam" />
          </div>
          <div class="field-group">
            <label class="field-label">Kategori Aset</label>
            <select v-model="accountForm.category" class="form-control app-control">
              <option value="Rekening Bank">Rekening Bank</option>
              <option value="E-Wallet">E-Wallet (OVO/Dana/Gopay)</option>
              <option value="Logam Mulia">Logam Mulia (Emas)</option>
              <option value="Investasi">Investasi (Reksadana/Saham)</option>
              <option value="Tunai">Uang Tunai</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Nomor Rekening (Opsional)</label>
            <input type="text" v-model="accountForm.accountNumber" class="form-control app-control" placeholder="Contoh: 1234567890" />
          </div>
          <div class="field-group" v-if="!editingAccount">
            <label class="field-label">Saldo Awal</label>
            <NumberInput v-model="accountForm.initialBalance" placeholder="0" />
          </div>
        </div>
        <div class="mt-4 d-flex justify-content-end gap-2">
          <ion-button class="btn-action light" @click="showAccountModal = false">Batal</ion-button>
          <ion-button class="btn-action primary" @click="saveAccount" :disabled="!accountForm.name">Simpan</ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal 2: Transaction (Deposit / Withdrawal) -->
    <ion-modal :is-open="showTxModal" @didDismiss="showTxModal = false">
      <ion-header>
        <ion-toolbar class="app-toolbar px-3">
          <ion-title class="fw-black text-dark">Transaksi Setor / Tarik</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showTxModal = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="app-content-wrap ion-padding">
        <!-- Type Selection Segment -->
        <ion-segment v-model="txForm.type" class="custom-segment mb-3">
          <ion-segment-button value="DEPOSIT"><ion-label>Setor Uang (+)</ion-label></ion-segment-button>
          <ion-segment-button value="WITHDRAWAL"><ion-label>Tarik Uang (-)</ion-label></ion-segment-button>
        </ion-segment>

        <div class="form-stack">
          <div class="field-group">
            <label class="field-label">Pilih Akun / Rekening</label>
            <select v-model="txForm.accountId" class="form-control app-control">
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Jumlah Uang (Rp)</label>
            <NumberInput v-model="txForm.amount" placeholder="0" />
          </div>
          <div class="field-group">
            <label class="field-label">Tanggal</label>
            <input type="date" v-model="txForm.date" class="form-control app-control" />
          </div>
          <div class="field-group">
            <label class="field-label">Kategori</label>
            <select v-model="txForm.category" class="form-control app-control">
              <option v-for="cat in activeCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Deskripsi / Catatan (Opsional)</label>
            <input type="text" v-model="txForm.description" class="form-control app-control" placeholder="Keterangan tambahan..." />
          </div>
        </div>
        <div class="mt-4 d-flex justify-content-end gap-2">
          <ion-button class="btn-action light" @click="showTxModal = false">Batal</ion-button>
          <ion-button class="btn-action primary" @click="saveTransaction" :disabled="!txForm.accountId || txForm.amount <= 0">Simpan</ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal 3: Transfer Between Accounts -->
    <ion-modal :is-open="showTransferModal" @didDismiss="showTransferModal = false">
      <ion-header>
        <ion-toolbar class="app-toolbar px-0">
          <ion-title class="fw-black text-dark">Transfer Antar Rekening</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showTransferModal = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="app-content-wrap ion-padding">
        <div class="form-stack mx-3">
          <div class="field-group">
            <label class="field-label">Dari Rekening / Akun</label>
            <select v-model="transferForm.fromAccountId" class="form-control app-control">
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Ke Rekening / Akun</label>
            <select v-model="transferForm.toAccountId" class="form-control app-control">
              <option v-for="acc in availableDestinationAccounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Jumlah Uang (Rp)</label>
            <NumberInput v-model="transferForm.amount" placeholder="0" />
          </div>
          <div class="field-group">
            <label class="field-label">Tanggal</label>
            <input type="date" v-model="transferForm.date" class="form-control app-control" />
          </div>
          <div class="field-group">
            <label class="field-label">Catatan / Deskripsi (Opsional)</label>
            <input type="text" v-model="transferForm.description" class="form-control app-control" placeholder="Keterangan transfer..." />
          </div>
        </div>
        <div class="mt-4 d-flex justify-content-end gap-2 mx-3">
          <ion-button class="btn-action light" @click="showTransferModal = false">Batal</ion-button>
          <ion-button class="btn-action primary" @click="saveTransfer" :disabled="!transferForm.fromAccountId || !transferForm.toAccountId || transferForm.amount <= 0">Proses Transfer</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import { onMounted, ref, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { savingAccountsRepo, savingTransactionsRepo } from '../../../db/repositories'
import { migrateOldSavings } from '../../../db/savingsMigration'
import { onIonViewWillEnter } from '@ionic/vue'
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons,
  IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonModal
} from '@ionic/vue';
import {
  addOutline, trashOutline, pencilOutline, swapHorizontalOutline, arrowUpOutline,
  arrowDownOutline, walletOutline, closeOutline
} from 'ionicons/icons';

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

export default {
  name: 'AccountingSavingsListView',
  components: {
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons,
    IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonModal, VueApexCharts
  },
  setup() {
    // State UI
    const activeTab = ref('akun')
    const loading = ref(false)
    const showAccountModal = ref(false)
    const showTxModal = ref(false)
    const showTransferModal = ref(false)

    watch(activeTab, (tab) => {
      if (tab === 'analisa') {
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

    // Data lists
    const accounts = ref([])
    const transactions = ref([])

    // Forms
    const editingAccount = ref(null)
    const accountForm = ref({ name: '', category: 'Rekening Bank', accountNumber: '', initialBalance: 0 })
    const txForm = ref({ type: 'DEPOSIT', accountId: null, amount: 0, date: '', category: 'Menabung', description: '' })
    const transferForm = ref({ fromAccountId: null, toAccountId: null, amount: 0, date: '', description: '' })

    // Filters
    const filterSearch = ref('')
    const filterAccount = ref('')
    const filterType = ref('')

    // Fetch DB Data
    const loadData = async () => {
      loading.value = true
      try {
        // Run migration first (convert old savings to accounts and transactions model)
        await migrateOldSavings()
        accounts.value = await savingAccountsRepo.getAll()
        transactions.value = await savingTransactionsRepo.getAll()
        nextTick(() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
          }, 100)
        })
      } catch (err) {
        console.error('Failed to load savings data:', err)
      } finally {
        loading.value = false
      }
    }

    onIonViewWillEnter(loadData)

    // Helper functions for categories
    const getCategoryBadgeClass = (category) => {
      switch (category) {
        case 'Rekening Bank': return 'primary'
        case 'E-Wallet': return 'teal'
        case 'Logam Mulia': return 'warning'
        case 'Investasi': return 'purple'
        case 'Tunai': return 'success'
        default: return 'secondary'
      }
    }

    const getCategoryBorderClass = (category) => {
      switch (category) {
        case 'Rekening Bank': return 'border-teal'
        case 'E-Wallet': return 'border-indigo'
        case 'Logam Mulia': return 'border-warning'
        case 'Investasi': return 'border-purple'
        case 'Tunai': return 'border-success'
        default: return 'border-secondary'
      }
    }

    // Helper formatting functions
    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(price || 0))
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

    const lastUpdatedDate = computed(() => {
      if (transactions.value.length === 0) return '-'
      const dates = transactions.value.map(t => new Date(t.date || t.createdAt))
      const latest = new Date(Math.max(...dates))
      return latest.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    })

    // Balance Calculations
    const accountsWithBalance = computed(() => {
      return accounts.value.map(acc => {
        const balance = transactions.value
          .filter(t => t.accountId === acc.id)
          .reduce((sum, t) => {
            if (t.type === 'DEPOSIT') return sum + Number(t.amount || 0)
            if (t.type === 'WITHDRAWAL') return sum - Number(t.amount || 0)
            return sum
          }, 0)
        return { ...acc, balance }
      })
    })

    const totalNetWorth = computed(() => {
      return accountsWithBalance.value.reduce((sum, acc) => sum + acc.balance, 0)
    })

    // Categories based on Deposit vs Withdrawal
    const activeCategories = computed(() => {
      if (txForm.value.type === 'DEPOSIT') {
        return ['Setoran Awal', 'Menabung', 'Gaji / Hasil Usaha', 'Bunga Bank', 'Transfer Masuk', 'Lainnya']
      } else {
        return ['Penarikan Kebutuhan', 'Biaya Admin Bank', 'Pengeluaran Bisnis', 'Transfer Keluar', 'Kerugian Investasi', 'Lainnya']
      }
    })

    // Filtered transaction mutasi
    const filteredTransactions = computed(() => {
      let filtered = [...transactions.value]
      if (filterSearch.value.trim()) {
        const q = filterSearch.value.toLowerCase()
        filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
      }
      if (filterAccount.value) {
        filtered = filtered.filter(t => t.accountId === Number(filterAccount.value))
      }
      if (filterType.value) {
        filtered = filtered.filter(t => t.type === filterType.value)
      }
      // Sort newest date first
      return filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    })

    const getAccountName = (accountId) => {
      const acc = accounts.value.find(a => a.id === accountId)
      return acc ? acc.name : 'Akun Tidak Dikenal'
    }

    // Modal Control: Accounts
    const openAccountModal = (account = null) => {
      if (account) {
        editingAccount.value = account
        accountForm.value = { ...account, initialBalance: 0 }
      } else {
        editingAccount.value = null
        accountForm.value = { name: '', category: 'Rekening Bank', accountNumber: '', initialBalance: 0 }
      }
      showAccountModal.value = true
    }

    const saveAccount = async () => {
      try {
        if (editingAccount.value) {
          await savingAccountsRepo.update(editingAccount.value.id, {
            name: accountForm.value.name,
            category: accountForm.value.category,
            accountNumber: accountForm.value.accountNumber
          })
        } else {
          const newAcc = await savingAccountsRepo.add({
            name: accountForm.value.name,
            category: accountForm.value.category,
            accountNumber: accountForm.value.accountNumber
          })

          // Save Initial Balance as transaction if greater than zero
          if (accountForm.value.initialBalance > 0) {
            await savingTransactionsRepo.add({
              accountId: newAcc.id,
              type: 'DEPOSIT',
              amount: accountForm.value.initialBalance,
              date: new Date().toISOString().substring(0, 10),
              category: 'Setoran Awal',
              description: 'Saldo Awal Rekening'
            })
          }
        }
        showAccountModal.value = false
        await loadData()
      } catch (err) {
        console.error('Failed to save account:', err)
      }
    }

    const onDeleteAccount = async (id) => {
      const confirmDelete = confirm('Apakah Anda yakin ingin menghapus akun ini? Seluruh riwayat transaksi di akun ini juga akan ikut terhapus.')
      if (!confirmDelete) return
      try {
        // Delete all transactions of this account
        const txs = transactions.value.filter(t => t.accountId === id)
        for (const t of txs) {
          await savingTransactionsRepo.delete(t.id)
        }
        // Delete account
        await savingAccountsRepo.delete(id)
        await loadData()
      } catch (err) {
        console.error('Failed to delete account:', err)
      }
    }

    // Modal Control: Transactions
    const openTxModal = (type = 'DEPOSIT', accountId = null) => {
      txForm.value = {
        type,
        accountId: accountId || (accounts.value[0]?.id || null),
        amount: null,
        date: new Date().toISOString().substring(0, 10),
        category: type === 'DEPOSIT' ? 'Menabung' : 'Penarikan Kebutuhan',
        description: ''
      }
      showTxModal.value = true
    }

    const saveTransaction = async () => {
      try {
        await savingTransactionsRepo.add({
          accountId: Number(txForm.value.accountId),
          type: txForm.value.type,
          amount: Number(txForm.value.amount),
          date: txForm.value.date,
          category: txForm.value.category,
          description: txForm.value.description
        })
        showTxModal.value = false
        await loadData()
      } catch (err) {
        console.error('Failed to save transaction:', err)
      }
    }

    const onDeleteTransaction = async (id) => {
      const confirmDelete = confirm('Hapus riwayat transaksi ini?')
      if (!confirmDelete) return
      try {
        await savingTransactionsRepo.delete(id)
        await loadData()
      } catch (err) {
        console.error('Failed to delete transaction:', err)
      }
    }

    // Modal Control: Transfers
    const openTransferModal = () => {
      transferForm.value = {
        fromAccountId: accounts.value[0]?.id || null,
        toAccountId: accounts.value[1]?.id || null,
        amount: null,
        date: new Date().toISOString().substring(0, 10),
        description: ''
      }
      showTransferModal.value = true
    }

    const availableDestinationAccounts = computed(() => {
      return accounts.value.filter(a => a.id !== transferForm.value.fromAccountId)
    })

    const saveTransfer = async () => {
      const amount = Number(transferForm.value.amount)
      const date = transferForm.value.date
      const desc = transferForm.value.description ? ` - ${transferForm.value.description}` : ''
      try {
        // 1. Withdrawal from source
        await savingTransactionsRepo.add({
          accountId: Number(transferForm.value.fromAccountId),
          type: 'WITHDRAWAL',
          amount,
          date,
          category: 'Transfer Keluar',
          description: `Transfer ke ${getAccountName(Number(transferForm.value.toAccountId))}${desc}`
        })
        // 2. Deposit into destination
        await savingTransactionsRepo.add({
          accountId: Number(transferForm.value.toAccountId),
          type: 'DEPOSIT',
          amount,
          date,
          category: 'Transfer Masuk',
          description: `Transfer dari ${getAccountName(Number(transferForm.value.fromAccountId))}${desc}`
        })
        showTransferModal.value = false
        await loadData()
      } catch (err) {
        console.error('Failed to process transfer:', err)
      }
    }

    // Analytics Calculations
    const stats = computed(() => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthTxs = transactions.value.filter(t => new Date(t.date || t.createdAt) >= startOfMonth)

      const deposits = thisMonthTxs.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + Number(t.amount || 0), 0)
      const withdrawals = thisMonthTxs.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + Number(t.amount || 0), 0)

      return {
        depositsThisMonth: deposits,
        withdrawalsThisMonth: withdrawals
      }
    })

    // Net Worth Trend Calculation (6 Months)
    const trendChartSeries = computed(() => {
      const data = []
      const now = new Date()
      
      // Calculate net worth at the end of each of the last 6 months
      for (let i = 5; i >= 0; i--) {
        const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0) // End of target month
        
        // Net worth up to this targetMonthDate
        const balanceUpToMonth = transactions.value
          .filter(t => new Date(t.date || t.createdAt) <= targetMonthDate)
          .reduce((sum, t) => {
            if (t.type === 'DEPOSIT') return sum + Number(t.amount || 0)
            if (t.type === 'WITHDRAWAL') return sum - Number(t.amount || 0)
            return sum
          }, 0)
        
        data.push(balanceUpToMonth)
      }
      
      return [{ name: 'Aset Bersih', data }]
    })

    const trendChartOptions = {
      chart: { toolbar: { show: false }, type: 'area', zoom: { enabled: false } },
      colors: ['#0d9488'],
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 100]
        }
      },
      xaxis: {
        categories: Array.from({ length: 6 }, (_, i) => {
          const m = new Date()
          m.setMonth(m.getMonth() - (5 - i))
          return m.toLocaleDateString('id-ID', { month: 'short' })
        })
      },
      yaxis: { labels: { formatter: (val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val) } }
    }

    // Account Asset Distribution
    const distributionChartSeries = computed(() => {
      return accountsWithBalance.value.map(acc => Math.max(0, acc.balance))
    })

    const distributionChartOptions = computed(() => {
      return {
        chart: { type: 'donut', toolbar: { show: false } },
        labels: accountsWithBalance.value.map(acc => acc.name),
        colors: ['#0d9488', '#4f46e5', '#f59e0b', '#8b5cf6', '#10b981', '#6366f1'],
        legend: { position: 'bottom' },
        stroke: { width: 0 },
        tooltip: {
          y: { formatter: (val) => formatPrice(val) }
        }
      }
    })

    return {
      activeTab, loading, showAccountModal, showTxModal, showTransferModal,
      accounts, transactions, editingAccount, accountForm, txForm, transferForm,
      filterSearch, filterAccount, filterType, formatPrice, formatDate,
      accountsWithBalance, totalNetWorth, lastUpdatedDate, activeCategories,
      filteredTransactions, getAccountName, openAccountModal, saveAccount,
      onDeleteAccount, openTxModal, saveTransaction, onDeleteTransaction,
      openTransferModal, availableDestinationAccounts, saveTransfer,
      stats, trendChartSeries, trendChartOptions, distributionChartSeries, distributionChartOptions,
      getCategoryBadgeClass, getCategoryBorderClass,
      addOutline, trashOutline, pencilOutline, swapHorizontalOutline, arrowUpOutline,
      arrowDownOutline, walletOutline, closeOutline
    }
  }
}
</script>

<style scoped>
.tracking-wider {
  letter-spacing: 0.05em;
}
.text-xs {
  font-size: 0.72rem;
}
.border-indigo {
  border-color: #6366f1 !important;
}
.border-purple {
  border-color: #a855f7 !important;
}
</style>
