<template>
  <div id="app">
    <!-- <router-view></router-view> -->
    <a-layout
      id="components-layout-demo-custom-trigger"
      :style="{ 'min-height': '100vh' }"
    >
      <a-layout-sider :trigger="null" collapsible>
        <div class="logo">
          <img src="@/assets/logo.png" height="50" />
        </div>
        <a-menu theme="dark" mode="inline" :selectedKeys="selectedKeys">
          <a-menu-item key="/">
            <router-link :to="'/'">
              <a-icon type="appstore" />
              <span>今日推荐</span>
            </router-link>
          </a-menu-item>
          <a-menu-item key="/recent" style="margin-top:0">
            <router-link :to="'/recent'">
              <a-icon type="heart" />
              <span>最近收藏</span>
            </router-link>
          </a-menu-item>
          <!-- <a-menu-item key="/artists" >
          <router-link :to="'/artists'">
            <a-icon type="user" />
            <span>艺术家</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="/album">
          <router-link :to="'/album'">
            <a-icon type="profile" />
            <span>专辑</span>
          </router-link>
        </a-menu-item> -->
          <a-menu-item key="/about">
            <router-link :to="'/about'">
              <a-icon type="info-circle" />
              <span>关于</span>
            </router-link>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout style="height:100vh; overflow-y:scroll">
        <a-layout-content :style="{ margin: '20px 16px', minHeight: '280px' }">
          <a-row>
            <router-view></router-view>
          </a-row>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script>
export default {
  name: "music-exporter",
  data() {
    return {
      selectedKeys: [this.$route.path]
    };
  },
  watch: {
    $route() {
      this.selectedKeys = [this.$route.path];
    }
  }
};
</script>

<style lang="less">

@import '~ant-design-vue/lib/style/themes/default.less';
@import '~ant-design-vue/dist/antd.less';
@import './theme.less';
/* @import '~ant-design-vue/dist/antd.less'; */
/* 设置滚动条的样式 */
::-webkit-scrollbar {
  width: 8px;
}
/* 滚动槽 */
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset006pxrgba(0, 0, 0, 0.3);
  border-radius: 10px;
}
/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: #555;
  -webkit-box-shadow: inset006pxrgba(0, 0, 0, 0.5);
}
::-webkit-scrollbar-thumb:window-inactive {
  background: #ccc;
}

body {
  min-height: 100vh;
  /* padding: 60px 80px; */
  /* width: 100vw; */
  /* text-align: center; */
}
/* CSS */

#app .ant-table-pagination.ant-pagination {
  margin-right: 20px;
}

.logo {
  padding: 15px 0 15px 20px;
  /* background: black; */
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  /* color: #2c3e50; */
}

body {
  color: #b3b3b3;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: white;
}

h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: white;
}
.ant-layout-content a:hover {
  color: white;
  text-decoration: underline;
}
p {
  margin-top: 0;
  margin-bottom: 10px;
}

html,
body,
.ant-layout {
  background: #131313;
}

.ant-menu-dark,
.ant-menu-dark .ant-menu-sub,
.ant-layout-sider {
  background: black;
}

.ant-menu.ant-menu-dark .ant-menu-item-selected,
.ant-menu-submenu-popup.ant-menu-dark .ant-menu-item-selected {
  background: #282828;
}

.ant-card {
  color: white;
  background: #282828;
  border: 0;
}
</style>
