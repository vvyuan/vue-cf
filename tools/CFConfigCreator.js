const inquirer = require('inquirer');
const mysql = require('mysql');
const fs = require('fs');

// TODO：读取默认数据库配置

let db = null;
let dbConfig = null;
(Promise.resolve()).then(()=>{
  const promptList = [
    {
      type: 'input',
      message: '请输入数据库host:',
      name: 'host',
      default: "localhost",
    },
    {
      type: 'input',
      message: '请输入数据库port:',
      name: 'port',
      default: "3306",
    },
    {
      type: 'input',
      message: '请输入数据库username:',
      name: 'user',
      default: "root",
    },
    {
      type: 'input',
      message: '请输入数据库password:',
      name: 'password',
      default: "root",
    },
    {
      type: 'input',
      message: '请输入数据库名称:',
      name: 'database',
      default: "his2020",
    },
  ];
  return inquirer.prompt(promptList)
}).then(dbConfigA => new Promise((resolve, reject) => {
  console.log('正在连接数据库');
  dbConfig = dbConfigA;
  db = mysql.createConnection(dbConfig);
  db.connect();
  db.query(`select table_name from information_schema.tables where table_schema="${dbConfig.database}"`, function (error, results, fields) {
    if (error) {
      reject(error);
      return;
    }
    let tablesName = results.map(item => item.table_name);
    resolve(tablesName);
  })
})).then(tablesName=> {
  const promptList = [
    {
      type: "input",
      message: "请输入要生成页面配置文件的表名称:",
      name: "filter",
      validate: (value) => tablesName.findIndex(item=>item.match(value)) >= 0 ? true : '查找不到对应的表'
    }
  ];
  return inquirer.prompt(promptList).then(answer=>tablesName.filter(item=>item.match(answer.filter)))
}).then(tablesName=>{
  const promptList = [
    {
      type: "checkbox",
      message: "请选择表:",
      name: "tablesName",
      choices: tablesName.map(item=>({name: item})),
    }
  ];
  return inquirer.prompt(promptList)
}).then(({tablesName})=>{
  let sqlList = tablesName.map(name=>`
  SELECT
    TABLE_NAME as tableName,
    COLUMN_NAME as colName,
    IS_NULLABLE as isNullable,
    DATA_TYPE as dataType,
    COLUMN_COMMENT as title
FROM
    information_schema.COLUMNS
WHERE
    TABLE_SCHEMA = '${dbConfig.database}'
    AND TABLE_NAME = '${name}'
ORDER BY
    TABLE_NAME,
    ORDINAL_POSITION;
  `);
  return Promise.all(sqlList.map(sql=>new Promise((resolve, reject) => {
    db.query(sql, (error, results, fields)=>{
      if (error) {
        reject(error);
        return;
      }
      resolve(results)
    })
  })))
}).then(tablesProps=>{
  tablesProps.forEach(tableProps=>{
    if(tableProps.length === 0) { return }
    let url = tableProps[0].tableName.replace(/_/g, "/");
    let tableName = tableProps[0].tableName;
    tableName = tableName.replace(/_\w/g, (char)=>char[1].toUpperCase());
    tableName = tableName.replace(/^\w/, (char)=>char[0].toUpperCase());
    let dataString = tableProps.map(props=>{
      let numberType = ['int', 'decimal', 'double', 'float'];
      let isNumber = !numberType.every(item=>!props.dataType.match(item));
      let propName = props.colName.toLowerCase().replace(/_\w/g, (char)=>char[1].toUpperCase());
      return `${propName}: ${isNumber ? "number" : "string"}, // ${props.title}`
    }).join("\n  ");
    let fieldListString = tableProps.map(props=>{
      let numberType = ['int', 'decimal', 'double', 'float'];
      let isNumber = !numberType.every(item=>!props.dataType.match(item));
      let propName = props.colName.toLowerCase().replace(/_\w/g, (char)=>char[1].toUpperCase());
      let inFormString = "";
      if(props.dataType === 'date') {
        inFormString = `new FormField.DateField(undefined, '请选择${props.title}', undefined, true, undefined)`;
      } else if(props.dataType === 'datetime') {
        inFormString = `new FormField.DateTimeField(undefined, '请选择${props.title}', undefined, true, undefined)`;
      } else if(isNumber) {
        inFormString = `new FormField.NumberField('请输入${props.title}', undefined, true, undefined)`;
      } else {
        inFormString = `new FormField.TextField('请输入${props.title}', undefined, true, undefined)`;
      }
      return `    {
      name: '${propName}',
      title: '${props.title}',
      inForm: ${inFormString},
      inTable: {
        display: true,
        column: { align: 'center' }
      },
    },`
    }).join("\n");
    let content = `import {CFConfig, CFFConfig} from '@/define/CFDefine'
import * as FormField from "@/define/FieldDefine";
import Request from "@/utils/Request";

/**
 * CF${tableName}
 */

export type CF${tableName}Data = {
  ${dataString}
}

const url = '${url}';

export function getDictFor${tableName}(): Promise<FormField.DictData[]> {
  return Request.get<CF${tableName}Data>(url).then(res=>res.list.map((item: CF${tableName}Data)=>({value: item.id, label: item.id})))
}

export default class CF${tableName} extends CFConfig<CF${tableName}Data> {
  url = url;

  fieldList: CFFConfig[] = [
${fieldListString}
  ];
}
`;
    let fileName = `src/cfConfigs/CF${tableName}.ts`;
    fs.writeFileSync(fileName, content);
    console.log(fileName + ' 创建成功');
  });
  process.exit(0);
});