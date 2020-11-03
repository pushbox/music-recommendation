<template>
  <a-row class="playerbar" type="flex" align="middle" v-if="playerStatus">
       <a-col :span="8">
        <!-- col-8 -->
        <!-- {{ playerStatus }} -->
        <a-list-item-meta :description="playerStatus.now.artist" v-if="playerStatus">
          <a slot="title" target="_blank" :href="playerStatus.now.song_detail">{{ playerStatus.now.song }}</a>
          <img
            slot="avatar"
            :src="playerStatus.now.cover"
            height="55"
          />
        </a-list-item-meta>
      </a-col>
      <a-col :span="10">
        <!-- col-8 -->
        <div class="contro-bar">
          <a-icon @click="prev" type="step-backward" />
          <a-icon @click="togglePlay" :type="playerStatus.isPlaying ? 'pause-circle':'play-circle'" class="play-block" />
          <a-icon @click="next" type="step-forward" />
        </div>
        <div v-if="playerStatus.progress" style="margin-top: 5px">
          <!-- {{ playerStatus.progress}} -->
          <a-row type="flex" align="middle" >
            <a-col :flex="1">
              <div style="background: #535353;   flex: 1;   height: 4px;   width: 100%;">
                <div :style="'background: #b3b3b3;  height: 4px; width:'+playerStatus.progress.percent+'%;'"></div>
              </div>
            </a-col>
             <a-col>
                <span style="margin-left: 10px">{{playerStatus.progress.now}} / {{playerStatus.progress.total}}</span>
              </a-col>
          </a-row>
        </div>
      </a-col>
      <a-col style="text-align: center" :span="6">
        <a-drawer
          title="播放列表"
          placement="right"
          class="playlist-items"
          :closable="false"
          width="380"
          :visible="visible"
          :bodyStyle="{padding:'0'}"
          @close="visible = false"
        >
        <!-- {{ playList.length }} -->
          <template v-for="album in playList">
            <a-list-item v-for="song in album.songs" :key="song.song" :class="{inplay: song.isPlaying}" @click="playSong(song.song, album)">
              <a-list-item-meta :description="song.artist">
                <a slot="title" target="_blank">{{ song.song }}</a>
              </a-list-item-meta>
              <span slot="actions">{{ song.time }}</span>
            </a-list-item>
          </template>
        </a-drawer>
        <!-- {{ playList.length }} -->
         <a-icon @click="visible = true" type="menu" />
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
      visible: false,
      frameplayer: null,
      playerStatus: null,
      playList: [],
    };
  },
  name: "landing-page",
  // components: { ScaleLoader },
  watch: {},
  methods: {},
  mounted() {
    var self = this

    window.addEventListener('beforeunload', (event) => {
      if(self.frameplayer) {
        self.frameplayer.close()
      }
    });
    window.$player = {
      playAlbum(keyword, type) {
        var isIn = self.playList.filter(_ => _.album == keyword)
        if(isIn.length == 0) {
          self.playList.push({
            album: keyword,
            songs: []
          })
        }
        
        if(self.frameplayer == null) {
          keyword = encodeURIComponent(keyword)
          const url =`https://music.163.com/#/search/m/?s=${keyword}&type=10`;
          self.frameplayer = new FramePlayer({
              url: url
          })
          self.frameplayer.on('status', (status) => {
            console.log('frameplayer', this, status)
            self.playerStatus = status
            if(status.tip) {
              self.$message.info(status.tip)
            }
            var newPlayList = self.playList.map(_ => {
              if(_.album === status.searchKeyWord) {
                _.songs = status.playList.map(songItem => {
                  if(status.now && songItem.song == status.now.song) {
                    songItem.isPlaying = true
                  } else {
                    songItem.isPlaying = false
                  }
                  return songItem
                })
              } else {
                _.songs = _.songs.map(songItem => {
                  songItem.isPlaying = false
                  return songItem
                })
              }
              return _;
            })
            self.playList = newPlayList
            // self.$set(self.playList, albumIndex, {
            //   songs: status.playList
            // })
          })

        } else {
          self.frameplayer.playAlbum(keyword)
        }
      }
    }
  },
  beforeDestroy() {
    if(this.frameplayer) {
      this.frameplayer.close()
    }
  },
  methods: {
    playSong(name, albumItem) { 
      console.log('playSong', name)
      if(albumItem.album == this.playerStatus.searchKeyWord) {
        this.frameplayer.playSong(name)
      } else {
        console.log('need switch album', {
          now: this.playerStatus.searchKeyWord,
          need: albumItem.album
        });
        this.frameplayer.playAlbum(albumItem.album)
        this.frameplayer.playSong(name)
      }
    },
    togglePlay() {
      if(this.playerStatus.isPlaying) {
        this.frameplayer.pause()
      } else {
        this.frameplayer.play()
      }
    },
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

.contro-bar {
  text-align: center;
}

.playerbar {
    color: #666;
    padding: 15px 0;
}

.playerbar .anticon {
  font-size: 25px;
  color: #b3b3b3
}

.playerbar .anticon:hover {
  color: white
}

.play-block {
  margin: 0 35px;
}
.playerbar .anticon.play-block {
  font-size: 28px
}
.playlist-items .ant-list-item {
  margin: 0;
  padding: 10px;
}

.playlist-items .ant-list-item:hover,
.playlist-items .ant-list-item.inplay {
  cursor: pointer;
  /* padding: 8px 10px; */
 background: #333;
}
</style>
