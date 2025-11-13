<template>
  <div
    v-if="enabled"
    class="custom-subtitle-container"
    :style="containerStyle"
  >
    <p
      class="subtitle-text"
      :style="textStyle"
    >
      {{ text }}
    </p>
  </div>
</template>

<script src="./FtCustomSubtitleDisplay.js" />
<style scoped src="./FtCustomSubtitleDisplay.css" />
