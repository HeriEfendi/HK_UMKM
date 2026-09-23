<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-hero" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ion-title class="app-hero-title" style="padding: 0;">Ceklok</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="openSettingsModal">
                <ion-icon :icon="settingsOutline" />
              </ion-button>
            </ion-buttons>
          </div>
          <p class="app-hero-subtitle" style="margin: 0;">Catat waktu hadir dan pulang, serta pantau status presensi harian.</p>
        </div>
      </ion-toolbar>

      <!-- Tabs Segment -->
      <div class="p-3">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="presensi">
            <ion-label>Presensi</ion-label>
          </ion-segment-button>
          <ion-segment-button value="dashboard">
            <ion-label>Dashboard</ion-label>
          </ion-segment-button>
          <ion-segment-button value="riwayat">
            <ion-label>Riwayat</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </ion-header> 

    <ion-content class="app-content-wrap">
      <!-- TAB 1: PRESENSI (Clock In/Out) -->
      <div v-show="activeTab === 'presensi'" class="ion-padding">
        <div class="row">
          <!-- Column 1: Live Status -->
          <div class="col-12 col-md-4 mb-3">
            <div class="mobile-card container-padded text-center py-4 h-100">
              <div class="current-time">{{ currentTimeStr }}</div>
              <div class="current-date">{{ currentDateStr }}</div>
              <div class="status-indicator mt-2" :class="activeLog ? 'active' : 'inactive'">
                <span class="dot"></span>
                {{ activeLog ? `Sedang Kerja (${activeLog.type})` : 'Belum Mulai Kerja' }}
              </div>
            </div>
          </div>

          <!-- Column 2: Actions & Durations -->
          <div class="col-12 col-md-4 mb-3">
            <div class="container-padded text-center py-2 h-100 d-flex flex-column justify-content-center">
              <button 
                class="ceklok-btn mx-auto" 
                :class="activeLog ? 'stop' : 'start'"
                @click="handleClockToggle"
              >
                <ion-icon :icon="activeLog ? stopOutline : playOutline" class="ceklok-btn-icon" />
                <span class="ceklok-btn-text">{{ activeLog ? 'Selesai Kerja' : 'Mulai Kerja' }}</span>
              </button>
              
              <div v-if="activeLog" class="duration-counter mt-4">
                <div class="row align-items-center text-center">
                  <div class="col-6 border-end">
                    <small class="text-muted d-block">Durasi</small>
                    <span class="fw-bold fs-5 text-indigo">{{ liveDurationStr }}</span>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block">Masuk</small>
                    <span class="fw-bold fs-5 text-teal">{{ formatTime(activeLog.clockIn) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: Details & Breaks -->
          <div class="col-12 col-md-4 mb-3">
            <div class="mobile-card container-padded h-100">
              <h5 class="fw-bold mb-3 text-dark">Detail Pekerjaan</h5>
              
              <div class="form-section mb-3">
                <label class="form-label">Tipe Presensi</label>
                <div class="d-flex gap-2">
                  <button type="button" class="btn flex-fill btn-outline-teal" :class="{ 'active': localType === 'WFO' }" @click="localType = 'WFO'" :disabled="!!activeLog">WFO</button>
                  <button type="button" class="btn flex-fill btn-outline-teal" :class="{ 'active': localType === 'WFH' }" @click="localType = 'WFH'" :disabled="!!activeLog">WFH</button>
                  <button type="button" class="btn flex-fill btn-outline-teal" :class="{ 'active': localType === 'Dinas' }" @click="localType = 'Dinas'" :disabled="!!activeLog">Dinas</button>
                </div>
              </div>

              <div class="form-section mb-3">
                <label class="form-label">Catatan</label>
                <textarea v-model="localNotes" class="form-control app-control" rows="2" placeholder="Tulis aktivitas..." @change="saveActiveNotes"></textarea>
              </div>

              <div v-if="activeLog" class="form-section mt-4 pt-3 border-top">
                <label class="form-label d-flex justify-content-between align-items-center">
                  <span>Waktu Istirahat</span>
                  <ion-badge color="warning" v-if="activeBreak">{{ activeBreak.name }}</ion-badge>
                </label>
                <button type="button" class="btn btn-action w-100" :class="activeBreak ? 'danger' : 'warning'" @click="activeBreak ? endBreak() : startBreak()">
                  <ion-icon :icon="activeBreak ? stopOutline : cafeOutline" class="me-2" /> {{ activeBreak ? 'Selesai Istirahat' : 'Mulai Istirahat' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: DASHBOARD (Stats & Charts) -->
      <div v-show="activeTab === 'dashboard'" class="ion-padding">
        <!-- KPI Row -->
        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Jam Kerja (Minggu Ini)</small>
                  <div class="fs-4 fw-black text-indigo mt-1">{{ Math.floor(totalWeekHours) }}.{{ String(Math.round((totalWeekHours % 1) * 60)).padStart(2, '0') }} <span class="fs-6 fw-normal">Jam</span></div>
                  <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar bg-indigo" role="progressbar" :style="{ width: Math.min(100, (totalWeekHours / 40) * 100) + '%' }"></div>
                  </div>
                  <small class="text-muted mt-1 d-block small">Target: 40 Jam / Minggu</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Jam Kerja (Periode)</small>
                  <div class="fs-4 fw-black text-teal mt-1">{{ Math.floor(totalMonthHours) }}.{{ String(Math.round((totalMonthHours % 1) * 60)).padStart(2, '0') }} <span class="fs-6 fw-normal">Jam</span></div>
                  <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar bg-teal" role="progressbar" :style="{ width: Math.min(100, (totalMonthHours / 160) * 100) + '%' }"></div>
                  </div>
                  <small class="text-muted mt-1 d-block small">Target: 160 Jam / Periode</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Hari Kerja</small>
                  <div class="fs-4 fw-black text-amber mt-1">{{ daysWorkedThisMonth }} <span class="fs-6 fw-normal">Hari</span></div>
                  <small class="text-muted mt-1 d-block small">Periode aktif</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-sm="6" size-md="3">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="py-3">
                  <small class="text-muted d-block text-xs">Rata-rata Harian</small>
                  <div class="fs-4 fw-black text-primary mt-1">{{ Math.floor(avgDailyHours) }}.{{ String(Math.round((avgDailyHours % 1) * 60)).padStart(2, '0') }} <span class="fs-6 fw-normal">Jam</span></div>
                  <small class="text-muted mt-1 d-block small">Hari aktif</small>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-grid class="mx-2">
          <ion-row>
            <ion-col size="12" size-sm="6" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Grafik Harian Minggu Ini</h6>
                    <span class="badge bg-light text-muted border small">{{ weeklyPeriodRange }}</span>
                  </div>
                  <VueApexCharts v-if="weeklyChartSeries.series[0].data.some(v => v > 0)" :key="'weekly-' + logs.length" type="bar" height="240" :options="weeklyChartOptions" :series="weeklyChartSeries.series" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data untuk minggu ini.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-sm="6" size-lg="6">
              <ion-card class="mobile-card m-0 h-100">
                <ion-card-content class="container-padded">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark mb-0">Grafik Mingguan Bulan Ini</h6>
                    <span class="badge bg-light text-muted border small">{{ monthlyPeriodRange }}</span>
                  </div>
                  <VueApexCharts v-if="monthlyChartSeries[0].data.some(v => v > 0)" :key="'monthly-' + logs.length" type="area" height="240" :options="monthlyChartOptions" :series="monthlyChartSeries" />
                  <div v-else class="text-center py-4 text-muted">Belum ada data untuk bulan ini.</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- TAB 3: RIWAYAT (History List) -->
      <div v-show="activeTab === 'riwayat'" class="ion-padding">
        <!-- Filter and Export Actions -->
        <div class="d-flex justify-content-between align-items-center mx-3 mb-3">
          <button class="btn btn-action primary btn-md" @click="openCorrectionModal">
            <ion-icon :icon="addOutline" class="me-1" /> Koreksi Absen
          </button>
          <button class="btn btn-action success btn-md" @click="exportExcel">
            <ion-icon :icon="downloadOutline" class="me-1" /> Export Excel
          </button>
        </div>

        <!-- History List -->
        <div v-if="logs.length === 0" class="text-center py-5 text-muted mobile-card container-padded">
          <ion-icon :icon="calendarOutline" style="font-size: 3rem;" class="mb-2 text-muted" />
          <p>Belum ada riwayat presensi kerja.</p>
        </div>

        <div v-else>
          <div 
            v-for="log in logs" 
            :key="log.id" 
            class="mobile-card container-padded mb-3 border-start border-4"
            :class="log.clockOut ? 'border-teal' : 'border-warning'"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="badge mb-2 me-1" :class="log.clockOut ? 'bg-success' : 'bg-warning'">
                  {{ log.clockOut ? 'Selesai' : 'Sedang Kerja' }}
                </span>
                <span class="badge bg-secondary mb-2">{{ log.type }}</span>
                <h6 class="fw-bold text-dark mb-1">{{ formatDateStr(log.date) }}</h6>
              </div>
              <div class="d-flex gap-1">
                <button class="btn btn-light btn-md text-primary" @click="editLog(log)" title="Edit">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="btn btn-light btn-md text-danger" @click="confirmDelete(log.id)" title="Hapus">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>

            <div class="row mt-2 text-muted small">
              <div class="col-4">
                <strong>Masuk</strong><br>
                {{ formatTime(log.clockIn) }}
              </div>
              <div class="col-4">
                <strong>Keluar</strong><br>
                {{ log.clockOut ? formatTime(log.clockOut) : '--:--' }}
              </div>
              <div class="col-4">
                <strong>Jam Kerja</strong><br>
                <span class="fw-bold text-dark">{{ Math.floor(log.totalWorkHours) }}:{{ String(Math.round((log.totalWorkHours % 1) * 60)).padStart(2, '0') }} Jam</span>
              </div>
            </div>

            <!-- Breaks list -->
            <div v-if="log.breaks && log.breaks.length > 0" class="mt-2 pt-2 border-top">
              <div class="text-muted" style="font-size: 0.75rem;">
                <strong>Istirahat:</strong> 
                <span v-for="(b, idx) in log.breaks" :key="idx" class="ms-1 badge bg-light text-dark border">
                  {{ b.name }} ({{ b.durationMinutes }}m)
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="log.notes" class="mt-2 p-2 bg-light rounded text-muted" style="font-size: 0.8rem; font-style: italic;">
              "{{ log.notes }}"
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- SETTINGS MODAL -->
    <ion-modal ref="settingsModal" :is-open="settingsModalVisible" @didDismiss="settingsModalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Pengaturan Presensi</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="settingsModalVisible = false">Batal</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding bg-light">
        <div class="mobile-card p-3 mb-4">
          <h6 class="fw-bold text-dark mb-3">Siklus & Periode Cut Off</h6>
          
          <div class="form-section mb-3">
            <label class="form-label">Tipe Periode</label>
            <select v-model="settings.cutoffType" class="form-select app-control">
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>

          <div class="form-section mb-3" v-if="settings.cutoffType === 'weekly'">
            <label class="form-label">Awal Hari Mingguan</label>
            <select v-model.number="settings.cutoffDay" class="form-select app-control">
              <option :value="1">Senin</option>
              <option :value="2">Selasa</option>
              <option :value="3">Rabu</option>
              <option :value="4">Kamis</option>
              <option :value="5">Jumat</option>
              <option :value="6">Sabtu</option>
              <option :value="0">Minggu</option>
            </select>
            <small class="text-muted">Hari ini menjadi patokan awal grafik mingguan.</small>
          </div>

          <div class="form-section mb-3" v-else>
            <label class="form-label">Tanggal Cut Off Bulanan</label>
            <input type="number" v-model.number="settings.cutoffDate" class="form-control app-control" min="1" max="28" />
            <small class="text-muted">Tanggal penutupan absen tiap bulan (Misal: 25).</small>
          </div>
        </div>

        <!-- Work Schedule Card -->
        <div class="mobile-card p-3 mb-4">
          <h6 class="fw-bold text-dark mb-1">Jam Kerja & Toleransi</h6>
          <p class="text-muted mb-3" style="font-size: 0.78rem;">Patokan jam masuk/pulang dan batas toleransi. Absen yang dimulai melebihi batas awal/akhir akan di-snap/stop otomatis.</p>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label">Jam Masuk</label>
              <input type="time" v-model="settings.workStart" class="form-control app-control" />
            </div>
            <div class="col-6">
              <label class="form-label">Jam Pulang</label>
              <input type="time" v-model="settings.workEnd" class="form-control app-control" />
            </div>
          </div>

          <div class="form-section mb-2">
            <label class="form-label d-flex justify-content-between">
              <span>Toleransi (menit)</span>
              <strong class="text-teal">{{ settings.toleranceMinutes }} menit</strong>
            </label>
            <input
              type="range"
              v-model.number="settings.toleranceMinutes"
              class="form-range"
              min="0" max="60" step="5"
            />
            <div class="d-flex justify-content-between" style="font-size: 0.7rem; color: #94a3b8;">
              <span>0m</span><span>15m</span><span>30m</span><span>45m</span><span>60m</span>
            </div>
          </div>

          <div class="alert-info-box mt-2">
            <div class="d-flex gap-2">
              <span>⏰</span>
              <div style="font-size: 0.75rem; color: #1e40af; line-height: 1.45;">
                <strong>Masuk lebih awal:</strong> Jika mulai kerja sebelum {{ effectiveStartStr }}, jam masuk tercatat sebagai {{ effectiveStartStr }}.<br>
                <strong>Pulang terlambat:</strong> Jika melewati {{ effectiveEndStr }}, shift otomatis berhenti.
              </div>
            </div>
          </div>
        </div>

        <div class="mobile-card p-3 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold text-dark mb-0">Preset Jam Istirahat</h6>
            <button class="btn btn-action primary btn-md" @click="addNewBreakPreset">
              <ion-icon :icon="addOutline" /> Tambah
            </button>
          </div>

          <div v-if="settings.breaks.length === 0" class="text-center py-3 text-muted">
            Belum ada preset jam istirahat.
          </div>

          <div v-else>
            <div 
              v-for="(bc, index) in settings.breaks" 
              :key="bc.id" 
              class="border rounded p-3 mb-2 bg-white"
            >
              <div class="d-flex justify-content-between align-items-center mb-2">
                <input type="text" v-model="bc.name" class="form-control form-control-sm w-70 fw-bold border-0 p-0" placeholder="Nama Istirahat" />
                <button class="btn btn-link text-danger btn-md p-0" @click="removeBreakPreset(index)">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
              
              <div class="row g-2">
                <div class="col-4">
                  <small class="text-muted d-block">Mulai</small>
                  <input type="time" v-model="bc.start" class="form-control form-control-sm" @change="calculatePresetDuration(bc)" />
                </div>
                <div class="col-4">
                  <small class="text-muted d-block">Selesai</small>
                  <input type="time" v-model="bc.end" class="form-control form-control-sm" @change="calculatePresetDuration(bc)" />
                </div>
                <div class="col-4 text-center">
                  <small class="text-muted d-block">Durasi (m)</small>
                  <span class="fw-semibold">{{ bc.duration }}m</span>
                </div>
              </div>

              <div class="form-check mt-2">
                <input class="form-check-input" type="checkbox" v-model="bc.autoDeduct" :id="'autoDeduct-' + bc.id">
                <label class="form-check-label small" :for="'autoDeduct-' + bc.id">
                  Kurangi otomatis jika shift melewati jam ini
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3">
          <button class="btn btn-action primary w-100" @click="saveSettings">Simpan Pengaturan</button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- MANUAL / EDIT CORRECTION MODAL -->
    <ion-modal ref="correctionModal" :is-open="correctionModalVisible" @didDismiss="correctionModalVisible = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ correctionForm.id ? 'Edit Log Presensi' : 'Koreksi Log Presensi' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="correctionModalVisible = false">Batal</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding bg-light">
        <div class="mobile-card container-padded mb-3">
          <div class="form-section mb-3">
            <label class="form-label">Tanggal</label>
            <input type="date" v-model="correctionForm.date" class="form-control app-control" />
          </div>

          <div class="form-section mb-3">
            <label class="form-label">Tipe Kerja</label>
            <select v-model="correctionForm.type" class="form-select app-control">
              <option value="WFO">WFO</option>
              <option value="WFH">WFH</option>
              <option value="Dinas">Dinas</option>
            </select>
          </div>

          <div class="row g-2 mx-1 mb-3">
            <div class="col-6">
              <label class="form-label">Jam Masuk</label>
              <input type="time" v-model="correctionForm.inTime" class="form-control app-control" />
            </div>
            <div class="col-6">
              <label class="form-label">Jam Keluar</label>
              <input type="time" v-model="correctionForm.outTime" class="form-control app-control" />
            </div>
          </div>

          <div class="form-section mb-3">
            <label class="form-label">Catatan Kegiatan</label>
            <textarea v-model="correctionForm.notes" class="form-control app-control" rows="3" placeholder="Tulis apa yang dikerjakan..."></textarea>
          </div>
        </div>

        <div class="mobile-card container-padded">
          <h6 class="fw-bold text-dark mb-3">Manual Breaks (Optional)</h6>
          <div v-for="(b, idx) in correctionForm.breaks" :key="idx" class="border rounded p-2 mb-2 bg-light">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong>Break #{{ idx + 1 }}</strong>
              <button class="btn btn-link text-danger btn-md p-0" @click="removeCorrectionBreak(idx)">Hapus</button>
            </div>
            <div class="row g-2">
              <div class="col-4">
                <small class="text-muted">Nama</small>
                <input type="text" v-model="b.name" class="form-control form-control-sm" />
              </div>
              <div class="col-4">
                <small class="text-muted">Start</small>
                <input type="time" v-model="b.start" class="form-control form-control-sm" />
              </div>
              <div class="col-4">
                <small class="text-muted">End</small>
                <input type="time" v-model="b.end" class="form-control form-control-sm" />
              </div>
            </div>
          </div>
          <button class="btn btn-action light btn-md w-100 mt-2" @click="addCorrectionBreak">
            + Tambah Istirahat Manual
          </button>
        </div>

      </ion-content>
      <ion-footer>
        <div class="form-actions p-3 d-flex justify-content-center">
          <button class="btn btn-action primary w-50" @click="saveCorrection">Simpan Koreksi</button>
        </div>
      </ion-footer>
    </ion-modal>

    <!-- Delete Confirmation -->
    <ion-alert
      :is-open="deleteId !== null"
      header="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus data presensi ini? Tindakan ini tidak bisa dibatalkan."
      :buttons="[
        { text: 'Batal', role: 'cancel', handler: () => { deleteId = null } },
        { text: 'Hapus', role: 'destructive', handler: () => { deleteLog() } }
      ]"
      @didDismiss="deleteId = null"
    />
  </ion-page>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton,
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonBadge, 
  IonModal, IonAlert, IonFooter, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  toastController
} from '@ionic/vue';
import { 
  settingsOutline, playOutline, stopOutline, cafeOutline, calendarOutline, 
  createOutline, trashOutline, downloadOutline, addOutline 
} from 'ionicons/icons';
import { CeklokRepository } from '@/db/ceklokRepository';
import * as XLSX from 'xlsx';

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

export default {
  name: 'CeklokView',
  components: {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton,
    IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonBadge, 
    IonModal, IonAlert, VueApexCharts, IonFooter, IonGrid, IonRow, IonCol, IonCard, IonCardContent
  },
  setup() {
    // Nav & States
    const activeTab = ref('presensi');
    const logs = ref([]);
    const activeLog = ref(null);
    const activeBreak = ref(null);

    const getLocalDateString = (d = new Date()) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    
    // Live Clocks & Timers
    const currentTimeStr = ref('');
    const currentDateStr = ref('');
    const liveDurationStr = ref('00:00:00');
    let clockInterval = null;
    let timerInterval = null;

    // Presensi Form States
    const localType = ref('WFO');
    const localNotes = ref('');

    // Settings States
    const settingsModalVisible = ref(false);
    const settings = ref({
      cutoffType: 'weekly',
      cutoffDay: 1,
      cutoffDate: 25,
      breaks: [],
      workStart: '08:00',
      workEnd: '17:00',
      toleranceMinutes: 15
    });

    // Correction Modal States
    const correctionModalVisible = ref(false);
    const correctionForm = ref({
      id: null,
      date: '',
      type: 'WFO',
      inTime: '08:00',
      outTime: '17:00',
      notes: '',
      breaks: []
    });

    const effectiveStartStr = computed(() => {
      if (!settings.value.workStart) return '08:00';
      const [h, m] = settings.value.workStart.split(':').map(Number);
      const tolerance = settings.value.toleranceMinutes || 0;
      const totalMinutes = (h * 60 + m) - tolerance;
      const finalH = Math.floor(totalMinutes / 60) % 24;
      const finalM = totalMinutes % 60;
      return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
    });

    const effectiveEndStr = computed(() => {
      if (!settings.value.workEnd) return '17:00';
      const [h, m] = settings.value.workEnd.split(':').map(Number);
      const tolerance = settings.value.toleranceMinutes || 0;
      const totalMinutes = (h * 60 + m) + tolerance;
      const finalH = Math.floor(totalMinutes / 60) % 24;
      const finalM = totalMinutes % 60;
      return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
    });

    const deleteId = ref(null);

    // Live Date/Time clock logic
    const updateLiveClock = () => {
      const now = new Date();
      currentTimeStr.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      currentDateStr.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Shared clock-out logic (used by both manual toggle and auto-stop)
    const performClockOut = async (clockOutDate, isAutoStop = false) => {
      if (!activeLog.value) return;

      // Close any ongoing break first
      const ongoingBreakIdx = activeLog.value.breaks.findIndex(b => !b.end);
      if (ongoingBreakIdx !== -1) {
        const bStart = new Date(activeLog.value.breaks[ongoingBreakIdx].start);
        const bEnd = clockOutDate;
        const dur = Math.round((bEnd.getTime() - bStart.getTime()) / 60000);
        activeLog.value.breaks[ongoingBreakIdx].end = bEnd.toISOString();
        activeLog.value.breaks[ongoingBreakIdx].durationMinutes = Math.max(1, dur);
      }
      activeBreak.value = null;

      // Apply auto-deduct breaks
      const freshSettings = await CeklokRepository.getSettings();
      const dateStr = activeLog.value.clockIn.split('T')[0];
      const clockInTime = new Date(activeLog.value.clockIn);

      freshSettings.breaks.forEach(bc => {
        if (!bc.autoDeduct) return;
        const breakStart = new Date(`${dateStr}T${bc.start}:00`);
        const breakEnd = new Date(`${dateStr}T${bc.end}:00`);
        if (clockInTime <= breakStart && clockOutDate >= breakEnd) {
          const exists = activeLog.value.breaks.some(b => b.name === bc.name || b.name === bc.name + ' (Auto)');
          if (!exists) {
            activeLog.value.breaks.push({
              name: bc.name + ' (Auto)',
              start: breakStart.toISOString(),
              end: breakEnd.toISOString(),
              durationMinutes: bc.duration
            });
          }
        }
      });

      // Compute total working hours
      const clockInMs = new Date(activeLog.value.clockIn).getTime();
      const clockOutMs = clockOutDate.getTime();
      let diffMs = Math.max(0, clockOutMs - clockInMs);
      let totalBreakMinutes = 0;
      activeLog.value.breaks.forEach(b => { totalBreakMinutes += b.durationMinutes; });
      diffMs = Math.max(0, diffMs - (totalBreakMinutes * 60000));

      await CeklokRepository.updateLog(activeLog.value.id, {
        clockOut: clockOutDate.toISOString(),
        breaks: activeLog.value.breaks,
        notes: isAutoStop ? (activeLog.value.notes + (activeLog.value.notes ? '\n' : '') + '[Auto-stop oleh sistem]') : localNotes.value,
        totalWorkHours: diffMs / 3600000
      });

      activeLog.value = null;
      localNotes.value = '';
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      liveDurationStr.value = '00:00:00';
      await loadState();
    };

    // Live active shift timer — also checks for auto-stop when workEnd + tolerance is crossed
    const updateActiveTimer = async () => {
      if (!activeLog.value) {
        liveDurationStr.value = '00:00:00';
        return;
      }
      const now = new Date();
      const inTime = new Date(activeLog.value.clockIn).getTime();
      let diffMs = now.getTime() - inTime;

      // Subtract active breaks durations (both finished and current ongoing breaks)
      let breakMs = 0;
      activeLog.value.breaks.forEach(b => {
        const startMs = new Date(b.start).getTime();
        const endMs = b.end ? new Date(b.end).getTime() : now.getTime();
        breakMs += (endMs - startMs);
      });

      diffMs = Math.max(0, diffMs - breakMs);

      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      liveDurationStr.value = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
      ].join(':');

      // ── AUTO-STOP: trigger if now >= workEnd + tolerance ──
      const cfg = settings.value;
      if (cfg.workEnd && activeLog.value && !activeLog.value.clockOut) {
        const dateStr = activeLog.value.clockIn.split('T')[0];
        const workEndMs = new Date(`${dateStr}T${cfg.workEnd}:00`).getTime();
        const cutoffMs = workEndMs + (cfg.toleranceMinutes || 0) * 60000;
        if (now.getTime() >= cutoffMs) {
          // Clamp clock-out to the exact cutoff moment
          await performClockOut(new Date(cutoffMs), true);
        }
      }
    };

    // Load active logs and presets
    const loadState = async () => {
      logs.value = await CeklokRepository.getAllLogs();
      activeLog.value = await CeklokRepository.getActiveLog();
      const config = await CeklokRepository.getSettings();
      settings.value = JSON.parse(JSON.stringify(config)); // deep copy

      if (activeLog.value) {
        localType.value = activeLog.value.type;
        localNotes.value = activeLog.value.notes;
        
        // Find if there is an active ongoing break
        const ongoingBreak = activeLog.value.breaks.find(b => !b.end);
        if (ongoingBreak) {
          activeBreak.value = ongoingBreak;
        } else {
          activeBreak.value = null;
        }

        // Restart timer interval if not already running
        if (!timerInterval) {
          timerInterval = setInterval(updateActiveTimer, 1000);
        }
      } else {
        // Reset timer
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        liveDurationStr.value = '00:00:00';
      }
    };

    // Handle Clock In / Clock Out Toggle
    const handleClockToggle = async () => {
      if (!activeLog.value) {
        // ── CLOCK IN ──
        const now = new Date();
        const dateStr = getLocalDateString(now);
        const cfg = settings.value;

        // Early-start snap: if arriving earlier than workStart - tolerance, clamp clockIn
        let clockInTime = now;
        if (cfg.workStart) {
          const [wh, wm] = cfg.workStart.split(':').map(Number);
          const workStartMs = new Date(`${dateStr}T${cfg.workStart}:00`).getTime();
          const earliestAllowedMs = workStartMs - (cfg.toleranceMinutes || 0) * 60000;
          if (now.getTime() < earliestAllowedMs) {
            // Arriving way too early → clamp to workStart - tolerance
            clockInTime = new Date(earliestAllowedMs);
          }
        }
        
        const newLog = {
          date: dateStr,
          clockIn: clockInTime.toISOString(),
          clockOut: null,
          breaks: [],
          notes: localNotes.value,
          type: localType.value,
          totalWorkHours: 0
        };

        activeLog.value = await CeklokRepository.addLog(newLog);
        localNotes.value = '';
        timerInterval = setInterval(updateActiveTimer, 1000);
      } else {
        // Clock Out
        const now = new Date();
        
        // If there's an ongoing break, finish it first
        if (activeBreak.value) {
          await endBreak();
        }

        // Apply auto-deduct breaks configured in settings
        const freshSettings = await CeklokRepository.getSettings();
        const dateStr = activeLog.value.clockIn.split('T')[0];
        const clockInTime = new Date(activeLog.value.clockIn);
        
        freshSettings.breaks.forEach(bc => {
          if (!bc.autoDeduct) return;
          const breakStart = new Date(`${dateStr}T${bc.start}:00`);
          const breakEnd = new Date(`${dateStr}T${bc.end}:00`);

          // Shift fully contains the break
          if (clockInTime <= breakStart && now >= breakEnd) {
            // Check if there is already a manual break logged with the same name
            const exists = activeLog.value.breaks.some(b => b.name === bc.name);
            if (!exists) {
              activeLog.value.breaks.push({
                name: bc.name + ' (Auto)',
                start: breakStart.toISOString(),
                end: breakEnd.toISOString(),
                durationMinutes: bc.duration
              });
            }
          }
        });

        // Calculate final working hours: ClockOut - ClockIn - Sum(breaks duration)
        const clockInMs = new Date(activeLog.value.clockIn).getTime();
        const clockOutMs = now.getTime();
        let diffMs = clockOutMs - clockInMs;

        let totalBreakMinutes = 0;
        activeLog.value.breaks.forEach(b => {
          totalBreakMinutes += b.durationMinutes;
        });

        diffMs = Math.max(0, diffMs - (totalBreakMinutes * 60000));
        const totalWorkHours = diffMs / 3600000;

        await CeklokRepository.updateLog(activeLog.value.id, {
          clockOut: now.toISOString(),
          breaks: JSON.parse(JSON.stringify(activeLog.value.breaks)),
          notes: localNotes.value,
          totalWorkHours: totalWorkHours
        });

        activeLog.value = null;
        localNotes.value = '';
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        liveDurationStr.value = '00:00:00';
      }
      await loadState();
    };

    // Auto-save notes in ongoing shift when focus lost
    const saveActiveNotes = async () => {
      if (activeLog.value) {
        await CeklokRepository.updateLog(activeLog.value.id, {
          notes: localNotes.value
        });
      }
    };

    // Breaks Logic
    const startBreak = async () => {
      if (!activeLog.value) return;
      const now = new Date();
      
      // We'll search settings preset or name it default "Istirahat"
      let breakName = 'Istirahat';
      const currentHour = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
      
      // Match current time with preset break times
      const matched = settings.value.breaks.find(b => {
        return currentHour >= b.start && currentHour <= b.end;
      });
      if (matched) breakName = matched.name;

      const newBreak = {
        name: breakName,
        start: now.toISOString(),
        end: null,
        durationMinutes: 0
      };

      activeLog.value.breaks.push(newBreak);
      await CeklokRepository.updateLog(activeLog.value.id, {
        breaks: activeLog.value.breaks
      });
      activeBreak.value = newBreak;
    };

    const endBreak = async () => {
      if (!activeLog.value || !activeBreak.value) return;
      const now = new Date();
      
      // Find ongoing break
      const idx = activeLog.value.breaks.findIndex(b => !b.end);
      if (idx !== -1) {
        const start = new Date(activeLog.value.breaks[idx].start);
        const durationMin = Math.round((now.getTime() - start.getTime()) / 60000);
        
        activeLog.value.breaks[idx].end = now.toISOString();
        activeLog.value.breaks[idx].durationMinutes = Math.max(1, durationMin);

        await CeklokRepository.updateLog(activeLog.value.id, {
          breaks: activeLog.value.breaks
        });
      }
      activeBreak.value = null;
    };

    // Settings Actions
    const openSettingsModal = () => {
      settingsModalVisible.value = true;
    };

    const addNewBreakPreset = () => {
      const id = Date.now();
      settings.value.breaks.push({
        id,
        name: 'Istirahat Baru',
        start: '12:00',
        end: '13:00',
        duration: 60,
        autoDeduct: true
      });
    };

    const removeBreakPreset = (index) => {
      settings.value.breaks.splice(index, 1);
    };

    const calculatePresetDuration = (bc) => {
      if (!bc.start || !bc.end) return;
      const [sh, sm] = bc.start.split(':').map(Number);
      const [eh, em] = bc.end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // wrap around midnight
      bc.duration = diff;
    };

    const saveSettings = async () => {
      if (settings.value.cutoffType === 'monthly') {
        settings.value.cutoffDay = null;
      }
      await CeklokRepository.saveSettings(settings.value);
      settingsModalVisible.value = false;
      await loadState();
    };

    // History Actions
    const openCorrectionModal = () => {
      correctionForm.value = {
        id: null,
        date: getLocalDateString(new Date()),
        type: 'WFO',
        inTime: '08:00',
        outTime: '17:00',
        notes: '',
        breaks: []
      };
      correctionModalVisible.value = true;
    };

    const addCorrectionBreak = () => {
      correctionForm.value.breaks.push({
        name: 'Istirahat',
        start: '12:00',
        end: '13:00'
      });
    };

    const removeCorrectionBreak = (idx) => {
      correctionForm.value.breaks.splice(idx, 1);
    };

    const editLog = (log) => {
      const inDate = new Date(log.clockIn);
      const outDate = log.clockOut ? new Date(log.clockOut) : new Date();
      
      const inTime = String(inDate.getHours()).padStart(2, '0') + ':' + String(inDate.getMinutes()).padStart(2, '0');
      const outTime = log.clockOut ? (String(outDate.getHours()).padStart(2, '0') + ':' + String(outDate.getMinutes()).padStart(2, '0')) : '';

      correctionForm.value = {
        id: log.id,
        date: log.date,
        type: log.type,
        inTime,
        outTime,
        notes: log.notes,
        breaks: log.breaks.map(b => {
          const sDate = new Date(b.start);
          const eDate = b.end ? new Date(b.end) : null;
          return {
            name: b.name,
            start: String(sDate.getHours()).padStart(2, '0') + ':' + String(sDate.getMinutes()).padStart(2, '0'),
            end: eDate ? (String(eDate.getHours()).padStart(2, '0') + ':' + String(eDate.getMinutes()).padStart(2, '0')) : ''
          };
        })
      };
      correctionModalVisible.value = true;
    };

    const saveCorrection = async () => {
      const f = correctionForm.value;
      if (!f.date || !f.inTime) return;

      const dateStr = f.date;
      const clockIn = new Date(`${dateStr}T${f.inTime}:00`).toISOString();
      const clockOut = f.outTime ? new Date(`${dateStr}T${f.outTime}:00`).toISOString() : null;

      // Construct breaks array with durations
      const processedBreaks = f.breaks.map(b => {
        const bStart = new Date(`${dateStr}T${b.start}:00`);
        const bEnd = b.end ? new Date(`${dateStr}T${b.end}:00`) : null;
        let dur = 0;
        if (bEnd) {
          dur = Math.round((bEnd.getTime() - bStart.getTime()) / 60000);
        }
        return {
          name: b.name,
          start: bStart.toISOString(),
          end: bEnd ? bEnd.toISOString() : null,
          durationMinutes: Math.max(0, dur)
        };
      });

      // Calculate working hours
      let totalWorkHours = 0;
      if (clockOut) {
        const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
        const diffMin = Math.round(diffMs / 60000);
        let totalBreakMin = 0;
        processedBreaks.forEach(b => { totalBreakMin += b.durationMinutes; });
        totalWorkHours = Math.max(0, diffMin - totalBreakMin) / 60;
      }

      const logPayload = {
        date: dateStr,
        clockIn,
        clockOut,
        breaks: processedBreaks,
        notes: f.notes,
        type: f.type,
        totalWorkHours
      };

      if (f.id) {
        await CeklokRepository.updateLog(f.id, logPayload);
      } else {
        await CeklokRepository.addLog(logPayload);
      }

      correctionModalVisible.value = false;
      await loadState();
    };

    const confirmDelete = (id) => {
      deleteId.value = id;
    };

    const deleteLog = async () => {
      if (deleteId.value) {
        await CeklokRepository.deleteLog(deleteId.value);
        deleteId.value = null;
        await loadState();
      }
    };

    // Excel Export
    const exportExcel = async () => {
      if (logs.value.length === 0) {
        const toast = await toastController.create({
          message: 'Belum ada data presensi untuk diekspor!',
          duration: 2000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
        return;
      }
      
      const data = logs.value.map(log => {
        let breakDesc = '';
        log.breaks.forEach(b => {
          breakDesc += `${b.name} (${b.durationMinutes}m); `;
        });
        return {
          Tanggal: log.date,
          Tipe: log.type,
          'Jam Masuk': new Date(log.clockIn).toLocaleTimeString('id-ID'),
          'Jam Keluar': log.clockOut ? new Date(log.clockOut).toLocaleTimeString('id-ID') : 'Belum selesai',
          'Daftar Istirahat': breakDesc,
          'Total Jam Kerja': `${Math.floor(log.totalWorkHours)}:${String(Math.round((log.totalWorkHours % 1) * 60)).padStart(2, '0')}`,
          Catatan: log.notes
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Ceklok");
      
      // Auto-fit column widths
      const maxLens = {};
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key]);
          maxLens[key] = Math.max(maxLens[key] || 10, valStr.length, key.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 2 }));

      XLSX.writeFile(workbook, `Rekap_Presensi_Kerja_${new Date().toISOString().slice(0, 10)}.xlsx`);
      const toast = await toastController.create({
        message: 'File Excel rekap presensi berhasil diunduh!',
        duration: 2500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    };

    // Formatting Helpers
    const formatTime = (isoString) => {
      if (!isoString) return '--:--';
      const d = new Date(isoString);
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };

    const formatDateStr = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Stats calculations for Dashboard
    const totalWeekHours = computed(() => {
      const now = new Date();
      let cutoffDay = settings.value.cutoffDay;
      
      // Sinkronisasi dengan mode bulanan jika cutoffDay null
      if (cutoffDay === null || cutoffDay === undefined) {
         let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), settings.value.cutoffDate + 1);
         if (now.getDate() <= settings.value.cutoffDate) startOfPeriod.setMonth(startOfPeriod.getMonth() - 1);
         cutoffDay = startOfPeriod.getDay();
      }

      const weekStart = getStartOfWeeklyPeriod(now, cutoffDay);
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let finalStart = new Date(weekStart);
      let finalEnd = new Date(weekEnd);

      if (settings.value.cutoffType === 'monthly') {
        const { start: periodStart, end: periodEnd } = getMonthlyPeriodDates(now, settings.value);
        const periodEndLimit = new Date(periodEnd);
        periodEndLimit.setDate(periodEndLimit.getDate() - 1);

        if (finalStart < periodStart) {
          finalStart = new Date(periodStart);
        }
        if (finalEnd > periodEndLimit) {
          finalEnd = new Date(periodEndLimit);
        }
      }

      finalStart.setHours(0, 0, 0, 0);
      finalEnd.setHours(23, 59, 59, 999);

      return logs.value
        .filter(log => {
          const d = new Date(log.clockIn);
          return d >= finalStart && d <= finalEnd;
        })
        .reduce((sum, log) => sum + log.totalWorkHours, 0);
    });

    const totalMonthHours = computed(() => {
      const now = new Date();
      const { start, end } = getMonthlyPeriodDates(now, settings.value);
      return logs.value
        .filter(log => {
          const d = new Date(log.clockIn);
          return d >= start && d < end;
        })
        .reduce((sum, log) => sum + log.totalWorkHours, 0);
    });

    const daysWorkedThisMonth = computed(() => {
      const now = new Date();

      const { start, end } = getMonthlyPeriodDates(now, settings.value);
      return logs.value.filter(log => {
        const d = new Date(log.clockIn);
        return d >= start && d < end;
      }).length;
    });

    const avgDailyHours = computed(() => {
      const completedSessions = logs.value.filter(log => {
        const { start, end } = getMonthlyPeriodDates(new Date(), settings.value);
        const d = new Date(log.clockIn);
        return log.clockOut && d >= start && d < end;
    });

    const totalHours = completedSessions.reduce((sum, log) => sum + log.totalWorkHours, 0);
    const uniqueDays = new Set(completedSessions.map(log => log.date)).size;

    if (uniqueDays === 0) return 0;
    return totalHours / uniqueDays;
    });

    // Helper functions for cutoff periods
    const getStartOfWeeklyPeriod = (date, cutoffDay) => {
      const result = new Date(date);
      const day = result.getDay();
      const distance = (day - cutoffDay + 7) % 7;
      result.setDate(result.getDate() - distance);
      result.setHours(0, 0, 0, 0);
      return result;
    };

    const getStartOfMonthlyPeriod = (date, cutoffDate) => {
      const result = new Date(date);
      const dayOfMonth = result.getDate();
      if (dayOfMonth > cutoffDate) {
        result.setDate(cutoffDate + 1);
      } else {
        result.setMonth(result.getMonth() - 1);
        result.setDate(cutoffDate + 1);
      }
      result.setHours(0, 0, 0, 0);
      return result;
    };


    const getMonthlyPeriodDates = (date, settings) => {
      let start, end;
      if (settings.cutoffType === 'weekly') {
        start = getStartOfWeeklyPeriod(new Date(date.getFullYear(), date.getMonth(), 1), settings.cutoffDay);
        end = new Date(start);
        end.setDate(end.getDate() + 35);
      } else {
        start = getStartOfMonthlyPeriod(date, settings.cutoffDate);
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
      }
      return { start, end };
    };
    const weeklyPeriodRange = computed(() => {
      const now = new Date();
      let cutoffDay = settings.value.cutoffDay;
      
      if (cutoffDay === null || cutoffDay === undefined) {
        let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), settings.value.cutoffDate + 1);
        if (now.getDate() <= settings.value.cutoffDate) {
          startOfPeriod.setMonth(startOfPeriod.getMonth() - 1);
        }
        cutoffDay = startOfPeriod.getDay();
      }

      const weekStart = getStartOfWeeklyPeriod(now, cutoffDay);
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let finalStart = new Date(weekStart);
      let finalEnd = new Date(weekEnd);

      if (settings.value.cutoffType === 'monthly') {
        const { start: periodStart, end: periodEnd } = getMonthlyPeriodDates(now, settings.value);
        const periodEndLimit = new Date(periodEnd);
        periodEndLimit.setDate(periodEndLimit.getDate() - 1);

        if (finalStart < periodStart) {
          finalStart = new Date(periodStart);
        }
        if (finalEnd > periodEndLimit) {
          finalEnd = new Date(periodEndLimit);
        }
      }

      finalStart.setHours(0, 0, 0, 0);
      finalEnd.setHours(23, 59, 59, 999);

      if (finalStart.getDate() === finalEnd.getDate() && finalStart.getMonth() === finalEnd.getMonth() && finalStart.getFullYear() === finalEnd.getFullYear()) {
        return `${finalStart.getDate()} ${finalStart.toLocaleString('id-ID', { month: 'short' })}`;
      }

      return `${finalStart.getDate()} ${finalStart.toLocaleString('id-ID', { month: 'short' })} - ${finalEnd.getDate()} ${finalEnd.toLocaleString('id-ID', { month: 'short' })}`;
    });

    const monthlyPeriodRange = computed(() => {
      const now = new Date();
      if (settings.value.cutoffType === 'weekly') {
        const getFirstFri = (d) => {
          let day = new Date(d.getFullYear(), d.getMonth(), 1);
          while (day.getDay() !== 5) day.setDate(day.getDate() + 1);
          return day;
        };
        const getNextMonthFirstFri = (d) => {
          let day = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          while (day.getDay() !== 5) day.setDate(day.getDate() + 1);
          return day;
        };
        const start = getFirstFri(now);
        const end = new Date(getNextMonthFirstFri(now));
        end.setDate(end.getDate() - 1);
        return `${start.getDate()} ${start.toLocaleString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('id-ID', { month: 'short' })}`;
      } else {
        const start = getStartOfMonthlyPeriod(now, settings.value.cutoffDate);
        const end = new Date(start.getTime());
        end.setMonth(end.getMonth() + 1);
        const lastDay = new Date(end);
        lastDay.setDate(lastDay.getDate() - 1);
        return `${start.getDate()} ${start.toLocaleString('id-ID', { month: 'short' })} - ${lastDay.getDate()} ${lastDay.toLocaleString('id-ID', { month: 'short' })}`;
      }
    });

    // Charts Config & Series
    const weeklyChartSeries = computed(() => {
      const now = new Date();
      let cutoffDay = settings.value.cutoffDay;
      if (cutoffDay === null || cutoffDay === undefined) {
         let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), settings.value.cutoffDate + 1);
         if (now.getDate() <= settings.value.cutoffDate) startOfPeriod.setMonth(startOfPeriod.getMonth() - 1);
         cutoffDay = startOfPeriod.getDay();
      }
      const weekStart = getStartOfWeeklyPeriod(now, cutoffDay);
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let finalStart = new Date(weekStart);
      let finalEnd = new Date(weekEnd);

      if (settings.value.cutoffType === 'monthly') {
        const { start: periodStart, end: periodEnd } = getMonthlyPeriodDates(now, settings.value);
        const periodEndLimit = new Date(periodEnd);
        periodEndLimit.setDate(periodEndLimit.getDate() - 1);

        if (finalStart < periodStart) {
          finalStart = new Date(periodStart);
        }
        if (finalEnd > periodEndLimit) {
          finalEnd = new Date(periodEndLimit);
        }
      }

      finalStart.setHours(0, 0, 0, 0);
      finalEnd.setHours(23, 59, 59, 999);

      const baseLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const labels = [];
      const data = [];

      const temp = new Date(finalStart);
      while (temp <= finalEnd) {
        labels.push(baseLabels[temp.getDay()]);
        const dateStr = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`;
        const hours = logs.value
          .filter(log => log.date === dateStr)
          .reduce((sum, log) => sum + log.totalWorkHours, 0);
        data.push(Number.isFinite(hours) ? Number(hours.toFixed(2)) : 0);
        temp.setDate(temp.getDate() + 1);
      }
      return { series: [{ name: 'Jam Kerja', data: data }], labels: labels };
    });

    const weeklyChartOptions = computed(() => {
      return {
        chart: { id: 'weekly-hours', toolbar: { show: false }, sparkline: { enabled: false } },
        colors: ['#4f46e5'],
        plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', dataLabels: { position: 'top' } } },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            const h = Math.floor(val);
            const m = Math.round((val % 1) * 60);
            return val > 0 ? `${h}.${String(m).padStart(2, '0')}` : '';
          },
          offsetY: -20,
          style: { fontSize: '10px', colors: ['#303030'] }
        },
        xaxis: {
          categories: weeklyChartSeries.value.labels,
          labels: { style: { colors: '#64748b', fontWeight: 600 } }
        },
        yaxis: { labels: { style: { colors: '#64748b' } }, title: { text: 'Jam', style: { color: '#64748b' } } },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4 }
      };
    });

    const monthlyChartSeries = computed(() => {
      const now = new Date();
      const baseMonth = now.getDate() <= settings.value.cutoffDate ? now.getMonth() - 1 : now.getMonth();
      const cutoff = settings.value.cutoffDate;
      const periodStart = new Date(now.getFullYear(), baseMonth, cutoff + 1);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, cutoff + 1);

      const logsInPeriod = logs.value.filter(log => {
        const d = new Date(log.clockIn);
        return d >= periodStart && d < periodEnd;
      });

      const data = [0, 0, 0, 0, 0];
      logsInPeriod.forEach(log => {
        const logDate = new Date(log.clockIn);
        const weekIdx = Math.min(4, Math.floor((logDate.getTime() - periodStart.getTime()) / (86400000 * 7)));
        if (weekIdx >= 0) {
          data[weekIdx] += (log.totalWorkHours || 0);
        }
      });

      return [{
        name: 'Total Jam',
        data: data.map(v => Number.isFinite(v) ? Number(v.toFixed(2)) : 0)
      }];
    });

    const monthlyChartOptions = computed(() => {
      return {
        chart: {
          id: 'monthly-weeks',
          toolbar: { show: false },
          zoom: { enabled: false }
        },
        colors: ['#0d9488'],
        stroke: {
          curve: 'smooth',
          width: 3
        },
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
          categories: Array.from({ length: 5 }, (_, i) => {
            const now = new Date();
            const baseMonth = now.getDate() <= settings.value.cutoffDate ? now.getMonth() - 1 : now.getMonth();
            const cutoff = settings.value.cutoffDate;
            const periodStart = new Date(now.getFullYear(), baseMonth, cutoff + 1);
            const weekStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + (i * 7));
            let weekEnd = new Date(weekStart);
            if (i === 4) {
              weekEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, cutoff);
            } else {
              weekEnd.setDate(weekStart.getDate() + 6);
            }
            return `${weekStart.getDate()} - ${weekEnd.getDate()}`;
          }),
          labels: { style: { colors: '#64748b', fontWeight: 600 } }
        },
        yaxis: {
          labels: { 
            style: { colors: '#64748b' },
            formatter: (val) => val.toFixed(0)
          }
        },
        grid: {
          borderColor: '#e2e8f0',
          strokeDashArray: 4
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            const h = Math.floor(val);
            const m = Math.round((val % 1) * 60);
            return val > 0 ? `${h}.${String(m).padStart(2, '0')}` : '';
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              const h = Math.floor(val);
              const m = Math.round((val % 1) * 60);
              return `${h}.${String(m).padStart(2, '0')} jam`;
            }
          },
          title: {
            formatter: function (seriesName, { dataPointIndex }) {
              const i = dataPointIndex ?? 0;
              const now = new Date();
              const baseMonth = now.getDate() <= settings.value.cutoffDate ? now.getMonth() - 1 : now.getMonth();
              const cutoff = settings.value.cutoffDate;
              const periodStart = new Date(now.getFullYear(), baseMonth, cutoff + 1);
              const weekStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + (i * 7));
              let weekEnd;
              if (i === 4) {
                weekEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, cutoff);
              } else {
                weekEnd = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + (i * 7) + 6);
              }
              const fmt = (d) => `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
              return `Mgg ${i + 1}: ${fmt(weekStart)} – ${fmt(weekEnd)}`;
            }
          }
        }
      };
    });

    // Lifecycle
    onMounted(() => {
      updateLiveClock();
      clockInterval = setInterval(updateLiveClock, 1000);
    });

    onIonViewWillEnter(async () => {
      await loadState();
    });

    onUnmounted(() => {
      if (clockInterval) clearInterval(clockInterval);
      if (timerInterval) clearInterval(timerInterval);
    });



    return {
      activeTab,
      logs,
      activeLog,
      activeBreak,
      currentTimeStr,
      currentDateStr,
      liveDurationStr,
      localType,
      localNotes,
      settingsModalVisible,
      settings,
      correctionModalVisible,
      correctionForm,
      deleteId,
      handleClockToggle,
      saveActiveNotes,
      startBreak,
      endBreak,
      openSettingsModal,
      addNewBreakPreset,
      removeBreakPreset,
      calculatePresetDuration,
      saveSettings,
      openCorrectionModal,
      addCorrectionBreak,
      removeCorrectionBreak,
      editLog,
      saveCorrection,
      confirmDelete,
      deleteLog,
      exportExcel,
      formatTime,
      formatDateStr,
      totalWeekHours,
      totalMonthHours,
      daysWorkedThisMonth,
      avgDailyHours,
      weeklyChartSeries,
      weeklyChartOptions,
      monthlyChartSeries,
      monthlyChartOptions,
      weeklyPeriodRange,
      monthlyPeriodRange,
      settingsOutline, playOutline, stopOutline, cafeOutline, calendarOutline, 
      createOutline, trashOutline, downloadOutline, addOutline,
      effectiveStartStr
    };
  }
}
</script>
