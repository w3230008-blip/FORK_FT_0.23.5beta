import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'CustomProgressBarSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput
  },
  computed: {
    ...mapGetters([
      'getCustomProgressBarEnabled',
      'getCustomProgressBarProgressColor',
      'getCustomProgressBarProgressOpacity',
      'getCustomProgressBarBufferColor',
      'getCustomProgressBarBufferOpacity',
      'getCustomProgressBarUnbufferedColor',
      'getCustomProgressBarUnbufferedOpacity',
      'getCustomProgressBarBarHeight',
      'getCustomProgressBarZIndex',
      'getCustomProgressBarChaptersEnabled',
      'getCustomProgressBarChapterMarkerColor'
    ])
  },
  methods: {
    ...mapActions([
      'updateCustomProgressBarEnabled',
      'updateCustomProgressBarProgressColor',
      'updateCustomProgressBarProgressOpacity',
      'updateCustomProgressBarBufferColor',
      'updateCustomProgressBarBufferOpacity',
      'updateCustomProgressBarUnbufferedColor',
      'updateCustomProgressBarUnbufferedOpacity',
      'updateCustomProgressBarBarHeight',
      'updateCustomProgressBarZIndex',
      'updateCustomProgressBarChaptersEnabled',
      'updateCustomProgressBarChapterMarkerColor'
    ])
  }
})
