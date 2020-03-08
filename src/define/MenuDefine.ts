import { Component } from 'vue'
import { CFConfig } from './CFDefine';
import {Route} from "vue-router";
import {DataBase} from "@/define/IRequest";
export type ViewProps<T extends DataBase> = {
  title?: string[],
  type?: string,
  path?: string,
  cfConfig?: CFConfig<T>,
  [propName: string]: any;
}

export type MenuUnit<T extends DataBase> = {
  display?: boolean, // 是否显示到菜单中，默认true
  title: string, // 菜单名称
  path: string, // 当前层级菜单的相对路径
  redirect?: string, // 重定向
  auth?: string, // 权限名（对应后端数据），undefined表示不受控,
  icon?: string, // AntD icon name
  description?: string,
  children?: MenuUnit<T>[],
  component?: Component,
  props?: ViewProps<T> | ((route: Route)=> ViewProps<T>),
  meta?: any,
}

export function menuCreator() {

}
