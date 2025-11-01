# Quick Reference: Playback Speed Time Adjustment Feature

## Feature Name
- **English:** "Show Adjusted Time at Current Playback Rate"
- **Polish:** "Pokaż dostosowany czas przy bieżącej prędkości odtwarzania"

## Translation Key
```
Settings.Player Settings.Show Adjusted Time
```

## All File References

### 1. Translation Files (3 files)
```
static/locales/pl.yaml           Line 404
static/locales/en-US.yaml        Line 419
static/locales/en-GB.yaml        Line ~419
```

### 2. Store Module (1 file)
```
src/renderer/store/modules/settings.js
  Line 184:  State definition (showAdjustedTime: false)
```

### 3. Settings UI Component (2 files)
```
src/renderer/components/player-settings/player-settings.vue
  Lines 43-48:  Toggle switch UI element

src/renderer/components/player-settings/player-settings.js
  Line 174-176:  Computed property (showAdjustedTime getter)
  Line 374:      Mapped action (updateShowAdjustedTime)
```

### 4. Video Player Component (2 files)
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js
  Line 236:      Computed property declaration
  Line 867:      Function call in handleTimeupdate()
  Lines 870-917: Implementation function (updateAdjustedTimeDisplay)

src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue
  Line 24:       Event binding (@timeupdate handler)
```

## Key Functions

### Store Functions (Auto-generated)
- `getShowAdjustedTime()` - Getter
- `setShowAdjustedTime(value)` - Mutation
- `updateShowAdjustedTime(value)` - Action

### Player Functions (Manual)
- `updateAdjustedTimeDisplay()` - Core implementation at lines 870-917

## DOM Element Created
```html
<span id="adjusted-duration-display" 
      style="margin-left: 8px; color: #ffeb3b; font-size: [inherited]; align-self: center">
  (0:15 / 0:30 @2x)
</span>
```

## Display Format
```
({adjusted_current_time} / {adjusted_total_duration} @{playback_rate}x)
```

Example: `(1:30 / 5:00 @2x)`

## Key Technical Details

- **Default Value:** `false` (disabled by default)
- **Storage:** NeDB datastore in userData directory
- **DOM Parent:** `.shaka-current-time` container
- **Display Position:** After time display, bottom left of player
- **Display Color:** `#ffeb3b` (yellow)
- **Visibility Condition:** Only shows when playback rate ≠ 1x
- **Update Frequency:** Every video timeupdate event (~250ms during playback)

## Dependencies
- Shaka Player (for UI structure)
- Vue 3 Composition API (reactive/computed)
- Vuex (state management)
- NeDB (persistence)
- `formatDurationAsTimestamp()` helper function

## User Journey
1. Settings → Player Settings
2. Toggle "Show Adjusted Time" switch
3. Play a video and change playback speed (e.g., 1.5x or 2x)
4. See adjusted time display next to regular time counter
5. At 1x speed, display is hidden

## Code Pattern
```javascript
// Settings store
showAdjustedTime: false

// Component computed
const showAdjustedTime = computed(() => store.getters.getShowAdjustedTime)

// Update function
function updateAdjustedTimeDisplay() {
  if (!showAdjustedTime.value) {
    // Remove element
    return
  }
  // Calculate and display adjusted time
  const adjustedDuration = originalDuration / playbackRate
  const adjustedCurrent = currentTime / playbackRate
  element.textContent = `(${adjustedCurrent} / ${adjustedDuration} @${playbackRate}x)`
}
```

## Search Patterns Used
To find all references, search for:
- `showAdjustedTime`
- `Show Adjusted Time`
- `adjustedTime`
- `Pokaż dostosowany czas przy bieżącej prędkości odtwarzania`

## Related Settings
This feature is grouped with other player settings:
- Play Next Video
- Autoplay Playlists/Videos
- Turn on Subtitles by Default
- Scroll controls over video player
- Display Play Button
- Playback rate controls
- Screenshot functionality
