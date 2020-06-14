/// <reference types="node" />
import {WrappedFormUtils} from "ant-design-vue/types/form/form";
import Vue, {Component, PluginFunction} from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import {ValidationRule} from "ant-design-vue/types/form/form";
import {Moment}from "moment";
import {CascaderOptionType} from "ant-design-vue/types/cascader";
import {Route} from "vue-router";

/**
 * Request define
 */
export type CFDataBase = {
  id: number | string,
  [propName: string]: any,
}

export type CFListResponse<T extends CFDataBase> = {
  pageSize: number,
  current: number,
  total: number,
  list: T[],
  [propName: string]: any,
}

export type PageInfo = {
  page: number,
  pageSize?: number,
}

export interface ICFRequest {
  request (url: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: CFDataBase | any, header?: any): Promise<any>;
  getList<T extends CFDataBase> (url: string, pageInfo?: PageInfo, data?: CFDataBase | any, header?: any): Promise<CFListResponse<T>>;
  get<T extends CFDataBase> (url: string, data?: CFDataBase | any, header?: any): Promise<T>;
  post<T> (url: string, data?: T, header?: any): Promise<any>;
  put<T extends CFDataBase> (url: string, data?: T, header?: any): Promise<any>;
  delete (url: string, data?: any, header?: any): Promise<any>;
}

/**
 * FieldUtil
 */
export class CFNumberFieldFormatter {
  static moneyRMB: {
    parser: (value: string) => number,
    formatter: (value: number) => string,
  }
}
// children 和 isLeaf属性为CascaderField专用
export type CFDictData = {value: string | number, label: string, children?: CFDictData[], isLeaf?: boolean}

/**
 * FieldDefine
 */
/**
 * 获取字典数据方法
 * 参数仅针对级联选择生效
 * level默认为0
 * value是当前的值，根据该值查询
 */
type GetCFDictDataFn = (level: number, value?: any)=>Promise<CFDictData[]>;
type WatchValueFn = ()=>{value: CFDictData[]};
export enum FieldPosition {
  both = 3,
  filter = 2,
  form = 1,
}
export abstract class FieldConfig {
  // defaultValue?: any;
  readonly placeholder?: string;
  readonly position: FieldPosition;
  readonly rules?: ValidationRule[];
  readonly print?: string; // 对应打印模板中的变量名
  // onChange事件响应队列
  private onChangeFnList: {fn: GetCFDictDataFn, watch: {value: CFDictData[]}}[];
  private onChangeHandleDelayTimer: number;
  /**
   * 输入值转换函数，默认为原始值
   * @param value 从数据源获取到的值
   * @return 作为最终写入到表单的值
   */
  translateInput(value: any): any;
  /**
   * 结果转换函数，默认为原始值
   * @param value 从表单获取到的结果
   * @return 作为最终提交的值
   */
  translateResult(value?: any): any;

  /**
   * 基本字段构造方法
   * @param placeholder
   * @param position 显示的位置
   * @param rules
   * @param print
   */
  constructor(placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string);
  /**
   * 选中事件处理方法，方法存在两个含义
   * 用于级联选择
   * 当dataSource: GetCFDictDataFn时，onChange作为事件处理方法，将dataSource放入响应处理队列
   * 用于组件事件响应
   * 当dataSource: string | string[]时，onChange作为事件响应方法，执行响应处理队列
   * @param dataSource
   */
  onChange(dataSource: GetCFDictDataFn | string | string[] | Event): WatchValueFn;
}
export namespace CFField {


// 文本类表单
  export class ReadonlyField extends FieldConfig {}
  export class TextField extends FieldConfig {}
  export class NumberField extends FieldConfig {
    readonly max?: number;
    readonly min?: number;
    readonly step?: number;
    readonly formatter?: (value: number) => string;
    readonly parser?: (value: string) => number;
    constructor(placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string, options?: {max?: number, min?: number, step?: number, formatter?: (value: number) => string, parser?: (value: string) => number});
  }
  export class PasswordField extends FieldConfig {}
  export class TextareaField extends FieldConfig {
    readonly rows: number;
    constructor(rows: number, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string);
  }
  export class RichTextField extends FieldConfig {}
// 时间类表单
  export abstract class DateFieldBase extends FieldConfig {
    format: string;
    /**
     * 时间类表单构造方法
     * @param format 格式参考 https://momentjs.com/docs/#/displaying/
     * @param placeholder
     * @param position
     * @param rules
     * @param print
     */
    constructor(format?: string, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string);
    translateInput(value: any): Moment | undefined;
    translateResult(value?: Moment): any;
  }
  export class TimeField extends DateFieldBase {}
  export class DateField extends DateFieldBase {}
  export class DateTimeField extends DateFieldBase {}
  export class DateRangeField extends DateFieldBase {}
  export class TimeRangeField extends DateFieldBase {}
// 带有字典数据的表单
  export class FieldWithDict extends FieldConfig {
    // 构造方法传入的dataSource，有可能是一个onChange
    private readonly _dataSource: GetCFDictDataFn | WatchValueFn;
    private isLoadData: boolean;
    options: CFDictData[];
    constructor(dataSource: GetCFDictDataFn | WatchValueFn, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string);
    dataSource(): Promise<CFDictData[]>;
    loadData(): Promise<CFDictData[]>;
  }
  export class ReadonlyFieldWithDict extends FieldWithDict {}
// 下拉选框类表单
  export class SingleSelectField extends FieldWithDict {}
  export class MultipleSelectField extends FieldWithDict {}
  export class TagField extends FieldWithDict {}
// 级联选择
  export class CascaderField extends FieldWithDict {
    private readonly mutilDataSource: ((level: number, parentValue?: string | number)=>Promise<CFDictData[]>)[];

    /**
     * 构造方法
     * @param dataSource 数据源：对于可提供完整数据的单一数据源，传入()=>Promise<CFDictData[]>类型的参数，CFDictData中必须包含children，不允许包含isLeaf
     *                           对于逐级获取数据的数据源，传入一个()=>Promise<CFDictData[]>数组，CFDictData中必须包含isLeaf，标记是否为叶子节点
     *                           数据源的顺序对应级联选择的层级，数据初始化时，会调用第一个数据源提供第一级数据
     *                           根据级联选择的层级自动调用对应层级的数据源，如果对应层级的数据源不存在，则调用最后一个数据源
     * @param placeholder
     * @param position
     * @param rules
     * @param print
     */
    constructor(dataSource: GetCFDictDataFn | WatchValueFn | GetCFDictDataFn[], placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string);
    readonly needLoadData: boolean;
    loadData(selectedOptions?: CascaderOptionType[]): Promise<CFDictData[]>;
  }
// 按钮类表单
  export class RadioField extends FieldWithDict {}
  export class CheckboxField extends FieldWithDict {}
}
/**
 * CFDefine
 */
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
  // 设置CFConfig默认使用的请求类
  static useRequest(request: ICFRequest): void;
  // 资源url
  url: string;
  // 字段列表
  readonly fieldList: CFFConfig[];
  /**
   * 字段映射
   * key: 视图字段
   * value: 报文字段
   */
  readonly map: {[key: string]: string};
  // 默认的按钮组，可以通过覆盖本属性来取消默认按钮，一般情况下只重写buttons属性即可
  protected readonly defaultButtons:
    {create: CFButton} |
    {edit: CFButton} |
    {delete: CFButton} |
    {cancel: CFButton} |
    {save: CFButton} |
    {[key: string]: CFButton};
  // 自定义按钮组，可增量覆盖默认按钮组
  protected readonly buttons: {[key: string]: CFButton | null | undefined};

  /**
   * 获取所有按钮清单，此处可继承后根据权限处理按钮是否允许显示
   */
  buttonFilter(buttons: CFButton[]): CFButton[];
  // 按钮列表
  readonly buttonList: CFButton[];
  // 实际使用的按钮数据
  readonly realButtons: CFButtons;

  // 请求类，默认使用CFConfig.useRequest配置的请求类，可重写
  request: ICFRequest;
  // 页面标题
  pageTitle: string;
  // 表单是否内嵌到view中
  inlineForm: boolean;
  // 是否启用行选择模式
  enableSelect: boolean;

  getList(pageInfo?: PageInfo, filter?: any): Promise<CFListResponse<T>>;
  getOne(id: number | string): Promise<T>;
  createOne(data: T): Promise<any>;
  updateOne(data: T): Promise<any>;
  deleteOne(id: number | string): Promise<any>;
}

/**
 * CFButtonDefine
 */

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
  tips?: string, // 鼠标悬浮提示信息
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
  onClick(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): void,
  /**
   * table中选中行事件的响应
   * @param selectedRecords
   */
  onTableSelected?(selectedRecords: any[]): void,
  // 按钮的disable条件
  conditionOfDisable?(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): boolean;
  // 按钮的显示条件
  conditionOfDisplay?(router: VueRouter, cfConfig: any, view?: ICFView, form?: ICFForm, selectedRecords?: any[], record?: any): boolean;
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

/**
 * ViewDefine
 */
export interface ICFForm {
  cancel(): void;
  loadData(): void;
  save(e?: Event, otherData?: any): Promise<any>;
  form: WrappedFormUtils;
}

export interface ICFView {
  reload(): void;
  deleteRecord(record: any): void;
  // 清空当前inlineForm数据，清除内部id，可用于创建新数据
  resetForInlineForm(): void;
  // 根据id加载数据到inlineForm
  loadDataForForm(id: number | string): void;
}

/**
 * MenuDefine
 */
export type CFViewProps<T extends CFDataBase> = {
  title?: string[],
  type?: string,
  path?: string,
  cfConfig?: CFConfig<T>,
  [propName: string]: any;
}

export type CFMenuUnit<T extends CFDataBase> = {
  display?: boolean, // 是否显示到菜单中，默认true
  title: string, // 菜单名称
  path: string, // 当前层级菜单的相对路径
  redirect?: string, // 重定向
  auth?: string, // 权限名（对应后端数据），undefined表示不受控,
  icon?: string, // AntD icon name
  description?: string,
  children?: CFMenuUnit<T>[],
  component?: Component,
  iframeComponent?: Component,
  props?: CFViewProps<T> | ((route: Route)=> CFViewProps<T>),
  meta?: any,
}

export function routesCreator(menus: CFMenuUnit<any>[]): RouteConfig[] | CFMenuUnit<any>[]

export class CFView extends Vue implements ICFView {
  resetForInlineForm(): void;
  deleteRecord(record: any): void;
  loadDataForForm(id: number | string): void;
  reload(): void;
}
export class CFForm extends Vue implements ICFForm {
  form: WrappedFormUtils;
  cancel(): void;
  loadData(): void;
  save(e?: Event, otherData?: any): Promise<any>;
}

export class CFParentView extends Vue{}
export class CFFormWithDrawer extends Vue{}
export class CFViewWithDrawer extends Vue{}

declare let defaultExport: PluginFunction<any>;
export default defaultExport
