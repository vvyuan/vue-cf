import {v4 as uuid} from "uuid"
import {message, notification} from "ant-design-vue";

let dbMap: {[key: string]: IDBDatabase} = {};
let queueId: number = 0;
type MockStorageQueueUnit = {
  id?: number,
  handleName: '_add' | '_update' | '_get' | '_getAll' | '_delete' | 'open',
  params: any,
  resolve: (result?: any)=>void,
  reject: (ev?: Error)=>void,
  before?: ()=>boolean | void // 执行队列处理方法之前执行的方法，返回true表示中断当前队列操作，立即重新执行队列
}

class MockStorage {
  private db?: IDBDatabase;
  private readonly dbName: string;
  private requestForIndexDB?: IDBOpenDBRequest;
  private queue: MockStorageQueueUnit[] = [];
  constructor (name: string = 'mockDB') {
    this.dbName = name
  }
  deleteDB() {
    return window.indexedDB.deleteDatabase(this.dbName)
  }
  exportDB(filter?: string[]): Promise<[string, any][]> {
    let names: string[] = this.getStoreNames();
    if(filter) {
      names = names.filter(name=>filter.indexOf(name) >= 0)
    }
    return Promise.all(names.map(name=>this.getAll(name))).then(allResult=>{
      return allResult
          .map((recordList: any[], index: number)=>recordList.map((record: any)=>[names[index], record] as [string, any]))
          .reduce((a, b)=>a.concat(b))
    })
  }
  private exeQueue() {
    if(this.queue.length) {
      let queueUnit = this.queue[0];
      // console.log('%c任务开始执行', 'color: red;', queueUnit.id, queueUnit.handleName, JSON.stringify(queueUnit.params))
      if(queueUnit.before && queueUnit.before()) {
        // console.log('任务中断')
        this.exeQueue();
        return
      }
      // @ts-ignore
      this[queueUnit.handleName](...queueUnit.params)
        .then(queueUnit.resolve)
        .catch(queueUnit.reject)
        .finally(() => {
          this.queue.shift();
          // console.log('%c任务完成', 'color: red;', queueUnit.id, queueUnit.handleName)
          this.exeQueue()
        })
    }
  }
  private addToQueue(unit: MockStorageQueueUnit) {
    unit.id = queueId++;
    this.queue.push(unit);
    // console.log('插入任务', unit.id, this.queue.length)
    // console.table(this.queue.map(q=>({ id: q.id, name: q.handleName, params: JSON.stringify(q.params) })))
    if (this.queue.length === 1) {
      this.exeQueue()
    }
  }
  private open (version?: number, onUpgradeNeeded?: (ev: IDBVersionChangeEvent) => Promise<undefined>): Promise<undefined> {
    return new Promise((resolve, reject) => {
      // console.log('open start')
      if (dbMap[this.dbName]) {
        if (onUpgradeNeeded) {
          // console.log('准备更新数据库结构')
          if (this.db) {
            // console.log('关闭数据库连接')
            this.db.close();
            this.db = undefined;
            delete dbMap[this.dbName]
          }
        } else {
          // console.log('数据库连接已存在，直接返回')
          this.db = dbMap[this.dbName];
          resolve();
          return
        }
      }
      // console.log('准备打开数据库')
      this.requestForIndexDB = window.indexedDB.open(this.dbName, version);
      this.requestForIndexDB.onblocked = function (event) {
        // 如果其他的一些页签加载了该数据库，在我们继续之前需要关闭它们
        // console.error('请关闭其他由该站点打开的页签！')
      };
      this.requestForIndexDB.onsuccess = (event) => {
        // @ts-ignore
        this.db = (event.target as IDBRequest).result;
        // console.log('%c打开数据库成功', 'color: blue;', !!this.db, !!onUpgradeNeeded)
        if (this.db) {
          dbMap[this.dbName] = this.db;
          this.db.onabort = (event) => {
            // @ts-ignore
            // console.error('db abort', event.target.error)
          };
          this.db.onerror = (event) => {
            // @ts-ignore
            // console.error('db onerror', event.target.error)
          };
          // 当由其他页签请求了版本变更时，确认添加了一个会被通知的事件处理程序。
          // 这里允许其他页签来更新数据库，如果不这样做，版本升级将不会发生知道用户关闭了这些页签。
          this.db.onversionchange = (event) => {
            // console.log('db onversionchange', event.oldVersion, event.newVersion)
            this.db!.close()
          };
          // console.log('打开数据库结束')
          resolve()
        } else {
          reject(new Event('mockDB获取失败'))
        }
      };
      this.requestForIndexDB.onerror = ev => {
        // reject(ev)
      };
      this.requestForIndexDB.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
        if (onUpgradeNeeded) {
          // console.log('开始更新数据库')
          // console.dir(onUpgradeNeeded)
          onUpgradeNeeded(ev).then(() => {
            // console.log('更新数据库完成，打开数据库结束')
            // resolve()
          }).catch((e) => {
            reject(e)
          })
        }
      }
    })
  }
  private _add <T extends {id: string | number}> (osName:string, value: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('连接数据库失败')); return }
      if (!this.db.objectStoreNames.contains(osName)) {
        reject(new Error('目标表不存在'));
        return
      }
      let transaction = this.db!.transaction(osName, 'readwrite');
      // 在所有数据添加完毕后的处理
      transaction.oncomplete = function (event) {
        resolve()
      };
      transaction.onerror = function (event) {
        // console.error('transaction.onerror', event)
        // @ts-ignore
        reject((event.target as IDBRequest).error)
      };
      if(!value.id) {
        value.id = uuid();
      }
      transaction.objectStore(osName).add(value)
    })
  }
  private _update <T> (osName:string, key: number, value: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('连接数据库失败')); return }
      if (!this.db.objectStoreNames.contains(osName)) {
        reject(new Error('目标表不存在'));
        return
      }
      let transaction = this.db!.transaction(osName, 'readwrite');
      transaction.oncomplete = function (event) { resolve() };
      transaction.onerror = function (event) { reject(event) };
      transaction.objectStore(osName).put(value)
    })
  }
  private _getAll <T> (osName:string, filter?: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('连接数据库失败')); return }
      if (!this.db.objectStoreNames.contains(osName)) {
        reject(new Error('目标表不存在'));
        return
      }
      let objectStore = this.db!.transaction(osName).objectStore(osName);
      let records: T[] = [];
      objectStore.openCursor().onsuccess = function (event) {
        // @ts-ignore
        let cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (filter) {
            let validData = true;
            for(let key in filter) {
              if(filter[key]) {
                let type = typeof cursor.value[key];
                if (type === "string") {
                  if(!cursor.value[key].match(filter[key])) {
                    validData = false;
                    break;
                  }
                } else if (type === "number") {
                  if(cursor.value[key] !== parseFloat(filter[key])) {
                    validData = false;
                    break;
                  }
                } else if (Array.isArray(cursor.value[key])) {
                  if(cursor.value[key].indexOf(filter[key]) < 0) {
                    validData = false;
                    break;
                  }
                }
              }
            }
            if(validData) {
              records.push(Object.assign(cursor.value, { key: cursor.key }))
            }
          } else {
            records.push(Object.assign(cursor.value, { key: cursor.key }))
          }
          cursor.continue()
        } else {
          resolve(records)
        }
      }
    })
  }
  private _get <T> (osName:string, key: number): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('连接数据库失败')); return }
      if (!this.db.objectStoreNames.contains(osName)) {
        reject(new Error('目标表不存在'));
        return
      }
      this.db.transaction(osName).objectStore(osName).get(key).onsuccess = function (event) {
        // @ts-ignore
        if ((event.target as IDBRequest).result === undefined) {
          reject(new Error('查找不到指定记录,' + 'key=' + key))
        } else {
          // @ts-ignore
          resolve((event.target as IDBRequest).result)
        }
      }
    })
  }
  private _delete (osName:string, key: number): Promise<undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('连接数据库失败')); return }
      if (!this.db.objectStoreNames.contains(osName)) {
        reject(new Error('目标表不存在'));
        return
      }
      let transaction = this.db.transaction(osName, 'readwrite');
      transaction.oncomplete = function (event) { resolve() };
      transaction.onerror = function (event) { reject(event) };
      transaction.objectStore(osName).delete(key)
    })
  }
  ready () {
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: 'open',
        params: [],
        resolve,
        reject,
      })
    })
  }
  getStoreNames(): string[] {
    if (!this.db) {
      throw (new Error('连接数据库失败'))
    }
    return Array.from(this.db.objectStoreNames)
  }
  add<T>(osName:string, value: T): Promise<T> {
    const self = this;
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: '_add',
        params: [osName, value],
        resolve,
        reject,
        before: ()=>{
          // console.log('添加数据前判定表是否存在', osName)
          if (!self.db) { throw new Error('连接数据库失败') }
          let createObjectStore = Promise.resolve();
          if (!self.db.objectStoreNames.contains(osName)) {
            // console.log('不存在，准备创建', osName)
            const version = self.db.version + 1;
            // @ts-ignore
            self.queue.unshift({
              handleName: 'open',
              params: [version, (event: IDBVersionChangeEvent): Promise<undefined> => {
                // console.log('创建表开始', osName)
                return new Promise(resolve => {
                  // @ts-ignore
                  let db: IDBDatabase = (event.target as IDBRequest).result;
                  // 为该数据库创建一个对象仓库
                  let objectStore = db.createObjectStore(osName, { keyPath: 'id' });
                  // 使用事务的 oncomplete 事件确保在插入数据前对象仓库已经创建完毕
                  objectStore.transaction.oncomplete = function(event) {
                    // console.log('创建表结束', osName)
                    resolve()
                  }
                })
              }],
              resolve: ()=>{},
              reject: (e)=>{ throw e },
            });
            return true
          }
          // console.log('存在，跳过', osName)
          return false
        }
      })
    })
  }
  update <T> (osName:string, key: number, value: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: '_update',
        params: [osName, key, value],
        resolve,
        reject,
      })
    })
  }
  getAll <T> (osName:string, filter?: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: '_getAll',
        params: [osName, filter],
        resolve,
        reject,
      })
    })
  }
  get <T> (osName:string, key: number): Promise<T> {
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: '_get',
        params: [osName, key],
        resolve,
        reject,
      })
    })
  }
  delete (osName:string, key: number): Promise<undefined> {
    return new Promise((resolve, reject) => {
      this.addToQueue({
        handleName: '_delete',
        params: [osName, key],
        resolve,
        reject,
      })
    })
  }
}

const mockStorage = new MockStorage();
export default mockStorage
