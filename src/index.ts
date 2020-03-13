import {__importDefault} from "tslib";

export * from './define/CFDefine';
import * as CFField from './define/FieldDefine';
export {CFField}
export * from './define/FieldUtil';
export * from './define/ICFRequest';
export * from './define/MenuDefine';
export * from './define/ViewDefine';
export * from './define/CFButtonDefine';
import CFView from './components/CFView.vue';
import CFForm from './components/CFForm.vue';
import CFViewWithDrawer from './components/CFViewWithDrawer.vue';
import CFFormWithDrawer from './components/CFFormWithDrawer.vue';
import CFParentView from './components/CFParentView.vue';
import Vue from "vue";
const components: any[] = [
  CFView,
  CFForm,
  CFViewWithDrawer,
  CFFormWithDrawer,
  CFParentView,
];
export {CFView};
export {CFForm};
export {CFViewWithDrawer};
export {CFFormWithDrawer};
export {CFParentView};

const install = function (vue: typeof Vue) {
  components.forEach(component => {
    vue.component(component.name, component)
  })
};

// 自动注册组件
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}
export default {install};
