import { defineComponent, computed } from 'vue'
import store from '../../store/index'
import { hexToRgba } from '../../helpers/colors' // Założenie, że przeniesiemy tę funkcję do helpersów

export default defineComponent({
  name: 'FtCustomSubtitleDisplay',
  props: {
    text: {
      type: String,
      required: true
    },
    isFullscreen: {
      type: Boolean,
      required: true
    },
    isHoveringControls: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const enabled = computed(() => store.getters.getCustomSubtitleEnabled)

    const currentModeSettings = computed(() => {
      const mode = props.isFullscreen ? 'fullscreen' : 'normal'
      return {
        color: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}Color`],
        fontSize: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}FontSize`],
        bgColor: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}BgColor`],
        bgOpacity: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}BgOpacity`],
        vPosition: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}VPosition`],
        containerWidth: store.getters[`getCustomSubtitle${mode === 'normal' ? 'Normal' : 'Fullscreen'}ContainerWidth`]
      }
    })

    const containerStyle = computed(() => {
      const settings = currentModeSettings.value
      const controlsHeight = 65 // Stała wysokość paska kontrolnego
      const bottomPosition = props.isHoveringControls ? `${controlsHeight}px` : `${settings.vPosition}px`

      return {
        bottom: bottomPosition,
        width: `${settings.containerWidth}%`,
        opacity: props.text ? '1' : '0'
      }
    })

    const textStyle = computed(() => {
      const settings = currentModeSettings.value
      return {
        color: settings.color,
        fontSize: `${settings.fontSize}px`,
        backgroundColor: hexToRgba(settings.bgColor, settings.bgOpacity)
      }
    })

    return {
      enabled,
      containerStyle,
      textStyle
    }
  }
})
