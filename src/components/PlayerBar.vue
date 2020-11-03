<template>
  <a-row class="playerbar">
       <a-col :span="8">
        <!-- col-8 -->
        <!-- {{ playerStatus }} -->
        <a-list-item-meta :description="playerStatus.now.artist" v-if="playerStatus">
          <a slot="title">{{ playerStatus.now.song }}</a>
          <a-avatar
            slot="avatar"
            :src="playerStatus.now.cover"
          />
        </a-list-item-meta>
      </a-col>
      <a-col :span="10">
        <!-- col-8 -->
        <a-icon @click="prev" type="step-backward" :style="{ fontSize: '38px', color: 'white' }"/>
        <a-icon @click="next" type="play-circle" :style="{ fontSize: '38px', color: 'white', margin: '0 25px' }" />
        <a-icon @click="next" type="step-forward"  :style="{ fontSize: '38px', color: 'white' }"/>
      </a-col>
  </a-row>
</template>

<script>
// import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
// import api from '@/api.js'
import FramePlayer from './frameplayer'
export default {
  data() {
    return {
      data: [],
      frameplayer: null,
      playerStatus: null
    };
  },
  name: "landing-page",
  // components: { ScaleLoader },
  watch: {},
  methods: {},
  mounted() {
      var self = this
    window.$player = {
      playAlbum(keyword, type) {
        if(self.frameplayer == null) {
            keyword = encodeURIComponent(keyword)
            const url =`https://music.163.com/#/search/m/?s=${keyword}&type=10`;
            self.frameplayer = new FramePlayer({
                url: url
            })
            self.frameplayer.on('status', (status) => {
                console.log('frameplayer', this, status)
                self.playerStatus = status
            })
        } else {
            self.frameplayer.playAlbum(keyword)
        }
      }
    }
  },
  methods: {
      next() {
          this.frameplayer.next()
      },
      prev() {
          this.frameplayer.prev()
      },
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

#wrapper {
  height: 100vh;
  /* padding: 60px 80px; */
  width: 100vw;
  text-align: center;
}

.about-page p {
  margin-bottom: 5px;
}
.playerbar {
    color: #666
}
</style>
