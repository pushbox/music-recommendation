// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import router from "./router";

// import "ant-design-vue/dist/antd.less";
// import "./theme.less"
// import "ant-design-vue/dist/antd.less";

import layout from "ant-design-vue/lib/layout"; // 加载 JS
Vue.use(layout);

import menu from "ant-design-vue/lib/menu"; // 加载 JS
Vue.use(menu);

import icon from "ant-design-vue/lib/icon"; // 加载 JS
Vue.use(icon);

import card from "ant-design-vue/lib/card"; // 加载 JS
Vue.use(card);

import table from "ant-design-vue/lib/table"; // 加载 JS
Vue.use(table);

import radio from "ant-design-vue/lib/radio"; // 加载 JS
Vue.use(radio);


import checkbox from "ant-design-vue/lib/checkbox"; // 加载 JS
Vue.use(checkbox);


;
router.afterEach((to, from) => {
  // 每次进入路由都会触发
  if (window._hmt) {
    if (to.path) {
      window._hmt.push(["_setAutoPageview", false]);
      window._hmt.push(["_trackPageview", to.fullPath]); // 如果不是根路径，需要指定第二个参数的路径
    }
  }
});

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");