<template>
<div>
  
  <div class="page" v-if="notFound">
    <h2 class="page-title">未登录</h2>
    <div class="page-content">
      <p>请登陆你的<a href="https://www.xiami.com/" target="_blank">虾米音乐</a>账号</p>
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
    <div class="page-content">
      <div style="width: 780px; margin-bottom: 15px">
        <a-alert  type="info" closable>
          <span slot="message">
            本工具目前最多只能导出最多200页的数据，收藏歌曲数超过5000的请使用windows桌面端的歌单助手！<a href="https://support.qq.com/products/284751/faqs/83552" target="_blank" style="color: red">使用教程</a>
          </span>
        </a-alert>
      </div>
     <!-- <a-card :bordered="true" type="inner" :bodyStyle="{ padding: '25px 20px' }"> -->
      <div v-if="!isExporting && !exportDone">
        <h2>虾米音乐导出工具</h2>
        <div style="padding: 25px 0" class="filter-bar" v-if="!fetchSimliar && !isScaning">
            <a-checkbox-group :options="exportTypes" v-model="needExports" style="margin-right: 10px"/>
        </div>
        <a-button type="primary" size="large" @click="exportTask">
          开始导出
        </a-button>
      </div>
      <div v-if="!isExporting && exportDone">
        <h2>导出成功！<a-button type="primary" style="margin-left: 40px" @click="resetExport">
          重新导出
        </a-button></h2>
        <div>
          <a-tabs>
            <a-tab-pane :key="dataTab.type" :tab="dataTab.name" v-for="dataTab in dataTabs">

            <a-card :bordered="true" type="inner"  :bodyStyle="{ padding: '1px 0'}"> 
        <div slot="title">
          {{ dataTab.name }} ({{ dataTab.total }})
        </div>
        <div class="operate" slot="extra">
          <a-button type="dashed" style="margin-right: 8px" @click="download(dataTab)" icon="download">下载</a-button>
        </div>
          <a-table bordered :columns="dataTab.columns" :data-source="dataTab.data" :pagination="paginationProps">
            <div slot="html" class="custom-desc" slot-scope="text" v-html="text" style="width: 250px"></div>
            <pre slot="code" slot-scope="text" v-html="text"  style="width: 450px"></pre>
          </a-table>
      </a-card>
              
            
            </a-tab-pane>
          </a-tabs>
        </div>
        
      </div>
      <div v-if="isExporting">
        <h2>正在导出</h2>
        <p>请耐心等待... 不要关闭页面!</p>
      </div>
     <!-- </a-card> -->
     <div id="alllogs" v-if="logStack.length">
       <div v-for="log in logStack" v-html="log" class="log-item"></div>
     </div>
    </div>
    <!-- <div v-if="albums.length" style="padding: 0 10px 20px">{{ showAlbums.length }}张</div> -->
  </div>
</div>
</template>


<script>
import { getAlbumsByRecId, getAlbums, getCloudMusicCollect, getXiamiCollect } from './helper'
import axios from 'axios'
import { getResizeImage } from './api'
import { Exporter } from './exporter'
const moment = require("moment");

const api = axios.create({
  baseURL: "http://localhost:8956",
  timeout: 4000
});
import md5 from "js-md5";
var PouchDB = require("pouchdb").default;
var taskDB = new PouchDB("export_tasks");
const _ = require('lodash')
window._ = _;

function convertHTMLEntity(text){
    const span = document.createElement('span');
    return text
    .replace(/&[#A-Za-z0-9]+;/gi, (entity,position,text)=> {
        span.innerHTML = entity;
        return span.innerText;
    });
}

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
      exportDone: false,
      currentPage: 1,
      albumsIsCollected: [],
      logStack: [],
      isExporting: false,
      fetchSimliar: false,
      allAlbumIndex: {},
      cloumnCount: 4,
      currentFound: null,
      sortByType: 'rec',
      bySource: 'all',
      needExports: [],
      forceExport: false,
      dataTabs: [],
      tableColumns: {
        artist: [
          {
            title: '艺术家',
            dataIndex: 'artist',
          },
        ],
        album: [
          {
            title: '专辑',
            dataIndex: 'album_name',
            width: 200,
          },
          {
            title: '艺术家',
            dataIndex: 'artist',
          },
          {
            title: '收藏时间',
            dataIndex: 'faved_time',
          }
        ],
        song: [
          {
            title: '歌曲',
            dataIndex: 'song_name',
            width: 200,
          },
          {
            title: '艺术家',
            dataIndex: 'artist',
          }
        ],
        collect: [
          {
            title: '歌单名称',
            dataIndex: 'collect_name',
          },
          {
            title: '描述',
            dataIndex: 'full_desc',
            scopedSlots: { customRender: 'html' },
            width: 100
          },
          {
            title: '详情',
            dataIndex: 'infos_display',
            scopedSlots: { customRender: 'code' },
            width: 100
          },
          {
            title: '歌曲',
            dataIndex: 'songs_display',
            scopedSlots: { customRender: 'code' },
          }
        ]
      },
      exportTypes: [
        { label: '收藏歌曲', value: 'song' },
        { label: '收藏专辑', value: 'album' },
        { label: '关注艺人', value: 'artist' },
        { label: '歌单', value: 'collect' },
      ],
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
        showTotal: total => `全部 ${total} 结果`,
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
     download (dataTab) {
      console.log('download')
      import('@/Export2Excel').then(excel => {
        // console.log('start', this.$refs.table.localDataSource)
        // const rowData = this.$refs.table.localDataSource
        const typeHeaders = {
          artist: [
            {
              name: '艺术家',
              dataIndex: 'artist'
            }, {
              name: '标签',
              dataIndex: 'tags'
            }, {
              name: '头像',
              dataIndex: 'cover'
            }
          ],
          song: [
            {
              title: '歌曲',
              dataIndex: 'song_name',
              width: 200,
            },
            {
              title: '艺术家',
              dataIndex: 'artist',
            }
          ],
          album: [
            {
              name: '艺术家',
              dataIndex: 'artist'
            }, {
              name: '专辑',
              dataIndex: 'album_name'
            }, {
              name: '收藏时间',
              dataIndex: 'faved_time'
            }, {
              name: '标签',
              dataIndex: 'tags'
            }, {
              name: '封面',
              dataIndex: 'cover'
            }
          ],
          collect: [
            {
              title: '歌单名称',
              dataIndex: 'collect_name',
            },
            {
              title: '描述',
              dataIndex: 'full_desc',
              scopedSlots: { customRender: 'html' },
              width: 100
            },
            {
              title: '详情',
              dataIndex: 'infos_display',
              scopedSlots: { customRender: 'code' },
              width: 100
            },
            {
              title: '歌曲',
              dataIndex: 'songs_display',
              scopedSlots: { customRender: 'code' },
            }
          ]
        }

        const currentHeaders = typeHeaders[dataTab.type]
        const tHeader = currentHeaders.map(_ => _.name ? _.name : _.title)
        const data = []
        dataTab.data.forEach(row => {
          const rowItem = []
          // rowItem.push(row.song_name)
          // rowItem.push(row.artist_name)
          // rowItem.push(row.album_name)
          data.push(currentHeaders.map(_ => {
            if(row[_.dataIndex]) {
              return row[_.dataIndex];
            }
            return '';
          }))
        })
        const filename = [
          dataTab.name,
          moment().format('YYYY-MM-DD_hh:mm:ss')
        ].join('-')

        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: filename + '.xlsx',
          autoWidth: true,
          bookType: 'xlsx'
        })
      })
    },
    goTop() {
      document.querySelector("#main-viewport").scrollTop = 0
    },
    initliaze() {
      var recid = this.$route.query.recid || null
      // this.loadLocalData();
      if(recid == null) {
        var self = this;
        (function check() {
          self.extensionInstalled = typeof window.$_musichelper != 'undefined';
          if(self.extensionInstalled) {
            self.checkpoint();
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

    async loadState() {
      const taskDocId = 'current_task'
      try {
        const eDoc = await taskDB.get(taskDocId)
        return eDoc.state
      } catch (e) {}

      var jobTypes = [].concat(this.needExports);
      var initailState = {
        jobTypes: jobTypes,
        leftTypes: jobTypes
      }
      return initailState
    },

    async checkpoint() {
      const hasNotDoneTask = await this.hasTaskNotDone();
      if(hasNotDoneTask) {
        this.runExportTask();
      }
    },

    async hasTaskNotDone() {
      const taskDocId = 'current_task'
      try {
        const eDoc = await taskDB.get(taskDocId)
        return true
      } catch (e) {}
      return false
    },

    addLog(log) {
      this.logStack.unshift(log);
      if(this.logStack.length > 50) {
        this.logStack.pop();
      }
    },

    async resetExport() {
      const taskDocId = 'current_task'
      await taskDB.get(taskDocId).then(function (doc) {
        doc._deleted = true;
        return taskDB.put(doc);
      });
      this.forceExport = true;
      this.exportDone = false;
      this.isExporting = false;
      this.logStack = [];
      console.log('resetExport')
    },

    async saveTaskProgress(state) {
      const taskDocId = 'current_task'
      try {
        const eDoc = await taskDB.get(taskDocId)
        eDoc.state = state
        eDoc.time = Date.now()
        await taskDB.put(eDoc)
      } catch (e) {
        console.log('update failed try create')
        await taskDB.put({
            _id: taskDocId,
            state: state,
            time: Date.now()
        })
      }
    },

    async runExportTask() {
      var self = this;
      var initailState = await this.loadState();
      this.isExporting = true;
      const runForce = this.forceExport
      if(this.forceExport) {
        this.forceExport = false;
      }
      await this.saveTaskProgress(initailState)
      var runTypes = [].concat(initailState.leftTypes);
      for (let index = 0; index < 6; index++) {
        try {
          const needExport = runTypes.pop();
          if(!needExport) {
            console.log('all done');
            break;
          }
          self.addLog(`准备导出: ${needExport}`)
          const expotInstance = new Exporter({
            type: needExport,
            force: runForce,
            progress: function(meta) {
              if(meta.progressType == 'fetch') {
                self.addLog(`准备提取: ${meta.url}`)
              }
              if(meta.progressType == "pageend") {
                self.addLog(`提取完毕: 发现${meta.state.pageData.length}条数据; ${meta.state.pageMeta}`)
              }

               if(meta.progressType == "wait") {
                self.addLog(`等待 ${meta.duration}毫秒`)
              }
              console.log('meta', meta)
            }
          })
          await expotInstance.export();
          await this.saveTaskProgress({
            jobTypes: initailState.jobTypes,
            leftTypes: runTypes
          })
        } catch (e) {
          console.log('export failed', e)
        }
      }
      console.log('all task done')
      this.exportDone = true;
      this.isExporting = false;
      this.loadTaskData(initailState);
    },

    async loadTaskData(initailState) {
      const allTypes = initailState.jobTypes
      const dataByType = {}
      const dataTables = []
    
      for (let index = 0; index < allTypes.length; index++) {
        try {
          const jobType = allTypes[index];
          const expotInstance = new Exporter({
            type: jobType
          })
          const typeResults = await expotInstance.getData();
          dataByType[jobType] = typeResults
          let dataRows = JSON.parse(JSON.stringify(typeResults.rows));
          if(jobType === 'collect') {
            dataRows = dataRows.map(_ => {
              try {
                _.full_desc = _.full_desc && convertHTMLEntity(_.full_desc);
              } catch (e) {}
              _.songs_display = _.songs.map(c => {
                return [
                  [
                  c.song_name.trim(),
                  c.artist_name
                ].join(' - '),
                  c.quote.trim()
                ].join("\t")
              }).join("\n")
              _.infos_display = _.infos.map(c => {
                return  [
                  c.name,
                  c.value
                ].join(':')
              }).join("\n")
              return _;
            })
          }
          dataTables.push({
            type: jobType,
            name: this.exportTypes.filter(_ => _.value === jobType)[0].label,
            total: typeResults.rows.length,
            data: dataRows,
            columns: this.tableColumns[jobType] || [],
            raw: typeResults
          })
        } catch (e) {
          console.log('export failed', e)
        }
      }

      this.dataTabs = dataTables
      console.log(dataTables)
    },

    async exportTask(force = false, opts = {}) {
      try { 
        const ximiSongs = await getXiamiCollect()
        if(ximiSongs.length === 0) {
          console.log('not login')
          this.notFound = true;
        } else {
          console.log('login')
        }
      } catch (e) {}

      if(this.notFound) {
        alert('未登录');
        return;
      }
      await this.runExportTask();
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

#alllogs {
  background: #222;
  padding: 20px;
  margin-top: 20px;
  line-height: 180%;
}

</style>

<style>
.custom-desc img {
  max-width: 100%;
}

</style>