import { defineComponent } from 'vue'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import { mapActions } from 'vuex'
import { IpcChannels } from '../../../constants'

const getRuntimeGlobal = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }

  if (typeof window !== 'undefined') {
    return window
  }

  if (typeof global !== 'undefined') {
    return global
  }

  return {}
}

const runtimeGlobal = getRuntimeGlobal()

const isElectronRuntime = Boolean(
  runtimeGlobal.process?.type === 'renderer' ||
  runtimeGlobal.process?.versions?.electron ||
  runtimeGlobal.process?.env?.IS_ELECTRON
)

export default defineComponent({
  name: 'DownloadSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-select': FtSelect,
    'ft-button': FtButton,
    'ft-input': FtInput
  },
  data: function () {
    return {
      downloadBehaviorValues: [
        'download',
        'open'
      ],
      isElectron: isElectronRuntime
    }
  },
  computed: {
    downloadPath: function () {
      return this.$store.getters.getDownloadFolderPath
    },
    askForDownloadPath: function () {
      return this.$store.getters.getDownloadAskPath
    },
    downloadBehaviorNames: function () {
      return [
        this.$t('Settings.Download Settings.Download in app'),
        this.$t('Settings.Download Settings.Open in web browser')
      ]
    },
    downloadBehavior: function () {
      return this.$store.getters.getDownloadBehavior
    },
    shouldShowDownloadOptions: function () {
      return this.downloadBehavior === 'download'
    },
    shouldShowYtDlpOptions: function () {
      return this.shouldShowDownloadOptions && this.isElectron
    },
    ytDlpBinaryPath: function () {
      return this.$store.getters.getYtDlpBinaryPath
    },
    ytDlpUseCustomArgs: function () {
      return this.$store.getters.getYtDlpUseCustomArgs
    },
    ytDlpCustomArgs: function () {
      return this.$store.getters.getYtDlpCustomArgs
    }
  },
  methods: {
    handleDownloadingSettingChange: function (value) {
      this.updateDownloadAskPath(value)
    },
    handleYtDlpUseCustomArgsChange: function (value) {
      this.updateYtDlpUseCustomArgs(value)

      if (!value) {
        this.updateYtDlpCustomArgs('')
      }
    },
    handleBinaryPathInput: function (value) {
      this.updateYtDlpBinaryPath(value)
    },
    handleBinaryPathClear: function () {
      this.updateYtDlpBinaryPath('')
    },
    handleCustomArgsInput: function (value) {
      this.updateYtDlpCustomArgs(value)
    },
    handleCustomArgsClear: function () {
      this.updateYtDlpCustomArgs('')
    },
    chooseDownloadingFolder: async function () {
      if (!this.isElectron) {
        return
      }

      const { ipcRenderer } = require('electron')
      const dialogResult = await ipcRenderer.invoke(
        IpcChannels.SHOW_OPEN_DIALOG,
        { properties: ['openDirectory'] }
      )

      if (dialogResult?.canceled) {
        return
      }

      const selectedPath = dialogResult?.filePaths?.[0]
      if (selectedPath) {
        this.updateDownloadFolderPath(selectedPath)
      }
    },
    chooseYtDlpBinaryPath: async function () {
      if (!this.isElectron) {
        return
      }

      const { ipcRenderer } = require('electron')
      const dialogResult = await ipcRenderer.invoke(
        IpcChannels.SHOW_OPEN_DIALOG,
        {
          properties: ['openFile']
        }
      )

      if (dialogResult?.canceled) {
        return
      }

      const selectedPath = dialogResult?.filePaths?.[0]
      if (selectedPath) {
        this.updateYtDlpBinaryPath(selectedPath)
      }
    },
    resetYtDlpBinaryPath: function () {
      this.updateYtDlpBinaryPath('')
    },
    ...mapActions([
      'updateDownloadAskPath',
      'updateDownloadFolderPath',
      'updateDownloadBehavior',
      'updateYtDlpBinaryPath',
      'updateYtDlpUseCustomArgs',
      'updateYtDlpCustomArgs'
    ])
  }
})
