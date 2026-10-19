<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div class="d-flex align-items-center justify-content-between">
            <ion-title class="app-hero-title">Kontak & Pelanggan</ion-title>
            <ion-buttons slot="end">
              <ion-button class="btn-action primary" @click="createUser">
                <ion-icon slot="start" :icon="addOutline" /> Tambah Kontak
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle">Kelola database pelanggan, pemasok (supplier), riwayat belanja, dan buku utang.</p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap">
      <div class="ion-padding">
        <!-- Search bar -->
        <div class="mb-3 px-2">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control app-control" 
            placeholder="Cari kontak berdasarkan nama atau telepon..." 
          />
        </div>

        <div v-if="loading" class="ion-text-center py-5"><ion-spinner /></div>
        <div v-else-if="filteredUsers.length === 0" class="text-center py-5 text-muted">
          <ion-icon :icon="peopleOutline" style="font-size: 3rem;" class="mb-2" />
          <p>Belum ada kontak ditemukan.</p>
        </div>
        <div v-else class="row mx-2">
          <div v-for="user in filteredUsers" :key="user.id" class="col-12 col-sm-6 col-lg-4 g-2 m-0 mb-1 px-2">
            <div class="mobile-card-sm h-100 d-flex align-items-center justify-content-between p-3">
              <div class="d-flex align-items-center" style="flex: 1; min-width: 0;">
                <ion-avatar slot="start" class="me-3 flex-shrink-0">
                  <ion-img :src="user.avatar || `https://i.pravatar.cc/150?u=${user.email || user.name}`" />
                </ion-avatar>
                <div class="d-flex flex-column" style="min-width: 0;">
                  <div class="d-flex align-items-center gap-1 mb-1">
                    <h6 class="fw-bold text-dark mb-0 text-truncate medium">{{ user.name }}</h6>
                    <span class="badge" :class="user.role === 'Supplier' ? 'bg-purple' : (user.role === 'Mitra' ? 'bg-teal' : 'bg-primary')" style="font-size: 0.6rem;">
                      {{ user.role || 'Pelanggan' }}
                    </span>
                  </div>
                  <p v-if="user.phone" class="text-dark small mb-0 d-flex align-items-center gap-1">
                    <ion-icon :icon="callOutline" class="text-success" />
                    <span>{{ user.phone }}</span>
                  </p>
                  <p class="text-muted text-xs mb-0 text-truncate">{{ user.email || 'Tanpa email' }}</p>
                </div>
              </div>

              <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <button class="btn btn-light btn-sm text-indigo" @click="openHistoryModal(user)" title="Riwayat Transaksi & Utang (M-06)">
                  <ion-icon :icon="receiptOutline" />
                </button>
                <button class="btn btn-light btn-sm text-primary" @click="editUser(user.id)" title="Edit">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="btn btn-light btn-sm text-danger" @click="deleteUser(user.id)" title="Hapus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Modal Riwayat Transaksi & Buku Utang (M-06) -->
    <ion-modal :is-open="historyModalVisible" @didDismiss="historyModalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Riwayat: {{ selectedContact?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="historyModalVisible = false"><ion-icon :icon="closeOutline" /></ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="app-content-wrap ion-padding bg-light">
        <div v-if="selectedContact" class="mobile-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="fw-bold text-dark mb-0">{{ selectedContact.name }}</h5>
              <small class="text-muted">{{ selectedContact.role || 'Pelanggan' }} • {{ selectedContact.phone || 'Tanpa No. HP' }}</small>
            </div>
            <button 
              v-if="selectedContact.phone" 
              class="btn btn-sm btn-success d-flex align-items-center gap-1"
              @click="openWhatsApp(selectedContact.phone)"
            >
              <ion-icon :icon="logoWhatsapp" /> Chat WA
            </button>
          </div>
        </div>

        <!-- Section 1: Catatan Utang / Piutang Kasbon Terkait -->
        <div class="mobile-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="fw-bold text-dark mb-0">Buku Utang & Piutang</h6>
            <span class="badge bg-secondary">{{ contactDebts.length }} Catatan</span>
          </div>

          <div v-if="contactDebts.length === 0" class="text-center py-3 text-muted small">
            Tidak ada catatan utang/piutang untuk kontak ini.
          </div>
          <div v-else class="list-group list-group-flush">
            <div v-for="d in contactDebts" :key="d.id" class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
              <div>
                <span class="badge me-2" :class="d.type === 'receivable' ? 'bg-success' : 'bg-warning text-dark'">
                  {{ d.type === 'receivable' ? '📥 Piutang Kasbon' : '📤 Utang Saya' }}
                </span>
                <span class="fw-bold text-dark small">{{ d.description }}</span>
                <div class="text-muted text-xs">Jatuh tempo: {{ formatDate(d.dueDate) }}</div>
              </div>
              <div class="text-end">
                <div class="fw-bold" :class="d.type === 'receivable' ? 'text-success' : 'text-danger'">
                  {{ formatPrice(d.amount) }}
                </div>
                <span class="badge" :class="d.status === 'PAID' ? 'bg-light text-success border' : 'bg-danger-subtle text-danger border'">
                  {{ d.status === 'PAID' ? 'Lunas' : 'Belum Lunas' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Riwayat Transaksi Penjualan Kasir Terkait -->
        <div class="mobile-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="fw-bold text-dark mb-0">Riwayat Belanja Kasir</h6>
            <span class="badge bg-secondary">{{ contactSales.length }} Transaksi</span>
          </div>

          <div v-if="contactSales.length === 0" class="text-center py-3 text-muted small">
            Belum ada riwayat transaksi kasir yang mencatat nama/kontak ini.
          </div>
          <div v-else class="list-group list-group-flush">
            <div v-for="s in contactSales" :key="s.id" class="list-group-item px-0 py-2">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <span class="badge bg-indigo me-1">INV-{{ s.id }}</span>
                  <span class="small fw-semibold text-dark">{{ formatDate(s.createdAt) }}</span>
                  <div class="text-muted text-xs mt-1" v-if="s.items">
                    {{ s.items.map(i => `${i.name} (x${i.quantity})`).join(', ') }}
                  </div>
                </div>
                <div class="text-end">
                  <span class="fw-bold text-indigo">{{ formatPrice(s.totalAmount) }}</span>
                  <small class="d-block text-muted text-xs">{{ s.paymentMethod || 'Tunai' }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <UsersEditModal 
      :isOpen="editModalVisible" 
      :userId="selectedUserId" 
      @update:isOpen="editModalVisible = $event" 
      @saved="fetchUsers" 
    />
  </ion-page>
</template>

<script>
import { ref, computed } from 'vue'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonAvatar, IonImg, IonSpinner, IonIcon, IonModal, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, trashOutline, createOutline, receiptOutline, callOutline, peopleOutline, closeOutline, logoWhatsapp } from 'ionicons/icons';
import { UsersRepository } from '@/db/usersRepository'
import { debtsRepo, salesRepo } from '@/db/repositories'
import UsersEditModal from './EditView.vue'

export default {
  name: 'UsersListView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonAvatar, IonImg, IonSpinner, IonIcon, IonModal, UsersEditModal },
  setup() {
    const users = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const editModalVisible = ref(false)
    const selectedUserId = ref(null)

    // History Modal states
    const historyModalVisible = ref(false)
    const selectedContact = ref(null)
    const contactDebts = ref([])
    const contactSales = ref([])

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0)

    const fetchUsers = async () => {
      loading.value = true
      try {
        users.value = await UsersRepository.getAll()
      } finally {
        loading.value = false
      }
    }

    const filteredUsers = computed(() => {
      const q = searchQuery.value.trim().toLowerCase()
      if (!q) return users.value
      return users.value.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      )
    })

    const editUser = (id) => {
      selectedUserId.value = id
      editModalVisible.value = true
    }

    const createUser = () => {
      selectedUserId.value = null
      editModalVisible.value = true
    }

    const deleteUser = async (id) => {
      if (confirm('Yakin ingin menghapus kontak ini?')) {
        await UsersRepository.delete(id)
        await fetchUsers()
      }
    }

    const openHistoryModal = async (contact) => {
      selectedContact.value = contact
      historyModalVisible.value = true

      try {
        const allDebts = await debtsRepo.getAll()
        const allSales = await salesRepo.getAll()

        const nameLower = (contact.name || '').toLowerCase()
        const phoneClean = (contact.phone || '').replace(/\D/g, '')

        contactDebts.value = allDebts.filter(d => {
          const dName = (d.personName || '').toLowerCase()
          const dPhone = (d.phone || '').replace(/\D/g, '')
          return (nameLower && dName.includes(nameLower)) || (phoneClean && dPhone && dPhone === phoneClean)
        })

        contactSales.value = allSales.filter(s => {
          const notes = (s.notes || '').toLowerCase()
          return nameLower && notes.includes(nameLower)
        })
      } catch (e) {
        console.error('Gagal memuat riwayat kontak:', e)
      }
    }

    const openWhatsApp = (phone) => {
      if (!phone) return
      let clean = String(phone).replace(/\D/g, '')
      if (clean.startsWith('0')) clean = '62' + clean.slice(1)
      window.open(`https://wa.me/${clean}`, '_blank')
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    }

    onIonViewWillEnter(fetchUsers)

    return { 
      users, loading, searchQuery, filteredUsers, deleteUser, formatDate, formatPrice,
      addOutline, trashOutline, createOutline, receiptOutline, callOutline, peopleOutline, closeOutline, logoWhatsapp,
      editModalVisible, selectedUserId, editUser, createUser, fetchUsers,
      historyModalVisible, selectedContact, contactDebts, contactSales, openHistoryModal, openWhatsApp
    }
  }
}
</script>
