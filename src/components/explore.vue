<template>
<div>
  
  <div class="page" v-if="notFound">
    <h2 class="page-title">未找到收藏歌曲</h2>
    <div class="page-content">
      <p>请登陆你的<a href="https://music.163.com/" target="_blank">网易云音乐</a>，<a href="https://www.xiami.com/" target="_blank">虾米音乐</a>账号</p>
      <p>登陆后请刷新本页！</p>
    </div>
  </div>
  <div class="page" v-if="!extensionInstalled">
    <h2 class="page-title">插件检测</h2>
    <div class="page-content">
      <p>没有检测到插件！！！！</p>
      <div class="col-sm-6 feature-item">
            <h4 class="mt-4 mb-2">下载插件</h4>
            <p>
              <a href="https://wpics.oss-cn-shanghai.aliyuncs.com/MusicHelper.zip" target="_blank">https://wpics.oss-cn-shanghai.aliyuncs.com/MusicHelper.zip</a><br>
              <a href="https://wpics.oss-cn-shanghai.aliyuncs.com/MusicHelper.zip" role="button" onclick="_hmt.push(['_trackEvent', 'download', 'internal', '0.0.4']);">下载安装包</a>,
              打开所在的文件夹，找到下载好的<code>MusicHelper.zip</code>文件解压
            </p>
            <h4 class="mt-4 mb-2">打开浏览器扩展管理页面</h4>
            <p onclick="_hmt.push(['_trackEvent', 'install', 'copy', '0.0.4']);">
              复制 <code>chrome://extensions</code>，并
              粘贴到地址栏，按回车键进入扩展中心 页面。
            </p>
            <h4 class="mt-4 mb-2">安装插件</h4>
            <p>
              在扩展中心打开右上角的【开发者模式】按钮，然后刷新页面，把解压后的<code>MusicHelper</code>文件夹【拖入扩展中心页面】
              <br>或点击左上角的【加载已解压的扩展程序】选择下载解压后的文件目录
            </p>

            <b>安装完成后刷新页面!</b>
            <p>
              还是不会？请看<a href="https://wpics.oss-cn-shanghai.aliyuncs.com/music/1604277490291288.mp4" target="_blank" onclick="_hmt.push(['_trackEvent', 'install', 'turial', '0.0.4']);">安装视频教程</a>
            </p>
          </div>
    </div>
  </div>
  <div class="page" v-if="extensionInstalled && !notFound || fetchSimliar">
    <!-- <h2 class="page-title">今日推荐</h2> -->
     <div class="page-content">
       <div v-if="fetchSimliar || isScaning">
          <scale-loader class="loading" style="text-align:left; margin-bottom: 10px" :loading="true" color="white" ></scale-loader>
          <p v-if="isScaning">
            正在扫描你最近收藏的歌曲...
          </p>
          <p v-if="fetchSimliar">
          正在生成推荐...<br>
          不要关闭页面！
          </p>
       </div>
    </div>
    <div class="filter-bar" v-if="!fetchSimliar && !isScaning">
      <a-radio-group :options="sortOptions" v-model="sortByType" style="margin-right: 10px"/>
      <a-checkbox v-model="exludeListened">
            排除听过的
      </a-checkbox>
      <a-radio-group :options="sourceOptions" v-model="bySource" style="margin-right: 10px"/>
      <a-button type="primary" @click="visible = true" icon="edit">自定义</a-button>
      <a-modal v-model="visible" width="65%" title="自定义最近听过的歌曲列表" @ok="createCustom">
        <div class="form">
          <div>
            <p>根据歌曲列表生成推荐专辑列表</p>
            <div style="margin-top:10px">
              <a-textarea
                rows="7"
                v-model="customsongs"
                placeholder="歌曲名 艺术家 专辑 一行一条 最好直接从execel复制过来 如
For Absent Friends	Genesis	Greatest Hits
Checkmate	Gryphon	Red Queen to Gryphon Three
Second Spasm	Gryphon	Red Queen to Gryphon Three
"
              />
            </div>
        </div>
        </div>
      </a-modal>
    </div>

    <ul v-if="fetchSimliar && currentFound">
      <li v-for="album in currentFound.items" :key="album.cover" class="album-item">
        <div style="position: relative;">
        <div class="image">
          <div class="cover-image">
              <div class="layout-image">
              <img :src="album.cover" class="layout-image-image"  />
            </div>
          </div>
        </div>
        <div class="playlink">
           <a-icon type="play-circle" @click="playAlbum(album)" :style="{ fontSize: '38px', color: 'white' }" />
        </div>
        <div class="image-content">
          <h3 class="album-title">{{ album.album }}</h3>
          <!-- <p> {{ album.album }} </p> -->
          <p class="desc">
            <template v-if="album.artist">{{ album.artist }}<br></template>
            <template v-if="album.listeners">{{ album.listeners }} 人听过<br></template>
            <span class="outlinks" style="margin-top:10px; display: inline-block;"><a :href="album.cloudmusicLink" target="_blank">
              <img src="@/assets/163.png" height="18"/>
            </a>
            <a :href="album.xiamiLink" target="_blank">
              <img src="@/assets/xiami.png" height="18"/>
            </a>
            </span>
            <!-- <a-icon name="play" /> -->
          </p>
          <!-- <p>基于 {{ album.rec_by.album }} 推荐</p> -->
        </div>
        </div>
        <div class="context">
          基于 <a-tooltip>
    <template slot="title">
      {{ album.rec_by.album }}
    </template>
    <a :href="album.rec_by.detail" :title="album.rec_by.album " target="_blank">{{ album.rec_by.album }}</a>
  </a-tooltip> 推荐
        </div>
      </li>
    </ul>
    <ul>
      <a-list v-show="showAlbums.length > 0" :data-source="showAlbums" :rowKey="item => item.cover" :pagination="paginationProps">
        <a-list-item slot="renderItem" class="album-item" slot-scope="album" style="border: 0">
              <div style="position: relative;">
              <div class="image">
                <div class="cover-image">
                    <div class="layout-image">
                    <img v-lazy="album.cover" class="layout-image-image"  />
                  </div>
                </div>
              </div>
              <div class="playlink">
                <a-icon type="play-circle" @click="playAlbum(album)" :style="{ fontSize: '38px', color: 'white' }" />
              </div>
              <div class="image-content">
                <h3 class="album-title">
                  <a target="_blank" :href="album.cloudmusicLink">{{ album.album }}</a>
                </h3>
                <p class="desc">
                  <template v-if="album.artist">{{ album.artist }}<br></template>
                  <template v-if="album.listeners">{{ album.listeners }} 人听过<br></template>
                  <span class="outlinks" style="margin-top:10px; display: inline-block;"><a :href="album.cloudmusicLink" target="_blank">
                    <img src="@/assets/163.png" height="18"/>
                  </a>
                  <a :href="album.xiamiLink" target="_blank">
                    <img src="@/assets/xiami.png" height="18"/>
                  </a>
                  </span>
                  <!-- <a-icon name="play" /> -->
                </p>
                <!-- <p>基于 {{ album.rec_by.album }} 推荐</p> -->
              </div>
              </div>
              <div class="context">
                基于 <a-tooltip>
          <template slot="title">
            {{ album.rec_by.album }}
          </template>
          <a :href="album.rec_by.detail" :title="album.rec_by.album " target="_blank">{{ album.rec_by.album }}</a>
        </a-tooltip> 推荐
              </div>
        </a-list-item>
      </a-list>
    </ul>
    <!-- <div v-if="albums.length" style="padding: 0 10px 20px">{{ showAlbums.length }}张</div> -->
  </div>
</div>
</template>


<script>
import { getAlbumsByRecId, getAlbums, getCloudMusicCollect, getXiamiCollect } from './helper'
import axios from 'axios'
import { getResizeImage } from './api'

const api = axios.create({
  baseURL: "http://localhost:8956",
  timeout: 4000
});
import md5 from "js-md5";
var PouchDB = require("pouchdb").default;
var recentDb = new PouchDB("recent_songs");
const _ = require('lodash')
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
export default {
  name: 'HelloWorld',
  components: { ScaleLoader },
  data () {
    return {
      extensionInstalled: false,
      albums: [],
      visible: false,
      customsongs: '',
      isScaning: false,
      notFound: false,
      exludeListened: true,
      sortByListeners: false,
      currentPage: 1,
      albumsIsCollected: [],
      fetchSimliar: false,
      allAlbumIndex: {},
      cloumnCount: 4,
      currentFound: null,
      sortByType: 'rec',
      bySource: 'all',
      sourceOptions: [
        { label: '全部', value: 'all' },
        { label: '豆瓣音乐', value: 'douban' },
        { label: 'last.fm', value: 'lastfm' },
      ],
      sortOptions: [
        { label: '热门排序', value: 'top' },
        { label: '冷门排序', value: 'down' },
        { label: '推荐重复度排序', value: 'rec' }
      ],
      // showAlbums: [],
      songs: null
    }
  },
  mounted() {
    this.cloumnCount = 24 / (Math.floor(250 / ( window.innerWidth / 24)))
    this.initliaze();
  },
  watch: {
    exludeListened() {
      this.currentPage = 1
    },
    bySource() {
      this.currentPage = 1
    },
    sortByType() {
      this.currentPage = 1
      console.log('changed', this.currentPage)
    },
    $route() {
      this.initliaze();
    },
    albumsIsCollected() {
      const aIndex = {};
      this.albumsIsCollected.forEach(_ => {
        const indexStr = _.album.toLocaleLowerCase().replace(' (Deluxe Edition)', '').replace(' (Remastered Version)', '')
        aIndex[indexStr] = [_];
      });
      this.allAlbumIndex = aIndex;
      console.log('allAlbumIndex created', this.allAlbumIndex)
    }
  },
  computed: {
    paginationProps () {
      return {
        showSizeChanger: true, 
        current: this.currentPage,
        pageSizeOptions: ['48', '96', '200', '800'],
        defaultPageSize: 48,
        showTotal: total => `全部 ${total} 张专辑`,
        onChange: (page, pageSize) => {
          this.currentPage = page
          console.log(page, pageSize)
          this.goTop();
        }
      }
    },
    showAlbums() {
      console.log('showAlbums.recompute')
      let dataSet = this.albums.filter(_ => {
        if(this.exludeListened) {
          // const isInLibiary = this.albumsIsCollected.filter(ab => ab.album_name == _.album)
          const compareStr = _.album.toLocaleLowerCase()
          const isInLibiary = this.allAlbumIndex[compareStr]
          if(isInLibiary && isInLibiary.length) {
            console.log('isInLibiary', isInLibiary[0], compareStr)
            return false
          }
        }
        if(this.bySource != "all") {
          console.log('_.type', _.type)
          if(this.bySource != _.type) {
            return false
          }
        }
        return true;
      })
      // if(this.sortByListeners) {
      if(this.sortByType == "rec") {
        dataSet = _.sortBy(dataSet, "repeatCount").reverse()
      }

      if(this.sortByType == "top") {
        dataSet = _.orderBy(dataSet, ["listeners"], ['desc'])
      }

      if(this.sortByType == "down") {
        const nodata = dataSet.filter(_ => _.listeners == 0);
        const datasortwed = _.orderBy(dataSet.filter(_ => _.listeners > 0), ["listeners"], ['asc'])
        // dataSet = _.orderBy(dataSet, ["listeners"], ['asc'])
        dataSet = [].concat(datasortwed, nodata)
        // dataSet = dataSet.sort(function(a, b) {
        //   if(a.listeners == 0) {
        //     return true
        //   }
        //   return a.listeners > b.listeners
        // })
      }
        
      // }

      return dataSet
    }
  },
  methods: {
    goTop() {
      document.querySelector("#main-viewport").scrollTop = 0
    },
    initliaze() {
      var recid = this.$route.query.recid || null
      this.loadLocalData();
      if(recid == null) {
        var self = this;
        (function check() {
          self.extensionInstalled = typeof window.$_musichelper != 'undefined';
          if(self.extensionInstalled) {
            self.recom();
            return
          }
          setTimeout(check, 800);
        })();
        // this.songs = [{"song":"Pane of Truth","artist":"Sylvan","album":"Posthumous Silence"},{"song":"Shingle Song (2006 Digital Remaster)","artist":"Peter Hammill","album":"Nadir's Big Chance"},{"song":"Questions","artist":"Sylvan","album":"Posthumous Silence"},{"song":"The Devil","artist":"The Enid","album":"In the Region of the Summer Stars (Original 1976 Emi Recording)"},{"song":"Fool / The Falling Tower","artist":"The Enid","album":"In the Region of the Summer Stars (Original 1976 Emi Recording)"},{"song":"Love Will Find A Way","artist":"Yes","album":"Big Generator"},{"song":"Throwing It All Away (2007 Digital Remaster)","artist":"Genesis","album":"Invisible Touch"},{"song":"Domino Medley (2007 Digital Remaster)","artist":"Genesis","album":"Invisible Touch"},{"song":"In Too Deep (2007 Digital Remaster)","artist":"Genesis","album":"Invisible Touch"},{"song":"Invisible Touch (Remastered 2007)","artist":"Genesis","album":"Invisible Touch"},{"song":"Three Boats Down From The Candy (1997 Digital Remaster)","artist":"Marillion","album":"Script For A Jester's Tear"},{"song":"Market Square Heroes (Battle Priest Version) (1997 Digital Remaster)","artist":"Marillion","album":"Script For A Jester's Tear"},{"song":"The Web (1997 Digital Remaster)","artist":"Marillion","album":"Script For A Jester's Tear"},{"song":"Script For A Jester's Tear (1997 Digital Remaster)","artist":"Marillion","album":"Script For A Jester's Tear"},{"song":"Telling the Bees","artist":"Big Big Train","album":"Folklore"},{"song":"Brooklands","artist":"Big Big Train","album":"Folklore"},{"song":"The Transit of Venus Across the Sun","artist":"Big Big Train","album":"Folklore"},{"song":"London Plane","artist":"Big Big Train","album":"Folklore"},{"song":"The Sun","artist":"The Enid","album":"In the Region of the Summer Stars (Original 1976 Emi Recording)"},{"song":"The Lovers","artist":"The Enid","album":"In the Region of the Summer Stars (Original 1976 Emi Recording)"},{"song":"Death, The Reaper","artist":"The Enid","album":"In the Region of the Summer Stars (Original 1976 Emi Recording)"},{"song":"For Absent Friends","artist":"Genesis","album":"Greatest Hits"},{"song":"Checkmate","artist":"Gryphon","album":"Red Queen to Gryphon Three"},{"song":"Second Spasm","artist":"Gryphon","album":"Red Queen to Gryphon Three"},{"song":"Opening Move","artist":"Gryphon","album":"Red Queen to Gryphon Three"},{"song":"Paper Chase","artist":"Anthony Phillips","album":"Wise After the Event"},{"song":"Greenhouse","artist":"Anthony Phillips","album":"Wise After the Event"},{"song":"Regrets","artist":"Anthony Phillips","album":"Wise After the Event"},{"song":"Ripples (2007 - Remaster)","artist":"Genesis","album":"A Trick Of The Tail"},{"song":"Entangled (2007 - Remaster)","artist":"Genesis","album":"A Trick Of The Tail"},{"song":"The Colony Of Slippermen (The Arrival/A Visit To The Doktor/Raven) (2008 Digital Remaster)","artist":"Genesis","album":"The Lamb Lies Down On Broadway"},{"song":"The Waiting Room (2008 Digital Remaster)","artist":"Genesis","album":"The Lamb Lies Down On Broadway"},{"song":"For Absent Friends (Digital Remastered 2008)","artist":"Genesis","album":"Nursery Cryme"},{"song":"Seven Stones (Digital Remastered 2008)","artist":"Genesis","album":"Nursery Cryme"},{"song":"The Musical Box (Digital Remastered 2008)","artist":"Genesis","album":"Nursery Cryme"},{"song":"Stagnation (Digital Remastered 2008)","artist":"Genesis","album":"Trespass"},{"song":"Looking For Someone (Digital Remastered 2008)","artist":"Genesis","album":"Trespass"},{"song":"In Hiding","artist":"Genesis","album":"From Genesis To Revelation"},{"song":"A Day Will Come","artist":"Buckethead","album":"Population Override"},{"song":"In The Wilderness","artist":"Genesis","album":"From Genesis To Revelation"},{"song":"A Day Will Come","artist":"Buckethead","album":"Population Override"},{"song":"Earth Heals Herself","artist":"Buckethead","album":"Population Override"}]
        // setTimeout(() => {
        //   this.recom();
        // }, 1000)
      } else {
        this.extensionInstalled = true;
        this.loadRec(recid);
      }
    },
    processShowData(albums) {
      return albums.map(source => {
        let _ = { ... source };
        if(_.cover.indexOf('wp.com') < 0) {
          _.cover = _.cover.replace('https://', '').replace('.webp', '')
          _.cover = getResizeImage(_.cover)
        }
        if(!_.cloudmusicLink) {
          var searchWordReal = _.artist ? `${_.album}  ${_.artist}`: _.album
          var searchWord = encodeURIComponent(searchWordReal)
          _.cloudmusicLink = `https://music.163.com/#/search/m/?s=${searchWord}&type=1`
          var xW = encodeURIComponent(JSON.stringify({
            searchKey: searchWordReal
          }));
          _.albumKeyword = searchWordReal
          _.listeners = _.listeners || 0;
          _.xiamiLink = `https://www.xiami.com/list?scene=search&type=song&query=${xW}`

        }
        return _;
      })
    },
    async loadRec(docId) {
      const recoResult = await getAlbumsByRecId(docId)
      const albums = recoResult.albums
      try {
        _hmt && _hmt.push(['_trackEvent', 'explre', 'loadRec', albums.length]);
      } catch (e) {}
      this.fetchSimliar = false
      const parsedAlbums = this.processShowData(albums)
      this.albums = _.shuffle(parsedAlbums);
    },
    async createCustom() {
      const customssongs = this.customsongs.split("\n")
      .map(_ => _.split("\t"))
      .map(_ => {
        return {
          song: _[0],
          artist: _[1],
          album: _[2]
        };
      }).filter(_ => _.artist);
      if(customssongs.length == 0) {
        alert('解析失败');
        return
      }
      this.albums = []
      const songHash = md5(JSON.stringify(customssongs)).substr(0, 6);
      const result = await this.recom(false, {
        type: 'custom_' + songHash,
        songs: customssongs
      })
      this.visible = false;
      // console.log(result)
      this.$router.push({
        query: {
          recid: result.id
        }
      })
    },
    playAlbum(album) {
      window.$player.playAlbum(album.albumKeyword)
    },
    async loadLocalData() {
      let isAlive = true
      try {
        const { data } = await api.get('/api/song/query', {
         params: {
            rawSql: 'select count(distinct(song_name)) as songs, album_name as album, artist_name as artist, album_logo from songs group by album_name, artist_name  order by songs desc',
          }
        });
        this.albumsIsCollected = data;
      } catch (e) {
        isAlive = false
        // this.albumsIsCollected = 
      }

      if(!isAlive) {
        try {
            const eDoc = await recentDb.get("all_songs")
            // eDoc.all_songs = {
            //   xiami: allData[0],
            //   cloudmusic: allData[1]
            // }

            const allRows = [].concat(eDoc.all_songs.xiami, eDoc.all_songs.cloudmusic)
            // console.log('eDoc.all_songs ', eDoc.all_songs )
            this.albumsIsCollected = allRows
            // eDoc.all_songs = Date.now()
            // await recentDb.put(eDoc)
        } catch (e) {}
      }
     
      // console.log('loadLocalData', data)
    },
    async recom(force = false, opts = {}) {
      try {
        _hmt && _hmt.push(['_trackEvent', 'explre', 'recom', 'init']);
      } catch (e) {}

      const type = opts.type || 'recent';
      const isNotRecent = type != 'recent'
      let recBySongs = []

      if(isNotRecent) {
        recBySongs = opts.songs;
      }

      if(!isNotRecent) {
        const recentDocId = 'recent';
        let cacheDoc = null
        try {
          cacheDoc = await recentDb.get(recentDocId)
        } catch (e) {}
        const needFetch = cacheDoc == null || cacheDoc != null && ((Date.now() - cacheDoc.time) > 8 * 60 * 60 * 1000);
        let rencetSongs = []
          console.log('cacheDoc', cacheDoc, 'needFetch', needFetch)
        if(needFetch) {
          this.isScaning = true
          try {
            const allData = await Promise.all([
              getXiamiCollect(),
              getCloudMusicCollect()
            ]);
            rencetSongs = [].concat(allData[1].slice(0, 50), allData[0].slice(0, 50))
            console.log('rencetSongs', rencetSongs)
            if (rencetSongs.length) {
              cacheDoc = cacheDoc == null ? {
                _id: recentDocId
              } : cacheDoc
              cacheDoc.songs = rencetSongs;
              cacheDoc.time = Date.now()
              await recentDb.put(cacheDoc)
              this.notFound = false
            } else {
              this.notFound = true
              console.log('not found songs')
            }

            const allSongsDocId = 'all_songs';
            try {
              const eDoc = await recentDb.get(allSongsDocId)
              eDoc.all_songs = {
                xiami: allData[0],
                cloudmusic: allData[1]
              }
              eDoc.time = Date.now()
              await recentDb.put(eDoc)
            } catch (e) {
              console.log('update failed try create')
              await recentDb.put({
                _id: allSongsDocId,
                all_songs: {
                  xiami: allData[0],
                  cloudmusic: allData[1]
                },
                time: Date.now()
              })
            }
          } catch (e) {
          }
          this.isScaning = false
        } else {
          rencetSongs = cacheDoc.songs
        }
        recBySongs = rencetSongs;
      }
      
      try {
        _hmt && _hmt.push(['_trackEvent', 'explre', 'rencentSongs', rencetSongs.length]);
      } catch (e) {}
      // const xiami = await getXiamiCollect();
      // const songs = await getCloudMusicCollect();
      // const recent = songs.splice(0, 40)
      // rencetSongs = rencetSongs.slice(0, 50)
      console.log('recBySongs', recBySongs)
      this.fetchSimliar = true
      var self = this
      const recoResult = await getAlbums(recBySongs, {
        type: type,
        progress: function(data) {
          var newData = JSON.parse(JSON.stringify(data));
          data.items = self.processShowData(data.items)
          self.currentFound = data
          console.log('progress.data', data)
        }
        // force: true
      })

      const albums = recoResult.albums
      try {
        _hmt && _hmt.push(['_trackEvent', 'explre', 'getAlbums', albums.length]);
      } catch (e) {}
      this.fetchSimliar = false
      const parsedAlbums = this.processShowData(albums)
      this.albums = _.shuffle(parsedAlbums);
      return recoResult
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.album-item {
  margin-bottom: 15px;
  width: 250px;
  position: relative;
  text-shadow: 0 0 10px rgba(0,0,0,.7);
  color: #fff;
  /* height: 250px; */
}

.album-item .image-content{
  position: absolute;
  bottom: 0;
  /* width: 100%; */
  padding: 15px;
}

/* .album-item img {
  margin-bottom: 10px;
} */
.page-title {
  /* color: black; */
  text-align: left;
  margin-bottom: 20px;
  margin-left: 15px;;
}

.page-content {
   margin-left: 15px;;
}

.page {
  /* width: 85%; */
  text-align: left;
}
.outlinks a {
  margin-right: 7px;
}

.album-item  .playlink {
  position: relative;
  font: 0/0 a;
  text-shadow: none;
  color: transparent;
  vertical-align: top;
  display: inline-block;
  min-width: 0;
  text-align: left;
  position: absolute;
  top: 15px;
  left: 15px;
  width: 48px;
  height: 48px;
  display: none;
}

.album-item:hover .playlink {
   display: inline-block;
}

.album-item .cover-image {
  overflow: hidden
}

.album-item .image img {
position: absolute;
    top: 0;
    width: 100%;
}

.album-title {
  color: white;
  margin-bottom: 5px;
}

.album-item .context {
  background-color: #222;
  color: #aaa;
  padding: 10px 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.album-item .desc {
  font-size: 12px;
  margin-bottom: 0;;
}
.layout-image {
  position: relative;
  padding-top: 100%;
}

.layout-image-image {
  position: absolute;
  top: 0;
  width: 100%;
}

.album-item .cover-image:after {
    background-image: -webkit-gradient(linear,left top,left bottom,from(transparent),color-stop(70%,rgba(0,0,0,.35)),to(rgba(0,0,0,.7)));
    background-image: linear-gradient(180deg,transparent 0,rgba(0,0,0,.35) 70%,rgba(0,0,0,.7));
    content: "";
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    /* z-index: -1; */
}

.filter-bar {
  padding: 0 10px;
  margin-bottom: 12px;
}

</style>
