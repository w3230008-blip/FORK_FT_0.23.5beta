# Investigation Documentation Index

## Overview
This directory contains comprehensive documentation of the "Show adjusted time at current playback speed" feature investigation in the FreeTube_0_23_5beta codebase.

---

## Documentation Files

### 1. 📋 INVESTIGATION_SUMMARY.md
**Start here for an executive overview**

**Size:** 11 KB  
**Purpose:** High-level summary of the investigation  
**Contents:**
- Executive summary
- Total files found (7 files)
- Feature implementation overview
- Key findings
- Documentation deliverables index
- Usage statistics
- Recommendations

**Best for:** Project managers, stakeholders, or anyone wanting a quick overview

---

### 2. 📖 PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md
**Complete technical documentation**

**Size:** 12 KB  
**Purpose:** Detailed technical reference  
**Contents:**
- Feature description
- All file references with full context
- Line numbers for every occurrence
- Usage patterns (display, logic, binding)
- Architecture and data flow
- Technical implementation details
- Code comments found
- Summary statistics

**Best for:** Developers, maintainers, or anyone making changes to the feature

---

### 3. 🔍 QUICK_REFERENCE.md
**Fast lookup guide**

**Size:** 3.8 KB  
**Purpose:** Quick reference for common lookups  
**Contents:**
- File paths with line numbers (table format)
- Translation key reference
- Key functions list
- DOM element structure
- Display format examples
- Code patterns
- Search terms

**Best for:** Developers needing quick file/line number references

---

### 4. 📊 FEATURE_ARCHITECTURE_DIAGRAM.md
**Visual architecture documentation**

**Size:** 23 KB  
**Purpose:** Visual representation of feature architecture  
**Contents:**
- ASCII component interaction diagrams
- Data flow sequences (3 scenarios)
- File dependency tree
- Translation system flow
- Persistence layer diagram
- Visual display mockup with example
- Edge cases handling
- Performance optimizations

**Best for:** Understanding system architecture, onboarding new developers, planning modifications

---

## Quick Navigation

### By Role

**👨‍💼 Project Manager / Stakeholder**
1. Start with: `INVESTIGATION_SUMMARY.md`
2. Key sections: Executive Summary, Key Findings, Usage Statistics

**👨‍💻 Developer (New to Feature)**
1. Start with: `INVESTIGATION_SUMMARY.md` (overview)
2. Then read: `FEATURE_ARCHITECTURE_DIAGRAM.md` (understand architecture)
3. Reference: `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` (detailed implementation)
4. Keep handy: `QUICK_REFERENCE.md` (quick lookups)

**👨‍💻 Developer (Making Changes)**
1. Reference: `QUICK_REFERENCE.md` (find files quickly)
2. Check: `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` (understand current implementation)
3. Review: `FEATURE_ARCHITECTURE_DIAGRAM.md` (data flow impact)

**👨‍🏫 Code Reviewer**
1. Check: `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` (all references)
2. Verify: `FEATURE_ARCHITECTURE_DIAGRAM.md` (architecture compliance)

---

## Quick Facts

### Feature Identity
- **English Name:** "Show Adjusted Time at Current Playback Rate"
- **Polish Name:** "Pokaż dostosowany czas przy bieżącej prędkości odtwarzania"
- **Translation Key:** `Settings.Player Settings.Show Adjusted Time`
- **Store Key:** `showAdjustedTime`
- **DOM Element ID:** `#adjusted-duration-display`

### File Locations
```
Total: 7 files

Translations (3):
  static/locales/pl.yaml (Line 404)
  static/locales/en-US.yaml (Line 419)
  static/locales/en-GB.yaml (Line ~419)

Store (1):
  src/renderer/store/modules/settings.js (Line 184)

Settings UI (2):
  src/renderer/components/player-settings/player-settings.vue (Lines 43-48)
  src/renderer/components/player-settings/player-settings.js (Lines 174-176, 374)

Player (2):
  src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js (Lines 236, 867, 870-917)
  src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue (Line 24)
```

### Key Functions
- `getShowAdjustedTime()` - Vuex getter
- `setShowAdjustedTime(value)` - Vuex mutation
- `updateShowAdjustedTime(value)` - Vuex action
- `updateAdjustedTimeDisplay()` - Core implementation (lines 870-917)

---

## Search Terms

To find references in the codebase:
- `showAdjustedTime`
- `Show Adjusted Time`
- `adjustedTime`
- `adjusted-duration-display`
- `Pokaż dostosowany czas przy bieżącej prędkości odtwarzania`

---

## Investigation Metadata

- **Date:** 2024-11-01
- **Branch:** `chore/investigate-playback-speed-time-refs`
- **Codebase:** FreeTube_0_23_5beta (marek7400v3 custom build)
- **Project Path:** `/home/engine/project/FreeTube-0.23.5-marek7400v3`
- **Total Documentation:** 5 files, ~50 KB

---

## File Reading Order

### For Complete Understanding (Recommended)
1. `INDEX.md` (this file) - Get oriented
2. `INVESTIGATION_SUMMARY.md` - Understand the big picture
3. `FEATURE_ARCHITECTURE_DIAGRAM.md` - Visualize the system
4. `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` - Deep dive into details
5. `QUICK_REFERENCE.md` - Bookmark for quick access

### For Quick Task Completion
1. `QUICK_REFERENCE.md` - Find files and line numbers
2. Open relevant source files
3. Refer back to other docs as needed

---

## Example Use Cases

### "I need to modify the display format"
1. Check `QUICK_REFERENCE.md` → Find function: `updateAdjustedTimeDisplay()`
2. Open: `ft-shaka-video-player.js` lines 870-917
3. Review `FEATURE_ARCHITECTURE_DIAGRAM.md` → See display format section
4. Make changes
5. Check all occurrences in `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md`

### "I need to understand how it works"
1. Read `INVESTIGATION_SUMMARY.md` → "How the Feature Works" section
2. Review `FEATURE_ARCHITECTURE_DIAGRAM.md` → Data flow sequences
3. Check `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` → Technical details

### "I need to add a similar feature"
1. Study `FEATURE_ARCHITECTURE_DIAGRAM.md` → Component interaction flow
2. Review `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` → Implementation patterns
3. Follow the same architecture pattern

### "I need to fix a bug"
1. Use `QUICK_REFERENCE.md` → Find all file references
2. Check `PLAYBACK_SPEED_TIME_ADJUSTMENT_DOCUMENTATION.md` → Understand usage
3. Review `FEATURE_ARCHITECTURE_DIAGRAM.md` → Identify affected components

---

## Additional Resources

### In the Codebase
- Original README: `FreeTube-0.23.5-marek7400v3/README.md`
- Contributing Guide: `FreeTube-0.23.5-marek7400v3/CONTRIBUTING.md`

### Related Code Sections
- Custom Subtitle Settings (settings.js, lines 152-167)
- Custom Progress Bar Settings (settings.js, lines 170-182)
- Other Player Settings (player-settings.vue, entire file)

---

## Documentation Quality

All documentation files include:
- ✅ Comprehensive coverage of all references
- ✅ Line numbers for every occurrence
- ✅ Code context and examples
- ✅ Visual diagrams where helpful
- ✅ Clear explanations of usage
- ✅ Technical implementation details
- ✅ Edge cases and considerations
- ✅ Cross-references between docs

---

## Feedback & Updates

This documentation represents the state of the codebase as of 2024-11-01.

If you make changes to the feature:
- Update the relevant documentation files
- Keep line numbers current
- Add new sections as needed
- Update the architecture diagrams if data flow changes

---

## Contact

For questions about this investigation or documentation:
- Check the ticket: "Find playback speed time adjustment references"
- Review commit history on branch: `chore/investigate-playback-speed-time-refs`

---

*Happy coding! 🚀*
