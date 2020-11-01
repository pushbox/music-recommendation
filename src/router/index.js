import Vue from "vue";
import Router from "vue-router";
import HelloWorld from "@/components/HelloWorld";
import About from "@/components/About";
import recent from "@/components/recent";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "explore",
      component: HelloWorld
    },
    {
      path: "/about",
      name: "ABout",
      component: About
    },
    {
      path: "/recent",
      name: "recent",
      component: recent
    }
  ]
});
