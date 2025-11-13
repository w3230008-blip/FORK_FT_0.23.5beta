import { computed, defineComponent } from 'vue'
import store from '../../store/index'

export default defineComponent({
  name: 'FtCustomProgressBar',
  props: {
    // Dane przekazywane z odtwarzacza Shaka
    currentTime: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    bufferedTime: {
      type: Number,
      required: true
    },
    chapters: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    // --- Ustawienia z Vuex ---
    const enabled = computed(() => store.getters.getCustomProgressBarEnabled)
    const progressColor = computed(() => store.getters.getCustomProgressBarProgressColor)
    const progressOpacity = computed(() => store.getters.getCustomProgressBarProgressOpacity)
    const bufferColor = computed(() => store.getters.getCustomProgressBarBufferColor)
    const bufferOpacity = computed(() => store.getters.getCustomProgressBarBufferOpacity)
    const unbufferedColor = computed(() => store.getters.getCustomProgressBarUnbufferedColor)
    const unbufferedOpacity = computed(() => store.getters.getCustomProgressBarUnbufferedOpacity)
    const barHeight = computed(() => store.getters.getCustomProgressBarBarHeight)
    const zIndex = computed(() => store.getters.getCustomProgressBarZIndex)
    const chaptersEnabled = computed(() => store.getters.getCustomProgressBarChaptersEnabled)
    const chapterMarkerColor = computed(() => store.getters.getCustomProgressBarChapterMarkerColor)

    // --- Funkcje pomocnicze ---
    const toHex = (opacity) => {
      const hex = Math.round(opacity * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    // --- Właściwości obliczeniowe dla stylów ---
    const progressPercent = computed(() => {
      if (props.duration === 0) return 0
      return (props.currentTime / props.duration) * 100
    })

    const bufferPercent = computed(() => {
      if (props.duration === 0) return 0
      return (props.bufferedTime / props.duration) * 100
    })

    const progressBarContainerStyle = computed(() => ({
      height: `${barHeight.value}px`,
      zIndex: zIndex.value,
      display: enabled.value ? 'block' : 'none'
    }))

    const progressBarStyle = computed(() => ({
      width: `${progressPercent.value}%`,
      backgroundColor: `${progressColor.value}${toHex(progressOpacity.value)}`,
      zIndex: zIndex.value + 2
    }))

    const bufferBarStyle = computed(() => ({
      width: `${bufferPercent.value}%`,
      backgroundColor: `${bufferColor.value}${toHex(bufferOpacity.value)}`,
      zIndex: zIndex.value + 1
    }))

    const unbufferedBarStyle = computed(() => ({
      backgroundColor: `${unbufferedColor.value}${toHex(unbufferedOpacity.value)}`,
      zIndex: zIndex.value
    }))

    const chapterMarkersContainerStyle = computed(() => ({
      height: `${barHeight.value}px`,
      zIndex: zIndex.value + 3
    }))

    const chapterMarkers = computed(() => {
      if (!chaptersEnabled.value || !props.chapters || props.chapters.length === 0 || props.duration === 0) {
        return []
      }

      return props.chapters
        .map(chapter => {
          const percent = (chapter.startSeconds / props.duration) * 100
          if (isNaN(percent) || percent <= 0 || percent >= 100) {
            return null
          }
          return {
            left: `${percent}%`,
            color: chapterMarkerColor.value
          }
        })
        .filter(marker => marker !== null)
    })

    return {
      enabled,
      progressBarContainerStyle,
      progressBarStyle,
      bufferBarStyle,
      unbufferedBarStyle,
      chaptersEnabled,
      chapterMarkersContainerStyle,
      chapterMarkers
    }
  }
})
