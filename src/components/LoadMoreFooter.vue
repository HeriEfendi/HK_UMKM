<template>
  <div class="load-more-footer-wrapper w-100">
    <!-- Ionic Native Infinite Scroll -->
    <ion-infinite-scroll
      :disabled="!hasMore"
      @ionInfinite="handleInfinite"
    >
      <ion-infinite-scroll-content
        loading-spinner="bubbles"
        :loading-text="loadingText"
      />
    </ion-infinite-scroll>

    <!-- Accessible Button Fallback & Status Counter -->
    <div v-if="hasMore" class="text-center py-3 w-100">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary px-3 shadow-none rounded-pill"
        @click="$emit('loadMore')"
      >
        Muat Lebih Banyak ({{ displayedCount }} dari {{ totalCount }})
      </button>
    </div>

    <!-- Completed Text -->
    <div 
      v-else-if="totalCount > initialLimit" 
      class="text-center py-2 text-muted small w-100"
    >
      Semua {{ totalCount }} {{ itemName }} telah ditampilkan
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/vue'

withDefaults(defineProps<{
  hasMore: boolean
  displayedCount: number
  totalCount: number
  initialLimit?: number
  itemName?: string
  loadingText?: string
}>(), {
  initialLimit: 20,
  itemName: 'data',
  loadingText: 'Memuat data lebih banyak...'
})

const emit = defineEmits<{
  (e: 'loadMore', ev?: any): void
}>()

const handleInfinite = (ev: any) => {
  emit('loadMore', ev)
}
</script>

