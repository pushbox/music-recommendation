import Vue from "vue";
import Router from "vue-router";
import explore from "@/components/explore";
import about from "@/components/about";
import recent from "@/components/recent";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "explore",
      component: explore,
    },
    {
      path: "/about",
      name: "about",
      component: about,
    },
    {
      path: "/recent",
      name: "recent",
      component: recent,
    },
  ],
});
