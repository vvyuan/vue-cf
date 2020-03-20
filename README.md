# vue-cf
基于antd和vue的通用视图组件，完全配置化的视图。可以快速配置列表页和配套表单页，并灵活的定制页面的展现内容。

对于单表的增删改查可以使用cfc命令根据数据库表结构快速创建配置文件

## 安装
```sh
npm i --save vue-cf
```

## 使用
vue-cf提供了一套通用view和form组件，CFView和CFForm以及基于二者的组件。使用CFConfig来统一组织组件的表现内容和表现形式。

### CFConfig(视图配置)

### 视图组件说明
+ CFView
+ CFForm
+ CFView
+ CFForm
+ CFParentView

## 辅助函数
### 1. routesCreator 路由生成器
本方法可以为目录配置创建有效的路由数据，并附加一些常用的数据到props和meta中，本方法会额外创建针对CFForm的路由

## 命令
### 1. vue-cf 帮助
显示组件的快速帮助信息

### 2. cfc/cfConfigCreator CFConfig生成器
本命令执行后将会读取指定MySQL数据库的数据表，并根据你的选择创建若干个CFConfig子类
为了减少每次执行时输入数据库连接信息，可在项目根路径下创建cf.config.json，配置信息如下：
```json
{
  "db": {
    "host": "127.0.0.1",
    "port": "3306",
    "user": "root",
    "password": "root",
    "database": "test_db"
  }
}
```

## 常见问题
### 1. Class constructor CFConfig cannot be invoked without 'new'
解决方法，在vue.config.js中加入/合并以下内容
```javascript
configureWebpack: {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [/vue-cf/]
      }
    ]
  }
}
```
