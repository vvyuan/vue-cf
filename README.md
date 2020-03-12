# vue-cf
基于antd和vue的中后台前端快速开发组件

## 安装
```sh
npm i --save vue-cf
```

## 使用
vue-cf提供了一套通用view和form组件，CFView和CFForm以及基于二者的组件。
所有组件使用一套配置文件CFConfig来组织组件的表现内容和表现形式

## 命令
### vue-cf 帮助
执行后显示组件的简易帮助信息

### cfc/cfConfigCreator CFConfig生成器
本命令执行后将会读取指定MySQL数据库的数据，并根据你的选择创建若干个CFConfig子类

## 常见问题
### Class constructor CFConfig cannot be invoked without 'new'
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
