import { Component } from 'vue'
import { CFConfig } from './CFDefine';
import {Route, RouteConfig} from "vue-router";
import {CFDataBase} from "./ICFRequest";
import CFParentView from "../components/CFParentView.vue";
import CFView from "../components/CFView.vue";
import CFFormWithDrawer from "../components/CFFormWithDrawer.vue";
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
  props?: CFViewProps<T> | ((route: Route)=> CFViewProps<T>),
  meta?: {[key: string]: any},
}

function routerCreatorForMenuUnit(menu: CFMenuUnit<any>, parentPath: string = '', titleList: string[] = []): RouteConfig {
  let curMenuPath = parentPath + '/' + menu.path;
  titleList.push(menu.title);
  // @ts-ignore
  let route: RouteConfig = {
    ...menu,
    path: menu.path,
    // redirect: menu.redirect,
    // children: menu.children,
    // props: menu.props,
    // component: menu.component,
    meta: {
      title: titleList,
      display: menu.display,
      auth: menu.auth,
      icon: menu.icon,
      description: menu.description,
      path: curMenuPath,
      ...(menu.meta || {})
    },
    props: menu.props,
  };
  if(typeof menu.props === 'function') {
    let propsFn = menu.props;
    route.props = function(route: Route){
      let props = propsFn(route);
      return {
        title: titleList,
        path: curMenuPath,
        ...props,
      }
    }
  } else {
    route.props = {
      title: titleList,
      path: curMenuPath,
      ...menu.props
    }
  }
  if(menu.children) {
    route.children = menu.children!.map(item=>routerCreatorForMenuUnit(item, curMenuPath, titleList));
  }
  // 是否叶子节点
  let isLeaf = !(menu.children && menu.children.some(item=>item.display !== false));
  if(isLeaf) {
    // 非叶子节点
    if(!menu.component) {
      route.redirect = curMenuPath + '/' + menu.children![0].path;
      route.component = CFParentView;
    }
  } else {
    // 叶子节点
    if(!menu.component) {
      route.component = CFView;
    }
    // 为所有叶子节点添加默认form路由
    // @ts-ignore
    route.children = (route.children || []).concat([
      {
        display: false,
        title: '新增',
        path: 'create',
        auth: menu.auth ? menu.auth + '/create' : undefined,
        component: CFFormWithDrawer,
        props: { ...menu.props, type: 'create', path: curMenuPath + '/create', title: titleList.concat(['新增'])},
        meta: {
          display: false,
          auth: menu.auth ? menu.auth + '/create' : undefined,
          title: '新增',
          path: curMenuPath + '/create',
        }
      },
      {
        display: false,
        title: '编辑',
        path: 'edit/:id',
        auth: menu.auth ? menu.auth + '/edit' : undefined,
        component: CFFormWithDrawer,
        // props: (route:any) => ({  ...menu.props, type: 'edit', id: route.query.id, }),
        props: (route:any) =>({
          ...menu.props,
          ...route.params,
          type: 'edit',
          path: curMenuPath + '/edit',
          title: titleList.concat(['编辑'])
        }),
        meta: {
          display: false,
          title: '编辑',
          auth: menu.auth ? menu.auth + '/edit' : undefined,
          path: curMenuPath + '/edit',
        }
      }
    ])
  }
  return route
}

/**
 * 根据菜单数据生成路由，主要用于补充默认的路由
 * 1：对于所有的叶子节点，增加create和edit路由，默认指向CFFormWithDrawer，新增加的路由默认配置props.cfConfig为该叶子节点的cfConfig
 * 2: 对于所有节点，配置的非路由必要数据，复制到meta中，便于在路由过程中获取数据
 * 3: 对于所有节点，增加props.path属性，填充为fullPath，不含参数
 * 4: 对于所有节点，增加props.title属性，填充为配置的titleArray
 * 5: 对于所有非叶子节点，并且节点未配置component属性的，默认配置为CFParentView
 * 6: 对于所有非叶子节点，并且节点未配置component属性的，默认重定向到第一个子节点
 * 7: 对于所有叶子节点，并且节点未配置component属性的，默认配置为CFView
 * @param menus
 */
export function routerCreator(menus: CFMenuUnit<any>[]): RouteConfig[] | CFMenuUnit<any>[] {
  if(menus.length) {
    return menus.map(item=>routerCreatorForMenuUnit(item));
  } else {
    return [];
  }
}
