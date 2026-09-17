<template>
  <ion-page class="app-page">
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero">
          <div>
            <ion-title class="app-hero-title">{{ isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}</ion-title>
            <p class="app-hero-subtitle">Catat pengeluaran Anda dan potong saldo akun bank secara otomatis.</p>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap">
      <div v-if="!loaded" class="loading-state text-center py-5">
        <ion-spinner />
        <p>Memuat data...</p>
      </div>

      <ion-card v-else class="mobile-card mx-3">
        <ion-card-content>
          <div class="form-stack">
            <div class="field-group">
              <label class="field-label">Deskripsi / Keperluan</label>
              <input type="text" v-model="form.description" class="form-control app-control" placeholder="Contoh: Beli Bahan Baku, Bayar Listrik Toko" />
            </div>
            
            <div class="field-group">
              <label class="field-label">Jumlah (Rp)</label>
              <NumberInput v-model="form.amount" placeholder="0" />
            </div>

            <div class="field-group">
              <label class="field-label">Tanggal</label>
              <input type="date" v-model="form.date" class="form-control app-control" />
            </div>

            <div class="field-group">
              <label class="field-label">Kategori Biaya (M-05)</label>
              <select v-model="selectedCategoryChoice" class="form-control app-control" @change="onCategoryChange">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                <option value="__custom__">+ Kategori Kustom Baru...</option>
              </select>
            </div>

            <div v-if="selectedCategoryChoice === '__custom__'" class="field-group">
              <label class="field-label text-primary">Tulis Nama Kategori Kustom</label>
              <input type="text" v-model="customCategoryText" class="form-control app-control" placeholder="Contoh: Pemeliharaan Mesin, Iklan IG" />
            </div>

            <div class="field-group">
              <label class="field-label">Sumber Dana / Rekening</label>
              <select v-model="form.accountId" class="form-control app-control">
                <option :value="null">-- Tanpa Potong Saldo (Hanya Catat) --</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
              <small class="text-muted" v-if="form.accountId">Memilih akun bank akan otomatis memotong saldo tabungan terkait.</small>
            </div>
          </div>

          <div class="mobile-card-footer mt-4">
            <ion-button class="btn-action light" router-link="/expenses">Batal</ion-button>
            <ion-button class="btn-action primary" @click="onSubmit" :disabled="!form.description || form.amount <= 0">
              {{ isEdit ? 'Simpan Perubahan' : 'Simpan' }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import { computed, ref } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { expensesRepo, savingAccountsRepo, savingTransactionsRepo } from '../../../db/repositories'
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner, IonCard, IonCardContent } from '@ionic/vue';

export default {
  name: 'AccountingExpensesFormView',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner, IonCard, IonCardContent },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loaded = ref(false)
    const accounts = ref([])
    
    const categories = [
      'Makanan & Minuman',
      'Transportasi & Bensin',
      'Perawatan & Servis Kendaraan',
      'Kebutuhan Rumah Tangga',
      'Amal & Sosial',
      'Hiburan & Liburan',
      'Tagihan & Utilitas',
      'Sewa Tempat / Kios',
      'Listrik, Air & Internet',
      'Perlengkapan Toko',
      'Bahan Baku / Modal Kulakan',
      'Pemasaran & Promosi',
      'Pajak & Retribusi Usaha',
      'Lain-lain'
    ]

    const selectedCategoryChoice = ref('Makanan & Minuman')
    const customCategoryText = ref('')

    const form = ref({
      description: '',
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      category: 'Makanan & Minuman',
      accountId: null,
      savingTxId: null
    })

    const onCategoryChange = () => {
      if (selectedCategoryChoice.value !== '__custom__') {
        form.value.category = selectedCategoryChoice.value
      }
    }

    const isEdit = computed(() => Boolean(route.params.id))

    const resetForm = () => {
      selectedCategoryChoice.value = 'Makanan & Minuman'
      customCategoryText.value = ''
      form.value = {
        description: '',
        amount: null,
        date: new Date().toISOString().slice(0, 10),
        category: 'Makanan & Minuman',
        accountId: null,
        savingTxId: null
      }
    }

    const load = async () => {
      loaded.value = false
      try {
        accounts.value = await savingAccountsRepo.getAll()
        
        if (!isEdit.value) {
          resetForm()
          loaded.value = true
          return
        }

        const data = await expensesRepo.getById(Number(route.params.id))
        if (!data) return router.push('/expenses')

        const cat = data.category || 'Lain-lain'
        if (categories.includes(cat)) {
          selectedCategoryChoice.value = cat
          customCategoryText.value = ''
        } else {
          selectedCategoryChoice.value = '__custom__'
          customCategoryText.value = cat
        }

        form.value = {
          description: data.description || '',
          amount: data.amount || 0,
          date: (data.date || new Date().toISOString()).slice(0, 10),
          category: cat,
          accountId: data.accountId || null,
          savingTxId: data.savingTxId || null
        }
      } catch (err) {
        console.error('Failed to load expense form data:', err)
      } finally {
        loaded.value = true
      }
    }

    const onSubmit = async () => {
      const finalCat = selectedCategoryChoice.value === '__custom__'
        ? (customCategoryText.value.trim() || 'Lain-lain')
        : selectedCategoryChoice.value

      const payload = {
        ...form.value,
        category: finalCat,
        amount: Number(form.value.amount),
        accountId: form.value.accountId ? Number(form.value.accountId) : null
      }

      try {
        if (isEdit.value) {
          // If previously had a linked saving transaction
          if (payload.savingTxId) {
            if (payload.accountId) {
              // Update existing linked transaction
              await savingTransactionsRepo.update(payload.savingTxId, {
                accountId: payload.accountId,
                amount: payload.amount,
                date: payload.date,
                description: `Pengeluaran: ${payload.description}`
              })
            } else {
              // Remove the saving transaction because accountId was unselected
              await savingTransactionsRepo.delete(payload.savingTxId)
              payload.savingTxId = null
            }
          } else if (payload.accountId) {
            // Create a new saving transaction because accountId was selected
            const tx = await savingTransactionsRepo.add({
              accountId: payload.accountId,
              type: 'WITHDRAWAL',
              amount: payload.amount,
              date: payload.date,
              category: 'Pengeluaran',
              description: `Pengeluaran: ${payload.description}`
            })
            payload.savingTxId = tx.id
          }

          await expensesRepo.update(Number(route.params.id), payload)
        } else {
          // Create new expense
          if (payload.accountId) {
            const tx = await savingTransactionsRepo.add({
              accountId: payload.accountId,
              type: 'WITHDRAWAL',
              amount: payload.amount,
              date: payload.date,
              category: 'Pengeluaran',
              description: `Pengeluaran: ${payload.description}`
            })
            payload.savingTxId = tx.id
          }

          await expensesRepo.add(payload)
        }

        await router.push('/expenses')
      } catch (err) {
        console.error('Failed to save expense:', err)
      }
    }

    onIonViewWillEnter(load)

    return { form, onSubmit, loaded, isEdit, categories, accounts, selectedCategoryChoice, customCategoryText, onCategoryChange }
  }
}
</script>
