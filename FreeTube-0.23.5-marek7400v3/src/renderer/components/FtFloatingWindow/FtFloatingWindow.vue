<template>
  <div
    v-if="visible"
    class="floating-window-overlay"
  >
    <div
      ref="window"
      class="floating-window"
      :style="{ top: top + 'px', left: left + 'px' }"
    >
      <div
        class="window-header"
        @mousedown="startDrag"
      >
        <h2 class="window-title">
          {{ title }}
        </h2>
        <ft-icon-button
          :title="$t('Close')"
          :icon="['fas', 'xmark']"
          theme="destructive"
          @click="$emit('close')"
        />
      </div>
      <div class="window-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

const props = defineProps({
  title: String,
  visible: Boolean,
  parentRef: {
    // POPRAWIONY TYP
    type: Element,
    required: true,
  },
})

defineEmits(['close'])

const window = ref(null)
const top = ref(0)
const left = ref(0)

const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const initialLeft = ref(0)
const initialTop = ref(0)

const centerWindow = () => {
  if (props.parentRef && window.value) {
    const parentRect = props.parentRef.getBoundingClientRect()
    const windowRect = window.value.getBoundingClientRect()

    // Ustawiamy pozycję względem rodzica (odtwarzacza)
    top.value = (parentRect.height - windowRect.height) / 2
    left.value = (parentRect.width - windowRect.width) / 2
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    centerWindow()
  }
})

const startDrag = (event) => {
  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  initialLeft.value = left.value
  initialTop.value = top.value

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event) => {
  if (isDragging.value) {
    const dx = event.clientX - dragStartX.value
    const dy = event.clientY - dragStartY.value
    left.value = initialLeft.value + dx
    top.value = initialTop.value + dy
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onMounted(() => {
  if (props.visible) {
    centerWindow()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

</script>

<style scoped src="./FtFloatingWindow.css" />
