<template>
  <ft-settings-section
    :title="$t('Settings.Download Settings.Download Settings')"
  >
    <ft-flex-box class="downloadSettingsRow">
      <ft-select
        :placeholder="$t('Settings.Download Settings.Download Behavior')"
        :value="downloadBehavior"
        :select-names="downloadBehaviorNames"
        :select-values="downloadBehaviorValues"
        :icon="['fas', 'download']"
        @change="updateDownloadBehavior"
      />
    </ft-flex-box>
    <template v-if="shouldShowDownloadOptions">
      <ft-flex-box
        class="downloadSettingsRow"
      >
        <ft-toggle-switch
          :label="$t('Settings.Download Settings.Ask Download Path')"
          :default-value="askForDownloadPath"
          @change="handleDownloadingSettingChange"
        />
      </ft-flex-box>
      <template v-if="!askForDownloadPath">
        <ft-flex-box class="downloadSettingsRow">
          <ft-input
            class="folderDisplay"
            :placeholder="downloadPath"
            :show-action-button="false"
            :show-label="false"
            :disabled="true"
          />
        </ft-flex-box>
        <ft-flex-box class="downloadSettingsButtonRow">
          <ft-button
            :label="$t('Settings.Download Settings.Choose Path')"
            @click="chooseDownloadingFolder"
          />
        </ft-flex-box>
      </template>
      <template v-if="shouldShowYtDlpOptions">
        <ft-flex-box class="downloadSettingsRow">
          <ft-input
            class="binaryPathInput"
            :label="$t('Settings.Download Settings.YtDlp Binary Path')"
            :placeholder="$t('Settings.Download Settings.YtDlp Binary Path Placeholder')"
            :value="ytDlpBinaryPath"
            :show-action-button="false"
            :show-clear-text-button="ytDlpBinaryPath.length > 0"
            :show-label="true"
            @input="handleBinaryPathInput"
            @clear="handleBinaryPathClear"
          />
        </ft-flex-box>
        <ft-flex-box class="downloadSettingsButtonRow">
          <ft-button
            :label="$t('Settings.Download Settings.Browse For YtDlp')"
            @click="chooseYtDlpBinaryPath"
          />
          <ft-button
            v-if="ytDlpBinaryPath"
            :label="$t('Settings.Download Settings.Reset YtDlp Binary Path')"
            @click="resetYtDlpBinaryPath"
          />
        </ft-flex-box>
        <ft-flex-box class="downloadSettingsRow">
          <ft-toggle-switch
            :label="$t('Settings.Download Settings.Use Custom YtDlp Arguments')"
            :default-value="ytDlpUseCustomArgs"
            @change="handleYtDlpUseCustomArgsChange"
          />
        </ft-flex-box>
        <ft-flex-box class="downloadSettingsRow">
          <ft-input
            class="customArgsInput"
            :label="$t('Settings.Download Settings.Custom YtDlp Arguments')"
            :placeholder="$t('Settings.Download Settings.Custom YtDlp Arguments Placeholder')"
            :value="ytDlpCustomArgs"
            :disabled="!ytDlpUseCustomArgs"
            :show-action-button="false"
            :show-clear-text-button="ytDlpCustomArgs.length > 0"
            :show-label="true"
            @input="handleCustomArgsInput"
            @clear="handleCustomArgsClear"
          />
        </ft-flex-box>
      </template>
    </template>
  </ft-settings-section>
</template>

<script src="./download-settings.js" />
<style scoped src="./download-settings.css" />
