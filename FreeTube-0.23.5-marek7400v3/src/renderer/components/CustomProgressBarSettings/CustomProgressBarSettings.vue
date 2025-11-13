<template>
  <ft-settings-section
    :title="$t('Settings.Player Settings.Custom Progress Bar Settings.Title')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Custom Progress Bar Settings.Enable Custom Progress Bar')"
          :default-value="getCustomProgressBarEnabled"
          :compact="true"
          @change="updateCustomProgressBarEnabled"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Custom Progress Bar Settings.Enable Chapter Markers')"
          :default-value="getCustomProgressBarChaptersEnabled"
          :disabled="!getCustomProgressBarEnabled"
          :compact="true"
          @change="updateCustomProgressBarChaptersEnabled"
        />
      </div>
    </div>
    <div
      v-if="getCustomProgressBarEnabled"
      class="settings-grid"
    >
      <!-- Progress Bar -->
      <div class="color-control">
        <label>{{ $t('Settings.Player Settings.Custom Progress Bar Settings.Progress Bar Color') }}</label>
        <input
          type="color"
          :value="getCustomProgressBarProgressColor"
          @input="updateCustomProgressBarProgressColor($event.target.value)"
        >
      </div>
      <ft-slider
        :label="$t('Settings.Player Settings.Custom Progress Bar Settings.Opacity')"
        :default-value="getCustomProgressBarProgressOpacity"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        @change="updateCustomProgressBarProgressOpacity"
      />
      <!-- Buffer Bar -->
      <div class="color-control">
        <label>{{ $t('Settings.Player Settings.Custom Progress Bar Settings.Buffer Bar Color') }}</label>
        <input
          type="color"
          :value="getCustomProgressBarBufferColor"
          @input="updateCustomProgressBarBufferColor($event.target.value)"
        >
      </div>
      <ft-slider
        :label="$t('Settings.Player Settings.Custom Progress Bar Settings.Opacity')"
        :default-value="getCustomProgressBarBufferOpacity"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        @change="updateCustomProgressBarBufferOpacity"
      />
      <!-- Unbuffered Bar -->
      <div class="color-control">
        <label>{{ $t('Settings.Player Settings.Custom Progress Bar Settings.Unbuffered Bar Color') }}</label>
        <input
          type="color"
          :value="getCustomProgressBarUnbufferedColor"
          @input="updateCustomProgressBarUnbufferedColor($event.target.value)"
        >
      </div>
      <ft-slider
        :label="$t('Settings.Player Settings.Custom Progress Bar Settings.Opacity')"
        :default-value="getCustomProgressBarUnbufferedOpacity"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        @change="updateCustomProgressBarUnbufferedOpacity"
      />
      <!-- Chapter Marker -->
      <div class="color-control">
        <label>{{ $t('Settings.Player Settings.Custom Progress Bar Settings.Chapter Marker Color') }}</label>
        <input
          type="color"
          :value="getCustomProgressBarChapterMarkerColor"
          :disabled="!getCustomProgressBarChaptersEnabled"
          @input="updateCustomProgressBarChapterMarkerColor($event.target.value)"
        >
      </div>
      <div><!-- Pusty element dla wyrównania w siatce --></div>
      <!-- Bar Height -->
      <div class="number-control">
        <label>{{ $t('Settings.Player Settings.Custom Progress Bar Settings.Bar Height') }}</label>
        <ft-input
          type="number"
          :value="getCustomProgressBarBarHeight.toString()"
          :show-action-button="false"
          :show-label="false"
          placeholder="px"
          @input="updateCustomProgressBarBarHeight(parseInt($event, 10))"
        />
      </div>
      <!-- Z-Index -->
      <div class="number-control">
        <label>Z-Index</label>
        <ft-input
          type="number"
          :value="getCustomProgressBarZIndex.toString()"
          :show-action-button="false"
          :show-label="false"
          placeholder=""
          @input="updateCustomProgressBarZIndex(parseInt($event, 10))"
        />
      </div>
    </div>
  </ft-settings-section>
</template>

<script src="./CustomProgressBarSettings.js" />
<style scoped src="./CustomProgressBarSettings.css" />
