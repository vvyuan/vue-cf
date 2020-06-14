import VueRouter from "vue-router";
import {ICFForm, ICFView} from "./ViewDefine";
import {Modal} from "ant-design-vue";

export enum CFButtonPosition {
  // table
  tableHeaderLeft = 'tableHeaderLeft',
  tableHeaderRight = 'tableHeaderRight',
  tableRowOperations = 'tableRowOperations',
  // form
  inlineHeaderLeft = 'inlineHeaderLeft',
  inlineHeaderCenter = 'inlineHeaderCenter',
  inlineHeaderRight = 'inlineHeaderRight',
  inlineFooterLeft = 'inlineFooterLeft',
  inlineFooterCenter = 'inlineFooterCenter',
  inlineFooterRight = 'inlineFooterRight',
  drawerFooterLeft = 'drawerFooterLeft',
  drawerFooterRight = 'drawerFooterRight',
}

export type CFButton = {
  key?: string, // 自动设置
  title: string,
  tips?: string, // 鼠标悬浮提示信息
  icon?: string,
  type?: 'primary' | 'danger' | 'default' | 'dashed' | 'link',
  htmlType?: 'submit' | 'button' | 'reset',
  auth?: string,
  position: CFButtonPosition[],
  // 从小到大，从左到右，默认0
  sort?: number,
  /**
   * 该按钮的点击事件
   * @param router 全局路由
   * @param cfConfig 所在的配置
   * @param view commonView
   * @param form commonForm
   * @param selectedRecords 已选中的记录，仅在CFButtonPosition.tableHeader中生效
   * @param record 当前记录，仅在CFButtonPosition.tableRowOperations中生效
   */
  onClick(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): void,
  /**
   * table中选中行事件的响应
   * @param selectedRecords
   */
  onTableSelected?(selectedRecords: any[]): void,
  _conditionOfDisable?: boolean;
  /**
   * 禁用条件，参数同onClick
   */
  conditionOfDisable?(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): boolean | Promise<boolean>;
  _conditionOfDisplay?: boolean;
  /**
   * 显示条件，参数同onClick
   */
  conditionOfDisplay?(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): boolean | Promise<boolean>;
}

export type CFButtons = {
  tableHeaderLeft: CFButton[],
  tableHeaderRight: CFButton[],
  tableRowOperations: CFButton[],
  inlineHeaderLeft: CFButton[],
  inlineHeaderCenter: CFButton[],
  inlineHeaderRight: CFButton[],
  inlineFooterLeft: CFButton[],
  inlineFooterCenter: CFButton[],
  inlineFooterRight: CFButton[],
  drawerFooterLeft: CFButton[],
  drawerFooterRight: CFButton[],
}

export const defaultButtons: {[key: string]: CFButton} = {
  create: {
    title: '新增',
    position: [CFButtonPosition.tableHeaderLeft],
    icon: 'plus',
    type: 'primary',
    onClick: (router, cfConfig, view, form, selectedRecords, record) => {
      router.push(router.currentRoute.path + "/create")
    }
  },
  edit: {
    title: '',
    position: [CFButtonPosition.tableRowOperations],
    icon: 'edit',
    onClick: (router, cfConfig, view, form, selectedRecords, record) => {
      router.push(router.currentRoute.path + "/edit/" + record.id)
    }
  },
  delete: {
    title: '',
    position: [CFButtonPosition.tableRowOperations],
    icon: 'delete',
    type: 'danger',
    sort: 99,
    onClick: (router, cfConfig, view, form, selectedRecords, record) => {
      Modal.confirm({
        title: '确定删除？',
        onOk: ()=>{
          view && view.deleteRecord(record);
        }
      })
    }
  },
  // printTable: {
  //   title: '打印',
  //   position: [CFButtonPosition.tableHeaderRight],
  //   icon: 'printer',
  //   onClick: (router, cfConfig, view, form, selectedRecords, record) => {
  //     window.print();
  //   }
  // },
  // printForm: {
  //   title: '打印',
  //   position: [CFButtonPosition.drawerFooterRight, CFButtonPosition.inlineFooterCenter],
  //   icon: 'printer',
  //   onClick: (router, cfConfig, view, form, selectedRecords, record) => {
  //     window.print();
  //   }
  // },
  cancel: {
    title: '取消',
    position: [CFButtonPosition.drawerFooterRight],
    onClick: (router, cfConfig, view, form, selectedRecords, record) => {
      form && form.cancel();
    }
  },
  save: {
    title: '保存',
    position: [CFButtonPosition.drawerFooterRight, CFButtonPosition.inlineFooterCenter],
    type: 'primary',
    htmlType: 'submit',
    onClick: (router, cfConfig, view, form, selectedRecords, record) => {
      form && form.save();
    }
  },
};
