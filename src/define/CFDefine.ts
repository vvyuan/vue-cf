import { FieldConfig } from './FieldDefine'
import {Component} from "vue";
import {VueRouter} from "vue-router/types/router";
// @ts-ignore
import {Modal} from "ant-design-vue";
import {ICFCommonForm, ICFCommonView} from "./ViewDefine";
import ICFRequest, {CFDataBase, CFListResponse} from "./ICFRequest";
import MockRequest from "../utils/MockRequest";

export type CFTableConfig = {
  display: boolean // 是否在table中显示
  formatter?: (value: string | number) => string; // 格式转换，在table的显示中优先级高于Form中的formatter
  print?: string, // 对应打印模板中的变量名
  column?: any
}

export type CFFConfig = {
  name: string, // 字段名称
  packetFieldName?: string, // 映射在报文中的字段名称，默认等于name
  title: string, // 字段标题
  inTable?: CFTableConfig, // 字段对于table的配置
  inForm?: FieldConfig, // 字段对于form的配置
}

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
  icon?: string,
  type?: 'primary' | 'danger' | 'default' | 'dashed' | 'link',
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
  onClick(router: VueRouter, cfConfig: any, view?: ICFCommonView, form?: ICFCommonForm, selectedRecords?: any[], record?: any): void,
  /**
   * table中选中行事件的响应
   * @param selectedRecords
   */
  onTableSelected?(selectedRecords: any[]): void,
}

type CFButtons = {
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

class CFRequest {
  static request?: ICFRequest;
}

export abstract class CFConfig<T extends CFDataBase> {
  static useRequest(request: ICFRequest) {
    if(CFRequest.request) {
      return
    }
    CFRequest.request = request;
  }
  // 资源url
  abstract url: string;
  // 字段列表
  readonly fieldList: CFFConfig[] = [];
  /**
   * 字段映射
   * key: 视图字段
   * value: 报文字段
   */
  private _map?: {[key: string]: string};
  get map(): {[key: string]: string} {
    if(!this._map) {
      this._map = {};
      this.fieldList.forEach(field=>{
        if(field.packetFieldName) {
          this.map[field.name] = field.packetFieldName;
        }
      });
    }
    return this._map;
  }
  // 默认的按钮组，可以通过覆盖本属性来取消默认按钮，一般情况下只重写buttons属性即可
  protected readonly defaultButtons: {[key: string]: CFButton} = {
    create: {
      title: '新增',
      position: [CFButtonPosition.tableHeaderLeft],
      icon: 'plus',
      type: 'primary',
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        if(cfConfig.inlineForm) {
          view && view.createForInlineForm();
        } else {
          router.push(router.currentRoute.path + "/create")
        }
      }
    },
    edit: {
      title: '',
      position: [CFButtonPosition.tableRowOperations],
      icon: 'edit',
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        if(cfConfig.inlineForm) {
          view && view.loadDataForForm(record.id);
        } else {
          router.push(router.currentRoute.path + "/edit?id=" + record.id)
        }
      }
    },
    delete: {
      title: '',
      position: [CFButtonPosition.tableRowOperations],
      icon: 'delete',
      type: 'danger',
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        Modal.confirm({
          title: '确定删除？',
          onOk: ()=>{
            view && view.deleteRecord(record);
          }
        })
      }
    },
    printTable: {
      title: '打印',
      position: [CFButtonPosition.tableHeaderRight],
      icon: 'printer',
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        window.print();
      }
    },
    printForm: {
      title: '打印',
      position: [CFButtonPosition.drawerFooterRight, CFButtonPosition.inlineFooterCenter],
      icon: 'printer',
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        window.print();
      }
    },
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
      onClick: (router, cfConfig, view, form, selectedRecords, record) => {
        form && form.save();
      }
    },
  };
  // 自定义按钮组，可增量覆盖默认按钮组
  protected readonly buttons: {[key: string]: CFButton | null | undefined} = {};

  private _buttonList?: CFButton[];
  /**
   * 获取所有按钮清单，此处可继承后根据权限处理按钮是否允许显示
   */
  buttonFilter(buttons: CFButton[]): CFButton[] {
    return buttons;
  }
  get buttonList(): CFButton[] {
    if(!this._buttonList) {
      let result = {...this.defaultButtons, ...this.buttons};
      let buttonList: CFButton[] = [];
      for(let key in result) {
        let button = result[key];
        if(button) {
          button.key = key;
          buttonList.push(button);
        }
      }
      buttonList = buttonList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      this._buttonList = this.buttonFilter(buttonList);
    }
    // @ts-ignore
    return this._buttonList;
  }
  private _realButtons?: CFButtons;
  get realButtons(): CFButtons {
    if(!this._realButtons) {
      let realButtons = this.buttonList;
      this._realButtons = { tableHeaderLeft: [], tableHeaderRight: [], tableRowOperations: [], inlineHeaderLeft: [], inlineHeaderCenter: [], inlineHeaderRight: [], inlineFooterLeft: [], inlineFooterCenter: [], inlineFooterRight: [], drawerFooterLeft: [], drawerFooterRight: [] };
      for(let button of realButtons) {
        for(let position of button.position) {
          this._realButtons[position].push(button);
        }
      }
    }
    return this._realButtons;
  }

  // 页面标题
  pageTitle: string = '';
  // 表单是否内嵌到view中
  inlineForm: boolean = false;
  // 是否启用行选择模式
  enableSelect: boolean = false;
  // 表格打印模板
  tablePrintTemplate?: Component;
  // 表单打印模板
  formPrintTemplate?: Component;

  // 数据请求及数据整理
  get request() {
    return CFRequest.request || MockRequest;
  }
  getList(filter?: any): Promise<CFListResponse<T>>{
    return this.request.get(this.url, filter, {}, this.map);
  }
  getOne(id: number | string): Promise<T> {
    return this.request.get(this.url, {id: id}, {}, this.map);
  }
  createOne(data: T): Promise<any> {
    return this.request.post(this.url, data, {}, this.map);
  }
  updateOne(data: T): Promise<any> {
    return this.request.put(this.url, data, {}, this.map);
  }
  deleteOne(id: number | string): Promise<any> {
    return this.request.delete(this.url, {id: id}, {}, this.map);
  }
}
