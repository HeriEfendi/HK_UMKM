<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="payment-modal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Bayar / Cicil Utang</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Tutup</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="app-content-wrap bg-light ion-padding">
      <div v-if="debt" class="d-flex flex-column gap-3">
        <!-- Debt Overview Card -->
        <div class="mobile-card p-3 shadow-sm">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="text-xs text-muted text-uppercase fw-bold">Pemberi Utang</span>
              <h5 class="fw-bold text-dark mb-0">{{ debt.lender }}</h5>
            </div>
            <span class="badge text-xs px-2 py-1" :class="isPaid ? 'bg-success text-white' : 'bg-warning text-dark'">
              {{ isPaid ? 'Lunas' : (paidAmount > 0 ? 'Sedang Dicicil' : 'Belum Dibayar') }}
            </span>
          </div>

          <!-- Schedule Badge if any -->
          <div v-if="getScheduleText(debt)" class="d-inline-flex align-items-center gap-1 badge bg-info text-white text-xs mb-2">
            <ion-icon :icon="calendarOutline" />
            <span>{{ getScheduleText(debt) }}</span>
          </div>

          <!-- Financial Breakdown -->
          <div class="row g-2 text-center my-2 p-2 bg-light rounded-3 border">
            <div class="col-4">
              <small class="text-muted text-xs d-block">Total Utang</small>
              <strong class="text-dark text-xs text-sm-semibold">{{ formatPrice(totalAmount) }}</strong>
            </div>
            <div class="col-4 border-start border-end">
              <small class="text-muted text-xs d-block">Sudah Dibayar</small>
              <strong class="text-success text-xs text-sm-semibold">{{ formatPrice(paidAmount) }}</strong>
            </div>
            <div class="col-4">
              <small class="text-muted text-xs d-block">Sisa Tagihan</small>
              <strong class="text-danger text-xs text-sm-semibold">{{ formatPrice(remainingAmount) }}</strong>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-2">
            <div class="d-flex justify-content-between text-xs text-muted mb-1">
              <span>Progres Pelunasan</span>
              <span class="fw-bold text-dark">{{ progressPercentage }}%</span>
            </div>
            <div class="progress" style="height: 8px; border-radius: 4px;">
              <div
                class="progress-bar bg-success"
                role="progressbar"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Action Form Card -->
        <div class="mobile-card p-3 shadow-sm" v-if="remainingAmount > 0">
          <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <ion-icon :icon="cashOutline" class="text-primary fs-5" />
            Catat Pembayaran Baru
          </h6>

          <!-- Quick Pay Full Button -->
          <div class="mb-3 p-3 bg-light-primary rounded-3 border border-primary border-opacity-25">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong class="text-primary d-block text-sm">Lunasi Sekaligus?</strong>
                <small class="text-muted text-xs">Bayar seluruh sisa tagihan ({{ formatPrice(remainingAmount) }})</small>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm fw-bold px-3 text-nowrap"
                @click="payFullDirectly"
              >
                <ion-icon :icon="checkmarkDoneOutline" class="me-1" />
                Lunasi Penuh
              </button>
            </div>
          </div>

          <!-- Installment Payment Form -->
          <div class="form-stack">
            <div class="field-group mb-2">
              <label class="field-label">Nominal Pembayaran / Cicilan (Rp)</label>
              <NumberInput v-model="form.amount" placeholder="Contoh: 500.000" />
            </div>

            <!-- Quick Amount Chips -->
            <div class="d-flex flex-wrap gap-1 mb-3">
              <button
                type="button"
                class="btn btn-outline-secondary btn-xs py-1 px-2"
                @click="form.amount = remainingAmount"
              >
                Sisa Lunas ({{ formatPrice(remainingAmount) }})
              </button>
              <button
                v-if="debt.installmentAmount && debt.installmentAmount <= remainingAmount"
                type="button"
                class="btn btn-outline-primary btn-xs py-1 px-2"
                @click="form.amount = debt.installmentAmount"
              >
                Cicilan Terjadwal ({{ formatPrice(debt.installmentAmount) }})
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary btn-xs py-1 px-2"
                v-for="chip in quickChips"
                :key="chip"
                @click="form.amount = chip"
              >
                {{ formatPrice(chip) }}
              </button>
            </div>

            <div class="field-group mb-2">
              <label class="field-label">Tanggal Pembayaran</label>
              <input type="date" v-model="form.date" class="form-control app-control" />
            </div>

            <div class="field-group mb-3">
              <label class="field-label">Catatan Pembayaran</label>
              <input
                type="text"
                v-model="form.notes"
                class="form-control app-control"
                placeholder="Contoh: Cicilan ke-1, Transfer BCA, dll"
              />
            </div>

            <button
              type="button"
              class="btn btn-action primary w-100 py-2 fw-bold text-sm"
              :disabled="!form.amount || form.amount <= 0 || form.amount > remainingAmount"
              @click="submitPayment"
            >
              <ion-icon :icon="checkmarkCircleOutline" class="me-1" />
              Simpan Pembayaran Cicilan
            </button>
          </div>
        </div>

        <div v-else class="alert alert-success d-flex align-items-center gap-2 rounded-3 shadow-sm">
          <ion-icon :icon="checkmarkCircleOutline" class="fs-4 text-success" />
          <div>
            <strong class="text-sm d-block">Utang Ini Sudah Lunas Penuh!</strong>
            <span class="text-xs">Tidak ada sisa tagihan pembayaran lagi untuk kewajiban ini.</span>
          </div>
        </div>

        <!-- Installments History List -->
        <div class="mobile-card p-3 shadow-sm">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <ion-icon :icon="receiptOutline" class="text-secondary fs-5" />
              Riwayat Pembayaran Cicilan ({{ installmentsList.length }})
            </h6>
          </div>

          <div v-if="installmentsList.length > 0" class="d-flex flex-column gap-2">
            <div
              v-for="(inst, index) in installmentsList"
              :key="inst.id || index"
              class="p-2 px-3 bg-light rounded-3 border d-flex justify-content-between align-items-center"
            >
              <div>
                <div class="d-flex align-items-center gap-2">
                  <strong class="text-dark text-sm">{{ formatPrice(inst.amount) }}</strong>
                  <span class="badge bg-secondary text-white text-xs py-0">Cicilan #{{ installmentsList.length - index }}</span>
                </div>
                <small class="text-muted text-xs d-block mt-1">
                  <ion-icon :icon="calendarOutline" class="me-1 align-text-bottom" />
                  {{ formatDate(inst.date) }} {{ inst.notes ? '• ' + inst.notes : '' }}
                </small>
              </div>

              <button
                type="button"
                class="btn btn-sm text-danger p-1"
                title="Hapus Pembayaran Ini"
                @click="deleteInstallment(inst.id || index)"
              >
                <ion-icon :icon="trashOutline" class="fs-5" />
              </button>
            </div>
          </div>

          <div v-else class="text-center py-4 text-muted text-xs">
            Belum ada riwayat pembayaran cicilan yang dicatat.
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, alertController
} from '@ionic/vue'
import {
  cashOutline, checkmarkCircleOutline, checkmarkDoneOutline,
  calendarOutline, receiptOutline, trashOutline
} from 'ionicons/icons'
import { debtsRepo } from '../../../db/repositories'

export default {
  name: 'DebtPaymentModal',
  components: {
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon
  },
  props: {
    isOpen: Boolean,
    debt: {
      type: Object,
      default: null
    }
  },
  emits: ['update:isOpen', 'saved'],
  setup(props, { emit }) {
    const form = reactive({
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      notes: ''
    })

    const quickChips = computed(() => {
      const remaining = remainingAmount.value
      const list = [100000, 200000, 500000, 1000000]
      return list.filter(v => v < remaining)
    })

    const totalAmount = computed(() => Number(props.debt?.amount || 0))

    const installmentsList = computed(() => {
      if (!props.debt || !props.debt.installments) return []
      return [...props.debt.installments].reverse()
    })

    const paidAmount = computed(() => {
      if (!props.debt) return 0
      if (Array.isArray(props.debt.installments) && props.debt.installments.length > 0) {
        return props.debt.installments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      }
      return props.debt.status === 'Lunas' || props.debt.status === 'Paid' ? totalAmount.value : (Number(props.debt.paidAmount) || 0)
    })

    const remainingAmount = computed(() => {
      const rem = totalAmount.value - paidAmount.value
      return rem > 0 ? rem : 0
    })

    const isPaid = computed(() => {
      return remainingAmount.value <= 0 || (props.debt && (props.debt.status === 'Lunas' || props.debt.status === 'Paid'))
    })

    const progressPercentage = computed(() => {
      if (totalAmount.value <= 0) return 0
      const pct = Math.round((paidAmount.value / totalAmount.value) * 100)
      return pct > 100 ? 100 : pct
    })

    const resetForm = () => {
      form.amount = null
      form.date = new Date().toISOString().slice(0, 10)
      form.notes = ''
    }

    watch(() => props.isOpen, (open) => {
      if (open) {
        resetForm()
        if (props.debt?.installmentAmount && props.debt.installmentAmount <= remainingAmount.value) {
          form.amount = props.debt.installmentAmount
        }
      }
    })

    const closeModal = () => {
      emit('update:isOpen', false)
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(Number(price || 0))
    }

    const formatDate = (d) => {
      if (!d) return '-'
      const date = new Date(d)
      if (isNaN(date.getTime())) return d
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const getScheduleText = (debt) => {
      if (!debt || debt.paymentType !== 'installment') return null
      const freq = debt.installmentFrequency
      const day = debt.payDayOfMonth || 5
      if (freq === 'monthly') return `Jadwal: Tgl ${day} tiap bulan`
      if (freq === 'quarterly') return `Jadwal: 3 bulan sekali (tgl ${day})`
      if (freq === 'biannual') return `Jadwal: 6 bulan sekali (tgl ${day})`
      if (freq === 'annual') return `Jadwal: 1 tahun sekali (tgl ${day})`
      if (freq === 'custom') return 'Jadwal: Cicilan fleksibel'
      return 'Jadwal: Dicicil'
    }

    const submitPayment = async () => {
      if (!form.amount || form.amount <= 0 || !props.debt) return

      const payAmount = Math.min(Number(form.amount), remainingAmount.value)
      const rawDebt = JSON.parse(JSON.stringify(props.debt))
      const newInstallment = {
        id: Date.now(),
        amount: payAmount,
        date: form.date || new Date().toISOString().slice(0, 10),
        notes: form.notes || 'Pembayaran Cicilan'
      }

      const existingInstallments = Array.isArray(rawDebt.installments) ? rawDebt.installments : []
      const updatedInstallments = [...existingInstallments, newInstallment]
      const newPaidAmount = updatedInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      const newStatus = newPaidAmount >= totalAmount.value ? 'Lunas' : 'Belum Lunas'

      const updatedDebt = {
        ...rawDebt,
        installments: updatedInstallments,
        paidAmount: newPaidAmount,
        status: newStatus
      }

      await debtsRepo.update(props.debt.id, updatedDebt)
      resetForm()
      emit('saved')
      if (newPaidAmount >= totalAmount.value) {
        closeModal()
      }
    }

    const payFullDirectly = async () => {
      if (!props.debt || remainingAmount.value <= 0) return

      const rawDebt = JSON.parse(JSON.stringify(props.debt))
      const newInstallment = {
        id: Date.now(),
        amount: remainingAmount.value,
        date: new Date().toISOString().slice(0, 10),
        notes: 'Pelunasan Penuh Sisa Utang'
      }

      const existingInstallments = Array.isArray(rawDebt.installments) ? rawDebt.installments : []
      const updatedInstallments = [...existingInstallments, newInstallment]
      const newPaidAmount = updatedInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0)

      const updatedDebt = {
        ...rawDebt,
        installments: updatedInstallments,
        paidAmount: newPaidAmount,
        status: 'Lunas'
      }

      await debtsRepo.update(props.debt.id, updatedDebt)
      emit('saved')
      closeModal()
    }

    const deleteInstallment = async (instId) => {
      const alert = await alertController.create({
        header: 'Hapus Pembayaran',
        message: 'Yakin ingin menghapus catatan pembayaran cicilan ini?',
        buttons: [
          { text: 'Batal', role: 'cancel' },
          {
            text: 'Hapus',
            role: 'destructive',
            handler: async () => {
              const rawDebt = JSON.parse(JSON.stringify(props.debt))
              const existingInstallments = Array.isArray(rawDebt.installments) ? rawDebt.installments : []
              const updatedInstallments = existingInstallments.filter((item, idx) => {
                if (item.id) return item.id !== instId
                return idx !== instId
              })
              const newPaidAmount = updatedInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
              const newStatus = newPaidAmount >= totalAmount.value ? 'Lunas' : 'Belum Lunas'

              const updatedDebt = {
                ...rawDebt,
                installments: updatedInstallments,
                paidAmount: newPaidAmount,
                status: newStatus
              }

              await debtsRepo.update(props.debt.id, updatedDebt)
              emit('saved')
            }
          }
        ]
      })
      await alert.present()
    }

    return {
      form, totalAmount, paidAmount, remainingAmount, isPaid, progressPercentage,
      installmentsList, quickChips, closeModal, formatPrice, formatDate,
      getScheduleText, submitPayment, payFullDirectly, deleteInstallment,
      cashOutline, checkmarkCircleOutline, checkmarkDoneOutline,
      calendarOutline, receiptOutline, trashOutline
    }
  }
}
</script>

<style scoped>
.payment-modal {
  --max-width: 540px;
}
.bg-light-primary {
  background-color: rgba(59, 130, 246, 0.08);
}
.btn-xs {
  font-size: 0.72rem;
  border-radius: 6px;
}
</style>
