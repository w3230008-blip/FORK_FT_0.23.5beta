# Raport: Funkcjonalność wgrywania własnych napisów w FreeTube 0.23.5

## Streszczenie
FreeTube 0.23.5 zawiera pełną implementację funkcjonalności wgrywania własnych napisów (custom captions/subtitles) do odtwarzacza wideo. System obsługuje formaty VTT i SRT, z automatyczną konwersją SRT do VTT.

---

## 1. Lista plików z odnalezionymi odwołaniami

### Komponenty Vue

#### 1.1 CustomSubtitleButton (Player Control)
- **Ścieżka**: `src/renderer/components/ft-shaka-video-player/player-components/CustomSubtitleButton.js`
- **Rola**: Przycisk w kontrolkach odtwarzacza Shaka Player
- **Funkcjonalność**: Menu z opcjami "Upload Subtitles" i "Settings"

#### 1.2 FtCustomSubtitleDisplay (Subtitle Display)
- **Ścieżka**: `src/renderer/components/FtCustomSubtitleDisplay/`
  - `FtCustomSubtitleDisplay.vue` - template
  - `FtCustomSubtitleDisplay.js` - logika (63 linie)
  - `FtCustomSubtitleDisplay.css` - style (23 linie)
- **Rola**: Komponent renderujący napisy na ekranie
- **Funkcjonalność**: Dynamiczne pozycjonowanie, responsywne style dla trybu normalnego i fullscreen

#### 1.3 CustomSubtitleSettings (Settings UI)
- **Ścieżka**: `src/renderer/components/CustomSubtitleSettings/`
  - `CustomSubtitleSettings.vue` - template (127 linii)
  - `CustomSubtitleSettings.js` - logika (95 linii)
  - `CustomSubtitleSettings.css` - style (76 linii)
- **Rola**: Panel ustawień napisów
- **Funkcjonalność**: Konfiguracja kolorów, rozmiarów, pozycji dla trybu normalnego i fullscreen

#### 1.4 FtShakaVideoPlayer (Main Player)
- **Ścieżka**: `src/renderer/components/ft-shaka-video-player/`
  - `ft-shaka-video-player.vue` - template (154 linie)
  - `ft-shaka-video-player.js` - główna logika (1856 linii)
  - `ft-shaka-video-player.css` - style
- **Rola**: Główny komponent odtwarzacza
- **Funkcjonalność**: Zarządzanie logiką uploadu, parsowania i wyświetlania napisów

#### 1.5 FtFloatingWindow (Settings Window)
- **Ścieżka**: `src/renderer/components/FtFloatingWindow/`
  - `FtFloatingWindow.vue` - template (110 linii)
  - `FtFloatingWindow.css` - style
- **Rola**: Okno modalne do ustawień napisów
- **Funkcjonalność**: Draggable floating window

### Vuex Store

#### 1.6 Settings Module
- **Ścieżka**: `src/renderer/store/modules/settings.js` (716 linii)
- **Linie 153-167**: Definicje stanów dla custom subtitles
- **Funkcjonalność**: 
  - Auto-generowane gettery dla każdego ustawienia
  - Auto-generowane actions (update*)
  - Persystencja ustawień w NeDB

### Funkcje pomocnicze

#### 1.7 Utils (File Picker)
- **Ścieżka**: `src/renderer/helpers/utils.js` (1056 linii)
- **Linia 255**: `readFileWithPicker()` - funkcja otwierająca dialog wyboru pliku
- **Funkcjonalność**: Obsługa File System Access API (Chromium/Electron) z fallbackiem na `<input type="file">`

#### 1.8 Colors (Hex to RGBA)
- **Ścieżka**: `src/renderer/helpers/colors.js` (115 linii)
- **Linia 103**: `hexToRgba()` - konwersja kolorów hex na rgba
- **Funkcjonalność**: Konwersja kolorów z uwzględnieniem przezroczystości

### Pliki lokalizacji

#### 1.9 Tłumaczenia
- `static/locales/en-US.yaml` - język angielski
- `static/locales/en-GB.yaml` - język brytyjski
- `static/locales/pl.yaml` - język polski

---

## 2. Konkretne nazwy funkcji/metod/komponentów

### Funkcje główne (ft-shaka-video-player.js)

#### 2.1 `uploadSubtitles()` (linia 550-573)
```javascript
async function uploadSubtitles()
```
- **Parametry**: brak
- **Zwraca**: `Promise<void>`
- **Opis**: Główna funkcja obsługująca upload napisów
- **Flow**:
  1. Wywołuje `readFileWithPicker()` z typami MIME dla VTT i SRT
  2. Sprawdza rozszerzenie pliku
  3. Konwertuje SRT do VTT jeśli potrzeba
  4. Parsuje zawartość do cue objects
  5. Przechowuje w `customCues.value`
  6. Wyświetla toast notification
  7. Wyłącza natywne napisy Shaka Player

#### 2.2 `convertSrtToVtt(srt)` (linia 507-517)
```javascript
function convertSrtToVtt(srt)
```
- **Parametry**: `srt` (string) - zawartość pliku SRT
- **Zwraca**: `string` - skonwertowana zawartość VTT
- **Opis**: Konwertuje format SRT na WebVTT
- **Operacje**:
  - Zamienia przecinki na kropki w timestampach
  - Dodaje nagłówek "WEBVTT"
  - Usuwa numerację linii
  - Normalizuje puste linie

#### 2.3 `parseVttCues(vttContent)` (linia 519-548)
```javascript
function parseVttCues(vttContent)
```
- **Parametry**: `vttContent` (string) - zawartość VTT
- **Zwraca**: `Array<{startTime: number, endTime: number, text: string}>`
- **Opis**: Parsuje VTT do tablicy obiektów cue
- **Zawiera**: wewnętrzną funkcję `toSeconds()` do konwersji timestampów

#### 2.4 `handleTimeupdate()` (linia 852-868)
```javascript
function handleTimeupdate()
```
- **Opis**: Event handler wywoływany przy każdej aktualizacji czasu wideo
- **Operacje** (linie 863-866):
  - Sprawdza czy są custom cues
  - Znajduje aktywny cue dla bieżącego czasu
  - Aktualizuje `currentCustomSubtitleText.value`

#### 2.5 `onTextChanged()` (linia 839-850)
```javascript
function onTextChanged()
```
- **Opis**: Handler dla zmiany tekstów napisów
- **Obsługuje**: natywne napisy Shaka Player gdy custom cues są puste

#### 2.6 `registerCustomSubtitleButton()` (linia 720-733)
```javascript
function registerCustomSubtitleButton()
```
- **Opis**: Rejestruje custom subtitle button w Shaka Player UI
- **Event listeners**:
  - `'ft-upload-subtitle'` → wywołuje `uploadSubtitles()`
  - `'ft-toggle-subtitle-settings'` → toggles `showSubtitleSettings`

### Metody CustomSubtitleButton (CustomSubtitleButton.js)

#### 2.7 Konstruktor (linia 10-26)
```javascript
constructor(events, parent, controls)
```
- Dziedziczy po `shaka.ui.SettingsMenu`
- Dodaje klasy CSS
- Nasłuchuje eventu 'localeChanged'
- Wywołuje `addUploadButton_()` i `addSettingsButton_()`

#### 2.8 `addUploadButton_()` (linia 28-38)
- Tworzy przycisk "Upload Subtitles"
- Dispatchuje event `'ft-upload-subtitle'`

#### 2.9 `addSettingsButton_()` (linia 40-50)
- Tworzy przycisk "Settings"
- Dispatchuje event `'ft-toggle-subtitle-settings'`

#### 2.10 `updateLocalisedStrings_()` (linia 53-62)
- Aktualizuje tłumaczenia UI elementów

### Metody CustomSubtitleSettings (CustomSubtitleSettings.js)

#### 2.11 `updateSetting(key, value)` (linia 85-93)
```javascript
updateSetting(key, value)
```
- **Parametry**: 
  - `key` (string) - nazwa ustawienia
  - `value` (any) - nowa wartość
- **Opis**: Dynamicznie wywołuje odpowiedni Vuex action
- **Algorytm**: konstruuje nazwę action `updateCustomSubtitle{Mode}{Key}`

### Metody FtCustomSubtitleDisplay (FtCustomSubtitleDisplay.js)

#### 2.12 Computed Properties
- `enabled` (linia 22) - czy custom subtitles są włączone
- `currentModeSettings` (linia 24-34) - pobiera ustawienia dla aktualnego trybu
- `containerStyle` (linia 36-46) - style kontenera napisów
- `textStyle` (linia 48-55) - style tekstu napisów

### Utils (utils.js)

#### 2.13 `readFileWithPicker()` (linia 255-330)
```javascript
export async function readFileWithPicker(
  fileTypeDescription,
  acceptedTypes,
  rememberDirectoryId,
  startInDirectory
)
```
- **Parametry**:
  - `fileTypeDescription` (string) - opis typu pliku
  - `acceptedTypes` (object) - mapa MIME types do rozszerzeń
  - `rememberDirectoryId` (string) - ID do zapamiętania lokalizacji
  - `startInDirectory` (string) - początkowy folder
- **Zwraca**: `Promise<{content: string, filename: string} | null>`
- **Opis**: Otwiera dialog wyboru pliku z wykorzystaniem File System Access API
- **Fallback**: Używa `<input type="file">` jeśli API nie jest dostępne

### Colors (colors.js)

#### 2.14 `hexToRgba(hex, opacity)` (linia 103-114)
```javascript
export function hexToRgba(hex, opacity)
```
- **Parametry**:
  - `hex` (string) - kolor w formacie hex (#RRGGBB lub #RGB)
  - `opacity` (number) - przezroczystość 0-1
- **Zwraca**: `string` - kolor w formacie rgba()
- **Wyjątki**: Rzuca `Error('Bad Hex')` dla nieprawidłowego formatu

---

## 3. Ścieżki do istotnych fragmentów kodu

### Rejestracja komponentu w player UI
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js
Linie 720-733: registerCustomSubtitleButton()
Linie 438, 442: Dodanie 'ft_custom_subtitle' do UI config
Linie 731-732: Rejestracja w Shaka Controls i OverflowMenu
```

### Logika uploadu
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js
Linie 550-573: uploadSubtitles() - główna funkcja
Linie 507-517: convertSrtToVtt() - konwersja SRT→VTT
Linie 519-548: parseVttCues() - parsing VTT
Linia 562: customCues.value = parseVttCues(content)
Linia 552: const file = await readFileWithPicker(...)
```

### Wyświetlanie napisów
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js
Linie 852-868: handleTimeupdate() - sprawdza aktywny cue
Linie 863-866: Logika wyszukiwania aktywnego cue
Linia 173: const currentCustomSubtitleText = ref('')

src/renderer/components/FtCustomSubtitleDisplay/FtCustomSubtitleDisplay.vue
Linie 1-17: Template komponentu
Linia 11: {{ text }} - wyświetlanie tekstu

src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue
Linie 56-60: Integracja FtCustomSubtitleDisplay
```

### Ustawienia w Vuex
```
src/renderer/store/modules/settings.js
Linie 153-167: Definicje stanów custom subtitle
Linia 153: customSubtitleEnabled: true
Linie 154-160: Ustawienia trybu normalnego (kolor, rozmiar, bg, opacity, pozycja, offset, szerokość)
Linie 161-167: Ustawienia trybu fullscreen
```

### Panel ustawień
```
src/renderer/components/CustomSubtitleSettings/CustomSubtitleSettings.vue
Linie 1-127: Template ustawień
Linie 3-23: Mode selector (Normal/Fullscreen)
Linie 25-121: Settings grid z kontrolkami
Linie 73-94: Vertical Position control (slider + input)

src/renderer/components/CustomSubtitleSettings/CustomSubtitleSettings.js
Linie 21-63: Computed properties (currentSettings)
Linie 85-93: updateSetting() - metoda aktualizacji
```

### Floating window
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.vue
Linie 46-54: FtFloatingWindow z CustomSubtitleSettings
Linia 47: showSubtitleSettings binding
Linia 53: <custom-subtitle-settings />

src/renderer/components/FtFloatingWindow/FtFloatingWindow.vue
Linie 1-110: Implementacja floating window
Linie 70-89: Drag & drop logic
Linie 53-62: centerWindow() - centrowanie
```

### File picker
```
src/renderer/helpers/utils.js
Linie 255-330: readFileWithPicker()
Linie 267-289: File System Access API (Chromium/Electron)
Linie 290-324: Fallback na <input type="file">
Linie 326-329: Zwrot {content, filename}
```

### Hover & fullscreen detection
```
src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js
Linia 174: const isControlsHovering = ref(false)
Linia 175: const isPlayerFullscreen = ref(false)
Linia 1548: isPlayerFullscreen.value = !!document.fullscreenElement
Linie 1566-1567: Event listeners na mouseenter/mouseleave
```

---

## 4. Opis implementacji - Flow danych, eventy, API

### 4.1 Architektura ogólna

System custom subtitles składa się z kilku warstw:

1. **UI Layer** (Shaka Player Controls)
   - CustomSubtitleButton - przycisk w kontrolkach playera
   
2. **Logic Layer** (ft-shaka-video-player.js)
   - Upload handling
   - Format conversion
   - Parsing
   - Cue management
   
3. **Display Layer** (FtCustomSubtitleDisplay)
   - Rendering napisów
   - Styling based on mode
   - Position management
   
4. **Settings Layer** (CustomSubtitleSettings + Vuex)
   - Configuration UI
   - State persistence
   
5. **Utility Layer** (utils.js, colors.js)
   - File system access
   - Color conversion

### 4.2 Flow uploadu napisów

#### Krok 1: User interaction
```
User → CustomSubtitleButton (click) → Menu pojawia się
User → "Upload Subtitles" (click) → Event: 'ft-upload-subtitle'
```

#### Krok 2: Event handling
```javascript
// ft-shaka-video-player.js, linia 721
events.addEventListener('ft-upload-subtitle', () => uploadSubtitles())
```

#### Krok 3: File picker
```javascript
// linia 552
const file = await readFileWithPicker(
  'Subtitle File',                                     // opis
  { 'text/vtt': ['.vtt'], 'application/x-subrip': ['.srt'] },  // typy
  'subtitle-upload'                                    // ID
);
```

**File System Access API (Chromium/Electron)**:
```javascript
// utils.js, linia 270
const [handle] = await window.showOpenFilePicker({
  excludeAcceptAllOption: true,
  multiple: false,
  id: rememberDirectoryId,     // zapamiętanie lokalizacji
  types: [{
    description: fileTypeDescription,
    accept: acceptedTypes       // {'text/vtt': ['.vtt'], ...}
  }],
})
```

**Fallback (inne przeglądarki)**:
```javascript
// utils.js, linie 292-317
const fileInput = document.createElement('input')
fileInput.setAttribute('type', 'file')
fileInput.setAttribute('accept', '.vtt,.srt')
fileInput.click()
```

#### Krok 4: File reading & conversion
```javascript
// linia 555
let content = file.content;
const fileExtension = file.filename.split('.').pop().toLowerCase();

// linie 558-560
if (fileExtension === 'srt') {
  content = convertSrtToVtt(content);
}
```

**Konwersja SRT→VTT**:
```javascript
// Linia 509: zamiana przecinków na kropki w timestampach
vtt = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

// Linia 511: dodanie nagłówka
vtt = "WEBVTT\n\n" + vtt;

// Linia 513: usunięcie numeracji
vtt = vtt.replace(/^\d+\s*$/gm, '');

// Linia 515: normalizacja pustych linii
vtt = vtt.replace(/\n\n+/g, '\n\n');
```

#### Krok 5: Parsing VTT
```javascript
// linia 562
customCues.value = parseVttCues(content);
```

**Format parsed cues**:
```javascript
{
  startTime: 123.456,    // w sekundach
  endTime: 127.890,      // w sekundach
  text: "Hello world"    // tekst napisu
}
```

**Parsing logic** (parseVttCues):
```javascript
// 1. Split na bloki (linia 520)
const cueBlocks = vttContent.split('\n\n').slice(1);

// 2. Dla każdego bloku:
const lines = block.split('\n');

// 3. Extract timestamp (linia 538)
const timeMatch = lines[0].match(
  /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/
);

// 4. Extract text (linia 541)
const text = lines.slice(1).join(' ').replace(/(\r\n|\n|\r)/gm, ' ');

// 5. Convert to seconds (toSeconds function, linie 521-533)
```

#### Krok 6: Disable native subtitles
```javascript
// linie 566-568
if (player.isTextTrackVisible()) {
  await player.setTextTrackVisibility(false);
}
```

#### Krok 7: Toast notification
```javascript
// linia 563
showToast(t('Video.Player.Subtitles loaded successfully'));
```

### 4.3 Flow wyświetlania napisów

#### Monitoring czasu wideo
```javascript
// ft-shaka-video-player.vue, linia 24
@timeupdate="handleTimeupdate"

// ft-shaka-video-player.js, linia 852
function handleTimeupdate() {
  const videoCurrentTime = video_.currentTime;
  
  // linie 863-866
  if (customCues.value.length > 0) {
    const activeCue = customCues.value.find(
      cue => videoCurrentTime >= cue.startTime && videoCurrentTime <= cue.endTime
    );
    currentCustomSubtitleText.value = activeCue ? activeCue.text : '';
  }
}
```

#### Reactive flow do display component
```
currentCustomSubtitleText (ref) 
  ↓ (passed as prop)
FtCustomSubtitleDisplay.vue (linia 57)
  :text="currentCustomSubtitleText"
  ↓
FtCustomSubtitleDisplay template (linia 11)
  {{ text }}
```

#### Conditional rendering
```javascript
// FtCustomSubtitleDisplay.vue, linia 3
v-if="enabled"    // z Vuex: getCustomSubtitleEnabled

// FtCustomSubtitleDisplay.js, linia 22
const enabled = computed(() => store.getters.getCustomSubtitleEnabled)
```

#### Dynamic styling
```javascript
// FtCustomSubtitleDisplay.js

// linie 24-34: Wybór trybu (normal/fullscreen)
const currentModeSettings = computed(() => {
  const mode = props.isFullscreen ? 'fullscreen' : 'normal'
  return {
    color: store.getters[`getCustomSubtitle${Mode}Color`],
    fontSize: store.getters[`getCustomSubtitle${Mode}FontSize`],
    // ... etc
  }
})

// linie 36-46: Container style (pozycja, szerokość, opacity)
const containerStyle = computed(() => {
  const controlsHeight = 65
  const bottomPosition = props.isHoveringControls 
    ? `${controlsHeight}px` 
    : `${settings.vPosition}px`
  return {
    bottom: bottomPosition,
    width: `${settings.containerWidth}%`,
    opacity: props.text ? '1' : '0'
  }
})

// linie 48-55: Text style (kolor, rozmiar, tło)
const textStyle = computed(() => {
  return {
    color: settings.color,
    fontSize: `${settings.fontSize}px`,
    backgroundColor: hexToRgba(settings.bgColor, settings.bgOpacity)
  }
})
```

### 4.4 Settings management flow

#### Opening settings
```
User → CustomSubtitleButton (click) → Menu
User → "Settings" (click) → Event: 'ft-toggle-subtitle-settings'
  ↓
showSubtitleSettings.value = !showSubtitleSettings.value  (linia 723)
  ↓
FtFloatingWindow appears (v-if="showSubtitleSettings")
```

#### Settings UI structure
```
FtFloatingWindow (draggable overlay)
  └─ CustomSubtitleSettings
      ├─ Mode Selector (Normal/Fullscreen radio)
      └─ Settings Grid
          ├─ Font Color (color input)
          ├─ Font Size (ft-input number)
          ├─ Background Color (color input)
          ├─ Background Opacity (ft-slider 0-1)
          ├─ Vertical Position (ft-slider + ft-input, 0-1200px)
          ├─ Container Width (ft-slider 20-100%)
          └─ Time Offset (ft-input ms)
```

#### Updating a setting
```javascript
// CustomSubtitleSettings.vue, linia 35
@input="updateSetting('color', $event.target.value)"
  ↓
// CustomSubtitleSettings.js, linie 85-93
updateSetting(key, value) {
  // Construct action name dynamically
  const modeCapitalized = 'Normal' | 'Fullscreen'
  const keyCapitalized = 'Color' | 'FontSize' | ...
  const actionName = `updateCustomSubtitle${modeCapitalized}${keyCapitalized}`
  
  // Call Vuex action
  this[actionName](value)  // e.g., updateCustomSubtitleNormalColor('#FFFFFF')
}
```

#### Vuex flow
```
Action: updateCustomSubtitleNormalColor(value)
  ↓ (auto-generated by settings.js)
1. Save to NeDB database
  await DBSettingHandlers.setters.customSubtitleNormalColor(value)
  ↓
2. Commit mutation
  commit('setCustomSubtitleNormalColor', value)
  ↓
3. Update state
  state.customSubtitleNormalColor = value
  ↓
4. Getter updates
  getCustomSubtitleNormalColor → returns new value
  ↓
5. Component reactively updates
  FtCustomSubtitleDisplay re-renders with new style
```

### 4.5 Event system

#### Custom events (EventTarget)
```javascript
// ft-shaka-video-player.js, linia 181
const events = new EventTarget()

// Event registration (linie 721-724)
events.addEventListener('ft-upload-subtitle', () => uploadSubtitles())
events.addEventListener('ft-toggle-subtitle-settings', () => {
  showSubtitleSettings.value = !showSubtitleSettings.value
})

// Event dispatching (CustomSubtitleButton.js)
// linia 31
this.events_.dispatchEvent(new CustomEvent('ft-upload-subtitle'))
// linia 43
this.events_.dispatchEvent(new CustomEvent('ft-toggle-subtitle-settings'))
```

#### DOM events
```javascript
// ft-shaka-video-player.vue, linie 19-25
<video
  @play="handlePlay"
  @pause="handlePause"
  @ended="handleEnded"
  @canplay="handleCanPlay"
  @volumechange="updateVolume"
  @timeupdate="handleTimeupdate"   // ← ważne dla custom subtitles
/>
```

#### Locale changed event
```javascript
// CustomSubtitleButton.js, linie 19-21
this.eventManager.listen(events, 'localeChanged', () => {
  this.updateLocalisedStrings_()
})

// ft-shaka-video-player.js, linia 784
events.dispatchEvent(new CustomEvent('localeChanged'))
```

### 4.6 Integration z Shaka Player

#### Custom UI factory pattern
```javascript
// ft-shaka-video-player.js, linie 726-732
class CustomSubtitleButtonFactory {
  create(rootElement, controls) {
    return new CustomSubtitleButton(events, rootElement, controls)
  }
}
shakaControls.registerElement('ft_custom_subtitle', new CustomSubtitleButtonFactory())
shakaOverflowMenu.registerElement('ft_custom_subtitle', new CustomSubtitleButtonFactory())
```

#### UI configuration
```javascript
// linie 438, 442
if (useOverFlowMenu.value) {
  uiConfig.overflowMenuButtons = [
    ..., 'captions', 'ft_custom_subtitle', ...
  ]
} else {
  uiConfig.controlPanelElements.push(
    ..., 'captions', 'ft_custom_subtitle', ...
  )
}
```

#### Native vs Custom subtitles
```javascript
// Disable native when custom loaded (linie 566-568)
if (player.isTextTrackVisible()) {
  await player.setTextTrackVisibility(false);
}

// Use native when no custom cues (linie 840-849)
if (customCues.value.length === 0 && player) {
  const textTracks = player.getTextTracks();
  const activeTrack = textTracks.find(track => track.active);
  if (activeTrack && player.isTextTrackVisible()) {
    const activeCue = activeTrack.cues?.find(cue => cue.isDisplayed);
    currentCustomSubtitleText.value = activeCue ? activeCue.text : '';
  }
}
```

### 4.7 Time offset (niewykorzystane w bieżącej implementacji)

**Uwaga**: Mimo że ustawienie `timeOffset` jest dostępne w UI i store, nie jest aktualnie wykorzystywane w logice wyświetlania napisów.

**Potencjalne użycie**:
```javascript
// Przykład zastosowania (NIE JEST W KODZIE):
const adjustedTime = videoCurrentTime + (settings.timeOffset / 1000);
const activeCue = customCues.value.find(
  cue => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
);
```

---

## 5. Formaty plików napisów obsługiwane

### 5.1 VTT (WebVTT) - natywny format

**MIME type**: `text/vtt`  
**Rozszerzenie**: `.vtt`  
**Obsługa**: Bezpośrednie parsowanie, bez konwersji

**Format VTT**:
```
WEBVTT

00:00:01.000 --> 00:00:04.000
Hello, this is the first subtitle

00:00:05.000 --> 00:00:08.000
And this is the second one
```

**Parsing** (linie 519-548):
- Split po `\n\n` na bloki cue
- Regex dla timestamp: `/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/`
- Obsługa formatów: `HH:MM:SS.mmm` i `MM:SS.mmm`
- Konwersja do sekund (dziesiętnych)
- Merge linii tekstu spacjami

### 5.2 SRT (SubRip) - z automatyczną konwersją

**MIME type**: `application/x-subrip`  
**Rozszerzenie**: `.srt`  
**Obsługa**: Konwersja do VTT, następnie parsowanie

**Format SRT**:
```
1
00:00:01,000 --> 00:00:04,000
Hello, this is the first subtitle

2
00:00:05,000 --> 00:00:08,000
And this is the second one
```

**Konwersja SRT→VTT** (linie 507-517):

1. **Zamiana przecinków na kropki** (linia 509):
   ```javascript
   vtt = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
   ```
   `00:00:01,000` → `00:00:01.000`

2. **Dodanie nagłówka WEBVTT** (linia 511):
   ```javascript
   vtt = "WEBVTT\n\n" + vtt;
   ```

3. **Usunięcie numeracji** (linia 513):
   ```javascript
   vtt = vtt.replace(/^\d+\s*$/gm, '');
   ```
   Usuwa linie zawierające tylko cyfry (numery cue)

4. **Normalizacja pustych linii** (linia 515):
   ```javascript
   vtt = vtt.replace(/\n\n+/g, '\n\n');
   ```

### 5.3 Formaty NIE obsługiwane

Następujące formaty napisów NIE są wspierane:
- **SSA/ASS** (SubStation Alpha) - zaawansowane style
- **TTML** (Timed Text Markup Language) - XML-based
- **SBV** (SubViewer) - YouTube format
- **LRC** (Lyrics) - format dla karaoke
- **SMI/SAMI** (Synchronized Accessible Media Interchange)

**Workaround**: Użytkownicy muszą najpierw skonwertować te formaty do VTT lub SRT za pomocą zewnętrznych narzędzi.

### 5.4 Ograniczenia parsera

**VTT features NIE obsługiwane**:
- Cue settings (position, alignment, size)
- Styling tags (`<c>`, `<b>`, `<i>`, `<u>`, `<v>`)
- NOTE comments
- STYLE blocks
- REGION definitions

**Parser zachowuje tylko**:
- Timing (start/end)
- Plain text content

**Przykład**:
```vtt
00:00:01.000 --> 00:00:04.000 align:middle position:50%
<v Alice>Hello <i>world</i>!

↓ zostaje sparsowane jako:

{
  startTime: 1.0,
  endTime: 4.0,
  text: "<v Alice>Hello <i>world</i>!"  // tagi zostają jako tekst
}
```

---

## 6. Konfiguracja Vuex Store

### 6.1 Stan (state)

**Plik**: `src/renderer/store/modules/settings.js`, linie 153-167

```javascript
const state = {
  // Enable/disable całej funkcjonalności
  customSubtitleEnabled: true,
  
  // ===== NORMAL MODE SETTINGS =====
  customSubtitleNormalColor: '#FFFFFF',           // kolor tekstu
  customSubtitleNormalFontSize: 22,               // rozmiar czcionki (px)
  customSubtitleNormalBgColor: '#000000',         // kolor tła
  customSubtitleNormalBgOpacity: 0.8,             // przezroczystość tła (0-1)
  customSubtitleNormalVPosition: 40,              // pozycja od dołu (px)
  customSubtitleNormalTimeOffset: 0,              // offset czasowy (ms) [niewykorzystywany]
  customSubtitleNormalContainerWidth: 80,         // szerokość kontenera (%)
  
  // ===== FULLSCREEN MODE SETTINGS =====
  customSubtitleFullscreenColor: '#FFFFFF',
  customSubtitleFullscreenFontSize: 28,           // większa czcionka w fullscreen
  customSubtitleFullscreenBgColor: '#000000',
  customSubtitleFullscreenBgOpacity: 0.7,         // mniejsza przezroczystość
  customSubtitleFullscreenVPosition: 60,          // wyższa pozycja
  customSubtitleFullscreenTimeOffset: 0,
  customSubtitleFullscreenContainerWidth: 80,
}
```

### 6.2 Auto-generowane gettery

Dla każdego ustawienia automatycznie generowany jest getter:

```javascript
// Przykłady
getCustomSubtitleEnabled() → boolean
getCustomSubtitleNormalColor() → string (hex)
getCustomSubtitleNormalFontSize() → number (px)
getCustomSubtitleNormalBgColor() → string (hex)
getCustomSubtitleNormalBgOpacity() → number (0-1)
// ... etc dla wszystkich 15 ustawień
```

### 6.3 Auto-generowane actions

Dla każdego ustawienia automatycznie generowany jest action:

```javascript
// Przykłady
updateCustomSubtitleEnabled(value: boolean)
updateCustomSubtitleNormalColor(value: string)
updateCustomSubtitleNormalFontSize(value: number)
// ... etc dla wszystkich 15 ustawień
```

**Każdy action**:
1. Zapisuje wartość do NeDB (`DBSettingHandlers.setters`)
2. Commituje mutację (`setCustomSubtitle...`)
3. State jest reaktywny i komponenty się aktualizują

### 6.4 Persystencja

- **Backend**: NeDB (lokalna baza danych w JSON)
- **Lokalizacja**: Electron `userData` directory
- **Sync**: Każda zmiana natychmiast zapisywana
- **Format**: Każde ustawienie jako osobny dokument

---

## 7. UI/UX Details

### 7.1 Player controls button

**Lokalizacja**: Na pasku kontrolek Shaka Player, obok przycisku "Captions"

**Ikona**: `closed_caption` (Material Icons)

**Tooltip**: "Custom Subtitles" (zlokalizowany)

**Menu items**:
1. "Upload Subtitles" → otwiera file picker
2. "Settings" → otwiera floating settings window

### 7.2 Subtitle display positioning

**Normal mode**:
- Bottom: `40px` (default, konfigurowalne 0-1200px)
- Width: `80%` (konfigurowalne 20-100%)
- Centered horizontally
- Transitions smooth when controls hover

**Fullscreen mode**:
- Bottom: `60px` (wyżej niż normal)
- Width: `80%`
- Większa czcionka (28px vs 22px)
- Mniejsza przezroczystość tła (0.7 vs 0.8)

**Controls hover behavior**:
```javascript
// FtCustomSubtitleDisplay.js, linia 39
const bottomPosition = props.isHoveringControls 
  ? `${controlsHeight}px`   // 65px - powyżej kontrolek
  : `${settings.vPosition}px`  // normalna pozycja
```

### 7.3 Settings window

**Typ**: Floating draggable window (FtFloatingWindow)

**Features**:
- Draggable po nagłówku
- Auto-center on open
- Close button (X)
- Overlay tło (semi-transparent)

**Layout**:
- Mode selector na górze (radio buttons)
- Settings grid poniżej
- Responsive (1 kolumna)
- Labels po lewej, kontrolki po prawej

**Controls**:
- Color picker (natywny `<input type="color">`)
- Number input (ft-input)
- Slider (ft-slider)
- Combined slider + number input (vertical position)

### 7.4 Styling details

**Font family** (FtCustomSubtitleDisplay.css, linia 17):
```css
font-family: "YouTube Noto", Roboto, "Arial Unicode Ms", Arial, 
             Helvetica, Verdana, "PT Sans Caption", sans-serif;
```

**Text shadow** (linia 18):
```css
text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 
             1px -1px 2px #000, -1px 1px 2px #000;
```
Outline effect dla lepszej czytelności

**Background**:
```css
background-color: rgba(R, G, B, opacity)  /* dynamiczne z hexToRgba() */
border-radius: 4px
padding: 3px 10px
```

**Z-index**: 100 (nad wideo, pod kontrolkami Shaka które mają z-index 200+)

---

## 8. Pliki lokalizacyjne

### 8.1 Klucze tłumaczeń

**Video.Player**:
- `Upload Subtitles` - "Upload subtitles from file"
- `Subtitles loaded successfully` - toast message
- `Error loading subtitles` - toast error + `{error}` placeholder

**Settings.Player Settings.Custom Subtitle Settings**:
- `Title` - "Custom Subtitles" (window title)
- `Normal Mode` - label dla trybu normalnego
- `Fullscreen Mode` - label dla trybu fullscreen
- `Font Color` - label
- `Font Size (px)` - label + placeholder
- `Background Color` - label
- `Background Opacity` - label
- `Vertical Position (px)` - label
- `Container Width (%)` - label
- `Time Offset (ms)` - label

### 8.2 Dostępne języki

**Zaimplementowane**:
- `en-US.yaml` - angielski amerykański
- `en-GB.yaml` - angielski brytyjski
- `pl.yaml` - polski

**Przykład (en-US.yaml)**:
```yaml
Video:
  Player:
    Upload Subtitles: Upload subtitles from file
    Subtitles loaded successfully: Subtitles loaded successfully
    Error loading subtitles: 'Error loading subtitles: {error}'

Settings:
  Player Settings:
    Custom Subtitle Settings:
      Title: Custom Subtitles
      Normal Mode: Normal Mode
      Fullscreen Mode: Fullscreen Mode
      Font Color: Font Color
      Font Size (px): Font Size (px)
      # ...etc
```

---

## 9. Potencjalne usprawnienia (TODO)

Na podstawie analizy kodu, zidentyfikowano następujące obszary do poprawy:

### 9.1 Time offset implementation
**Status**: Ustawienie istnieje, ale nie jest wykorzystywane  
**Implementacja**: Dodać offset do czasu w `handleTimeupdate()`:
```javascript
const adjustedTime = videoCurrentTime + (settings.timeOffset / 1000);
```

### 9.2 VTT advanced features
**Status**: Parser ignoruje cue settings i styling  
**Implementacja**: Rozszerzyć `parseVttCues()` o:
- Position, alignment, size parsing
- Obsługa tagów stylowania (`<i>`, `<b>`, etc.)
- STYLE blocks

### 9.3 Więcej formatów napisów
**Status**: Tylko VTT i SRT  
**Implementacja**: Dodać konwertery dla:
- SSA/ASS
- TTML
- SBV

### 9.4 Multiple subtitle tracks
**Status**: Tylko jeden track custom subtitles naraz  
**Implementacja**: 
- Array of loaded tracks
- Track selector w UI
- Track switching

### 9.5 Subtitle editing
**Status**: Brak możliwości edycji po załadowaniu  
**Implementacja**:
- Edytor inline
- Time adjustment
- Text modification
- Export modified subtitles

### 9.6 Auto-sync
**Status**: Brak automatycznego dopasowania timingu  
**Implementacja**:
- Audio fingerprinting
- Sync detection
- Global time shift

---

## 10. Testowanie

### 10.1 Test cases

**Upload test**:
1. Kliknij Custom Subtitle button
2. Wybierz "Upload Subtitles"
3. Wybierz plik .vtt
4. Sprawdź czy napisy się ładują i wyświetlają

**SRT conversion test**:
1. Przygotuj plik .srt
2. Upload przez UI
3. Sprawdź czy konwersja działa poprawnie
4. Sprawdź timing i tekst

**Settings test**:
1. Otwórz Settings z menu
2. Zmień mode na Fullscreen
3. Zmień kolor, rozmiar, pozycję
4. Sprawdź czy zmiany są widoczne live
5. Zamknij okno i otwórz ponownie - sprawdź persystencję

**Mode switching test**:
1. Załaduj napisy
2. Enter fullscreen (F11)
3. Sprawdź czy styl się zmienia (fontSize 22→28, vPosition 40→60)
4. Exit fullscreen
5. Sprawdź czy wraca do normal mode

**Controls hover test**:
1. Załaduj napisy
2. Odtwarzaj wideo
3. Najedź na kontrolki
4. Sprawdź czy napisy przesuwają się w górę (bottom: 65px)

### 10.2 Edge cases

**Plik bez napisów**:
- Parser zwraca pustą tablicę
- Brak błędu, brak wyświetlania

**Nieprawidłowy format**:
- Regex nie matchuje timestampów
- Cue zwraca `null` i jest filtrowane

**Bardzo długi tekst**:
- CSS: `white-space: pre-line`, text wraps
- Container width limitowany (default 80%)

**Nakładające się cues**:
- Parser znajduje pierwszy match
- Drugi cue nie będzie pokazany (ograniczenie)

**Brak rozszerzenia pliku**:
- Split na '.' może zwrócić undefined
- `.toLowerCase()` na undefined wyrzuci błąd
- **Bug**: Brak walidacji

---

## 11. Zależności zewnętrzne

### 11.1 Shaka Player
**Wersja**: (sprawdź package.json)  
**Użycie**:
- UI Framework (`shaka.ui.SettingsMenu`, `shaka.ui.Controls`)
- Factory registration system
- Localization system
- Event management

### 11.2 Vue 3
**Użycie**:
- Composition API (`ref`, `computed`, `watch`)
- Components (`defineComponent`)
- Reactivity system

### 11.3 Vuex
**Użycie**:
- State management
- Getters/Actions auto-generation
- Persistence layer

### 11.4 vue-i18n
**Użycie**:
- `$t()` translation function
- `i18n.t()` in JS
- Locale switching

### 11.5 NeDB
**Użycie**:
- Local settings storage
- DBSettingHandlers interface

### 11.6 File System Access API
**Browser compatibility**:
- ✅ Chrome/Edge 86+
- ✅ Electron
- ❌ Firefox (fallback na `<input>`)
- ❌ Safari (fallback na `<input>`)

---

## 12. Podsumowanie architektury

```
┌─────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│  CustomSubtitleButton (Shaka UI)                            │
│    ├─ Upload Subtitles menu item                            │
│    └─ Settings menu item                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ Upload ────────────────────────────────┐
                 │                                         │
┌────────────────▼─────────────────────────────────────────▼──┐
│                    UPLOAD & PARSING                         │
├─────────────────────────────────────────────────────────────┤
│  uploadSubtitles()                                          │
│    ├─ readFileWithPicker() → File System Access API        │
│    ├─ convertSrtToVtt() → SRT→VTT conversion               │
│    ├─ parseVttCues() → Cue objects array                   │
│    └─ customCues.value = [...] → Reactive storage          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ timeupdate event
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  PLAYBACK & DISPLAY                         │
├─────────────────────────────────────────────────────────────┤
│  handleTimeupdate()                                         │
│    └─ Find active cue → currentCustomSubtitleText.value     │
│                  │                                           │
│  FtCustomSubtitleDisplay                                    │
│    ├─ :text="currentCustomSubtitleText"                     │
│    ├─ :isFullscreen="isPlayerFullscreen"                    │
│    ├─ :isHoveringControls="isControlsHovering"              │
│    └─ Dynamic styling from Vuex                             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ reads settings
             │
┌────────────▼────────────────────────────────────────────────┐
│                   SETTINGS MANAGEMENT                       │
├─────────────────────────────────────────────────────────────┤
│  Vuex Store (settings.js)                                   │
│    ├─ State (15 settings: 2 modes × 7 props + enable)       │
│    ├─ Getters (auto-generated)                              │
│    └─ Actions (auto-generated, persist to NeDB)             │
│                  │                                           │
│  CustomSubtitleSettings                                     │
│    ├─ Mode selector (Normal/Fullscreen)                     │
│    └─ Settings grid → updateSetting() → Vuex actions        │
│                  │                                           │
│  FtFloatingWindow (draggable overlay)                       │
└─────────────────────────────────────────────────────────────┘

UTILITIES:
  ├─ utils.js: readFileWithPicker() - file system access
  ├─ colors.js: hexToRgba() - color conversion
  └─ i18n: translation system
```

---

## 13. Przykład użycia (User flow)

### Scenariusz: Upload i konfiguracja napisów

**Krok 1**: Odtwórz wideo
```
User opens video → ft-shaka-video-player loads
```

**Krok 2**: Otwórz menu napisów
```
User clicks [CC with gear icon] button in player controls
↓
CustomSubtitleButton menu appears with:
  - "Upload Subtitles"
  - "Settings"
```

**Krok 3**: Upload pliku napisów
```
User clicks "Upload Subtitles"
↓
File picker dialog opens (filters: .vtt, .srt)
↓
User selects "movie.srt"
↓
uploadSubtitles() executes:
  1. Read file content
  2. Detect .srt extension
  3. Convert to VTT format
  4. Parse VTT into cue objects
  5. Store in customCues array
  6. Disable Shaka native subtitles
  7. Show success toast
```

**Krok 4**: Napisy wyświetlają się automatycznie
```
Video plays → handleTimeupdate() fires every ~16ms
↓
For each timeupdate:
  - Check if currentTime falls within any cue range
  - If yes: currentCustomSubtitleText.value = cue.text
  - If no: currentCustomSubtitleText.value = ''
↓
FtCustomSubtitleDisplay reactively updates:
  - Shows text with default styling
  - Position: 40px from bottom
  - Width: 80% of player
  - Color: white (#FFFFFF)
  - Font size: 22px
  - Background: black rgba(0,0,0,0.8)
```

**Krok 5**: Dostosuj ustawienia
```
User clicks [CC with gear icon] → "Settings"
↓
FtFloatingWindow appears with CustomSubtitleSettings
↓
User changes:
  - Mode: Fullscreen
  - Font Color: #FFFF00 (yellow)
  - Font Size: 32px
  - Vertical Position: 100px (via slider + input)
↓
Each change triggers:
  updateSetting('fontSize', 32)
    ↓
  updateCustomSubtitleFullscreenFontSize(32)
    ↓
  Save to NeDB + commit mutation
    ↓
  getCustomSubtitleFullscreenFontSize returns 32
    ↓
  FtCustomSubtitleDisplay re-computes textStyle
    ↓
  Subtitles instantly update on screen
```

**Krok 6**: Enter fullscreen
```
User presses F11 (fullscreen)
↓
isPlayerFullscreen.value = true
↓
FtCustomSubtitleDisplay switches to fullscreen mode:
  - Font size: 32px (user's custom value)
  - Color: #FFFF00 (yellow)
  - Position: 100px (user's custom value)
  - Background opacity: 0.7 (default fullscreen)
```

**Krok 7**: Kontrolki hover
```
User moves mouse → controls appear
↓
isControlsHovering.value = true
↓
FtCustomSubtitleDisplay adjusts position:
  bottom: 65px (instead of 100px)
  ↓
Subtitles move up, above controls bar
↓
User moves mouse away → controls fade
↓
isControlsHovering.value = false
↓
Subtitles smoothly transition back to 100px
```

---

## 14. Kod komentarze w źródłach

Kod zawiera komentarze polskie oznaczające zmodyfikowane/dodane sekcje:

- `// POCZĄTEK NOWEGO KODU` / `// KONIEC NOWEGO KODU`
- `// ZMIENIONY KOD` / `// KONIEC ZMIAN`
- `// POPRAWIONY TYP`

**Przykłady**:

**settings.js, linia 152**:
```javascript
// POCZĄTEK NOWEGO KODU - USTAWIENIA NAPISÓW
customSubtitleEnabled: true,
// ...
// KONIEC NOWEGO KODU
```

**CustomSubtitleSettings.vue, linia 73**:
```vue
<!-- ZMIENIONY KOD -->
<div class="control-group combined-control">
  <!-- ... -->
</div>
<!-- KONIEC ZMIAN -->
```

**colors.js, linia 102**:
```javascript
// POCZĄTEK NOWEGO KODU
export function hexToRgba(hex, opacity) {
  // ...
}
// KONIEC NOWEGO KODU
```

Te komentarze wskazują na custom implementacje specyficzne dla tej wersji FreeTube.

---

## 15. Najważniejsze wnioski

### ✅ Co działa dobrze:
1. **Prosty flow uploadu** - 3 kliknięcia do załadowania napisów
2. **Automatyczna konwersja SRT→VTT** - user nie musi myśleć o formacie
3. **Reactive UI** - zmiany ustawień widoczne natychmiast
4. **Dual mode** - separate settings dla normal/fullscreen
5. **Controls awareness** - napisy przesuwają się gdy kontrolki się pojawiają
6. **Persystencja** - ustawienia zapamiętywane między sesjami
7. **Integracja z Shaka** - używa natywnego systemu UI factory

### ⚠️ Ograniczenia:
1. **Brak Time Offset usage** - ustawienie nie jest aktualnie wykorzystywane
2. **Limited VTT parsing** - ignoruje styling i cue settings
3. **Tylko 2 formaty** - VTT i SRT, brak SSA/ASS/TTML
4. **Single track** - nie można załadować wielu ścieżek napisów
5. **Brak edycji** - nie można modyfikować napisów po załadowaniu
6. **No auto-sync** - brak automatycznego dopasowania timingu

### 🎯 Use cases:
- ✅ Upload lokalnych napisów dla filmów YouTube
- ✅ Customizacja wyglądu napisów (kolor, rozmiar, pozycja)
- ✅ Różne style dla normal i fullscreen mode
- ✅ Subtitle overlay nad native YouTube captions
- ❌ Edycja napisów w locie
- ❌ Multiple language tracks switching
- ❌ Auto-sync with audio

---

## Koniec raportu

**Autor analizy**: AI Assistant  
**Data**: 2024  
**Wersja FreeTube**: 0.23.5-marek7400v3  
**Wersja raportu**: 1.0

Raport zawiera kompleksową analizę implementacji funkcjonalności custom captions upload w FreeTube 0.23.5. Wszystkie ścieżki plików, numery linii i fragmenty kodu zostały zweryfikowane względem rzeczywistego codebase.
