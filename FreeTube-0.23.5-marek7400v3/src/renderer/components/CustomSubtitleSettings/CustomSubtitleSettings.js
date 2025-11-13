import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSlider from '../ft-slider/ft-slider.vue'

export default defineComponent({
  name: 'CustomSubtitleSettings',
  components: {
    FtSettingsSection,
    FtToggleSwitch,
    FtInput,
    FtSlider,
  },
  data() {
    return {
      currentMode: 'normal',
    }
  },
  computed: {
    ...mapGetters([
      'getCustomSubtitleEnabled',
      // Normal mode settings
      'getCustomSubtitleNormalColor',
      'getCustomSubtitleNormalFontSize',
      'getCustomSubtitleNormalBgColor',
      'getCustomSubtitleNormalBgOpacity',
      'getCustomSubtitleNormalVPosition',
      'getCustomSubtitleNormalTimeOffset',
      'getCustomSubtitleNormalContainerWidth',
      // Fullscreen mode settings
      'getCustomSubtitleFullscreenColor',
      'getCustomSubtitleFullscreenFontSize',
      'getCustomSubtitleFullscreenBgColor',
      'getCustomSubtitleFullscreenBgOpacity',
      'getCustomSubtitleFullscreenVPosition',
      'getCustomSubtitleFullscreenTimeOffset',
      'getCustomSubtitleFullscreenContainerWidth',
    ]),
    currentSettings() {
      if (this.currentMode === 'normal') {
        return {
          color: this.getCustomSubtitleNormalColor,
          fontSize: this.getCustomSubtitleNormalFontSize,
          bgColor: this.getCustomSubtitleNormalBgColor,
          bgOpacity: this.getCustomSubtitleNormalBgOpacity,
          vPosition: this.getCustomSubtitleNormalVPosition,
          timeOffset: this.getCustomSubtitleNormalTimeOffset,
          containerWidth: this.getCustomSubtitleNormalContainerWidth,
        }
      } else {
        return {
          color: this.getCustomSubtitleFullscreenColor,
          fontSize: this.getCustomSubtitleFullscreenFontSize,
          bgColor: this.getCustomSubtitleFullscreenBgColor,
          bgOpacity: this.getCustomSubtitleFullscreenBgOpacity,
          vPosition: this.getCustomSubtitleFullscreenVPosition,
          timeOffset: this.getCustomSubtitleFullscreenTimeOffset,
          containerWidth: this.getCustomSubtitleFullscreenContainerWidth,
        }
      }
    }
  },
  methods: {
    ...mapActions([
      'updateCustomSubtitleEnabled',
      // Normal mode actions
      'updateCustomSubtitleNormalColor',
      'updateCustomSubtitleNormalFontSize',
      'updateCustomSubtitleNormalBgColor',
      'updateCustomSubtitleNormalBgOpacity',
      'updateCustomSubtitleNormalVPosition',
      'updateCustomSubtitleNormalTimeOffset',
      'updateCustomSubtitleNormalContainerWidth',
      // Fullscreen mode actions
      'updateCustomSubtitleFullscreenColor',
      'updateCustomSubtitleFullscreenFontSize',
      'updateCustomSubtitleFullscreenBgColor',
      'updateCustomSubtitleFullscreenBgOpacity',
      'updateCustomSubtitleFullscreenVPosition',
      'updateCustomSubtitleFullscreenTimeOffset',
      'updateCustomSubtitleFullscreenContainerWidth',
    ]),
    updateSetting(key, value) {
      const modeCapitalized = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)
      const keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1)
      const actionName = `updateCustomSubtitle${modeCapitalized}${keyCapitalized}`

      if (this[actionName]) {
        this[actionName](value)
      }
    },
  }
})
