import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
Vue.config.productionTip = false;

Vue.use(Antd);
Vue.use(VueRouter);
const router = new VueRouter({
  'mode': 'history',
  routes: [],
});
new Vue({
  router,
  render: (h: any) => h(App)
}).$mount('#app');
