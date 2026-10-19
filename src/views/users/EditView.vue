<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('update:isOpen', false)">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <ion-buttons slot="end">
            <ion-button @click="$emit('update:isOpen', false)">Batal</ion-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit User' : 'Tambah User' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap">
      <div v-if="loading" class="loading-state text-center py-5">
        <ion-spinner />
      </div>
      <ion-card v-else class="mobile-card mx-2">
        <ion-card-content class="form-stack">
          <div class="field-group mb-2">
            <label class="field-label">Nama Kontak</label>
            <input v-model="user.name" class="form-control app-control" placeholder="Nama pelanggan / supplier" />
          </div>
          <div class="field-group mb-2">
            <label class="field-label">Nomor WhatsApp / Telepon</label>
            <input type="tel" v-model="user.phone" class="form-control app-control" placeholder="08123456789" />
          </div>
          <div class="field-group mb-2">
            <label class="field-label">Email</label>
            <input type="email" v-model="user.email" class="form-control app-control" placeholder="kontak@example.com" />
          </div>
          <div class="field-group mb-3">
            <label class="field-label">Tipe Kontak</label>
            <select v-model="user.role" class="form-select app-control">
              <option value="Pelanggan">Pelanggan</option>
              <option value="Supplier">Supplier / Pemasok</option>
              <option value="Mitra">Mitra Usaha</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <ion-button expand="block" class="btn-action primary ion-margin-top" :disabled="saving || !user.name" @click="saveUser">Simpan Kontak</ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, watch } from 'vue'
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner, IonCard, IonCardContent, IonButtons, IonIcon } from '@ionic/vue';
import { UsersRepository } from '@/db/usersRepository'

export default {
  name: 'UsersEditModal',
  props: ['isOpen', 'userId'],
  emits: ['update:isOpen', 'saved'],
  components: { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner, IonCard, IonCardContent, IonButtons, IonIcon },
  setup(props, { emit }) {
    const isEdit = ref(!!props.userId)
    const user = ref({ name: '', phone: '', email: '', role: 'Pelanggan' })
    const loading = ref(false)
    const saving = ref(false)

    const fetchUser = async () => {
      if (!props.userId) {
          user.value = { name: '', phone: '', email: '', role: 'Pelanggan' }
          return
      }
      loading.value = true
      try {
        const found = await UsersRepository.getById(parseInt(props.userId))
        user.value = {
          name: '',
          phone: '',
          email: '',
          role: 'Pelanggan',
          ...found
        }
      } finally {
        loading.value = false
      }
    }

    watch(() => props.isOpen, (val) => {
        if (val) {
            isEdit.value = !!props.userId
            fetchUser()
        }
    })

    const saveUser = async () => {
      if (!user.value.name?.trim()) return
      saving.value = true
      try {
        if (isEdit.value) {
            await UsersRepository.update(parseInt(props.userId), user.value)
        } else {
            await UsersRepository.add(user.value)
        }
        emit('saved')
        emit('update:isOpen', false)
      } finally {
        saving.value = false
      }
    }

    return { user, loading, saving, saveUser, isEdit }
  }
}
</script>
