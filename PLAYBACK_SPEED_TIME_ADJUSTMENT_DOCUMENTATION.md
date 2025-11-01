# Playback Speed Time Adjustment Feature Documentation

## Overview
This document details all references to the "Show adjusted time at current playback speed" feature (Polish: "Pokaż dostosowany czas przy bieżącej prędkości odtwarzania") in the FreeTube_0_23_5beta codebase.

## Feature Description
This feature displays the adjusted time remaining/elapsed when a video is played at speeds other than 1x. For example, when playing at 2x speed, a 10-minute video will show the adjusted duration as 5 minutes. The display shows current adjusted time, total adjusted duration, and the playback rate (e.g., "(1:30 / 5:00 @2x)").

---

## All References

### 1. Translation Files

#### File: `static/locales/pl.yaml`
**Line:** 404  
**Context:**
```yaml
  Player Settings:
    Player Settings: 'Odtwarzacz'
    Show Adjusted Time: Pokaż dostosowany czas przy bieżącej prędkości odtwarzania
    Play Next Video: 'Automatycznie odtwórz polecany film'
```
**Usage:** Polish translation for the setting label  
**Translation Key:** `Settings.Player Settings.Show Adjusted Time`

#### File: `static/locales/en-US.yaml`
**Line:** 419  
**Context:**
```yaml
  Player Settings:
    Player Settings: Player
    Show Adjusted Time: Show Adjusted Time at Current Playback Rate
    Play Next Video: Autoplay Recommended Videos
```
**Usage:** English (US) translation for the setting label  
**Translation Key:** `Settings.Player Settings.Show Adjusted Time`

#### File: `static/locales/en-GB.yaml`
**Line:** ~419 (similar to en-US)  
**Usage:** English (GB) translation for the setting label  
**Translation Key:** `Settings.Player Settings.Show Adjusted Time`

---

### 2. Settings Store Module

#### File: `src/renderer/store/modules/settings.js`
**Line:** 184  
**Context:**
```javascript
  // KONIEC NOWEGO KODU

  showAdjustedTime: false,
  autoplayPlaylists: true,
  autoplayVideos: true,
```
**Usage:** Vuex state definition - stores the boolean value for this setting  
**Default Value:** `false`  
**Type:** Simple state (no side effects)  
**Auto-generated functions:**
- Getter: `getShowAdjustedTime`
- Mutation: `setShowAdjustedTime`
- Action: `updateShowAdjustedTime`

**Storage:** Persisted to NeDB datastore via DBSettingHandlers

---

### 3. Player Settings UI Component

#### File: `src/renderer/components/player-settings/player-settings.vue`
**Lines:** 43-48  
**Context:**
```vue
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Show Adjusted Time')"
          :default-value="showAdjustedTime"
          :compact="true"
          @change="updateShowAdjustedTime"
        />
      </div>
      <div class="switchColumn">
```
**Usage:** UI toggle switch in the Player Settings page  
**Binding:**
- Label: Uses i18n translation key
- Default Value: Bound to `showAdjustedTime` computed property
- Change Event: Calls `updateShowAdjustedTime` action
**Location:** Left column of the switch grid in Player Settings section

#### File: `src/renderer/components/player-settings/player-settings.js`
**Lines:** 174-176, 374  
**Context 1 (Computed Property):**
```javascript
    videoPlaybackRateInterval: function () {
      return this.$store.getters.getVideoPlaybackRateInterval
    },

    showAdjustedTime: function () {
      return this.$store.getters.getShowAdjustedTime
    },

    formatNames: function () {
```
**Usage:** Computed property that retrieves the setting value from Vuex store

**Context 2 (Mapped Actions):**
```javascript
      'updateScreenshotFilenamePattern',
      'parseScreenshotCustomFileName',
      'updateShowAdjustedTime',
    ])
  }
})
```
**Usage:** Maps the Vuex action to component methods for updating the setting

---

### 4. Video Player Component

#### File: `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js`

##### Reference 1: Import and Computed Property
**Lines:** 234-236  
**Context:**
```javascript
    const customSubtitlesEnabledFromStore = computed(() => store.getters.getCustomSubtitleEnabled);

    const showAdjustedTime = computed(() => store.getters.getShowAdjustedTime);
    const autoplayVideos = computed(() => store.getters.getAutoplayVideos)
```
**Usage:** Creates a Vue 3 computed property that reactively tracks the setting from the store

##### Reference 2: Time Update Handler
**Lines:** 852-868  
**Context:**
```javascript
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
        const activeCue = customCues.value.find(cue => videoCurrentTime >= cue.startTime && videoCurrentTime <= cue.endTime);
        currentCustomSubtitleText.value = activeCue ? activeCue.text : '';
      }
      updateAdjustedTimeDisplay()
    }
```
**Usage:** Calls `updateAdjustedTimeDisplay()` on every time update to refresh the adjusted time display

##### Reference 3: Core Implementation Function
**Lines:** 870-917  
**Context:**
```javascript
    function updateAdjustedTimeDisplay() {
      let adjustedElement = container.value?.querySelector('#adjusted-duration-display');
  
      if (!showAdjustedTime.value) {
        if (adjustedElement) {
          adjustedElement.remove();
        }
        return;
      }
  
      // If element is not in DOM, but it should be, create and append it
      if (!adjustedElement) {
        const timeContainer = container.value?.querySelector('.shaka-current-time');
        if (!timeContainer) {
          return; // Can't do anything if parent element isn't ready
        }
        adjustedElement = document.createElement('span');
        adjustedElement.id = 'adjusted-duration-display';
        adjustedElement.style.marginLeft = '8px';
        adjustedElement.style.color = '#ffeb3b';
        adjustedElement.style.fontSize = getComputedStyle(timeContainer).fontSize;
        adjustedElement.style.alignSelf = 'center';
  
        // Insert after the time container
        timeContainer.parentNode.insertBefore(adjustedElement, timeContainer.nextSibling);
      }
  
      const playbackRate = video.value?.playbackRate;
      const originalDuration = video.value?.duration;
  
      if (!playbackRate || playbackRate === 1 || !isFinite(originalDuration) || originalDuration <= 0) {
        adjustedElement.textContent = '';
        return;
      }
      
      const adjustedTotalDuration = originalDuration / playbackRate;
      const formattedAdjustedTotal = formatDurationAsTimestamp(adjustedTotalDuration);
      
      const currentTimeValue = video.value.currentTime;
      const adjustedCurrentTime = currentTimeValue / playbackRate;
      const formattedAdjustedCurrent = formatDurationAsTimestamp(adjustedCurrentTime);
      
      const textToShow = `(${formattedAdjustedCurrent} / ${formattedAdjustedTotal} @${playbackRate}x)`;
  
      if (adjustedElement.textContent !== textToShow) {
          adjustedElement.textContent = textContent;
      }
    }
```
**Usage:** Core implementation function that:
1. Checks if the feature is enabled (`showAdjustedTime.value`)
2. If disabled: Removes the display element if it exists
3. If enabled:
   - Creates a new span element with ID `adjusted-duration-display` if it doesn't exist
   - Positions it after `.shaka-current-time` element
   - Styles it with yellow color (#ffeb3b), 8px left margin
   - Calculates adjusted times by dividing by playback rate
   - Formats and displays: "(adjusted_current / adjusted_total @RATEx)"
   - Only shows when playback rate ≠ 1
   - Uses `formatDurationAsTimestamp()` helper from utils

**DOM Structure:**
- Parent: `.shaka-current-time` container in Shaka player controls
- Element: `<span id="adjusted-duration-display">`
- Position: Inserted as next sibling after the time container

**Styling:**
- Color: `#ffeb3b` (yellow)
- Margin: `8px` left
- Font size: Inherited from parent `.shaka-current-time`
- Alignment: Center

**Example Output:**
- At 2x speed, 30 seconds into a 60-second video: "(0:15 / 0:30 @2x)"
- At 1.5x speed, 45 seconds into a 90-second video: "(0:30 / 1:00 @1.5x)"

#### File: `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue`
**Line:** 24  
**Context:**
```vue
      @canplay="handleCanPlay"
      @volumechange="updateVolume"
      @timeupdate="handleTimeupdate"
    />
```
**Usage:** The `@timeupdate` event handler triggers the chain that calls `updateAdjustedTimeDisplay()`

---

## Feature Architecture

### Data Flow
1. **User Interaction:** User toggles the switch in Player Settings
2. **Action Dispatch:** `updateShowAdjustedTime` action is called
3. **State Update:** 
   - Value saved to NeDB datastore
   - Vuex mutation `setShowAdjustedTime` updates state
4. **Reactive Update:** Computed property in video player component reacts to state change
5. **Display Update:** On next `timeupdate` event, display is shown/hidden accordingly

### Persistence
- **Storage:** NeDB datastore in userData directory
- **Key:** `showAdjustedTime`
- **Type:** Boolean
- **Default:** `false`
- **Sync:** Automatically synced across windows via IPC (Electron)

### UI Location
- **Settings Path:** Settings → Player Settings
- **Position:** Left column, after "Skip by Scrolling Over Video Player" toggle
- **Player Display:** Adjacent to the time display in Shaka player controls (bottom left area)

### Technical Implementation Details

#### CSS Selector Path
```
.ftVideoPlayer → .shaka-controls-container → .shaka-bottom-controls → .shaka-current-time → #adjusted-duration-display
```

#### Dependencies
- **Shaka Player:** Uses Shaka player's control panel structure
- **Vue 3 Composition API:** Uses reactive refs and computed properties
- **Vuex:** For state management
- **NeDB:** For persistence
- **Helper Functions:** `formatDurationAsTimestamp()` from `src/renderer/helpers/utils`

#### Event-Driven Updates
- Triggered by HTML5 video `timeupdate` event (fires during playback)
- Automatically updates approximately every 250ms during playback
- Removes/adds DOM element reactively based on setting state

#### Performance Considerations
- DOM query is cached using `let adjustedElement`
- Text content only updated when value changes
- Element removed from DOM when feature is disabled
- No display when playback rate is 1x (to avoid clutter)

---

## Code Comments Found
The setting appears in a section with Polish comments marking custom features:
```javascript
  // POCZĄTEK NOWEGO KODU - USTAWIENIA NAPISÓW
  // (Beginning of new code - subtitle settings)
  
  // KONIEC NOWEGO KODU
  // (End of new code)
```

This suggests the feature was added as a custom modification to the FreeTube codebase, likely by a Polish-speaking developer named "marek7400" (based on the version string "FreeTube-0.23.5-marek7400v3").

---

## Summary Statistics
- **Total Files:** 7 files
- **Locale Files:** 3 (pl.yaml, en-US.yaml, en-GB.yaml)
- **JavaScript Files:** 2 (settings.js, player-settings.js, ft-shaka-video-player.js)
- **Vue Components:** 2 (player-settings.vue, ft-shaka-video-player.vue)
- **Lines of Implementation Code:** ~48 lines (function + references)
- **Translation Keys:** 1 (`Settings.Player Settings.Show Adjusted Time`)
- **Store State Properties:** 1 (`showAdjustedTime`)
- **Auto-generated Store Functions:** 3 (getter, mutation, action)

---

## Related Features
The feature is implemented alongside other custom enhancements:
1. Custom subtitle settings (lines 152-167 in settings.js)
2. Custom progress bar settings (lines 170-182 in settings.js)
3. Screenshot functionality
4. Playback rate controls
5. Theater mode

All these features are accessible through the Player Settings section of the application.
