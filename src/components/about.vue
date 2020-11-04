<template>
  <a-card :bordered="true" type="inner" :bodyStyle="{ padding: '10px 20px' }">
    <div style="padding: 15px"></div>
    <h2>推荐机制</h2>
    <p>基于当前浏览器登录过的网易云音乐账号+虾米音乐最近收藏的50首歌。</p>
    <p>然后按专辑收藏数量分别去音乐平台，抓取相似的专辑。</p>
    <p>根据本地库或线上库排除已经听过的专辑，按需要再排序！</p>
    <h2 style="margin-top:25px">数据源</h2>
    <ul>
      <li><a href="https://www.last.fm/" target="_blank">last.fm</a></li>
      <li><a href="https://music.douban.com/tag/" target="_blank">豆瓣音乐</a></li>
    </ul>
    <div style="text-align: left; padding-top: 50px;" class="about-page">
      <a
        href="https://music.wechatsync.com/?utm_source=extension_about"
        target="_blank"
        ><img src="~@/assets/logo.png" height="60" /> <br />
        <p style="font-size: 22px; ">歌单助手</p></a
      >
      <div
        style="color: rgb(119, 119, 119); margin-top: 20px; margin-bottom: 40px"
      >
        <p>
          作者:
          <a href="https://www.douban.com/people/52076105/" target="_blank"
            >fun</a
          >
        </p>
        <!-- <p>版本：0.0.2</p>  -->
        <p>
          Github:
          <a href="https://github.com/lljxx1/music-recommendation" target="_blank"
            >lljxx1/music-recommendation</a
          >
        </p>
        <p>
          问题反馈:<a
            href="https://support.qq.com/products/284751"
            target="_blank"
            >https://support.qq.com/products/284751</a
          >
        </p>
      </div>
    </div>
  </a-card>
</template>

<script>
// import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
// import api from '@/api.js'
export default {
  data() {
    return {
      data: []
    };
  },
  name: "landing-page",
  // components: { ScaleLoader },
  watch: {},
  methods: {},
  mounted() {}
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
</style>
