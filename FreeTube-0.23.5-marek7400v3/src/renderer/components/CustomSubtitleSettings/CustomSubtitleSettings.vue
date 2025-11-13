<template>
  <div class="custom-subtitle-settings-section">
    <div v-if="getCustomSubtitleEnabled">
      <div class="mode-selector">
        <label>
          <input
            v-model="currentMode"
            type="radio"
            value="normal"
            name="subtitleMode"
          >
          {{ $t('Settings.Player Settings.Custom Subtitle Settings.Normal Mode') }}
        </label>
        <label>
          <input
            v-model="currentMode"
            type="radio"
            value="fullscreen"
            name="subtitleMode"
          >
          {{ $t('Settings.Player Settings.Custom Subtitle Settings.Fullscreen Mode') }}
        </label>
      </div>

      <div
        v-if="currentSettings"
        class="settings-grid"
      >
        <!-- Font Color -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Font Color') }}</label>
          <input
            type="color"
            :value="currentSettings.color"
            @input="updateSetting('color', $event.target.value)"
          >
        </div>
        <!-- Font Size -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Font Size (px)') }}</label>
          <ft-input
            type="number"
            :value="currentSettings.fontSize.toString()"
            :placeholder="$t('Settings.Player Settings.Custom Subtitle Settings.Font Size (px)')"
            :show-action-button="false"
            :show-label="false"
            @input="updateSetting('fontSize', parseInt($event, 10))"
          />
        </div>
        <!-- BG Color -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Background Color') }}</label>
          <input
            type="color"
            :value="currentSettings.bgColor"
            @input="updateSetting('bgColor', $event.target.value)"
          >
        </div>
        <!-- BG Opacity -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Background Opacity') }}</label>
          <ft-slider
            :label="''"
            :default-value="currentSettings.bgOpacity"
            :min-value="0"
            :max-value="1"
            :step="0.05"
            @change="updateSetting('bgOpacity', $event)"
          />
        </div>

        <!-- Vertical Position -->
        <!-- ZMIENIONY KOD -->
        <div class="control-group combined-control">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Vertical Position (px)') }}</label>
          <div class="slider-input-wrapper">
            <ft-slider
              :label="''"
              :default-value="currentSettings.vPosition"
              :min-value="0"
              :max-value="1200"
              :step="1"
              @change="updateSetting('vPosition', $event)"
            />
            <ft-input
              type="number"
              class="v-pos-input"
              :value="currentSettings.vPosition.toString()"
              :show-action-button="false"
              :show-label="false"
              @input="updateSetting('vPosition', parseInt($event, 10))"
            />
          </div>
        </div>
        <!-- KONIEC ZMIAN -->

        <!-- Container Width -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Container Width (%)') }}</label>
          <ft-slider
            :label="''"
            :default-value="currentSettings.containerWidth"
            :min-value="20"
            :max-value="100"
            :step="1"
            @change="updateSetting('containerWidth', $event)"
          />
        </div>
        <!-- Time Offset -->
        <div class="control-group">
          <label>{{ $t('Settings.Player Settings.Custom Subtitle Settings.Time Offset (ms)') }}</label>
          <ft-input
            type="number"
            :value="currentSettings.timeOffset.toString()"
            :placeholder="$t('Settings.Player Settings.Custom Subtitle Settings.Time Offset (ms)')"
            :show-action-button="false"
            :show-label="false"
            @input="updateSetting('timeOffset', parseInt($event, 10))"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./CustomSubtitleSettings.js" />
<style scoped src="./CustomSubtitleSettings.css" />
