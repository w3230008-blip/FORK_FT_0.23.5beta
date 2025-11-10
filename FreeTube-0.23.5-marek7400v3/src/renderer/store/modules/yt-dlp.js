const createInitialState = () => ({
  showPrompt: false,
  videoUrl: '',
  downloadOptions: null,
  lastError: null,
})

const state = createInitialState()

const getters = {
  showPrompt(currentState) {
    return currentState.showPrompt
  },

  videoUrl(currentState) {
    return currentState.videoUrl
  },

  downloadOptions(currentState) {
    return currentState.downloadOptions
  },

  lastError(currentState) {
    return currentState.lastError
  },
}

const mutations = {
  setShowPrompt(currentState, value) {
    currentState.showPrompt = Boolean(value)
  },

  setVideoUrl(currentState, value) {
    currentState.videoUrl = value ?? ''
  },

  setDownloadOptions(currentState, options) {
    currentState.downloadOptions = options ?? null
  },

  setLastError(currentState, error) {
    currentState.lastError = error ?? null
  },

  resetPromptState(currentState) {
    currentState.showPrompt = false
    currentState.videoUrl = ''
    currentState.downloadOptions = null
  },

  resetState(currentState) {
    Object.assign(currentState, createInitialState())
  }
}

const actions = {
  openPrompt({ commit }, { videoUrl = '', options = null } = {}) {
    commit('setVideoUrl', videoUrl)
    commit('setDownloadOptions', options)
    commit('setShowPrompt', true)
  },

  closePrompt({ commit }) {
    commit('resetPromptState')
  },

  updateVideoUrl({ commit }, videoUrl) {
    commit('setVideoUrl', videoUrl)
  },

  updateDownloadOptions({ commit }, options) {
    commit('setDownloadOptions', options)
  },

  setError({ commit }, error) {
    commit('setLastError', error)
  },

  clearError({ commit }) {
    commit('setLastError', null)
  },

  reset({ commit }) {
    commit('resetState')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
