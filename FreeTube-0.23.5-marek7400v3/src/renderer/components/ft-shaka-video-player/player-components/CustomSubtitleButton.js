import shaka from 'shaka-player'
import i18n from '../../../i18n/index'

export class CustomSubtitleButton extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls, 'closed_caption')

    this.button.classList.add('custom-subtitle-button', 'shaka-tooltip')
    this.menu.classList.add('custom-subtitle-menu')

    /** @private */
    this.events_ = events

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.addUploadButton_()
    this.addSettingsButton_()
    this.updateLocalisedStrings_()
  }

  addUploadButton_() {
    const button = document.createElement('button')
    button.addEventListener('click', () => {
      this.events_.dispatchEvent(new CustomEvent('ft-upload-subtitle'))
    })

    const span = document.createElement('span')
    span.textContent = i18n.t('Video.Player.Upload Subtitles')
    button.appendChild(span)
    this.menu.appendChild(button)
  }

  addSettingsButton_() {
    const button = document.createElement('button')
    button.addEventListener('click', () => {
      this.events_.dispatchEvent(new CustomEvent('ft-toggle-subtitle-settings'))
    })

    const span = document.createElement('span')
    span.textContent = i18n.t('Settings.Settings')
    button.appendChild(span)
    this.menu.appendChild(button)
  }

  /** @private */
  updateLocalisedStrings_() {
    const customSubtitlesText = i18n.t('Settings.Player Settings.Custom Subtitle Settings.Title')
    this.button.ariaLabel = customSubtitlesText
    this.nameSpan.textContent = customSubtitlesText
    this.backSpan.textContent = customSubtitlesText

    // Update menu item text if needed, for simplicity we keep them static for now
    this.menu.children[1].querySelector('span').textContent = i18n.t('Video.Player.Upload Subtitles')
    this.menu.children[2].querySelector('span').textContent = i18n.t('Settings.Settings')
  }
}
