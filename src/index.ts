import {__importDefault} from "tslib";

export * from './define/CFDefine';
import * as CFField from './define/FieldDefine';
export {CFField}
export * from './define/FieldUtil';
export * from './define/CFIRequest';
export * from './define/MenuDefine';
export * from './define/ViewDefine';
import CFCommonView from './components/CFCommonView.vue';
import CFCommonForm from './components/CFCommonForm.vue';
import CFCommonViewWithDrawer from './components/CFCommonViewWithDrawer.vue';
import CFCommonFormWithDrawer from './components/CFCommonFormWithDrawer.vue';
import CommonParentView from './components/CommonParentView.vue';
const components: any[] = [
  CFCommonView,
  CFCommonForm,
  CFCommonViewWithDrawer,
  CFCommonFormWithDrawer,
  CommonParentView,
];
export {CFCommonView};
export {CFCommonForm};
export {CFCommonViewWithDrawer};
export {CFCommonFormWithDrawer};
export {CommonParentView};

const install = function (Vue: any) {
  components.forEach(component => {
    Vue.component(component.name, component)
  })
};

// 自动注册组件
// @ts-ignore
if (typeof window !== 'undefined' && window.Vue) {
  // @ts-ignore
  install(window.Vue);
}

export default install
