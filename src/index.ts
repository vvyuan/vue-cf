import {__importDefault} from "tslib";

export * from './define/CFDefine';
import * as CFField from './define/FieldDefine';
export {CFField}
export * from './define/FieldUtil';
export * from './define/ICFRequest';
export * from './define/MenuDefine';
export * from './define/ViewDefine';
import CFCommonView from './components/CFCommonView.vue';
import CFCommonForm from './components/CFCommonForm.vue';
import CFCommonViewWithDrawer from './components/CFCommonViewWithDrawer.vue';
import CFCommonFormWithDrawer from './components/CFCommonFormWithDrawer.vue';
import CFCommonParentView from './components/CFCommonParentView.vue';
import Vue from "vue";
const components: any[] = [
  CFCommonView,
  CFCommonForm,
  CFCommonViewWithDrawer,
  CFCommonFormWithDrawer,
  CFCommonParentView,
];
export {CFCommonView};
export {CFCommonForm};
export {CFCommonViewWithDrawer};
export {CFCommonFormWithDrawer};
export {CFCommonParentView};

const install = function (vue: typeof Vue) {
  console.log('install', components);
  components.forEach(component => {
    vue.component(component.name, component)
  })
};

// 自动注册组件
if (typeof window !== 'undefined' && window.Vue) {
  console.log('auto install', components);
  install(window.Vue);
}
export default {install}
