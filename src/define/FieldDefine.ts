import {ValidationRule} from "ant-design-vue/types/form/form";
import moment, {relativeTimeRounding} from "moment";
import md5 from "md5";
import {CascaderOptionType} from "ant-design-vue/types/cascader";
import {CFDictData, FieldPosition} from "./FieldUtil";

// children 和 isLeaf属性为CascaderField专用
/**
 * 获取字典数据方法
 * 参数仅针对级联选择生效
 * level默认为0
 * value是当前的值，根据该值查询
 */
type GetCFDictDataFn = (level: number, value?: any)=>Promise<CFDictData[]>;
type WatchValue = {value: CFDictData[], isCache: boolean};
type WatchValueFn = ()=>WatchValue;
export abstract class FieldConfig {
  // defaultValue?: any;
  readonly placeholder?: string;
  readonly position: FieldPosition;
  readonly rules?: ValidationRule[];
  readonly print?: string; // 对应打印模板中的变量名
  // onChange事件响应队列
  private onChangeFnList: {fn: GetCFDictDataFn, watch: WatchValue}[] = [];
  private onChangeHandleDelayTimer: number = 0;
  private onChangeFnResultCache: {[key: string]: CFDictData[]}[] = [];
  /**
   * 输入值转换函数，默认为原始值
   * @param value 从数据源获取到的值
   * @return 作为最终写入到表单的值
   */
  translateInput(value: any): any {
    return value;
  }
  /**
   * 结果转换函数，默认为原始值
   * @param value 从表单获取到的结果
   * @return 作为最终提交的值
   */
  translateResult(value?: any): any {
    return value;
  }

  /**
   * 基本字段构造方法
   * @param placeholder
   * @param position 显示的位置
   * @param rules
   * @param print
   */
  constructor(placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    if(placeholder) {
      this.placeholder = placeholder;
    }
    this.position = position || FieldPosition.both;
    if(rules === true) {
      this.rules = [{required: true, message: this.placeholder}]
    } else {
      this.rules = rules;
    }
    if(print) {
      this.print = print;
    }
  }
  /**
   * 选中事件处理方法，对应于onChange方法
   * 当dataSource: string | string[] | Event时，执行响应处理队列
   * 当dataSource: null 时，目标DataSource结果设为空数组
   */
  /**
   * 选中事件处理方法，对应于onChange方法
   * 当dataSource: string | string[] | Event时，执行响应处理队列
   * 当dataSource: null 时，目标DataSource结果设为空数组
   * @param newValue
   * @param immediately 是否立即处理
   */
  onChangeForEvent(newValue: string | string[] | Event | null, immediately?: boolean): Promise<any> {
    if(this.onChangeFnList.length === 0) {
      return Promise.resolve();
    }
    return (new Promise((resolve, reject) => {
      let a = {a: newValue};
      let b = 100010;
      clearTimeout(this.onChangeHandleDelayTimer);
      const onChangeHandle = ()=>{
        // 结果转换
        let value = newValue;
        if(value instanceof Event) {
          // @ts-ignore
          value = value.target.value;
        }
        value = this.translateResult(value);
        // 执行响应队列
        let allP: Promise<any>[] = this.onChangeFnList.map(({fn, watch}, index)=>{
          if(value === null) {
            watch.isCache = true;
            watch.value = [];
            return Promise.resolve();
          }
          // 执行数据获取方法并将数据写入被监听对象
          if(!this.onChangeFnResultCache[index]) {this.onChangeFnResultCache[index] = {}}
          const cache = this.onChangeFnResultCache[index][value.toString()];
          if(cache) {
            watch.isCache = true;
            watch.value = cache;
            return Promise.resolve();
          }
          return fn(Array.isArray(value) ? value.length : 0, value).then(res=>{
            this.onChangeFnResultCache[index][value!.toString()] = res;
            watch.isCache = false;
            watch.value = res;
          })
        });
        resolve(Promise.all(allP));
      };
      if(immediately === true) {
        onChangeHandle();
      } else {
        this.onChangeHandleDelayTimer = window.setTimeout(onChangeHandle, 500);
      }
    })).then(()=>{});
  }
  /**
   * 配置其他field的dataSource
   * 当前field的内容变化后，触发onChangeForSelectEvent方法，调用DataSource获取数据，用于级联选择
   * 当dataSource: GetCFDictDataFn时，onChange作为事件处理方法，将dataSource放入响应处理队列
   * @param dataSource
   * @return 返回一个可监听对象，数据获取后，听过对象监听方式获取最新数据
   */
  onChange(dataSource: GetCFDictDataFn): WatchValueFn {
    // 创建一个被监听对象
    let obj: WatchValue = {value: [], isCache: false};
    this.onChangeFnList.push({fn: dataSource, watch: obj});
    return ()=>obj;
  }
}
// TODO: 文本验证规则
export enum RuleForText {
}
// 文本类表单
export class ReadonlyField extends FieldConfig {}
export class TextField extends FieldConfig {}
export class NumberField extends FieldConfig {
  readonly max?: number;
  readonly min?: number;
  readonly step?: number;
  readonly formatter?: (value: number) => string;
  readonly parser?: (value: string) => number;
  constructor(placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string, options?: {max?: number, min?: number, step?: number, formatter?: (value: number) => string, parser?: (value: string) => number}) {
    super(placeholder, position, rules, print);
    if(options) {
      this.max = options.max;
      this.min = options.min;
      this.step = options.step;
      this.formatter = options.formatter;
      this.parser = options.parser;
    }
  }
}
export class PasswordField extends FieldConfig {
  translateResult(value?: string): string {
    return value ? md5(value) : ''
  }
}
export class TextareaField extends FieldConfig {
  readonly rows: number;
  constructor(rows: number, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(placeholder, position, rules, print);
    this.rows = rows;
  }
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
  constructor(format?: string, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(placeholder, position, rules, print);
    this.format = format || 'YYYY-MM-DD HH:mm:ss';
  }
  translateInput(value: any): moment.Moment | undefined {
    return value ? moment(value, this.format) : undefined;
  }
  translateResult(value?: moment.Moment): any {
    return value ? value.format(this.format) : undefined
  }
}
export class TimeField extends DateFieldBase {
  constructor(format?: string, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(format || 'HH:mm:ss', placeholder, position, rules, print);
  }
}
export class DateField extends DateFieldBase {
  constructor(format?: string, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(format || 'YYYY-MM-DD', placeholder, position, rules, print);
  }
}
export class DateTimeField extends DateFieldBase {}
export class DateRangeField extends DateFieldBase {}
export class TimeRangeField extends DateFieldBase {}
// 带有字典数据的表单
export class FieldWithDict extends FieldConfig {
  // 构造方法传入的dataSource，有可能是一个onChange
  private readonly _dataSource: GetCFDictDataFn | WatchValueFn;
  private isLoadData: boolean = false;
  private isWatched: boolean = false; // options是否是被监听的对象，即当其他field变化时才获取数据
  options: CFDictData[] = [];
  allOptions: CFDictData[] = [];
  onOptionsChange: (options: CFDictData[])=>void = ()=>{};

  constructor(dataSource: GetCFDictDataFn | WatchValueFn, placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(placeholder, position, rules, print);
    // dataSource 当传入WatchValueFn时，在首次加载数据后，isWatched会被设置为true
    this._dataSource = dataSource;
  }
  dataSource(): Promise<CFDictData[]> | false {
  // | {value: CFDictData[]}
    if(this.isWatched) { return false }
    let result = this._dataSource(0);
    if(result instanceof Promise) {
      return result;
    } else {
      this.isWatched = true;
      let self = this;
      // 监听WatchValueFn返回的对象，级联更新
      Object.defineProperty(result, 'value', {
        get() { return true },
        set(val) {
          // console.log(val);
          if(!(result as WatchValue).isCache) {
            self.allOptions.splice(0, 0, ...val)
          }
          self.options = val;
          self.onOptionsChange(val);
        }
      });
      return false
    }
  }
  loadData(): Promise<CFDictData[]> {
    if(this.isLoadData) {
      // console.log("load dict from cache");
      return Promise.resolve(this.options);
    } else {
      if(this.isWatched) {
        return Promise.resolve([]);
      }
      let dataSourceResult = this.dataSource();
      if(dataSourceResult === false) {
        return Promise.resolve([]);
      }
      return dataSourceResult.then(res=>{
        this.isLoadData = true;
        this.allOptions.splice(0, 0, ...res);
        this.options = res;
        return res
      }).catch((e: Error)=>{
        e.message = '[Field:dataSource]' + e.message;
        throw e
      })
    }
  }
}
export class ReadonlyFieldWithDict extends FieldWithDict {}
// 下拉选框类表单
export class SingleSelectField extends FieldWithDict {}
export class MultipleSelectField extends FieldWithDict {}
export class TagField extends FieldWithDict {}
// 级联选择
export class CascaderField extends FieldWithDict {
  private readonly mutilDataSource: ((level: number, parentValue?: string | number)=>Promise<CFDictData[]>)[] = [];

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
  constructor(dataSource: GetCFDictDataFn | WatchValueFn | GetCFDictDataFn[], placeholder?: string, position?: FieldPosition, rules?: ValidationRule[] | true, print?: string) {
    super(Array.isArray(dataSource) ? dataSource[0] : dataSource, placeholder, position, rules, print);
    if(Array.isArray(dataSource)) {
      if(dataSource.length === 0) {
        throw new Error('dataSource要求至少有一个可用数据源');
      } else {
        this.mutilDataSource = dataSource;
        this.needLoadData = true;
      }
      console.log(this.needLoadData)
    }
  }
  readonly needLoadData: boolean = false;
  loadData(selectedOptions?: CascaderOptionType[]): Promise<CFDictData[]> {
    if(selectedOptions && this.needLoadData) {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      // @ts-ignore
      targetOption.loading = true;
      let index = Math.min(this.mutilDataSource.length - 1, selectedOptions.length);
      console.log('loadData', selectedOptions.length, targetOption.value);
      return this.mutilDataSource[index](selectedOptions.length, targetOption.value).then(res=>{
        // @ts-ignore
        targetOption.loading = false;
        targetOption.children = res;
        this.options = [...this.options];
        return res
      })
    } else {
      return super.loadData();
    }
  }
}
// 按钮类表单
export class RadioField extends FieldWithDict {}
export class CheckboxField extends FieldWithDict {}
