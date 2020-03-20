import { FieldConfig } from './FieldDefine'
import {Component} from "vue";
import ICFRequest, {CFDataBase, CFListResponse, PageInfo} from "./ICFRequest";
import {defaultButtons, CFButton, CFButtons} from './CFButtonDefine';

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

export class CFConfig<T extends CFDataBase> {
  // 默认的请求类
  protected static defaultRequest?: ICFRequest;
  static useRequest(request: ICFRequest) {
    this.defaultRequest = request;
  }
  // 资源url
  url: string = '';
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
  protected readonly defaultButtons: {[key: string]: CFButton} = defaultButtons;
  // 自定义按钮组，可增量覆盖默认按钮组
  protected readonly buttons: {[key: string]: CFButton | null | undefined} = {};

  protected _buttonList?: CFButton[];
  /**
   * todo: 对于异步过滤的处理
   * 获取所有按钮清单，此处可继承后根据权限处理按钮是否允许显示
   */
  buttonFilter(buttons: CFButton[]): CFButton[] {
    this._buttonList = buttons;
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
  // 在CF**WithDrawer中生效，指定Drawer的宽度
  drawerWidth?: number | string;

  // 数据请求及数据整理
  get request(): ICFRequest {
    if(!CFConfig.defaultRequest) {
      throw new Error('[vue-cf] CFConfig必须配置默认的请求类，CFConfig.useRequest(ICFRequest)，或者在子类中重写request属性')
    }
    return CFConfig.defaultRequest;
  }

  getList(pageInfo: PageInfo, filter?: any): Promise<CFListResponse<T>>{
    return this.request.getList(this.url, pageInfo, filter);
  }
  getOne(id: number | string): Promise<T> {
    return this.request.get(this.url, {id: id}, {});
  }
  createOne(data: T): Promise<any> {
    return this.request.post(this.url, data, {});
  }
  updateOne(data: T): Promise<any> {
    return this.request.put(this.url, data, {});
  }
  deleteOne(id: number | string): Promise<any> {
    return this.request.delete(this.url, {id: id}, {});
  }
}
