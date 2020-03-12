import { Component } from 'vue'
import { CFConfig } from './CFDefine';
import {Route} from "vue-router";
import {CFDataBase} from "./ICFRequest";
export type CFViewProps<T extends CFDataBase> = {
  display?: boolean, // 是否在menu中显示
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
  props?: CFViewProps<T> | ((route: Route)=> CFViewProps<T>),
  meta?: any,
}

export function menuCreator() {

}
