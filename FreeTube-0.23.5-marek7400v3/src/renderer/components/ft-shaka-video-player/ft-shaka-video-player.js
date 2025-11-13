import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import shaka from 'shaka-player'
import { useI18n } from '../../composables/use-i18n-polyfill'

import store from '../../store/index'
import { IpcChannels, KeyboardShortcuts } from '../../../constants'
import { AudioTrackSelection } from './player-components/AudioTrackSelection'
import { FullWindowButton } from './player-components/FullWindowButton'
import { LegacyQualitySelection } from './player-components/LegacyQualitySelection'
import { ScreenshotButton } from './player-components/ScreenshotButton'
import { StatsButton } from './player-components/StatsButton'
import { TheatreModeButton } from './player-components/TheatreModeButton'
import { AutoplayToggle } from './player-components/AutoplayToggle'
import { CustomSubtitleButton } from './player-components/CustomSubtitleButton'
import {
  findMostSimilarAudioBandwidth,
  getSponsorBlockSegments,
  logShakaError,
  repairInvidiousManifest,
  sortCaptions,
  translateSponsorBlockCategory
} from '../../helpers/player/utils'
import {
  addKeyboardShortcutToActionTitle,
  formatDurationAsTimestamp,
  showToast,
  writeFileWithPicker,
  readFileWithPicker
} from '../../helpers/utils'

import FtCustomProgressBar from '../FtCustomProgressBar/FtCustomProgressBar.vue'
import FtCustomSubtitleSettings from '../CustomSubtitleSettings/CustomSubtitleSettings.vue'
import FtCustomSubtitleDisplay from '../FtCustomSubtitleDisplay/FtCustomSubtitleDisplay.vue'
import FtFloatingWindow from '../FtFloatingWindow/FtFloatingWindow.vue'

/** @typedef {import('../../helpers/sponsorblock').SponsorBlockCategory} SponsorBlockCategory */

const HTTP_IN_HEX = 0x68747470
const USE_OVERFLOW_MENU_WIDTH_THRESHOLD = 634
const RequestType = shaka.net.NetworkingEngine.RequestType
const AdvancedRequestType = shaka.net.NetworkingEngine.AdvancedRequestType
const TrackLabelFormat = shaka.ui.Overlay.TrackLabelFormat
const { ContextMenu: shakaContextMenu, Controls: shakaControls, OverflowMenu: shakaOverflowMenu } = shaka.ui

const shakaControlKeysToShortcuts = {
  MUTE: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.MUTE,
  UNMUTE: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.MUTE,
  PLAY: KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.PLAY,
  PAUSE: KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.PLAY,
  PICTURE_IN_PICTURE: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.PICTURE_IN_PICTURE,
  ENTER_PICTURE_IN_PICTURE: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.PICTURE_IN_PICTURE,
  EXIT_PICTURE_IN_PICTURE: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.PICTURE_IN_PICTURE,
  CAPTIONS: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.CAPTIONS,
  FULL_SCREEN: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.FULLSCREEN,
  EXIT_FULL_SCREEN: KeyboardShortcuts.VIDEO_PLAYER.GENERAL.FULLSCREEN
}

/** @type {Map<string, string>} */
const LOCALE_MAPPINGS = new Map(process.env.SHAKA_LOCALE_MAPPINGS)

export default defineComponent({
  name: 'FtShakaVideoPlayer',
  components: {
    FtCustomProgressBar,
    FtCustomSubtitleSettings,
    FtCustomSubtitleDisplay,
    FtFloatingWindow
  },
  props: {
    format: {
      type: String,
      required: true
    },
    manifestSrc: {
      type: String,
      default: null
    },
    manifestMimeType: {
      type: String,
      required: true
    },
    legacyFormats: {
      type: Array,
      default: () => ([])
    },
    startTime: {
      type: Number,
      default: null
    },
    captions: {
      type: Array,
      default: () => ([])
    },
    chapters: {
      type: Array,
      default: () => []
    },
    currentChapterIndex: {
      type: Number,
      default: 0
    },
    storyboardSrc: {
      type: String,
      default: ''
    },
    videoId: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    thumbnail: {
      type: String,
      default: ''
    },
    theatrePossible: {
      type: Boolean,
      default: false
    },
    useTheatreMode: {
      type: Boolean,
      default: false
    },
    autoplayPossible: {
      type: Boolean,
      default: false
    },
    autoplayEnabled: {
      type: Boolean,
      default: false
    },
    vrProjection: {
      type: String,
      default: null
    },
    startInFullscreen: {
      type: Boolean,
      default: false
    },
    startInFullwindow: {
      type: Boolean,
      default: false
    },
    startInPip: {
      type: Boolean,
      default: false
    },
    currentPlaybackRate: {
      type: Number,
      default: 1
    },
  },
  emits: [
    'error',
    'loaded',
    'ended',
    'timeupdate',
    'toggle-autoplay',
    'toggle-theatre-mode',
    'playback-rate-updated'
  ],
  setup: function (props, { emit, expose }) {
    const { locale, t } = useI18n()

    const currentTime = ref(0)
    const duration = ref(0)
    const bufferedTime = ref(0)

    const showSubtitleSettings = ref(false)
    const currentCustomSubtitleText = ref('')
    const isControlsHovering = ref(false)
    const isPlayerFullscreen = ref(false)

    const customCues = ref([])

    let player = null
    let ui = null
    const events = new EventTarget()
    const container = ref(null)
    const video = ref(null)
    const vrCanvas = ref(null)
    const hasLoaded = ref(false)
    const hasMultipleAudioTracks = ref(false)
    const isLive = ref(false)
    const useOverFlowMenu = ref(false)
    const forceAspectRatio = ref(false)
    const activeLegacyFormat = shallowRef(null)
    const fullWindowEnabled = ref(false)
    const startInFullwindow = props.startInFullwindow
    let startInFullscreen = props.startInFullscreen
    let startInPip = props.startInPip
    let sortedCaptions
    if (props.captions.length > 1) {
      sortedCaptions = sortCaptions(props.captions)
    } else if (props.captions.length === 1) {
      sortedCaptions = props.captions
    } else {
      sortedCaptions = []
    }
    let restoreCaptionIndex = null
    if (store.getters.getEnableSubtitlesByDefault && sortedCaptions.length > 0) {
      restoreCaptionIndex = 0
    }
    const showStats = ref(false)
    const stats = reactive({
      resolution: {
        width: 0,
        height: 0,
        frameRate: 0
      },
      playerDimensions: {
        width: 0,
        height: 0
      },
      bitrate: '0',
      volume: '100',
      bandwidth: '0',
      buffered: '0',
      frames: {
        totalFrames: 0,
        droppedFrames: 0
      },
      codecs: {
        audioItag: '',
        audioCodec: '',
        videoItag: '',
        videoCodec: ''
      }
    })

    const customSubtitlesEnabledFromStore = computed(() => store.getters.getCustomSubtitleEnabled)

    const showAdjustedTime = computed(() => store.getters.getShowAdjustedTime)
    const autoplayVideos = computed(() => store.getters.getAutoplayVideos)
    const displayVideoPlayButton = computed(() => store.getters.getDisplayVideoPlayButton)
    watch(displayVideoPlayButton, (newValue) => ui.configure({ addBigPlayButton: newValue }))
    const defaultSkipInterval = computed(() => store.getters.getDefaultSkipInterval)
    watch(defaultSkipInterval, (newValue) => ui.configure({ tapSeekDistance: newValue }))
    const defaultQuality = computed(() => {
      const value = store.getters.getDefaultQuality
      if (value === 'auto') { return value }
      return parseInt(value)
    })
    const enterFullscreenOnDisplayRotate = computed(() => store.getters.getEnterFullscreenOnDisplayRotate)
    watch(enterFullscreenOnDisplayRotate, (newValue) => ui.configure({ enableFullscreenOnRotation: newValue }))
    const maxVideoPlaybackRate = computed(() => parseInt(store.getters.getMaxVideoPlaybackRate))
    const videoPlaybackRateInterval = computed(() => parseFloat(store.getters.getVideoPlaybackRateInterval))
    const playbackRates = computed(() => {
      const interval = videoPlaybackRateInterval.value
      const playbackRates = []
      let i = interval
      while (i <= maxVideoPlaybackRate.value) {
        playbackRates.unshift(i)
        i += interval
        i = parseFloat(i.toFixed(2))
      }
      return playbackRates
    })
    watch(playbackRates, (newValue) => ui.configure({ playbackRates: newValue }))
    const enableScreenshot = computed(() => store.getters.getEnableScreenshot)
    const screenshotFormat = computed(() => store.getters.getScreenshotFormat)
    const screenshotQuality = computed(() => store.getters.getScreenshotQuality)
    const screenshotAskPath = computed(() => store.getters.getScreenshotAskPath)
    const videoVolumeMouseScroll = computed(() => store.getters.getVideoVolumeMouseScroll)
    const videoPlaybackRateMouseScroll = computed(() => store.getters.getVideoPlaybackRateMouseScroll)
    const videoSkipMouseScroll = computed(() => store.getters.getVideoSkipMouseScroll)
    const useSponsorBlock = computed(() => store.getters.getUseSponsorBlock)
    const sponsorBlockShowSkippedToast = computed(() => store.getters.getSponsorBlockShowSkippedToast)
    const sponsorSkips = computed(() => {
      if (!useSponsorBlock.value) { return {} }
      const sponsorCategories = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic', 'filler']
      const autoSkip = new Set()
      const seekBar = []
      const promptSkip = new Set()
      const categoryData = {}
      sponsorCategories.forEach(x => {
        let sponsorVal = {}
        switch (x) {
          case 'sponsor': sponsorVal = store.getters.getSponsorBlockSponsor; break
          case 'selfpromo': sponsorVal = store.getters.getSponsorBlockSelfPromo; break
          case 'interaction': sponsorVal = store.getters.getSponsorBlockInteraction; break
          case 'intro': sponsorVal = store.getters.getSponsorBlockIntro; break
          case 'outro': sponsorVal = store.getters.getSponsorBlockOutro; break
          case 'preview': sponsorVal = store.getters.getSponsorBlockRecap; break
          case 'music_offtopic': sponsorVal = store.getters.getSponsorBlockMusicOffTopic; break
          case 'filler': sponsorVal = store.getters.getSponsorBlockFiller; break
        }
        if (sponsorVal.skip !== 'doNothing') seekBar.push(x)
        if (sponsorVal.skip === 'autoSkip') autoSkip.add(x)
        if (sponsorVal.skip === 'promptToSkip') promptSkip.add(x)
        categoryData[x] = sponsorVal
      })
      return { autoSkip, seekBar, promptSkip, categoryData }
    })

    let sponsorBlockSegments = []
    let sponsorBlockAverageVideoDuration = 0
    const skippedSponsorBlockSegments = ref([])
    async function setupSponsorBlock() {
      let segments, averageDuration
      try { ({ segments, averageDuration } = await getSponsorBlockSegments(props.videoId, sponsorSkips.value.seekBar)) } catch (e) { console.error(e); segments = [] }
      if (!ui || !player) return
      if (segments.length > 0) {
        sponsorBlockSegments = segments
        sponsorBlockAverageVideoDuration = averageDuration
        createSponsorBlockMarkers(averageDuration)
      }
    }
    function skipSponsorBlockSegments(currentTime) {
      const { autoSkip } = sponsorSkips.value
      if (autoSkip.size === 0) return
      const video_ = video.value
      let newTime = 0
      const skippedSegments = []
      sponsorBlockSegments.forEach(segment => {
        if (autoSkip.has(segment.category) && currentTime < segment.endTime &&
          (segment.startTime <= currentTime || (newTime > 0 && (segment.startTime < newTime || segment.startTime - newTime <= 0.150) && segment.endTime > newTime))) {
          newTime = segment.endTime
          skippedSegments.push(segment)
        }
      })
      if (newTime === 0 || video_.ended) return
      const videoEnd = player.seekRange().end
      if (Math.abs(videoEnd - currentTime) < 1 || video_.ended) return
      if (newTime > videoEnd || Math.abs(videoEnd - newTime) < 1) newTime = videoEnd
      video_.currentTime = newTime
      if (sponsorBlockShowSkippedToast.value) {
        skippedSegments.forEach(({ uuid, category }) => {
          const existingSkip = skippedSponsorBlockSegments.value.find(skipped => skipped.uuid === uuid)
          if (existingSkip) {
            clearTimeout(existingSkip.timeoutId)
            existingSkip.timeoutId = setTimeout(() => {
              const index = skippedSponsorBlockSegments.value.findIndex(skipped => skipped.uuid === uuid)
              skippedSponsorBlockSegments.value.splice(index, 1)
            }, 2000)
          } else {
            skippedSponsorBlockSegments.value.push({
              uuid,
              translatedCategory: translateSponsorBlockCategory(category),
              timeoutId: setTimeout(() => {
                const index = skippedSponsorBlockSegments.value.findIndex(skipped => skipped.uuid === uuid)
                skippedSponsorBlockSegments.value.splice(index, 1)
              }, 2000)
            })
          }
        })
      }
    }

    const seekingIsPossible = computed(() => {
      if (props.manifestMimeType !== 'application/x-mpegurl') return true
      const match = props.manifestSrc.match(/\/(?:manifest|playlist)_duration\/(\d+)\//)
      return match != null && parseInt(match[1] || '0') > 30
    })
    function getPlayerConfig(format, useAutoQuality = false) {
      return {
        streaming: { bufferingGoal: 180, rebufferingGoal: 0.02, bufferBehind: 300 },
        manifest: {
          disableVideo: format === 'audio',
          segmentRelativeVttTiming: true,
          dash: { manifestPreprocessorTXml: manifestPreprocessorTXml },
        },
        abr: { enabled: useAutoQuality, restrictToElementSize: true },
        autoShowText: shaka.config.AutoShowText.NEVER,
        preferredDecodingAttributes: format === 'dash' ? ['smooth', 'powerEfficient'] : [],
        preferredVideoCodecs: typeof props.vrProjection === 'string' ? ['av01', 'avc1'] : []
      }
    }
    function manifestPreprocessorTXml(mpdNode) {
      const periods = mpdNode.children?.filter(child => typeof child !== 'string' && child.tagName === 'Period') ?? []
      sortAdapationSetsByCodec(periods)
      if (mpdNode.attributes.type === 'dynamic') {
        const minimumUpdatePeriod = parseFloat(mpdNode.attributes.minimumUpdatePeriod.match(/^PT(\d+(?:\.\d+)?)S$/)[1])
        mpdNode.attributes.suggestedPresentationDelay = `PT${(minimumUpdatePeriod * 2).toFixed(3)}S`
        for (const period of periods) {
          const representations = []
          for (const periodChild of period.children) {
            if (typeof periodChild !== 'string' && periodChild.tagName === 'AdaptationSet') {
              for (const adaptationSetChild of periodChild.children) {
                if (typeof adaptationSetChild !== 'string' && adaptationSetChild.tagName === 'Representation') {
                  representations.push(adaptationSetChild)
                }
              }
            }
          }
          const knownIds = new Set()
          let counter = 0
          for (const representation of representations) {
            const id = representation.attributes.id
            if (knownIds.has(id)) {
              const newId = `${id}-ft-fix-${counter}`
              representation.attributes.id = newId
              knownIds.add(newId)
              counter++
            } else {
              knownIds.add(id)
            }
          }
        }
      } else if (!process.env.SUPPORTS_LOCAL_API) {
        repairInvidiousManifest(periods)
      }
    }
    function sortAdapationSetsByCodec(periods) {
      const getCodecsPrefix = (adaptationSet) => {
        const codecs = adaptationSet.attributes.codecs ??
          adaptationSet.children.find(child => typeof child !== 'string' && child.tagName === 'Representation').attributes.codecs
        return codecs.split('.')[0]
      }
      const codecPriorities = ['opus', 'mp4a', 'ec-3', 'ac-3', 'av01', 'vp09', 'vp9', 'avc1']
      for (const period of periods) {
        period.children?.sort((a, b) => {
          if (typeof a === 'string' || a.tagName !== 'AdaptationSet' || typeof b === 'string' || b.tagName !== 'AdaptationSet') return 0
          const typeA = a.attributes.contentType || a.attributes.mimeType.split('/')[0]
          const typeB = b.attributes.contentType || b.attributes.mimeType.split('/')[0]
          if (typeA !== 'video' && typeA !== 'audio') return 1
          if (typeB !== 'video' && typeB !== 'audio') return -1
          const codecsPrefixA = getCodecsPrefix(a)
          const codecsPrefixB = getCodecsPrefix(b)
          return codecPriorities.indexOf(codecsPrefixA) - codecPriorities.indexOf(codecsPrefixB)
        })
      }
    }
    const useVrMode = computed(() => props.format === 'dash' && props.vrProjection === 'EQUIRECTANGULAR')
    const uiConfig = computed(() => {
      const uiConfig = {
        controlPanelElements: ['play_pause', 'mute', 'volume', 'time_and_duration', 'spacer'],
        overflowMenuButtons: [],
        trackLabelFormat: hasMultipleAudioTracks.value ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        textTrackLabelFormat: sortedCaptions.length > 0 ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        displayInVrMode: useVrMode.value
      }
      let elementList = []
      if (useOverFlowMenu.value) {
        uiConfig.overflowMenuButtons = ['ft_screenshot', 'ft_autoplay_toggle', 'playback_rate', 'loop', 'ft_audio_tracks', 'captions', 'ft_custom_subtitle', 'picture_in_picture', 'ft_full_window', props.format === 'legacy' ? 'ft_legacy_quality' : 'quality', 'recenter_vr', 'toggle_stereoscopic']
        elementList = uiConfig.overflowMenuButtons
        uiConfig.controlPanelElements.push('overflow_menu')
      } else {
        uiConfig.controlPanelElements.push('recenter_vr', 'toggle_stereoscopic', 'ft_screenshot', 'ft_autoplay_toggle', 'playback_rate', 'loop', 'ft_audio_tracks', 'captions', 'ft_custom_subtitle', 'picture_in_picture', 'ft_theatre_mode', 'ft_full_window', props.format === 'legacy' ? 'ft_legacy_quality' : 'quality')
        elementList = uiConfig.controlPanelElements
      }
      uiConfig.controlPanelElements.push('fullscreen')
      if (!enableScreenshot.value || props.format === 'audio') elementList.splice(elementList.indexOf('ft_screenshot'), 1)
      if (!props.theatrePossible) {
        const index = elementList.indexOf('ft_theatre_mode')
        if (index !== -1) elementList.splice(index, 1)
      }
      if (!props.autoplayPossible) elementList.splice(elementList.indexOf('ft_autoplay_toggle'), 1)
      if (props.format === 'audio') elementList.splice(elementList.indexOf('picture_in_picture'), 1)
      if (isLive.value) elementList.splice(elementList.indexOf('loop'), 1)
      if (!useVrMode.value) {
        const indexRecenterVr = elementList.indexOf('recenter_vr')
        elementList.splice(indexRecenterVr, 1)
        const indexToggleStereoscopic = elementList.indexOf('toggle_stereoscopic')
        elementList.splice(indexToggleStereoscopic, 1)
      }
      return uiConfig
    })
    function configureUI(firstTime = false) {
      if (firstTime) {
        const firstTimeConfig = {
          addSeekBar: seekingIsPossible.value,
          customContextMenu: true,
          contextMenuElements: ['ft_stats'],
          enableTooltips: true,
          seekBarColors: { played: 'var(--primary-color)' },
          volumeBarColors: { level: 'var(--primary-color)' },
          addBigPlayButton: displayVideoPlayButton.value,
          enableFullscreenOnRotation: enterFullscreenOnDisplayRotate.value,
          playbackRates: playbackRates.value,
          tapSeekDistance: defaultSkipInterval.value,
          enableKeyboardPlaybackControls: false,
          preferDocumentPictureInPicture: false
        }
        Object.assign(firstTimeConfig, uiConfig.value)
        ui.configure(firstTimeConfig)
      } else {
        ui.configure(uiConfig.value)
      }
    }
    function handleControlsContainerWheel(event) {
      const classList = event.target.classList
      if (classList.contains('shaka-scrim-container') || classList.contains('shaka-fast-foward-container') || classList.contains('shaka-rewind-container') || classList.contains('shaka-play-button-container') || classList.contains('shaka-play-button')) {
        if (event.ctrlKey || event.metaKey) {
          if (videoPlaybackRateMouseScroll.value) mouseScrollPlaybackRate(event)
        } else {
          if (videoVolumeMouseScroll.value) mouseScrollVolume(event)
          else if (videoSkipMouseScroll.value) mouseScrollSkip(event)
        }
      }
    }
    function handleControlsContainerClick(event) {
      if (event.ctrlKey || event.metaKey) {
        event.stopPropagation()
        video.value.playbackRate = props.currentPlaybackRate
        video.value.defaultPlaybackRate = props.currentPlaybackRate
      }
    }

    /**
     * @param {string} srt
     * @returns {string}
     */
    function convertSrtToVtt(srt) {
      // Zamiana przecinków na kropki w znacznikach czasu
      let vtt = srt.replaceAll(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
      // Dodanie nagłówka WEBVTT
      vtt = 'WEBVTT\n\n' + vtt
      // Usunięcie numeracji linii
      vtt = vtt.replaceAll(/^\d+\s*$/gm, '')
      // Poprawienie pustych linii, aby były co najmniej dwie między wpisami
      vtt = vtt.replaceAll(/\n\n+/g, '\n\n')
      return vtt
    }

    function parseVttCues(vttContent) {
      const cueBlocks = vttContent.split('\n\n').slice(1)
      const toSeconds = (timeStr) => {
        const parts = timeStr.split(':').map(part => parseFloat(part.replace(',', '.')))
        let seconds = 0
        if (parts.length === 3) {
          seconds += parts[0] * 3600
          seconds += parts[1] * 60
          seconds += parts[2]
        } else {
          seconds += parts[0] * 60
          seconds += parts[1]
        }
        return seconds
      }

      return cueBlocks.map(block => {
        const lines = block.split('\n')
        if (lines.length < 2) return null
        const timeMatch = lines[0].match(/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/)
        if (!timeMatch) return null

        const text = lines.slice(1).join(' ').replaceAll(/(\r\n|\n|\r)/gm, ' ')
        return {
          startTime: toSeconds(timeMatch[1]),
          endTime: toSeconds(timeMatch[2]),
          text: text,
        }
      }).filter(cue => cue !== null)
    }

    async function uploadSubtitles() {
      try {
        const file = await readFileWithPicker('Subtitle File', { 'text/vtt': ['.vtt'], 'application/x-subrip': ['.srt'] }, 'subtitle-upload')
        if (file === null) return

        let content = file.content
        const fileExtension = file.filename.split('.').pop().toLowerCase()

        if (fileExtension === 'srt') {
          content = convertSrtToVtt(content)
        }

        customCues.value = parseVttCues(content)
        showToast(t('Video.Player.Subtitles loaded successfully'))

        // Wyłączenie natywnych napisów Shaka, jeśli jakieś są aktywne
        if (player.isTextTrackVisible()) {
          await player.setTextTrackVisibility(false)
        }
      } catch (err) {
        console.error('Error loading subtitles:', err)
        showToast(t('Video.Player.Error loading subtitles', { error: err.message }))
      }
    }

    function addUICustomizations() {
      const controlsContainer = ui.getControls().getControlsContainer()
      controlsContainer.removeEventListener('wheel', handleControlsContainerWheel)
      controlsContainer.removeEventListener('click', handleControlsContainerClick, true)
      if (!useVrMode.value) {
        if (videoVolumeMouseScroll.value || videoSkipMouseScroll.value || videoPlaybackRateMouseScroll.value) {
          controlsContainer.addEventListener('wheel', handleControlsContainerWheel)
        }
        if (videoPlaybackRateMouseScroll.value) {
          controlsContainer.addEventListener('click', handleControlsContainerClick, true)
        }
      }
      container.value.querySelector('.shaka-volume-bar').addEventListener('wheel', mouseScrollVolume)
      const fullscreenTitleOverlay = document.createElement('h1')
      fullscreenTitleOverlay.textContent = props.title
      fullscreenTitleOverlay.className = 'playerFullscreenTitleOverlay'
      controlsContainer.appendChild(fullscreenTitleOverlay)

      if (hasLoaded.value && props.chapters.length > 0) {
        createChapterMarkers()
      }
      if (useSponsorBlock.value && sponsorBlockSegments.length > 0) {
        let duration
        if (hasLoaded.value) {
          const seekRange = player.seekRange()
          duration = seekRange.end - seekRange.start
        } else {
          duration = sponsorBlockAverageVideoDuration
        }
        createSponsorBlockMarkers(duration)
      }
    }

    function registerAudioTrackSelection() {
      class AudioTrackSelectionFactory {
        create(rootElement, controls) {
          return new AudioTrackSelection(events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_audio_tracks', new AudioTrackSelectionFactory())
      shakaOverflowMenu.registerElement('ft_audio_tracks', new AudioTrackSelectionFactory())
    }
    function registerAutoplayToggle() {
      events.addEventListener('toggleAutoplay', () => {
        emit('toggle-autoplay')
      })
      class AutoplayToggleFactory {
        create(rootElement, controls) {
          return new AutoplayToggle(props.autoplayEnabled, events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_autoplay_toggle', new AutoplayToggleFactory())
      shakaOverflowMenu.registerElement('ft_autoplay_toggle', new AutoplayToggleFactory())
    }
    function registerTheatreModeButton() {
      events.addEventListener('toggleTheatreMode', () => {
        emit('toggle-theatre-mode')
      })
      class TheatreModeButtonFactory {
        create(rootElement, controls) {
          return new TheatreModeButton(props.useTheatreMode, events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
      shakaOverflowMenu.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
    }
    function registerFullWindowButton() {
      events.addEventListener('setFullWindow', (event) => {
        if (event.detail) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
        fullWindowEnabled.value = event.detail
        if (fullWindowEnabled.value) {
          document.body.classList.add('playerFullWindow')
        } else {
          document.body.classList.remove('playerFullWindow')
        }
      })
      if (startInFullwindow) {
        events.dispatchEvent(new CustomEvent('setFullWindow', {
          detail: true
        }))
      }
      class FullWindowButtonFactory {
        create(rootElement, controls) {
          return new FullWindowButton(fullWindowEnabled.value, events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_full_window', new FullWindowButtonFactory())
      shakaOverflowMenu.registerElement('ft_full_window', new FullWindowButtonFactory())
    }
    function registerLegacyQualitySelection() {
      events.addEventListener('setLegacyFormat', async (event) => {
        const { format, playbackPosition, restoreCaptionIndex: restoreCaptionIndex_ = null } = event.detail
        if (restoreCaptionIndex_ !== null) {
          restoreCaptionIndex = restoreCaptionIndex_
        }
        activeLegacyFormat.value = event.detail.format
        try {
          await player.load(format.url, playbackPosition, format.mimeType)
        } catch (error) {
          handleError(error, 'setLegacyFormat', event.detail)
        }
      })
      class LegacyQualitySelectionFactory {
        create(rootElement, controls) {
          return new LegacyQualitySelection(
            activeLegacyFormat.value,
            props.legacyFormats,
            events,
            rootElement,
            controls
          )
        }
      }
      shakaControls.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
      shakaOverflowMenu.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
    }
    function registerStatsButton() {
      events.addEventListener('setStatsVisibility', (event) => {
        showStats.value = event.detail
        if (showStats.value) {
          gatherInitialStatsValues()
        }
      })
      class StatsButtonFactory {
        create(rootElement, controls) {
          return new StatsButton(showStats.value, events, rootElement, controls)
        }
      }
      shakaContextMenu.registerElement('ft_stats', new StatsButtonFactory())
    }
    function registerScreenshotButton() {
      events.addEventListener('takeScreenshot', () => {
        takeScreenshot()
      })
      class ScreenshotButtonFactory {
        create(rootElement, controls) {
          return new ScreenshotButton(events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_screenshot', new ScreenshotButtonFactory())
      shakaOverflowMenu.registerElement('ft_screenshot', new ScreenshotButtonFactory())
    }
    function registerCustomSubtitleButton() {
      events.addEventListener('ft-upload-subtitle', () => uploadSubtitles())
      events.addEventListener('ft-toggle-subtitle-settings', () => {
        showSubtitleSettings.value = !showSubtitleSettings.value
      })

      class CustomSubtitleButtonFactory {
        create(rootElement, controls) {
          return new CustomSubtitleButton(events, rootElement, controls)
        }
      }
      shakaControls.registerElement('ft_custom_subtitle', new CustomSubtitleButtonFactory())
      shakaOverflowMenu.registerElement('ft_custom_subtitle', new CustomSubtitleButtonFactory())
    }
    function cleanUpCustomPlayerControls() {
      shakaControls.registerElement('ft_audio_tracks', null)
      shakaOverflowMenu.registerElement('ft_audio_tracks', null)
      shakaControls.registerElement('ft_autoplay_toggle', null)
      shakaOverflowMenu.registerElement('ft_autoplay_toggle', null)
      shakaControls.registerElement('ft_theatre_mode', null)
      shakaOverflowMenu.registerElement('ft_theatre_mode', null)
      shakaControls.registerElement('ft_full_window', null)
      shakaOverflowMenu.registerElement('ft_full_window', null)
      shakaControls.registerElement('ft_legacy_quality', null)
      shakaOverflowMenu.registerElement('ft_legacy_quality', null)
      shakaContextMenu.registerElement('ft_stats', null)
      shakaControls.registerElement('ft_screenshot', null)
      shakaOverflowMenu.registerElement('ft_screenshot', null)
      shakaControls.registerElement('ft_custom_subtitle', null)
      shakaOverflowMenu.registerElement('ft_custom_subtitle', null)
    }

    watch(uiConfig, (newValue, oldValue) => { if (newValue !== oldValue && ui) { configureUI() } })
    watch(videoVolumeMouseScroll, (newValue, oldValue) => { if (newValue !== oldValue && ui) { configureUI() } })
    watch(videoPlaybackRateMouseScroll, (newValue, oldValue) => { if (newValue !== oldValue && ui) { configureUI() } })
    watch(videoSkipMouseScroll, (newValue, oldValue) => { if (newValue !== oldValue && ui) { configureUI() } })
    watch(() => props.autoplayEnabled, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        events.dispatchEvent(new CustomEvent('setAutoplay', { detail: newValue }))
      }
    })

    let resizeObserver = null
    function resized(entries) { useOverFlowMenu.value = entries[0].contentBoxSize[0].inlineSize <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD }

    const loadedLocales = new Set(process.env.SHAKA_LOCALES_PREBUNDLED)
    async function setLocale(locale) {
      const shakaLocale = LOCALE_MAPPINGS.get(locale) ?? 'en'
      const localization = ui.getControls().getLocalization()
      const cachedLocales = store.state.player.cachedPlayerLocales
      if (!loadedLocales.has(shakaLocale)) {
        if (!Object.hasOwn(cachedLocales, shakaLocale)) await store.dispatch('cachePlayerLocale', shakaLocale)
        localization.insert(shakaLocale, new Map(Object.entries(cachedLocales[shakaLocale])))
        loadedLocales.add(shakaLocale)
      }
      localization.changeLocale([shakaLocale])
      const shakaControlKeysToShortcutLocalizations = new Map()
      Object.entries(shakaControlKeysToShortcuts).forEach(([shakaControlKey, shortcut]) => {
        const originalLocalization = localization.resolve(shakaControlKey)
        if (originalLocalization === '') { console.error('Mising Shaka localization key "%s"', shakaControlKey); return }
        const localizationWithShortcut = addKeyboardShortcutToActionTitle(originalLocalization, shortcut)
        shakaControlKeysToShortcutLocalizations.set(shakaControlKey, localizationWithShortcut)
      })
      localization.insert(shakaLocale, shakaControlKeysToShortcutLocalizations)
      events.dispatchEvent(new CustomEvent('localeChanged'))
    }
    watch(locale, setLocale)
    watch(showAdjustedTime, updateAdjustedTimeDisplay)

    let powerSaveBlocker = null
    async function startPowerSaveBlocker() {
      if (process.env.IS_ELECTRON && powerSaveBlocker === null) {
        const { ipcRenderer } = require('electron')
        powerSaveBlocker = await ipcRenderer.invoke(IpcChannels.START_POWER_SAVE_BLOCKER)
      }
    }
    function stopPowerSaveBlocker() {
      if (process.env.IS_ELECTRON && powerSaveBlocker !== null) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, powerSaveBlocker)
        powerSaveBlocker = null
      }
    }

    function handlePlay() {
      startPowerSaveBlocker()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    }
    function handlePause() {
      stopPowerSaveBlocker()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    function handleEnded() {
      stopPowerSaveBlocker()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none'
      emit('ended')
    }
    function handleCanPlay() {
      if (startInPip && props.format !== 'audio' && ui.getControls().isPiPAllowed() && process.env.IS_ELECTRON) {
        startInPip = false
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.REQUEST_PIP)
      }
    }
    function updateVolume() {
      const video_ = video.value
      if (sessionStorage.getItem('muted') === 'false' && video_.volume === 0) {
        const volume = parseFloat(sessionStorage.getItem('defaultVolume'))
        const muted = true
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      } else {
        const volume = video_.volume
        const muted = video_.muted
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      }
      if (showStats.value) stats.volume = (video_.volume * 100).toFixed(1)
    }
    function onTextChanged() {
      if (customCues.value.length === 0 && player) {
        const textTracks = player.getTextTracks()
        const activeTrack = textTracks.find(track => track.active)
        if (activeTrack && player.isTextTrackVisible()) {
          const activeCue = activeTrack.cues ? activeTrack.cues.find(cue => cue.isDisplayed) : null
          currentCustomSubtitleText.value = activeCue ? activeCue.text.replaceAll(/(\r\n|\n|\r)/gm, ' ') : ''
        } else {
          currentCustomSubtitleText.value = ''
        }
      }
    }

    function handleTimeupdate() {
      const video_ = video.value
      const videoCurrentTime = video_.currentTime
      const videoDuration = video_.duration
      currentTime.value = videoCurrentTime
      if (duration.value !== videoDuration) duration.value = videoDuration
      if (video_.buffered.length > 0) bufferedTime.value = video_.buffered.end(video_.buffered.length - 1)
      emit('timeupdate', videoCurrentTime)
      if (showStats.value && hasLoaded.value) updateStats()
      if (useSponsorBlock.value && sponsorBlockSegments.length > 0 && canSeek()) skipSponsorBlockSegments(videoCurrentTime)

      if (customCues.value.length > 0) {
        const activeCue = customCues.value.find(cue => videoCurrentTime >= cue.startTime && videoCurrentTime <= cue.endTime)
        currentCustomSubtitleText.value = activeCue ? activeCue.text : ''
      }
      updateAdjustedTimeDisplay()
    }

    function updateAdjustedTimeDisplay() {
      let adjustedElement = container.value?.querySelector('#adjusted-duration-display')

      if (!showAdjustedTime.value) {
        if (adjustedElement) {
          adjustedElement.remove()
        }
        return
      }

      // If element is not in DOM, but it should be, create and append it
      if (!adjustedElement) {
        const timeContainer = container.value?.querySelector('.shaka-current-time')
        if (!timeContainer) {
          return // Can't do anything if parent element isn't ready
        }
        adjustedElement = document.createElement('span')
        adjustedElement.id = 'adjusted-duration-display'
        adjustedElement.style.marginLeft = '8px'
        adjustedElement.style.color = '#ffeb3b'
        adjustedElement.style.fontSize = getComputedStyle(timeContainer).fontSize
        adjustedElement.style.alignSelf = 'center'

        // Insert after the time container
        timeContainer.parentNode.insertBefore(adjustedElement, timeContainer.nextSibling)
      }

      const playbackRate = video.value?.playbackRate
      const originalDuration = video.value?.duration

      if (!playbackRate || playbackRate === 1 || !isFinite(originalDuration) || originalDuration <= 0) {
        adjustedElement.textContent = ''
        return
      }

      const adjustedTotalDuration = originalDuration / playbackRate
      const formattedAdjustedTotal = formatDurationAsTimestamp(adjustedTotalDuration)

      const currentTimeValue = video.value.currentTime
      const adjustedCurrentTime = currentTimeValue / playbackRate
      const formattedAdjustedCurrent = formatDurationAsTimestamp(adjustedCurrentTime)

      const textToShow = `(${formattedAdjustedCurrent} / ${formattedAdjustedTotal} @${playbackRate}x)`

      if (adjustedElement.textContent !== textToShow) {
        adjustedElement.textContent = textToShow
      }
    }

    function requestFilter(type, request, _context) {
      if (type === RequestType.SEGMENT) {
        const url = new URL(request.uris[0])
        if (url.hostname.endsWith('.googlevideo.com') && url.pathname === '/videoplayback') {
          request.method = 'POST'
          request.body = new Uint8Array([0x78, 0])
          if (request.headers.Range) {
            request.uris[0] += `&range=${request.headers.Range.split('=')[1]}`
            delete request.headers.Range
          }
          request.uris[0] += '&alr=yes'
        }
      }
    }
    async function responseFilter(type, response, context) {
      if (type === RequestType.SEGMENT) {
        if (response.data && response.data.byteLength > 4 && new DataView(response.data).getUint32(0) === HTTP_IN_HEX) {
          const responseAsString = shaka.util.StringUtils.fromUTF8(response.data)
          const retryParameters = player.getConfiguration().streaming.retryParameters
          const uris = [responseAsString]
          const redirectRequest = shaka.net.NetworkingEngine.makeRequest(uris, retryParameters)
          const requestOperation = player.getNetworkingEngine().request(type, redirectRequest, context)
          const redirectResponse = await requestOperation.promise
          response.data = redirectResponse.data
          response.headers = redirectResponse.headers
          response.uri = redirectResponse.uri
        } else {
          const url = new URL(response.uri)
          if (url.hostname.endsWith('.youtube.com') && url.pathname === '/api/timedtext' && url.searchParams.get('caps') === 'asr' && url.searchParams.get('kind') === 'asr' && url.searchParams.get('fmt') === 'vtt') {
            const stringBody = new TextDecoder().decode(response.data)
            let cleaned = stringBody.replaceAll(/ align:start position:(?:10)?0%$/gm, '')
            if (!cleaned.startsWith('WEBVTT')) {
              cleaned = 'WEBVTT\n\n' + cleaned
            }
            response.data = new TextEncoder().encode(cleaned).buffer
          }
        }
      } else if (type === RequestType.MANIFEST && context.type === AdvancedRequestType.MEDIA_PLAYLIST) {
        const url = new URL(response.uri)
        let modifiedText
        if (url.searchParams.has('local')) {
          const stringBody = new TextDecoder().decode(response.data)
          modifiedText = stringBody.replaceAll(/https?:\/\/.+$/gm, hlsProxiedUrlReplacer)
        }
        if (/\/itag\/23[34]\//.test(url.pathname) || url.searchParams.get('itag') === '233' || url.searchParams.get('itag') === '234') {
          if (!modifiedText) {
            modifiedText = new TextDecoder().decode(response.data)
          }
          modifiedText = modifiedText.replaceAll('/file/seg.ts', '/file/seg.aac')
        }
        if (modifiedText) {
          response.data = new TextEncoder().encode(modifiedText).buffer
        }
      }
    }
    function hlsProxiedUrlReplacer(match) {
      const url = new URL(match)
      let fileValue
      for (const [key, value] of url.searchParams) {
        if (key === 'file') {
          fileValue = value
          continue
        } else if (key === 'hls_chunk_host') {
          url.pathname += `/host/${encodeURIComponent(value.replace('.c.youtube.com', '.googlevideo.com'))}`
        }
        url.pathname += `/${key}/${encodeURIComponent(value)}`
      }
      url.pathname += `/file/${encodeURIComponent(fileValue)}`
      url.search = ''
      return url.toString()
    }
    function setDashQuality(quality, audioBandwidth, label) {
      let variants = player.getVariantTracks()
      if (label) {
        variants = variants.filter(variant => variant.label === label)
      } else if (hasMultipleAudioTracks.value) {
        variants = variants.filter(variant => variant.audioRoles.includes('main'))
      }
      const isPortrait = variants[0].height > variants[0].width
      let matches = variants.filter(variant => {
        return quality === (isPortrait ? variant.width : variant.height)
      })
      if (matches.length === 0) {
        matches = variants.filter(variant => {
          return quality > (isPortrait ? variant.width : variant.height)
        })
      }
      matches.sort((a, b) => isPortrait ? b.width - a.width : b.height - a.height)
      let chosenVariant
      if (typeof audioBandwidth === 'number') {
        const width = matches[0].width
        const height = matches[0].height
        matches = matches.filter(variant => variant.width === width && variant.height === height)
        chosenVariant = findMostSimilarAudioBandwidth(matches, audioBandwidth)
      } else {
        chosenVariant = matches[0]
      }
      player.selectVariantTrack(chosenVariant)
    }
    async function setLegacyQuality(playbackPosition = null, previousQuality = undefined) {
      if (typeof previousQuality === 'undefined') {
        if (defaultQuality.value === 'auto') {
          previousQuality = Infinity
        } else {
          previousQuality = defaultQuality.value
        }
      }
      const legacyFormats = props.legacyFormats
      const isPortrait = legacyFormats[0].height > legacyFormats[0].width
      let matches = legacyFormats.filter(variant => {
        return previousQuality === isPortrait ? variant.width : variant.height
      })
      if (matches.length === 0) {
        matches = legacyFormats.filter(variant => {
          return previousQuality > isPortrait ? variant.width : variant.height
        })
        if (matches.length > 0) {
          matches.sort((a, b) => b.bitrate - a.bitrate)
        } else {
          matches = legacyFormats.sort((a, b) => a.bitrate - b.bitrate)
        }
      }
      hasMultipleAudioTracks.value = false
      events.dispatchEvent(new CustomEvent('setLegacyFormat', {
        detail: {
          format: matches[0],
          playbackPosition
        }
      }))
    }
    function gatherInitialStatsValues() {
      const video_ = video.value
      stats.volume = (video_.volume * 100).toFixed(1)
      if (props.format === 'legacy') {
        updateLegacyQualityStats(activeLegacyFormat.value)
      }
      const playerDimensions = video_.getBoundingClientRect()
      stats.playerDimensions = {
        width: Math.floor(playerDimensions.width),
        height: Math.floor(playerDimensions.height)
      }
      if (!hasLoaded.value) {
        player.addEventListener('loaded', () => {
          if (showStats.value) {
            if (props.format !== 'legacy') {
              updateQualityStats({
                newTrack: player.getVariantTracks().find(track => track.active)
              })
            }
            updateStats()
          }
        }, {
          once: true
        })
        return
      }
      if (props.format !== 'legacy') {
        updateQualityStats({
          newTrack: player.getVariantTracks().find(track => track.active)
        })
      }
      updateStats()
    }
    function updateQualityStats({ newTrack }) {
      if (!showStats.value || props.format === 'legacy') {
        return
      }
      stats.bitrate = (newTrack.bandwidth / 1000).toFixed(2)
      if (newTrack.videoCodec?.includes(',')) {
        stats.codecs.audioItag = ''
        stats.codecs.videoItag = ''
        const [audioCodec, videoCodec] = newTrack.videoCodec.split(',')
        stats.codecs.audioCodec = audioCodec
        stats.codecs.videoCodec = videoCodec
        stats.resolution.frameRate = newTrack.frameRate
        stats.resolution.width = newTrack.width
        stats.resolution.height = newTrack.height
      } else {
        stats.codecs.audioItag = newTrack.originalAudioId.split('-')[0]
        stats.codecs.audioCodec = newTrack.audioCodec
        if (props.format === 'dash') {
          stats.resolution.frameRate = newTrack.frameRate
          stats.codecs.videoItag = newTrack.originalVideoId
          stats.codecs.videoCodec = newTrack.videoCodec
          stats.resolution.width = newTrack.width
          stats.resolution.height = newTrack.height
        }
      }
    }
    function updateLegacyQualityStats(newFormat) {
      if (!showStats.value || props.format !== 'legacy') {
        return
      }
      const { fps, bitrate, mimeType, itag, width, height } = newFormat
      const codecsMatch = mimeType.match(/codecs="(?<videoCodec>.+), ?(?<audioCodec>.+)"/)
      stats.codecs.audioItag = itag
      stats.codecs.audioCodec = codecsMatch.groups.audioCodec
      stats.codecs.videoItag = itag
      stats.codecs.videoCodec = codecsMatch.groups.videoCodec
      stats.resolution.frameRate = fps
      stats.bitrate = (bitrate / 1000).toFixed(2)
      stats.resolution.width = width
      stats.resolution.height = height
    }
    function updateStats() {
      const playerDimensions = video.value.getBoundingClientRect()
      stats.playerDimensions = {
        width: Math.floor(playerDimensions.width),
        height: Math.floor(playerDimensions.height)
      }
      const playerStats = player.getStats()
      if (props.format !== 'audio') {
        stats.frames = {
          droppedFrames: playerStats.droppedFrames,
          totalFrames: playerStats.decodedFrames
        }
      }
      if (props.format !== 'legacy') {
        stats.bandwidth = (playerStats.estimatedBandwidth / 1000).toFixed(2)
      }
      let bufferedSeconds = 0
      const buffered = player.getBufferedInfo().total
      for (const { start, end } of buffered) {
        bufferedSeconds += end - start
      }
      const seekRange = player.seekRange()
      const duration = seekRange.end - seekRange.start
      stats.buffered = ((bufferedSeconds / duration) * 100).toFixed(2)
    }
    watch(showStats, (newValue) => {
      if (newValue) {
        player.addEventListener('adaptation', updateQualityStats)
        player.addEventListener('variantchanged', updateQualityStats)
      } else {
        player.removeEventListener('adaptation', updateQualityStats)
        player.removeEventListener('variantchanged', updateQualityStats)
      }
    })
    watch(activeLegacyFormat, updateLegacyQualityStats)
    async function takeScreenshot() {
      const video_ = video.value
      const width = video_.videoWidth
      const height = video_.videoHeight
      if (width <= 0) {
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(video_, 0, 0)
      const format = screenshotFormat.value
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
      const imageQuality = screenshotQuality.value / 100
      let filename
      try {
        filename = await store.dispatch('parseScreenshotCustomFileName', {
          date: new Date(),
          playerTime: video_.currentTime,
          videoId: props.videoId
        })
      } catch (err) {
        console.error(`Parse failed: ${err.message}`)
        showToast(t('Screenshot Error', { error: err.message }))
        canvas.remove()
        return
      }
      const filenameWithExtension = `${filename}.${format}`
      const wasPlaying = !video_.paused
      if (wasPlaying) {
        video_.pause()
      }
      try {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, imageQuality))
        if (!process.env.IS_ELECTRON || screenshotAskPath.value) {
          const saved = await writeFileWithPicker(filenameWithExtension, blob, format.toUpperCase(), mimeType, `.${format}`, 'player-screenshots', 'pictures')
          if (saved) {
            showToast(t('Screenshot Success'))
          }
        } else {
          const arrayBuffer = await blob.arrayBuffer()
          const { ipcRenderer } = require('electron')
          await ipcRenderer.invoke(IpcChannels.WRITE_SCREENSHOT, filenameWithExtension, arrayBuffer)
          showToast(t('Screenshot Success'))
        }
      } catch (error) {
        console.error(error)
        showToast(t('Screenshot Error', { error }))
      } finally {
        canvas.remove()
        if (wasPlaying) {
          video_.play()
        }
      }
    }
    function changeVolume(step) {
      const volumeBar = container.value.querySelector('.shaka-volume-bar')
      const oldValue = parseFloat(volumeBar.value)
      const newValue = oldValue + (step * 100)
      if (newValue < 0) {
        volumeBar.value = 0
      } else if (newValue > 100) {
        volumeBar.value = 100
      } else {
        volumeBar.value = newValue
      }
      volumeBar.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
      let messageIcon
      if (newValue <= 0) {
        messageIcon = 'volume-mute'
      } else if (newValue > 0 && newValue < oldValue) {
        messageIcon = 'volume-low'
      } else if (newValue > 0 && newValue > oldValue) {
        messageIcon = 'volume-high'
      }
      showValueChange(`${Math.round(video.value.volume * 100)}%`, messageIcon)
    }
    function changePlayBackRate(step) {
      const video_ = video.value
      const newPlaybackRateString = (video_.playbackRate + step).toFixed(2)
      const newPlaybackRate = parseFloat(newPlaybackRateString)
      if (newPlaybackRate > 0.07 && newPlaybackRate <= maxVideoPlaybackRate.value) {
        video_.playbackRate = newPlaybackRate
        video_.defaultPlaybackRate = newPlaybackRate
        showValueChange(`${newPlaybackRateString}x`)
      }
    }
    function canSeek() {
      if (!player || !hasLoaded.value) {
        return false
      }
      const seekRange = player.seekRange()
      if (seekRange.start === seekRange.end || !seekingIsPossible.value) {
        return false
      }
      return true
    }
    function seekBySeconds(seconds, canSeekResult = false) {
      if (!(canSeekResult || canSeek())) {
        return
      }
      const seekRange = player.seekRange()
      const video_ = video.value
      const currentTime = video_.currentTime
      const newTime = currentTime + seconds
      if (newTime < seekRange.start) {
        video_.currentTime = seekRange.start
      } else if (newTime > seekRange.end) {
        if (isLive.value) {
          player.goToLive()
        } else {
          video_.currentTime = seekRange.end
        }
      } else {
        video_.currentTime = newTime
      }
    }
    function mouseScrollPlaybackRate(event) {
      event.preventDefault()
      if ((event.deltaY < 0 || event.deltaX > 0)) {
        changePlayBackRate(0.05)
      } else if ((event.deltaY > 0 || event.deltaX < 0)) {
        changePlayBackRate(-0.05)
      }
    }
    function mouseScrollSkip(event) {
      if (canSeek()) {
        event.preventDefault()
        if ((event.deltaY < 0 || event.deltaX > 0)) {
          seekBySeconds(defaultSkipInterval.value * video.value.playbackRate, true)
        } else if ((event.deltaY > 0 || event.deltaX < 0)) {
          seekBySeconds(-defaultSkipInterval.value * video.value.playbackRate, true)
        }
      }
    }
    function mouseScrollVolume(event) {
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        event.stopPropagation()
        const video_ = video.value
        if (video_.muted && (event.deltaY < 0 || event.deltaX > 0)) {
          video_.muted = false
          video_.volume = 0
        }
        if (!video_.muted) {
          if ((event.deltaY < 0 || event.deltaX > 0)) {
            changeVolume(0.05)
          } else if ((event.deltaY > 0 || event.deltaX < 0)) {
            changeVolume(-0.05)
          }
        }
      }
    }
    function canChapterJump(event, direction) {
      const currentChapter = props.currentChapterIndex
      return props.chapters.length > 0 &&
        (direction === 'previous' ? currentChapter > 0 : props.chapters.length - 1 !== currentChapter) &&
        ((process.platform !== 'darwin' && event.ctrlKey) ||
          (process.platform === 'darwin' && event.metaKey))
    }
    function frameByFrame(step) {
      if (props.format === 'audio' || !canSeek()) {
        return
      }
      video.value.pause()
      let fps
      if (props.format === 'legacy') {
        fps = activeLegacyFormat.value.fps
      } else {
        fps = player.getVariantTracks().find(track => track.active).frameRate
      }
      const frameTime = 1 / fps
      const dist = frameTime * step
      seekBySeconds(dist, true)
    }
    function keyboardShortcutHandler(event) {
      if (!player || !hasLoaded.value) {
        return
      }
      if (document.activeElement.classList.contains('ft-input') || event.altKey) {
        return
      }
      if (event.shiftKey && event.key === '?') {
        event.preventDefault()
        if (ui.getControls().isFullScreenEnabled()) {
          ui.getControls().toggleFullScreen()
        }
        if (fullWindowEnabled.value) {
          events.dispatchEvent(new CustomEvent('setFullWindow', {
            detail: !fullWindowEnabled.value
          }))
        }
        return
      }
      if (event.ctrlKey && (process.platform === 'darwin' || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))) {
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        return
      }
      const video_ = video.value
      switch (event.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.PLAY:
          event.preventDefault()
          video_.paused ? video_.play() : video_.pause()
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.LARGE_REWIND:
          event.preventDefault()
          seekBySeconds(-defaultSkipInterval.value * video_.playbackRate * 2)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.LARGE_FAST_FORWARD:
          event.preventDefault()
          seekBySeconds(defaultSkipInterval.value * video_.playbackRate * 2)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.DECREASE_VIDEO_SPEED:
          event.preventDefault()
          changePlayBackRate(-videoPlaybackRateInterval.value)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.INCREASE_VIDEO_SPEED:
          event.preventDefault()
          changePlayBackRate(videoPlaybackRateInterval.value)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.FULLSCREEN:
          event.preventDefault()
          ui.getControls().toggleFullScreen()
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.MUTE:
          if (!event.metaKey) {
            event.preventDefault()
            const isMuted = !video_.muted
            video_.muted = isMuted
            const messageIcon = isMuted ? 'volume-mute' : 'volume-high'
            const message = isMuted ? '0%' : `${Math.round(video_.volume * 100)}%`
            showValueChange(message, messageIcon)
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.CAPTIONS:
          if (player.getTextTracks().length > 0) {
            event.preventDefault()
            const currentlyVisible = player.isTextTrackVisible()
            player.setTextTrackVisibility(!currentlyVisible)
          }
          break
        case 'x':
          if (customCues.value.length > 0) {
            event.preventDefault()
            store.dispatch('updateCustomSubtitleEnabled', !customSubtitlesEnabledFromStore.value)
            showToast(customSubtitlesEnabledFromStore.value ? t('Video.Player.Subtitles enabled') : t('Video.Player.Subtitles disabled'))
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.VOLUME_UP:
          event.preventDefault()
          changeVolume(0.05)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.VOLUME_DOWN:
          event.preventDefault()
          changeVolume(-0.05)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.SMALL_REWIND:
          event.preventDefault()
          if (canChapterJump(event, 'previous')) {
            video_.currentTime = props.chapters[props.currentChapterIndex - 1].startSeconds
          } else {
            seekBySeconds(-defaultSkipInterval.value * video_.playbackRate)
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.SMALL_FAST_FORWARD:
          event.preventDefault()
          if (canChapterJump(event, 'next')) {
            video_.currentTime = (props.chapters[props.currentChapterIndex + 1].startSeconds)
          } else {
            seekBySeconds(defaultSkipInterval.value * video_.playbackRate)
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.PICTURE_IN_PICTURE:
          if (props.format !== 'audio') {
            const controls = ui.getControls()
            if (controls.isPiPAllowed()) {
              controls.togglePiP()
            }
          }
          break
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
          if (canSeek()) {
            event.preventDefault()
            const seekRange = player.seekRange()
            const length = seekRange.end - seekRange.start
            const percentage = parseInt(event.key) / 10
            video_.currentTime = seekRange.start + (length * percentage)
          }
          break
        }
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.LAST_FRAME:
          if (!event.metaKey) {
            event.preventDefault()
            frameByFrame(-1)
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.NEXT_FRAME:
          event.preventDefault()
          frameByFrame(1)
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.STATS:
          event.preventDefault()
          events.dispatchEvent(new CustomEvent('setStatsVisibility', { detail: !showStats.value }))
          break
        case 'escape':
          if (fullWindowEnabled.value) {
            event.preventDefault()
            events.dispatchEvent(new CustomEvent('setFullWindow', { detail: false }))
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.FULLWINDOW:
          event.preventDefault()
          events.dispatchEvent(new CustomEvent('setFullWindow', { detail: !fullWindowEnabled.value }))
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.THEATRE_MODE:
          if (props.theatrePossible) {
            event.preventDefault()
            events.dispatchEvent(new CustomEvent('toggleTheatreMode', { detail: !props.useTheatreMode }))
          }
          break
        case KeyboardShortcuts.VIDEO_PLAYER.GENERAL.TAKE_SCREENSHOT:
          if (enableScreenshot.value && props.format !== 'audio') {
            event.preventDefault()
            takeScreenshot()
          }
          break
      }
    }
    let ignoreErrors = false
    function handleError(error, context, details) {
      while (error.code === shaka.util.Error.Code.REQUEST_FILTER_ERROR || error.code === shaka.util.Error.Code.RESPONSE_FILTER_ERROR) {
        error = error.data[0]
      }
      logShakaError(error, context, props.videoId, details)
      if (!ignoreErrors && error.category !== shaka.util.Error.Category.TEXT) {
        ignoreErrors = true
        emit('error', error)
        stopPowerSaveBlocker()
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none'
        }
      }
    }
    function createSponsorBlockMarkers(duration) {
      addMarkers(sponsorBlockSegments.map(segment => {
        const markerDiv = document.createElement('div')
        markerDiv.title = translateSponsorBlockCategory(segment.category)
        markerDiv.className = `sponsorBlockMarker main${sponsorSkips.value.categoryData[segment.category].color}`
        markerDiv.style.width = `${((segment.endTime - segment.startTime) / duration) * 100}%`
        markerDiv.style.left = `${(segment.startTime / duration) * 100}%`
        return markerDiv
      }))
    }
    function createChapterMarkers() {
      const { start, end } = player.seekRange()
      const duration = end - start
      const chapters = props.chapters
      addMarkers(chapters.map(chapter => {
        const markerDiv = document.createElement('div')
        markerDiv.title = chapter.title
        markerDiv.className = 'chapterMarker'
        markerDiv.style.left = `calc(${(chapter.startSeconds / duration) * 100}% - 1px)`
        return markerDiv
      }))
    }
    function addMarkers(markers) {
      const seekBarContainer = container.value.querySelector('.shaka-seek-bar-container')
      if (seekBarContainer.firstElementChild?.classList.contains('markerContainer')) {
        const markerBar = seekBarContainer.firstElementChild
        markers.forEach(marker => markerBar.appendChild(marker))
      } else {
        const markerBar = document.createElement('div')
        markerBar.className = 'markerContainer'
        markers.forEach(marker => markerBar.appendChild(marker))
        seekBarContainer.insertBefore(markerBar, seekBarContainer.firstElementChild)
      }
    }
    const isOffline = ref(!navigator.onLine)
    const isBuffering = ref(false)
    function onlineHandler() { isOffline.value = false }
    function offlineHandler() { isOffline.value = true }
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    const showOfflineMessage = computed(() => isOffline.value && isBuffering.value)

    const handleFullscreenChange = () => {
      isPlayerFullscreen.value = !!document.fullscreenElement
    }

    onMounted(async () => {
      const videoElement = video.value
      const volume = sessionStorage.getItem('volume')
      if (volume !== null) videoElement.volume = parseFloat(volume)
      const muted = sessionStorage.getItem('muted')
      if (muted !== null) videoElement.muted = (muted === 'true')
      videoElement.playbackRate = props.currentPlaybackRate
      videoElement.defaultPlaybackRate = props.currentPlaybackRate
      const localPlayer = new shaka.Player()
      player = localPlayer
      ui = new shaka.ui.Overlay(localPlayer, container.value, videoElement, vrCanvas.value)
      player.addEventListener('texttrackvisibility', onTextChanged)
      player.addEventListener('textchanged', onTextChanged)
      const controls = ui.getControls()
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      controls.addEventListener('mouseenter', () => { isControlsHovering.value = true })
      controls.addEventListener('mouseleave', () => { isControlsHovering.value = false })
      await localPlayer.attach(videoElement)
      if (!ui) return
      player.addEventListener('buffering', event => { isBuffering.value = event.buffering })
      player.addEventListener('error', event => handleError(event.detail, 'shaka error handler'))
      player.configure(getPlayerConfig(props.format, defaultQuality.value === 'auto'))
      if (process.env.SUPPORTS_LOCAL_API) {
        player.getNetworkingEngine().registerRequestFilter(requestFilter)
        player.getNetworkingEngine().registerResponseFilter(responseFilter)
      }
      await setLocale(locale.value)
      if (!ui || !player) return
      registerScreenshotButton()
      registerAudioTrackSelection()
      registerAutoplayToggle()
      registerTheatreModeButton()
      registerFullWindowButton()
      registerLegacyQualitySelection()
      registerStatsButton()
      registerCustomSubtitleButton()
      if (ui.isMobile()) {
        useOverFlowMenu.value = true
      } else {
        useOverFlowMenu.value = container.value.getBoundingClientRect().width <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD
        resizeObserver = new ResizeObserver(resized)
        resizeObserver.observe(container.value)
      }
      controls.addEventListener('uiupdated', addUICustomizations)
      configureUI(true)
      document.removeEventListener('keydown', keyboardShortcutHandler)
      document.addEventListener('keydown', keyboardShortcutHandler)
      player.addEventListener('loading', () => { hasLoaded.value = false })
      player.addEventListener('loaded', handleLoaded)
      if (props.format !== 'legacy') {
        player.addEventListener('streaming', () => {
          hasMultipleAudioTracks.value = player.getAudioLanguagesAndRoles().length > 1
          if (props.format === 'dash') {
            const firstVariant = player.getVariantTracks()[0]
            forceAspectRatio.value = firstVariant.width / firstVariant.height < 1.5
          }
        })
      } else {
        const firstFormat = props.legacyFormats[0]
        forceAspectRatio.value = firstFormat.width / firstFormat.height < 1.5
      }
      if (useSponsorBlock.value && sponsorSkips.value.seekBar.length > 0) {
        setupSponsorBlock()
      }
      window.addEventListener('beforeunload', stopPowerSaveBlocker)
      container.value.classList.add('no-cursor')
      await performFirstLoad()
      player.addEventListener('ratechange', () => {
        emit('playback-rate-updated', player.getPlaybackRate())
        updateAdjustedTimeDisplay()
      })
    })
    async function performFirstLoad() {
      if (props.format === 'dash' || props.format === 'audio') {
        try {
          await player.load(props.manifestSrc, props.startTime, props.manifestMimeType)
          if (defaultQuality.value !== 'auto') {
            if (props.format === 'dash') {
              setDashQuality(defaultQuality.value)
            } else {
              let variants = player.getVariantTracks()
              if (hasMultipleAudioTracks.value) {
                variants = variants.filter(variant => variant.audioRoles.includes('main'))
              }
              const highestBandwidth = Math.max(...variants.map(variant => variant.audioBandwidth))
              variants = variants.filter(variant => variant.audioBandwidth === highestBandwidth)
              player.selectVariantTrack(variants[0])
            }
          }
        } catch (error) {
          handleError(error, 'loading dash/audio manifest and setting default quality in mounted')
        }
      } else {
        await setLegacyQuality(props.startTime)
      }
    }
    async function handleLoaded() {
      hasLoaded.value = true
      emit('loaded')
      isLive.value = player.isLive()
      const promises = []
      for (const caption of sortedCaptions) {
        if (props.format === 'legacy') {
          const url = new URL(caption.url)
          if (url.hostname.endsWith('.youtube.com') && url.pathname === '/api/timedtext' && url.searchParams.get('caps') === 'asr' && url.searchParams.get('kind') === 'asr' && url.searchParams.get('fmt') === 'vtt') {
            promises.push((async () => {
              try {
                const response = await fetch(caption.url)
                let text = await response.text()
                text = text.replaceAll(/ align:start position:(?:10)?0%$/gm, '')
                if (!text.startsWith('WEBVTT')) {
                  text = 'WEBVTT\n\n' + text
                }
                const url = `data:${caption.mimeType};charset=utf-8,${encodeURIComponent(text)}`
                await player.addTextTrackAsync(url, caption.language, 'captions', caption.mimeType, undefined, caption.label)
              } catch (error) {
                if (error instanceof shaka.util.Error) {
                  handleError(error, 'addTextTrackAsync', caption)
                } else {
                  console.error(error)
                }
              }
            })())
          } else {
            promises.push(player.addTextTrackAsync(caption.url, caption.language, 'captions', caption.mimeType, undefined, caption.label).catch(error => handleError(error, 'addTextTrackAsync', caption)))
          }
        } else {
          promises.push(player.addTextTrackAsync(caption.url, caption.language, 'captions', caption.mimeType, undefined, caption.label).catch(error => handleError(error, 'addTextTrackAsync', caption)))
        }
      }
      if (!isLive.value && props.storyboardSrc) {
        promises.push(player.addThumbnailsTrack(props.storyboardSrc, 'text/vtt').catch(error => logShakaError(error, 'addThumbnailsTrack', props.videoId, props.storyboardSrc)))
      }
      await Promise.all(promises)
      if (restoreCaptionIndex !== null) {
        const index = restoreCaptionIndex
        restoreCaptionIndex = null
        const textTrack = player.getTextTracks()[index]
        if (textTrack) {
          player.selectTextTrack(textTrack)
          await player.setTextTrackVisibility(true)
        }
      }
      if (props.chapters.length > 0) {
        createChapterMarkers()
      }
      if (startInFullscreen && process.env.IS_ELECTRON) {
        startInFullscreen = false
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.REQUEST_FULLSCREEN)
      }
    }
    watch(() => props.format, async (newFormat, oldFormat) => {
      ignoreErrors = true
      if (!hasLoaded.value) {
        try { await player.unload() } catch { }
        ignoreErrors = false
        player.configure(getPlayerConfig(newFormat, defaultQuality.value === 'auto'))
        await performFirstLoad()
        return
      }
      const video_ = video.value
      const wasPaused = video_.paused
      let useAutoQuality = oldFormat === 'legacy' ? defaultQuality.value === 'auto' : player.getConfiguration().abr.enabled
      if (!wasPaused) video_.pause()
      const playbackPosition = video_.currentTime
      const activeCaptionIndex = player.getTextTracks().findIndex(caption => caption.active)
      if (activeCaptionIndex >= 0 && player.isTextTrackVisible()) {
        restoreCaptionIndex = activeCaptionIndex
        await player.setTextTrackVisibility(false)
      } else {
        restoreCaptionIndex = null
      }
      if (newFormat === 'audio' || newFormat === 'dash') {
        let label, audioBandwidth, dimension
        if (oldFormat === 'legacy' && newFormat === 'dash') {
          const legacyFormat = activeLegacyFormat.value
          if (!useAutoQuality) dimension = legacyFormat.height > legacyFormat.width ? legacyFormat.width : legacyFormat.height
        } else if (oldFormat !== 'legacy') {
          const track = player.getVariantTracks().find(track => track.active)
          if (typeof track.audioBandwidth === 'number') audioBandwidth = track.audioBandwidth
          if (track.label) label = track.label
        }
        if (oldFormat === 'audio' && newFormat === 'dash' && !useAutoQuality) {
          if (defaultQuality.value !== 'auto') dimension = defaultQuality.value
          else useAutoQuality = true
        }
        try { await player.unload() } catch { }
        ignoreErrors = false
        player.configure(getPlayerConfig(newFormat, useAutoQuality))
        try {
          await player.load(props.manifestSrc, playbackPosition, props.manifestMimeType)
          if (useAutoQuality) {
            if (label) player.selectVariantsByLabel(label)
          } else {
            if (dimension) {
              setDashQuality(dimension, audioBandwidth, label)
            } else {
              let variants = player.getVariantTracks()
              if (label) variants = variants.filter(variant => variant.label === label)
              let chosenVariant
              if (typeof audioBandwidth === 'number') {
                chosenVariant = findMostSimilarAudioBandwidth(variants, audioBandwidth)
              } else {
                chosenVariant = variants.reduce((previous, current) => previous === null || current.bandwidth > previous.bandwidth ? current : previous, null)
              }
              player.selectVariantTrack(chosenVariant)
            }
          }
        } catch (error) {
          handleError(error, 'loading dash/audio manifest for format switch', `${oldFormat} -> ${newFormat}`)
        }
        activeLegacyFormat.value = null
      } else {
        let previousQuality
        if (oldFormat === 'dash') {
          const previousTrack = player.getVariantTracks().find(track => track.active)
          previousQuality = previousTrack.height > previousTrack.width ? previousTrack.width : previousTrack.height
        }
        try { await player.unload() } catch { }
        ignoreErrors = false
        await setLegacyQuality(playbackPosition, previousQuality)
      }
      if (wasPaused) video_.pause()
    })
    onBeforeUnmount(() => {
      hasLoaded.value = false
      document.body.classList.remove('playerFullWindow')
      document.removeEventListener('keydown', keyboardShortcutHandler)
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (player) {
        player.removeEventListener('texttrackvisibility', onTextChanged)
        player.removeEventListener('textchanged', onTextChanged)
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      cleanUpCustomPlayerControls()
      stopPowerSaveBlocker()
      window.removeEventListener('beforeunload', stopPowerSaveBlocker)
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none'
      }
      skippedSponsorBlockSegments.value.forEach(segment => clearTimeout(segment.timeoutId))
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)

      const adjustedElement = container.value?.querySelector('#adjusted-duration-display')
      if (adjustedElement) {
        adjustedElement.remove()
      }
    })
    function isPaused() { return video.value.paused }
    function pause() { video.value.pause() }
    function getCurrentTime() { return video.value.currentTime }
    function setCurrentTime(time) { video.value.currentTime = time }
    async function destroyPlayer() {
      ignoreErrors = true
      let uiState = { startNextVideoInFullscreen: false, startNextVideoInFullwindow: false, startNextVideoInPip: false }
      if (ui) {
        if (ui.getControls()) {
          const controls = ui.getControls()
          uiState = {
            startNextVideoInFullscreen: controls.isFullScreenEnabled(),
            startNextVideoInFullwindow: fullWindowEnabled.value,
            startNextVideoInPip: controls.isPiPEnabled()
          }
        }
        await ui.destroy()
        ui = null
        player = null
      } else if (player) {
        await player.destroy()
        player = null
      }
      if (container.value) container.value.ui = null
      if (video.value) video.value.ui = null
      return uiState
    }
    expose({ hasLoaded, isPaused, pause, getCurrentTime, setCurrentTime, destroyPlayer })
    const showValueChangePopup = ref(false)
    const valueChangeMessage = ref('')
    const valueChangeIcon = ref(null)
    let valueChangeTimeout = null
    function showValueChange(message, icon = null) {
      valueChangeMessage.value = message
      valueChangeIcon.value = icon
      showValueChangePopup.value = true
      if (valueChangeTimeout) clearTimeout(valueChangeTimeout)
      valueChangeTimeout = setTimeout(() => { showValueChangePopup.value = false }, 2000)
    }

    return {
      container,
      video,
      vrCanvas,
      currentTime,
      duration,
      bufferedTime,
      fullWindowEnabled,
      forceAspectRatio,
      showStats,
      stats,
      autoplayVideos,
      sponsorBlockShowSkippedToast,
      skippedSponsorBlockSegments,
      showOfflineMessage,
      handlePlay,
      handlePause,
      handleCanPlay,
      handleEnded,
      updateVolume,
      handleTimeupdate,
      valueChangeMessage,
      valueChangeIcon,
      showValueChangePopup,
      showSubtitleSettings,
      currentCustomSubtitleText,
      isControlsHovering,
      isPlayerFullscreen
    }
  }
})
