<template>
  <div
    v-if="enabled"
    class="progressBarContainer"
    :style="progressBarContainerStyle"
  >
    <div
      class="unbufferedBar"
      :style="unbufferedBarStyle"
    />
    <div
      class="bufferBar"
      :style="bufferBarStyle"
    />
    <div
      class="progressBar"
      :style="progressBarStyle"
    />
    <div
      v-if="chaptersEnabled && chapterMarkers.length > 0"
      class="chapterMarkersContainer"
      :style="chapterMarkersContainerStyle"
    >
      <div
        v-for="(marker, index) in chapterMarkers"
        :key="index"
        class="chapterMarker"
        :style="{ left: marker.left, backgroundColor: marker.color }"
      />
    </div>
  </div>
</template>

<script src="./FtCustomProgressBar.js" />
<style scoped src="./FtCustomProgressBar.css" />
