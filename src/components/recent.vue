
<template>
<a-card :bordered="true" type="inner"  :bodyStyle="{ padding: '1px 0'}"> 

  <div slot="title">
          <a-radio-group name="radioGroup" v-model="filters.type" :default-value="'all'">
            <a-radio value="all">
              全部
            </a-radio>
            <a-radio value="cloudmusic">
              网易云
            </a-radio>
            <a-radio value="xiami">
              虾米
            </a-radio>
          </a-radio-group>
        </div>
        <div class="operate" slot="extra">
          <!-- <a-button type="dashed" style="margin-right: 8px" @click="download" icon="download">导出</a-button> -->
        </div>
        <a-table :columns="columns" :loading="loading" :data-source="allSongs" :pagination="{pageSize: 50, showTotal: total => `全部 ${total} 结果`}">
            <a slot="name" slot-scope="text, item" target="_blank" :href="item.link">
                <img :src="item.album_logo" height="20" style="vertical-align: -5px; margin-right: 6px;"/>{{ text }}
            </a>
            <span slot="customTitle"><a-icon type="smile-o" /> Name</span>
        </a-table>
</div>
  </a-card>
</template>

<script>

var PouchDB = require("pouchdb").default;
var recentDb = new PouchDB("recent_songs");
// import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
// import api from '@/api.js'
  export default {
      data() {
          return {
            columns: [
                  {
                        dataIndex: 'song',
                        key: 'name',
                        title: '歌曲名',
                        // slots: { title: 'customTitle' },
                        // scopedSlots: { customRender: 'name' },
                    },
                    {
                        dataIndex: 'artist',
                        key: 'artist',
                        title: '艺术家',
                        // slots: { title: 'customTitle' },
                        // scopedSlots: { customRender: 'name' },
                    },{
                        dataIndex: 'album',
                        key: 'album',
                        title: '专辑',
                        // slots: { title: 'customTitle' },
                        // scopedSlots: { customRender: 'name' },
                    }
              ],
              filters: {
                type: 'all'
              },
              importing: false,
              importTip: null,
              loading: true,
              rows: [],
              notData: false,
              songs: [],
          }
      },
    name: 'landing-page',
    // components: { ScaleLoader },
    watch: {
      
    },
    computed: {
      allSongs() {
        return this.rows.filter(_ => {
          if(this.filters.type && this.filters.type != 'all') {
            return _.type == this.filters.type
          }
          return true
        });
      }
    },
    methods: {
       async loadData() {

         this.loading = true
          const allSongsDocId = 'all_songs';
          let allData = null
          try {
            allData = await recentDb.get(allSongsDocId)
          }catch(e) {
            this.notData = true
            console.log(e)
          }
          console.log(allData)
          this.loading = false
          this.rows = [].concat(allData.all_songs.xiami.slice(0, 100), allData.all_songs.cloudmusic.slice(0, 100))
       }
    },
    mounted() {
        this.loadData()
    },
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    height: 100vh;
    /* padding: 60px 80px; */
    width: 100vw;
    text-align: center;
  }

  .about-page p {
      margin-bottom: 5px;
  }

</style>
