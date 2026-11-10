<template>
  <ion-header>
    <ion-toolbar class="px-2">
      <ion-title class="fw-bold fs-6">{{ title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="$emit('close')">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'

defineProps<{
  title: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

