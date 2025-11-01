# Investigation Summary: Playback Speed Time Adjustment Feature

## Executive Summary

This investigation has successfully identified and documented all references to the "Show adjusted time at current playback speed" feature (Polish: "Pokaż dostosowany czas przy bieżącej prędkości odtwarzania") in the FreeTube_0_23_5beta codebase.

**Key Finding:** This is a custom feature added to FreeTube, likely by developer "marek7400" (based on version string), that displays the adjusted time when videos are played at speeds other than 1x.

---

## Investigation Results

### Total Files Found: 7

#### 1. Locale/Translation Files (3 files)
- `static/locales/pl.yaml` - Line 404
- `static/locales/en-US.yaml` - Line 419  
- `static/locales/en-GB.yaml` - Line ~419

#### 2. State Management (1 file)
- `src/renderer/store/modules/settings.js` - Line 184

#### 3. Settings UI Components (2 files)
- `src/renderer/components/player-settings/player-settings.vue` - Lines 43-48
- `src/renderer/components/player-settings/player-settings.js` - Lines 174-176, 374

#### 4. Video Player Components (2 files)
- `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js` - Lines 236, 867, 870-917
- `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue` - Line 24

---

## Feature Implementation Details

### Setting Storage
- **Store Key:** `showAdjustedTime`
- **Type:** Boolean
- **Default Value:** `false`
- **Location:** Vuex state → NeDB datastore (userData directory)

### User Interface
- **Settings Location:** Settings → Player Settings → Left column
- **UI Element:** Toggle switch (`ft-toggle-switch`)
- **Label Key:** `Settings.Player Settings.Show Adjusted Time`

### Display Implementation
- **DOM Element:** `<span id="adjusted-duration-display">`
- **Insertion Point:** After `.shaka-current-time` in Shaka player controls
- **Display Format:** `({adjusted_current} / {adjusted_total} @{rate}x)`
- **Example:** `(1:30 / 5:00 @2x)` when video is 3 minutes at 2x speed
- **Color:** `#ffeb3b` (yellow) for visibility
- **Visibility:** Only shown when playback rate ≠ 1x

### Core Logic
Located in `ft-shaka-video-player.js`, function `updateAdjustedTimeDisplay()` (lines 870-917):

```javascript
// Calculates adjusted time by dividing by playback rate
adjustedDuration = originalDuration / playbackRate
adjustedCurrent = currentTime / playbackRate

// Formats and displays
textToShow = `(${formattedAdjustedCurrent} / ${formattedAdjustedTotal} @${playbackRate}x)`
```

### Update Mechanism
- Triggered by HTML5 video `timeupdate` event
- Frequency: Approximately every 250ms during playback
- Reactive to setting changes via Vue 3 computed property

---

## Documentation Deliverables

This investigation has produced **4 comprehensive documentation files**:

### 1. PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md (12 KB)
**Complete technical documentation** including:
- Feature description and overview
- All file references with line numbers and context
- Usage patterns (display, logic, binding)
- Architecture and data flow
- Technical implementation details
- Dependencies and event handling
- Performance considerations
- Summary statistics

### 2. QUICK_REFERENCE.md (3.8 KB)
**Quick lookup guide** with:
- File paths and line numbers table
- Key function names
- DOM element structure
- Display format examples
- Technical details summary
- Code patterns
- Search terms for finding references

### 3. FEATURE_ARCHITECTURE_DIAGRAM.md (23 KB)
**Visual architecture documentation** featuring:
- ASCII component interaction diagrams
- Data flow sequences for all scenarios
- File dependency tree
- Translation system flow
- Persistence layer diagram
- Visual display mockup
- Edge cases and optimizations

### 4. INVESTIGATION_SUMMARY.md (This file)
**Executive summary** providing:
- High-level overview
- Quick statistics
- Key findings
- Documentation index
- Usage guide

---

## Key Findings

### 1. Custom Feature Implementation
This is a **custom modification** to FreeTube, evidenced by:
- Polish comments in the code (`// POCZĄTEK NOWEGO KODU`)
- Polish translation as the primary language reference
- Version string indicating custom build: "FreeTube-0.23.5-marek7400v3"
- Not part of standard FreeTube feature set

### 2. Well-Integrated Architecture
Despite being custom, the feature is properly integrated:
- Uses standard Vuex state management pattern
- Follows FreeTube's settings module conventions
- Leverages auto-generated getters/mutations/actions
- Properly persisted via NeDB
- Synced across windows via IPC

### 3. Implementation Quality
The implementation shows good practices:
- **Reactive:** Uses Vue 3 Composition API properly
- **Performant:** Caches DOM queries, conditional updates
- **Clean:** Removes element when disabled
- **User-friendly:** Only displays when relevant (speed ≠ 1x)
- **Visible:** Yellow color differentiates from regular time
- **Accessible:** Inherits font size from parent

### 4. Companion Features
Implemented alongside other custom enhancements:
- Custom subtitle settings and display
- Custom progress bar with chapter markers
- All managed in the same settings module section

---

## How the Feature Works

### User Perspective
1. Enable "Show Adjusted Time" in Player Settings
2. Play any video and change playback speed (e.g., 1.5x or 2x)
3. See yellow text next to regular time showing adjusted duration
4. At 2x speed, a 10-minute video shows as 5 minutes adjusted time
5. Useful for knowing actual time commitment at current speed

### Technical Perspective
```
User Toggle → Vuex Action → NeDB Save → State Update
                                             ↓
                                    Computed Property
                                             ↓
Video Timeupdate Event → handleTimeupdate() → updateAdjustedTimeDisplay()
                                             ↓
                                    Calculate & Display
                                    (duration / playbackRate)
```

---

## Usage Statistics

### Lines of Code
- **Total Implementation:** ~48 lines (core function + references)
- **Store State:** 1 line
- **UI Components:** ~10 lines
- **Locale Entries:** 3 lines (one per language)

### Auto-generated Code
- **Getters:** 1 (`getShowAdjustedTime`)
- **Mutations:** 1 (`setShowAdjustedTime`)
- **Actions:** 1 (`updateShowAdjustedTime`)

### Translation Coverage
- **Languages:** 3 (Polish, English US, English GB)
- **Translation Key:** 1 (`Settings.Player Settings.Show Adjusted Time`)

---

## Search Terms Used

To replicate this investigation, search for:
1. `Pokaż dostosowany czas przy bieżącej prędkości odtwarzania` (Polish)
2. `Show Adjusted Time` (English)
3. `showAdjustedTime` (camelCase variable)
4. `adjustedTime` (partial match)
5. `adjusted-duration-display` (DOM element ID)

---

## Related Features in Settings Module

The feature appears in a section with other custom enhancements (settings.js, lines 152-184):

```javascript
// Custom Subtitle Settings (lines 152-167)
customSubtitleEnabled
customSubtitleNormalColor
customSubtitleNormalFontSize
[... 14 subtitle-related settings ...]

// Custom Progress Bar Settings (lines 170-182)
customProgressBarEnabled
customProgressBarProgressColor
customProgressBarOpacity
[... 11 progress bar settings ...]

// Adjusted Time Feature (line 184)
showAdjustedTime: false
```

---

## Dependencies

### External Libraries
- **Shaka Player:** Provides video player UI structure
- **Vue 3:** Composition API (reactive, computed, ref)
- **Vuex:** State management
- **vue-i18n:** Internationalization
- **NeDB:** Local database persistence

### Internal Utilities
- `formatDurationAsTimestamp()` from `src/renderer/helpers/utils`
- `DBSettingHandlers` from `src/datastores/handlers/index`

### UI Components
- `ft-toggle-switch` - Settings toggle component
- `ft-settings-section` - Settings section wrapper

---

## Potential Use Cases

1. **Time Management:** Users can see actual time commitment when watching sped-up videos
2. **Productivity:** Helps plan video consumption at higher speeds
3. **Learning:** Students watching lectures at 1.5x-2x can gauge actual time needed
4. **Podcast Playback:** Useful for audio content at variable speeds
5. **Content Review:** Quickly assess remaining time at review speeds

---

## Technical Considerations

### Browser Compatibility
- Uses standard HTML5 video API
- No browser-specific code
- Should work in Electron (Chromium-based)

### Performance Impact
- **Minimal:** Only updates during playback
- **Efficient:** DOM query caching
- **Conditional:** Removes element when disabled
- **Optimized:** Text comparison before update

### Edge Cases Handled
✅ Playback rate = 1x (display cleared)  
✅ Feature disabled (element removed)  
✅ Invalid duration (display cleared)  
✅ Element doesn't exist (created dynamically)  
✅ Live streams (handled by duration check)

---

## Recommendations for Future Development

1. **Enhancement Ideas:**
   - Add setting to customize display format
   - Option to show only adjusted time or only original
   - Configurable color for better theme integration
   - Show adjusted time in chapter markers

2. **Code Improvements:**
   - Consider using Vue template instead of DOM manipulation
   - Add unit tests for calculation logic
   - Extract magic values to constants (colors, margins)
   - Add JSDoc comments to implementation function

3. **Documentation:**
   - Add feature description to main README
   - Include screenshots in user documentation
   - Create tutorial for similar feature additions
   - Document the calculation formula clearly

---

## Conclusion

This investigation has successfully:

✅ Found all 7 files referencing the feature  
✅ Documented every occurrence with line numbers and context  
✅ Explained how the feature is used (display, logic, binding)  
✅ Created comprehensive technical documentation  
✅ Provided visual architecture diagrams  
✅ Included quick reference guide  
✅ Identified it as a custom modification by "marek7400"  
✅ Documented all dependencies and related features  

The feature is well-implemented, properly integrated, and follows FreeTube's architectural patterns. All documentation is ready for development team review or future maintenance work.

---

## Files Included in This Investigation

```
/home/engine/project/
├── INVESTIGATION_SUMMARY.md (this file)
├── PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md
├── QUICK_REFERENCE.md
└── FEATURE_ARCHITECTURE_DIAGRAM.md
```

**Total Documentation:** 4 files, ~40 KB of comprehensive documentation

---

*Investigation completed: 2024-11-01*  
*Branch: chore/investigate-playback-speed-time-refs*  
*Codebase: FreeTube_0_23_5beta (marek7400v3 custom build)*
