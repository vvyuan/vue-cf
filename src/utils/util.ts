import Pinyin from "./Pinyin";
import {DictData} from "../define/FieldDefine";

/**
 * select组件filterOption处理方法，同时支持value、text和text拼音首字母查询
 * 因为运行效率问题，不可直接将函数名写在filterOption属性中，需要写filterOption()
 * 每运行一次filterOption表示创建一个新的缓存，对于同一数据源的数据，使用同一个filterOption()返回的结果可最高效率使用内存
 */
export function filterOption() {
  let pinyin = new Pinyin();
  return function(input: string, option: any) {
    let value = option.componentOptions.propsData.value;
    let text = option.componentOptions.children[0].text;
    let pinyinFirstForText = pinyin.getCamelChars(text);
    let search = value + '\n' + text + '\n' + pinyinFirstForText;
    return (
      search.toLowerCase().indexOf(input.toLowerCase()) >= 0
    );
  }
}

/**
 * cascader组件filterOption处理方法，同select
 */
export function cascaderFilterOption() {
  let pinyin = new Pinyin();
  return function(input: string, path: DictData[]) {
    return path.some(option => {
      let pinyinFirstForText = pinyin.getCamelChars(option.label);
      let search = option.value + '\n' + (option.label || '') + '\n' + pinyinFirstForText;
      console.log('cascaderFilterOption', search);
      return search.toLowerCase().indexOf(input.toLowerCase()) > -1
    });
  }
}

/**
 * obj转url参数
 * @param obj
 */
export function objectToQueryString(obj: any) {
  if(obj instanceof FormData) {
    return Array.from(obj).filter(item=>item[1]).map(item=>item[0] + '=' + encodeURIComponent(item[1] as string)).join('&')
  } else {
    let queryArray = [];
    for(let key in obj) {
      if(obj[key]) {
        queryArray.push(key + '=' + encodeURIComponent(obj[key]))
      }
    }
    return queryArray.join('&')
  }
}
