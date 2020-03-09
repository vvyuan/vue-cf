import { Modal } from 'ant-design-vue';
import { v4 } from 'uuid';
import moment from 'moment';
import md5 from 'md5';

let dbMap = {};
let queueId = 0;
class MockStorage {
    constructor(name = 'mockDB') {
        this.queue = [];
        this.dbName = name;
    }
    deleteDB() {
        return window.indexedDB.deleteDatabase(this.dbName);
    }
    exportDB(filter) {
        let names = this.getStoreNames();
        if (filter) {
            names = names.filter(name => filter.indexOf(name) >= 0);
        }
        return Promise.all(names.map(name => this.getAll(name))).then(allResult => {
            return allResult
                .map((recordList, index) => recordList.map((record) => [names[index], record]))
                .reduce((a, b) => a.concat(b));
        });
    }
    exeQueue() {
        if (this.queue.length) {
            let queueUnit = this.queue[0];
            // console.log('%c任务开始执行', 'color: red;', queueUnit.id, queueUnit.handleName, JSON.stringify(queueUnit.params))
            if (queueUnit.before && queueUnit.before()) {
                // console.log('任务中断')
                this.exeQueue();
                return;
            }
            // @ts-ignore
            this[queueUnit.handleName](...queueUnit.params)
                .then(queueUnit.resolve)
                .catch(queueUnit.reject)
                .finally(() => {
                this.queue.shift();
                // console.log('%c任务完成', 'color: red;', queueUnit.id, queueUnit.handleName)
                this.exeQueue();
            });
        }
    }
    addToQueue(unit) {
        unit.id = queueId++;
        this.queue.push(unit);
        // console.log('插入任务', unit.id, this.queue.length)
        // console.table(this.queue.map(q=>({ id: q.id, name: q.handleName, params: JSON.stringify(q.params) })))
        if (this.queue.length === 1) {
            this.exeQueue();
        }
    }
    open(version, onUpgradeNeeded) {
        return new Promise((resolve, reject) => {
            // console.log('open start')
            if (dbMap[this.dbName]) {
                if (onUpgradeNeeded) {
                    // console.log('准备更新数据库结构')
                    if (this.db) {
                        // console.log('关闭数据库连接')
                        this.db.close();
                        this.db = undefined;
                        delete dbMap[this.dbName];
                    }
                }
                else {
                    // console.log('数据库连接已存在，直接返回')
                    this.db = dbMap[this.dbName];
                    resolve();
                    return;
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
                this.db = event.target.result;
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
                        this.db.close();
                    };
                    // console.log('打开数据库结束')
                    resolve();
                }
                else {
                    reject(new Event('mockDB获取失败'));
                }
            };
            this.requestForIndexDB.onerror = ev => {
                // reject(ev)
            };
            this.requestForIndexDB.onupgradeneeded = (ev) => {
                if (onUpgradeNeeded) {
                    // console.log('开始更新数据库')
                    // console.dir(onUpgradeNeeded)
                    onUpgradeNeeded(ev).then(() => {
                        // console.log('更新数据库完成，打开数据库结束')
                        // resolve()
                    }).catch((e) => {
                        reject(e);
                    });
                }
            };
        });
    }
    _add(osName, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('连接数据库失败'));
                return;
            }
            if (!this.db.objectStoreNames.contains(osName)) {
                reject(new Error('目标表不存在'));
                return;
            }
            let transaction = this.db.transaction(osName, 'readwrite');
            // 在所有数据添加完毕后的处理
            transaction.oncomplete = function (event) {
                resolve();
            };
            transaction.onerror = function (event) {
                // console.error('transaction.onerror', event)
                // @ts-ignore
                reject(event.target.error);
            };
            if (!value.id) {
                value.id = v4();
            }
            transaction.objectStore(osName).add(value);
        });
    }
    _update(osName, key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('连接数据库失败'));
                return;
            }
            if (!this.db.objectStoreNames.contains(osName)) {
                reject(new Error('目标表不存在'));
                return;
            }
            let transaction = this.db.transaction(osName, 'readwrite');
            transaction.oncomplete = function (event) { resolve(); };
            transaction.onerror = function (event) { reject(event); };
            transaction.objectStore(osName).put(value);
        });
    }
    _getAll(osName, filter) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('连接数据库失败'));
                return;
            }
            if (!this.db.objectStoreNames.contains(osName)) {
                reject(new Error('目标表不存在'));
                return;
            }
            let objectStore = this.db.transaction(osName).objectStore(osName);
            let records = [];
            objectStore.openCursor().onsuccess = function (event) {
                // @ts-ignore
                let cursor = event.target.result;
                if (cursor) {
                    if (filter) {
                        let validData = true;
                        for (let key in filter) {
                            if (filter[key]) {
                                let type = typeof cursor.value[key];
                                if (type === "string") {
                                    if (!cursor.value[key].match(filter[key])) {
                                        validData = false;
                                        break;
                                    }
                                }
                                else if (type === "number") {
                                    if (cursor.value[key] !== parseFloat(filter[key])) {
                                        validData = false;
                                        break;
                                    }
                                }
                                else if (Array.isArray(cursor.value[key])) {
                                    if (cursor.value[key].indexOf(filter[key]) < 0) {
                                        validData = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (validData) {
                            records.push(Object.assign(cursor.value, { key: cursor.key }));
                        }
                    }
                    else {
                        records.push(Object.assign(cursor.value, { key: cursor.key }));
                    }
                    cursor.continue();
                }
                else {
                    resolve(records);
                }
            };
        });
    }
    _get(osName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('连接数据库失败'));
                return;
            }
            if (!this.db.objectStoreNames.contains(osName)) {
                reject(new Error('目标表不存在'));
                return;
            }
            this.db.transaction(osName).objectStore(osName).get(key).onsuccess = function (event) {
                // @ts-ignore
                if (event.target.result === undefined) {
                    reject(new Error('查找不到指定记录,' + 'key=' + key));
                }
                else {
                    // @ts-ignore
                    resolve(event.target.result);
                }
            };
        });
    }
    _delete(osName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('连接数据库失败'));
                return;
            }
            if (!this.db.objectStoreNames.contains(osName)) {
                reject(new Error('目标表不存在'));
                return;
            }
            let transaction = this.db.transaction(osName, 'readwrite');
            transaction.oncomplete = function (event) { resolve(); };
            transaction.onerror = function (event) { reject(event); };
            transaction.objectStore(osName).delete(key);
        });
    }
    ready() {
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: 'open',
                params: [],
                resolve,
                reject,
            });
        });
    }
    getStoreNames() {
        if (!this.db) {
            throw (new Error('连接数据库失败'));
        }
        return Array.from(this.db.objectStoreNames);
    }
    add(osName, value) {
        const self = this;
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: '_add',
                params: [osName, value],
                resolve,
                reject,
                before: () => {
                    // console.log('添加数据前判定表是否存在', osName)
                    if (!self.db) {
                        throw new Error('连接数据库失败');
                    }
                    if (!self.db.objectStoreNames.contains(osName)) {
                        // console.log('不存在，准备创建', osName)
                        const version = self.db.version + 1;
                        // @ts-ignore
                        self.queue.unshift({
                            handleName: 'open',
                            params: [version, (event) => {
                                    // console.log('创建表开始', osName)
                                    return new Promise(resolve => {
                                        // @ts-ignore
                                        let db = event.target.result;
                                        // 为该数据库创建一个对象仓库
                                        let objectStore = db.createObjectStore(osName, { keyPath: 'id' });
                                        // 使用事务的 oncomplete 事件确保在插入数据前对象仓库已经创建完毕
                                        objectStore.transaction.oncomplete = function () {
                                            // console.log('创建表结束', osName)
                                            resolve();
                                        };
                                    });
                                }],
                            resolve: () => { },
                            reject: (e) => { throw e; },
                        });
                        return true;
                    }
                    // console.log('存在，跳过', osName)
                    return false;
                }
            });
        });
    }
    update(osName, key, value) {
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: '_update',
                params: [osName, key, value],
                resolve,
                reject,
            });
        });
    }
    getAll(osName, filter) {
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: '_getAll',
                params: [osName, filter],
                resolve,
                reject,
            });
        });
    }
    get(osName, key) {
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: '_get',
                params: [osName, key],
                resolve,
                reject,
            });
        });
    }
    delete(osName, key) {
        return new Promise((resolve, reject) => {
            this.addToQueue({
                handleName: '_delete',
                params: [osName, key],
                resolve,
                reject,
            });
        });
    }
}
const mockStorage = new MockStorage();

class ARequest {
    get(url, data, header, map) {
        return this.request(url, 'GET', data, header, map);
    }
    post(url, data, header, map) {
        return this.request(url, 'POST', data, header, map);
    }
    put(url, data, header, map) {
        return this.request(url, 'PUT', data, header, map);
    }
    delete(url, data, header, map) {
        return this.request(url, 'DELETE', data, header, map);
    }
}
class MockRequest extends ARequest {
    request(url, method, data, header) {
        return mockStorage.ready().then(() => {
            let id = data ? data.id : undefined;
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    switch (method) {
                        case 'GET':
                            if (id) {
                                resolve(mockStorage.get(url, id));
                            }
                            else {
                                resolve(mockStorage.getAll(url, data).then(response => {
                                    return {
                                        list: response,
                                        pageSize: response.length,
                                        total: 1,
                                        page: 1,
                                    };
                                }));
                            }
                            break;
                        case 'POST':
                            if (data) {
                                resolve(mockStorage.add(url, data));
                            }
                            else {
                                resolve();
                            }
                            break;
                        case 'PUT':
                            if (id && data) {
                                resolve(mockStorage.update(url, id, data));
                            }
                            else {
                                reject(new Error('id或要更新的数据不存在'));
                            }
                            break;
                        case 'DELETE':
                            if (id) {
                                resolve(mockStorage.delete(url, id));
                            }
                            else {
                                reject(new Error('必须传入id'));
                            }
                            break;
                    }
                }, Math.random() * 500);
            });
        }).catch((e) => {
            throw e;
        });
    }
}
/**
 * 将数据映射到报文字段名
 * @param map key: 视图使用字段名 value: 报文使用字段名
 * @param formData
 */
function mapDataForRequest(map, formData) {
    let tempData = {};
    for (let key in formData) {
        tempData[map[key] || key] = formData[key];
    }
    return tempData;
}
/**
 * 将数据映射到视图字段名
 * @param map key: 视图使用字段名 value: 报文使用字段名
 * @param responseData
 */
function mapDataForView(map, responseData) {
    let mapZ = {};
    for (let key in map) {
        mapZ[map[key]] = key;
    }
    return mapDataForRequest(mapZ, responseData);
}
class MockRequestEx extends MockRequest {
    constructor() {
        super(...arguments);
        this.counter = 0;
        this.colors = [
            '#b14242', '#f18e3a', '#179c07', '#6bc1b9', '#75c16b',
            '#169e92', '#1859a9', '#7651d0', '#cc72d2', '#e299bb',
        ];
    }
    request(url, method, data, header, map) {
        this.counter += 1;
        const counter = this.counter;
        const color = this.colors[counter % 10];
        if (map) {
            data = mapDataForRequest(map, data);
        }
        console.time(`[Mock][Request:${counter}] expend time`);
        console.log(`%c [Mock] %c [Request:${counter}] `, 'color: white; background: black', 'color: white; background: ' + color, url, method, data, header);
        return super.request(url, method, data, header).then(response => {
            let responseData = response ? response.data || response : null;
            if (responseData && map) {
                if (responseData.list) {
                    responseData.list = responseData.list.map((item) => mapDataForView(map, item));
                }
                else {
                    responseData = mapDataForView(map, responseData);
                }
            }
            console.log(`%c [Mock] %c [Request:response:${counter}] `, 'color: white; background: black', 'color: white; background: ' + color, url, method, responseData);
            return response;
        }).catch(e => {
            // message.error(e.message);
            console.log(`%c [Mock] %c [Request:response:${counter}] %c ${e.message}`, 'color: white; background: black', 'color: white; background: ' + color, 'color: red');
            throw e;
        }).finally(() => {
            console.timeEnd(`[Mock][Request:${counter}] expend time`);
        });
    }
}
var MockRequest$1 = new MockRequestEx();

// @ts-ignore
var CFButtonPosition;
(function (CFButtonPosition) {
    // table
    CFButtonPosition["tableHeaderLeft"] = "tableHeaderLeft";
    CFButtonPosition["tableHeaderRight"] = "tableHeaderRight";
    CFButtonPosition["tableRowOperations"] = "tableRowOperations";
    // form
    CFButtonPosition["inlineHeaderLeft"] = "inlineHeaderLeft";
    CFButtonPosition["inlineHeaderCenter"] = "inlineHeaderCenter";
    CFButtonPosition["inlineHeaderRight"] = "inlineHeaderRight";
    CFButtonPosition["inlineFooterLeft"] = "inlineFooterLeft";
    CFButtonPosition["inlineFooterCenter"] = "inlineFooterCenter";
    CFButtonPosition["inlineFooterRight"] = "inlineFooterRight";
    CFButtonPosition["drawerFooterLeft"] = "drawerFooterLeft";
    CFButtonPosition["drawerFooterRight"] = "drawerFooterRight";
})(CFButtonPosition || (CFButtonPosition = {}));
class CFRequest {
}
class CFConfig {
    constructor() {
        // 字段列表
        this.fieldList = [];
        // 默认的按钮组，可以通过覆盖本属性来取消默认按钮，一般情况下只重写buttons属性即可
        this.defaultButtons = {
            create: {
                title: '新增',
                position: [CFButtonPosition.tableHeaderLeft],
                icon: 'plus',
                type: 'primary',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    if (cfConfig.inlineForm) {
                        view && view.createForInlineForm();
                    }
                    else {
                        router.push(router.currentRoute.path + "/create");
                    }
                }
            },
            edit: {
                title: '',
                position: [CFButtonPosition.tableRowOperations],
                icon: 'edit',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    if (cfConfig.inlineForm) {
                        view && view.loadDataForForm(record.id);
                    }
                    else {
                        router.push(router.currentRoute.path + "/edit?id=" + record.id);
                    }
                }
            },
            delete: {
                title: '',
                position: [CFButtonPosition.tableRowOperations],
                icon: 'delete',
                type: 'danger',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    Modal.confirm({
                        title: '确定删除？',
                        onOk: () => {
                            view && view.deleteRecord(record);
                        }
                    });
                }
            },
            printTable: {
                title: '打印',
                position: [CFButtonPosition.tableHeaderRight],
                icon: 'printer',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    window.print();
                }
            },
            printForm: {
                title: '打印',
                position: [CFButtonPosition.drawerFooterRight, CFButtonPosition.inlineFooterCenter],
                icon: 'printer',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    window.print();
                }
            },
            cancel: {
                title: '取消',
                position: [CFButtonPosition.drawerFooterRight],
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    form && form.cancel();
                }
            },
            save: {
                title: '保存',
                position: [CFButtonPosition.drawerFooterRight, CFButtonPosition.inlineFooterCenter],
                type: 'primary',
                onClick: (router, cfConfig, view, form, selectedRecords, record) => {
                    form && form.save();
                }
            },
        };
        // 自定义按钮组，可增量覆盖默认按钮组
        this.buttons = {};
        // 页面标题
        this.pageTitle = '';
        // 表单是否内嵌到view中
        this.inlineForm = false;
        // 是否启用行选择模式
        this.enableSelect = false;
    }
    static useRequest(request) {
        if (CFRequest.request) {
            return;
        }
        CFRequest.request = request;
    }
    get map() {
        if (!this._map) {
            this._map = {};
            this.fieldList.forEach(field => {
                if (field.packetFieldName) {
                    this.map[field.name] = field.packetFieldName;
                }
            });
        }
        return this._map;
    }
    /**
     * 获取所有按钮清单，此处可继承后根据权限处理按钮是否允许显示
     */
    buttonFilter(buttons) {
        return buttons;
    }
    get buttonList() {
        if (!this._buttonList) {
            let result = { ...this.defaultButtons, ...this.buttons };
            let buttonList = [];
            for (let key in result) {
                let button = result[key];
                if (button) {
                    button.key = key;
                    buttonList.push(button);
                }
            }
            buttonList = buttonList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
            this._buttonList = this.buttonFilter(buttonList);
        }
        // @ts-ignore
        return this._buttonList;
    }
    get realButtons() {
        if (!this._realButtons) {
            let realButtons = this.buttonList;
            this._realButtons = { tableHeaderLeft: [], tableHeaderRight: [], tableRowOperations: [], inlineHeaderLeft: [], inlineHeaderCenter: [], inlineHeaderRight: [], inlineFooterLeft: [], inlineFooterCenter: [], inlineFooterRight: [], drawerFooterLeft: [], drawerFooterRight: [] };
            for (let button of realButtons) {
                for (let position of button.position) {
                    this._realButtons[position].push(button);
                }
            }
        }
        return this._realButtons;
    }
    // 数据请求及数据整理
    get request() {
        return CFRequest.request || MockRequest$1;
    }
    getList(filter) {
        return this.request.get(this.url, filter, {}, this.map);
    }
    getOne(id) {
        return this.request.get(this.url, { id: id }, {}, this.map);
    }
    createOne(data) {
        return this.request.post(this.url, data, {}, this.map);
    }
    updateOne(data) {
        return this.request.put(this.url, data, {}, this.map);
    }
    deleteOne(id) {
        return this.request.delete(this.url, { id: id }, {}, this.map);
    }
}

var FieldPosition;
(function (FieldPosition) {
    FieldPosition[FieldPosition["both"] = 3] = "both";
    FieldPosition[FieldPosition["filter"] = 2] = "filter";
    FieldPosition[FieldPosition["form"] = 1] = "form";
})(FieldPosition || (FieldPosition = {}));
class FieldConfig {
    /**
     * 基本字段构造方法
     * @param placeholder
     * @param position 显示的位置
     * @param rules
     * @param print
     */
    constructor(placeholder, position, rules, print) {
        // onChange事件响应队列
        this.onChangeFnList = [];
        this.onChangeHandleDelayTimer = 0;
        if (placeholder) {
            this.placeholder = placeholder;
        }
        this.position = position || FieldPosition.both;
        if (rules === true) {
            this.rules = [{ required: true, message: this.placeholder }];
        }
        else {
            this.rules = rules;
        }
        if (print) {
            this.print = print;
        }
    }
    /**
     * 输入值转换函数，默认为原始值
     * @param value 从数据源获取到的值
     * @return 作为最终写入到表单的值
     */
    translateInput(value) {
        return value;
    }
    /**
     * 结果转换函数，默认为原始值
     * @param value 从表单获取到的结果
     * @return 作为最终提交的值
     */
    translateResult(value) {
        return value;
    }
    /**
     * 选中事件处理方法，方法存在两个含义
     * 用于级联选择
     * 当dataSource: GetCFDictDataFn时，onChange作为事件处理方法，将dataSource放入响应处理队列
     * 用于组件事件响应
     * 当dataSource: string | string[]时，onChange作为事件响应方法，执行响应处理队列
     * @param dataSource
     */
    onChange(dataSource) {
        if (typeof dataSource === "function") {
            // 创建一个被监听对象
            let obj = { value: [] };
            this.onChangeFnList.push({ fn: dataSource, watch: obj });
            return () => obj;
        }
        else {
            if (this.onChangeFnList.length === 0) {
                // 无效返回
                return () => ({ value: [] });
            }
            clearTimeout(this.onChangeHandleDelayTimer);
            this.onChangeHandleDelayTimer = window.setTimeout(() => {
                // 结果转换
                let value = dataSource;
                if (value instanceof Event) {
                    // @ts-ignore
                    value = value.target.value;
                }
                value = this.translateResult(value);
                // 执行响应队列
                this.onChangeFnList.forEach(({ fn, watch }) => {
                    // 执行数据获取方法并将数据写入被监听对象
                    fn(Array.isArray(value) ? value.length : 0, value).then(res => {
                        watch.value = res;
                    });
                });
            }, 500);
            // 无效返回
            return () => ({ value: [] });
        }
    }
}
// TODO: 文本验证规则
var RuleForText;
(function (RuleForText) {
})(RuleForText || (RuleForText = {}));
// 文本类表单
class ReadonlyField extends FieldConfig {
}
class TextField extends FieldConfig {
}
class NumberField extends FieldConfig {
    constructor(placeholder, position, rules, print, options) {
        super(placeholder, position, rules, print);
        if (options) {
            this.max = options.max;
            this.min = options.min;
            this.step = options.step;
            this.formatter = options.formatter;
            this.parser = options.parser;
        }
    }
}
class PasswordField extends FieldConfig {
    translateResult(value) {
        return value ? md5(value) : '';
    }
}
class TextareaField extends FieldConfig {
    constructor(rows, placeholder, position, rules, print) {
        super(placeholder, position, rules, print);
        this.rows = rows;
    }
}
class RichTextField extends FieldConfig {
}
// 时间类表单
class DateFieldBase extends FieldConfig {
    /**
     * 时间类表单构造方法
     * @param format 格式参考 https://momentjs.com/docs/#/displaying/
     * @param placeholder
     * @param position
     * @param rules
     * @param print
     */
    constructor(format, placeholder, position, rules, print) {
        super(placeholder, position, rules, print);
        this.format = format || 'YYYY-MM-DD HH:mm:ss';
    }
    translateInput(value) {
        return value ? moment(value, this.format) : undefined;
    }
    translateResult(value) {
        return value ? value.format(this.format) : undefined;
    }
}
class TimeField extends DateFieldBase {
    constructor(format, placeholder, position, rules, print) {
        super(format || 'HH:mm:ss', placeholder, position, rules, print);
    }
}
class DateField extends DateFieldBase {
    constructor(format, placeholder, position, rules, print) {
        super(format || 'YYYY-MM-DD', placeholder, position, rules, print);
    }
}
class DateTimeField extends DateFieldBase {
}
class DateRangeField extends DateFieldBase {
}
class TimeRangeField extends DateFieldBase {
}
// 带有字典数据的表单
class FieldWithDict extends FieldConfig {
    constructor(dataSource, placeholder, position, rules, print) {
        super(placeholder, position, rules, print);
        this.isLoadData = false;
        this.options = [];
        this._dataSource = dataSource;
    }
    dataSource() {
        // | {value: CFDictData[]}
        let result = this._dataSource(0);
        if (result instanceof Promise) {
            return result;
        }
        else {
            let self = this;
            // 监听WatchValueFn返回的对象
            Object.defineProperty(result, 'value', {
                get() { return true; },
                set(val) {
                    console.log(val);
                    self.options = val;
                }
            });
            return Promise.resolve([]);
        }
    }
    loadData() {
        if (this.isLoadData) {
            // console.log("load dict from cache");
            return Promise.resolve(this.options);
        }
        else {
            return this.dataSource().then(res => {
                this.isLoadData = true;
                this.options = res;
                return res;
            }).catch((e) => {
                e.message = '[Field:dataSource]' + e.message;
                throw e;
            });
        }
    }
}
class ReadonlyFieldWithDict extends FieldWithDict {
}
// 下拉选框类表单
class SingleSelectField extends FieldWithDict {
}
class MultipleSelectField extends FieldWithDict {
}
class TagField extends FieldWithDict {
}
// 级联选择
class CascaderField extends FieldWithDict {
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
    constructor(dataSource, placeholder, position, rules, print) {
        super(Array.isArray(dataSource) ? dataSource[0] : dataSource, placeholder, position, rules, print);
        this.mutilDataSource = [];
        this.needLoadData = false;
        if (Array.isArray(dataSource)) {
            if (dataSource.length === 0) {
                throw new Error('dataSource要求至少有一个可用数据源');
            }
            else {
                this.mutilDataSource = dataSource;
                this.needLoadData = true;
            }
            console.log(this.needLoadData);
        }
    }
    loadData(selectedOptions) {
        if (selectedOptions && this.needLoadData) {
            const targetOption = selectedOptions[selectedOptions.length - 1];
            // @ts-ignore
            targetOption.loading = true;
            let index = Math.min(this.mutilDataSource.length - 1, selectedOptions.length);
            console.log('loadData', selectedOptions.length, targetOption.value);
            return this.mutilDataSource[index](selectedOptions.length, targetOption.value).then(res => {
                // @ts-ignore
                targetOption.loading = false;
                targetOption.children = res;
                this.options = [...this.options];
                return res;
            });
        }
        else {
            return super.loadData();
        }
    }
}
// 按钮类表单
class RadioField extends FieldWithDict {
}
class CheckboxField extends FieldWithDict {
}

var Field = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get FieldPosition () { return FieldPosition; },
    FieldConfig: FieldConfig,
    get RuleForText () { return RuleForText; },
    ReadonlyField: ReadonlyField,
    TextField: TextField,
    NumberField: NumberField,
    PasswordField: PasswordField,
    TextareaField: TextareaField,
    RichTextField: RichTextField,
    DateFieldBase: DateFieldBase,
    TimeField: TimeField,
    DateField: DateField,
    DateTimeField: DateTimeField,
    DateRangeField: DateRangeField,
    TimeRangeField: TimeRangeField,
    FieldWithDict: FieldWithDict,
    ReadonlyFieldWithDict: ReadonlyFieldWithDict,
    SingleSelectField: SingleSelectField,
    MultipleSelectField: MultipleSelectField,
    TagField: TagField,
    CascaderField: CascaderField,
    RadioField: RadioField,
    CheckboxField: CheckboxField
});

const CFNumberFieldFormatter = {
    moneyRMB: {
        parser: (value) => parseFloat(value.replace("￥", '')),
        formatter: (value) => "￥" + parseFloat(String(value || 0)).toFixed(2),
    }
};

function menuCreator() {
}

/**
 * obj转url参数
 * @param obj
 */
function objectToQueryString(obj) {
    if (obj instanceof FormData) {
        return Array.from(obj).filter(item => item[1]).map(item => item[0] + '=' + encodeURIComponent(item[1])).join('&');
    }
    else {
        let queryArray = [];
        for (let key in obj) {
            if (obj[key]) {
                queryArray.push(key + '=' + encodeURIComponent(obj[key]));
            }
        }
        return queryArray.join('&');
    }
}

var CFCommonForm = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"cf-common-form-container"},[(_vm.cfConfig && _vm.cfConfig.formPrintTemplate)?_c(_vm.cfConfig.formPrintTemplate,{tag:"component"}):_vm._e(),_vm._v(" "),_c('div',[_c('a-form',{ref:"form",attrs:{"form":_vm.form},on:{"submit":_vm.save}},[_c('a-row',{staticClass:"content common-form-content"},[_vm._l((_vm.fieldList),function(field,index){return [(field.inForm.position & _vm.FieldDefine.FieldPosition.form)?_c('a-col',{key:index,attrs:{"xs":_vm._inlineForm ? 24 : 24,"sm":_vm._inlineForm ? 24 : 24,"md":_vm._inlineForm ? 12 : 24,"lg":_vm._inlineForm ? 12 : 24,"xl":_vm._inlineForm ? 8 : 24,"xxl":_vm._inlineForm ? 6 : 24}},[_c('a-form-item',{staticClass:"form-item",attrs:{"disabled":_vm.readonly,"label-col":{span: 5},"wrapper-col":{span: 19},"label":field.title}},[(field.inForm instanceof _vm.FieldDefine.TextField)?[_c('a-input',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:_vm._e(),_vm._v(" "),(field.inForm instanceof _vm.FieldDefine.ReadonlyField || field.inForm instanceof _vm.FieldDefine.ReadonlyFieldWithDict)?[_c('a-input',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name]),expression:"[field.name]"}],staticClass:"input",attrs:{"disabled":true}})]:_vm._e(),_vm._v(" "),(field.inForm instanceof _vm.FieldDefine.PasswordField)?[_c('a-input-password',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"placeholder":field.inForm.placeholder}})]:_vm._e(),_vm._v(" "),(field.inForm instanceof _vm.FieldDefine.TextareaField)?[_c('a-textarea',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"rows":field.inForm.rows,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.NumberField)?[_c('a-input-number',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"step":field.inForm.step,"max":field.inForm.max,"min":field.inForm.min,"formatter":field.inForm.formatter,"parser":field.inForm.parser,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.SingleSelectField)?[_c('a-select',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"showSearch":"","optionFilterProp":"children","filterOption":_vm.filterOption(),"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.MultipleSelectField)?[_c('a-select',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"mode":"multiple","showSearch":"","optionFilterProp":"children","filterOption":_vm.filterOption(),"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.TagField)?[_c('a-select',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"mode":"tags","showSearch":"","optionFilterProp":"children","filterOption":_vm.filterOption(),"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.CascaderField)?[_c('a-cascader',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"showSearch":field.inForm.needLoadData ? false : {filter: _vm.cascaderFilterOption()},"loadData":field.inForm.needLoadData ? field.inForm.loadData.bind(field.inForm) : undefined,"changeOnSelect":field.inForm.needLoadData,"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.RadioField)?[_c('a-radio-group',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.CheckboxField)?[_c('a-checkbox-group',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"placeholder":field.inForm.placeholder,"options":field.inForm.options},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.DateTimeField)?[_c('a-date-picker',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"showTime":"","getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.DateField)?[_c('a-date-picker',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:(field.inForm instanceof _vm.FieldDefine.TimeField)?[_c('a-time-picker',{directives:[{name:"decorator",rawName:"v-decorator",value:([field.name, {rules: field.inForm.rules || []}]),expression:"[field.name, {rules: field.inForm.rules || []}]"}],staticClass:"input",attrs:{"disabled":_vm.readonly,"getPopupContainer":_vm.getPopupContainer,"placeholder":field.inForm.placeholder},on:{"change":function (e){ return field.inForm.onChange(e); }}})]:_vm._e()],2)],1):_vm._e()]})],2),_vm._v(" "),(!_vm._inlineForm)?[_c('div',{staticClass:"footer-placeholder"}),_vm._v(" "),_c('div',{staticClass:"footer"},[_c('div',{staticClass:"left-buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.drawerFooterLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"right-buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.drawerFooterRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2)])]:_vm._e()],2)],1)],1)},
staticRenderFns: [],
stub: 1
};

var CFCommonView = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"cf-common-view-container"},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig),expression:"cfConfig"}]},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig && _vm.cfConfig.inlineForm),expression:"cfConfig && cfConfig.inlineForm"}]},[_c('a-divider',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig && _vm.cfConfig.pageTitle),expression:"cfConfig && cfConfig.pageTitle"}]},[_vm._v(_vm._s(_vm.cfConfig && _vm.cfConfig.pageTitle))]),_vm._v(" "),_c('div',{staticStyle:{"display":"flex","margin-bottom":"16px","align-items":"center"}},[_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-start"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"center"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderCenter : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-end"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2)]),_vm._v(" "),(_vm.cfConfig && _vm.cfConfig.pageTitle)?_c('a-divider',{staticStyle:{"margin":"8px 0 20px 0"}}):_vm._e(),_vm._v(" "),_c('common-form',{ref:"form",attrs:{"cfConfig":_vm.cfConfig,"id":_vm.formId},on:{"on-saved":_vm.onFormSaved}}),_vm._v(" "),_c('div',{staticStyle:{"display":"flex"}},[_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-start"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"center"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterCenter : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-end"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2)]),_vm._v(" "),_c('a-divider')],1),_vm._v(" "),(_vm.checkPathIsCurView() && _vm.cfConfig && _vm.cfConfig.tablePrintTemplate)?_c(_vm.cfConfig.tablePrintTemplate,{tag:"component",attrs:{"cfConfig":_vm.cfConfig}}):_vm._e(),_vm._v(" "),_c('div',{staticStyle:{"display":"flex","justify-content":"space-between","margin-bottom":"16px"}},[_c('div',{staticClass:"buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableHeaderLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableHeaderRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]}),_vm._v(" "),_c('a-button',{attrs:{"hidden":_vm.filters.length === 0,"icon":"filter"},on:{"click":function($event){_vm.openFilter=!_vm.openFilter;}}},[_vm._v("筛选")])],2)]),_vm._v(" "),_c('form',{ref:"filterForm",class:("filter-container " + (_vm.openFilterEx ? 'active' : '')),attrs:{"form":"filterForm","action":"./"},on:{"submit":function($event){$event.stopPropagation();$event.preventDefault();return _vm.submitFilter($event)}}},[_c('div',{staticStyle:{"display":"flex","padding":"4px 10px","align-items":"center","justify-content":"space-between","border-bottom":"solid 1px #77d0ea","background":"#ecfdff"}},[_c('div',[_vm._v("筛选")]),_vm._v(" "),_c('div',[_c('a-button',{attrs:{"size":"small","html-type":"reset"},on:{"click":_vm.resetFilter}},[_vm._v("重置")]),_vm._v(" "),_c('a-button',{staticStyle:{"margin-left":"8px"},attrs:{"size":"small","html-type":"submit"}},[_vm._v("搜索")])],1)]),_vm._v(" "),_c('div',{staticClass:"content"},[_c('a-row',[_vm._l((_vm.filters),function(filter){return [_c('a-col',{key:filter.name,staticStyle:{"display":"flex","align-items":"center","padding":"16px 16px 0 16px"},attrs:{"xs":24,"sm":24,"md":12,"lg":8,"xl":8,"xxl":6}},[_c('div',{staticStyle:{"min-width":"6em","max-width":"40%"}},[_vm._v(_vm._s(filter.title)+"：")]),_vm._v(" "),_c('div',{staticStyle:{"flex":"1"}},[(filter.inForm instanceof _vm.Field.FieldWithDict)?[_c('a-select',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name],"options":[{value: '', label: '无'}].concat(filter.inForm.options)},on:{"change":function (value){ return _vm.filterChange(filter.name, value); }}})]:(filter.inForm instanceof _vm.Field.DateFieldBase)?[_c('a-date-picker',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name] ? _vm.moment(_vm.$route.query[filter.name], filter.inForm.format) : null},on:{"change":function (moment){ return _vm.filterChange(filter.name, moment ? moment.format(filter.inForm.format) : ''); }}})]:[_c('a-input',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name]},on:{"change":function (e){ return _vm.filterChange(filter.name, e.target.value); }}})]],2)])]})],2)],1)]),_vm._v(" "),_c('div',[_c('a-table',{attrs:{"columns":_vm.columnsData.columns,"rowSelection":_vm.cfConfig && _vm.cfConfig.enableSelect ? {selectedRowKeys: _vm.selectedRowKeys, onChange: _vm.onSelectChange} : undefined,"rowKey":"id","dataSource":_vm.list,"pagination":_vm.pagination,"loading":_vm.loading,"scroll":_vm.columnsData.tableScrollWidth ? { x: _vm.columnsData.tableScrollWidth } : undefined},on:{"change":_vm.handleTableChange},scopedSlots:_vm._u([{key:"operation",fn:function(text, record){return [_c('div',{staticClass:"operation buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableRowOperations : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick, record)}}},[_vm._v(_vm._s(button.title))])]})],2)]}}])}),_vm._v(" "),_c('router-view')],1)],1),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(!_vm.cfConfig),expression:"!cfConfig"}]},[_c('h5',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('a-alert',{attrs:{"message":"[CFCommonView:props] cfConfig无效","type":"error"}})],1)])},
staticRenderFns: [],
    name: 'CFCommonView',
    components: {CFCommonForm},
    props: {
      title: Array,
      cfConfig: null,
      path: null,
    },
    data () {
      return {
        formId: undefined,
        loading: false,
        selectedRowKeys: [],
        selectedRecords: [],
        list: [],
        pagination: {},
        openFilter: false,
        Field: Field,
        filterForm: this.$form.createForm(),
      }
    },
    computed: {
      openFilterEx: function() {
        let existFilterQuery = false;
        for(let queryKey in this.$route.query) {
          if(this.$route.query[queryKey]) {
            existFilterQuery = true;
            break;
          }
        }
        if(!this.checkPathIsCurView()) {
          return false
        }
        return this.openFilter || existFilterQuery
      },
      filters: function() {
        if(!this.cfConfig) { return [] }
        return this.cfConfig.fieldList.filter(field=>field.inForm && (field.inForm.position & FieldPosition.filter))
      },
      columnsData: function () {
        let containerWidth = document.body.offsetWidth - 200 - 40;
        let emToPxRatio = 14;
        if(!this.cfConfig) { return [] }
        let fieldListColumns = this.cfConfig.fieldList.filter(field => field.inTable && !!field.inTable.display).map(field => {
          let formatter = {};
          if(field.inForm && field.inForm.formatter) {
            formatter.customRender = field.inForm.formatter;
          }
          if(field.inTable.formatter) {
            formatter.customRender = field.inTable.formatter;
          }
          return {
            title: field.title,
            dataIndex: field.name,
            ...field.inTable.column,
            ...formatter
          }
        });
        let fullWidthConfig = true; // 是否所有显示的列都配置了宽度
        // 所有已配置宽度的列的总宽度
        let columnsWidthTotal = [0].concat(fieldListColumns).reduce((a, b)=>{
          fullWidthConfig = fullWidthConfig && !!b.width;
          let bWidth = b.width || 0;
          if(typeof bWidth === "string") {
            let match = bWidth.match(/^(\d+)(\w+)$/);
            if(match) {
              switch (match[2]) {
                case 'px':
                  bWidth = match[1] * 1;
                  break;
                case 'em':
                  bWidth = match[1] * emToPxRatio;
                  break;
                default:
                  // 对于不支持的类型默认认为0宽度
                  bWidth = 0;
              }
            }
          }
          // 谜之数据默认为宽度为0
          return a + (parseInt(bWidth) || 0);
        });
        let setDefaultColumnWidth = false; // 是否为各个列配置默认宽度，此时必然开启水平滑动
        if(columnsWidthTotal > containerWidth) {
          // 当表格中已配置宽度的列总宽度超过容器宽度时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true;
        } else if(fullWidthConfig) {
          // 当表格中已配置宽度的列总宽度小于容器宽度时，并且当所有列都配置了宽度时，本判定优先级高于显示的列数判定
          setDefaultColumnWidth = false;
        } else if(fieldListColumns.length > 9) {
          // 当表格中显示的列数超过9个时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true;
        }
        if(setDefaultColumnWidth) {
          // 配置默认列宽度 200px
          fieldListColumns.forEach(item=>{
            if(!item.width) {
              columnsWidthTotal += 200;
              item.width = 200;
            }
          });
        }
        fieldListColumns = fieldListColumns.concat({
          title: '操作',
          dataIndex: 'operation',
          align: 'center',
          width: 60,
          fixed: setDefaultColumnWidth ? 'right' : undefined,
          scopedSlots: { customRender: 'operation' },
        });
        return {columns: fieldListColumns, tableScrollWidth: columnsWidthTotal}
      }
    },
    watch: {
      // 如果路由有变化，会再次执行该方法
      '$route': 'routeChange'
    },
    created () {
      // 组件创建完后获取数据，
      // 此时 data 已经被 observed 了
      this.reload();
    },
    mounted() {
      this.filterData = {...this.$route.query};
      // console.log('mounted', this.filterData)
      // console.log("view:mounted")
      // addEventListener('keyup', this.keyPressEventHandle);
    },
    destroyed() {
      // console.log("view:destroyed")
      // removeEventListener('keyup', this.keyPressEventHandle)
    },
    // 带有字典数据且显示在table中或可搜索的字段列表
    fieldWithDictList: [],
    // 筛选数据
    filterData: {},
    methods: {
      moment(a, b, c) { return moment(a, b, c) },
      onCFButtonClick(buttonClickFn, record) {
        buttonClickFn(this.$router, this.cfConfig, this, this.$refs.form, this.selectedRecords, record);
      },
      checkPathIsCurView() {
        // props.path在创建菜单时自动生成
        return this.$route.matched.length === 0 || this.$route.matched[this.$route.matched.length - 1].path === this.path
      },
      reload() {
        this.$nextTick(()=>{
          this.getList().then(this.createForInlineForm);
        });
      },
      loadDict() {
        if(this.cfConfig) {
          this.fieldWithDictList = this.cfConfig.fieldList.filter(field=>field.inForm && field.inForm instanceof FieldWithDict && ((field.inForm.position & FieldPosition.filter) || (field.inTable && field.inTable.display)));
          let loadDict = this.fieldWithDictList.map(field=>field.inForm.loadData());
          return Promise.all(loadDict)
        }
        return Promise.resolve()
      },
      routeChange(a, b) {
        // console.log("routeChange", this.$route);
        if(this.checkPathIsCurView()) {
          this.reload();
        }
      },
      getList () {
        if(this.cfConfig) {
          this.loading = true;
          return this.loadDict().then(()=>this.cfConfig.getList(this.$route.query)).then(response => {
            let list = response.list;
            if(this.fieldWithDictList.length) {
              // 映射字典值
              list.forEach(item=>{
                for(let field of this.fieldWithDictList) {
                  let value = item[field.name];
                  let label = null;
                  if(Array.isArray(value)) {
                    label = value.map(v=>(field.inForm.options.find(option=>option.value === v) || {}).label || value).join(',');
                  } else {
                    label = (field.inForm.options.find(option=>option.value === value) || {}).label;
                  }
                  item[field.name] = label || value;
                }
              });
            }
            this.list = list;
          }).catch(e=>{
            this.list = [];
            console.error(e.message);
          }).finally(()=>{
            this.loading = false;
          })
        } else {
          return Promise.resolve();
        }
      },
      deleteRecord(record) {
        console.log(record);
        this.loading = true;
        this.cfConfig && this.cfConfig.deleteOne(record.id).then(response=>{
          this.reload();
        }).finally(()=>{
          this.loading = false;
        });
      },
      handleTableChange (pagination, filters, sorter) {
        console.log(pagination);
        // const pager = { ...this.pagination };
        // pager.current = pagination.current;
        // this.pagination = pager;
      },
      filterChange(name, value) {
        if(!this.filterData) { this.filterData = {}; }
        this.filterData[name] = value;
      },
      resetFilter() {
        this.filterData = {};
        if(Object.keys(this.$route.query).length) {
          this.$router.replace(this.$route.path);
        }
      },
      submitFilter(event) {
        const willQueryString = objectToQueryString(this.filterData);
        const curQueryString = objectToQueryString(this.$route.query);
        if(willQueryString !== curQueryString) {
          this.$router.replace('?' + willQueryString);
        }
      },
      onSelectChange(selectedRowKeys) {
        this.selectedRowKeys = selectedRowKeys;
        this.selectedRecords = this.list.filter(item=>this.selectedRowKeys.indexOf(item.id) >= 0);
        // 给所有按钮传递onSelectChange事件
        for(let button of this.cfConfig.buttonList) {
          button.onTableSelected && button.onTableSelected(this.selectedRecords);
        }
      },
      print() {
        print();
      },
      // 以下为form用方法
      loadDataForForm(id) {
        this.formId = id || undefined;
        this.$nextTick(()=>{
          this.$refs.form.loadData().then(()=>{
            // 滚动到顶部
            window.scrollTo(0, 0);
          });
        });
      },
      createForInlineForm() {
        this.formId = undefined;
        this.$refs.form && this.$refs.form.loadData();
      },
      onFormSaved() {
        this.createForInlineForm();
        this.reload();
      },
    }
  };

var CFCommonViewWithDrawer = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig),expression:"cfConfig"}]},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig && _vm.cfConfig.inlineForm),expression:"cfConfig && cfConfig.inlineForm"}]},[_c('a-divider',{directives:[{name:"show",rawName:"v-show",value:(_vm.cfConfig && _vm.cfConfig.pageTitle),expression:"cfConfig && cfConfig.pageTitle"}]},[_vm._v(_vm._s(_vm.cfConfig && _vm.cfConfig.pageTitle))]),_vm._v(" "),_c('div',{staticStyle:{"display":"flex","margin-bottom":"16px","align-items":"center"}},[_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-start"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"center"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderCenter : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-end"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineHeaderRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2)]),_vm._v(" "),(_vm.cfConfig && _vm.cfConfig.pageTitle)?_c('a-divider',{staticStyle:{"margin":"8px 0 20px 0"}}):_vm._e(),_vm._v(" "),_c('common-form',{ref:"form",attrs:{"cfConfig":_vm.cfConfig,"id":_vm.formId},on:{"on-saved":_vm.onFormSaved}}),_vm._v(" "),_c('div',{staticStyle:{"display":"flex"}},[_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-start"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"center"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterCenter : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons",staticStyle:{"display":"flex","flex":"1","align-items":"center","justify-content":"flex-end"}},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.inlineFooterRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2)]),_vm._v(" "),_c('a-divider')],1),_vm._v(" "),(_vm.checkPathIsCurView() && _vm.cfConfig && _vm.cfConfig.tablePrintTemplate)?_c(_vm.cfConfig.tablePrintTemplate,{tag:"component",attrs:{"cfConfig":_vm.cfConfig}}):_vm._e(),_vm._v(" "),_c('div',{staticStyle:{"display":"flex","justify-content":"space-between","margin-bottom":"16px"}},[_c('div',{staticClass:"buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableHeaderLeft : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]})],2),_vm._v(" "),_c('div',{staticClass:"buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableHeaderRight : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick)}}},[_vm._v(_vm._s(button.title))])]}),_vm._v(" "),_c('a-button',{attrs:{"hidden":_vm.filters.length === 0,"icon":"filter"},on:{"click":function($event){_vm.openFilter=!_vm.openFilter;}}},[_vm._v("筛选")])],2)]),_vm._v(" "),_c('form',{ref:"filterForm",class:("filter-container " + (_vm.openFilterEx ? 'active' : '')),attrs:{"form":"filterForm","action":"./"},on:{"submit":function($event){$event.stopPropagation();$event.preventDefault();return _vm.submitFilter($event)}}},[_c('div',{staticStyle:{"display":"flex","padding":"4px 10px","align-items":"center","justify-content":"space-between","border-bottom":"solid 1px #77d0ea","background":"#ecfdff"}},[_c('div',[_vm._v("筛选")]),_vm._v(" "),_c('div',[_c('a-button',{attrs:{"size":"small","html-type":"reset"},on:{"click":_vm.resetFilter}},[_vm._v("重置")]),_vm._v(" "),_c('a-button',{staticStyle:{"margin-left":"8px"},attrs:{"size":"small","html-type":"submit"}},[_vm._v("搜索")])],1)]),_vm._v(" "),_c('div',{staticClass:"content"},[_c('a-row',[_vm._l((_vm.filters),function(filter){return [_c('a-col',{key:filter.name,staticStyle:{"display":"flex","align-items":"center","padding":"16px 16px 0 16px"},attrs:{"xs":24,"sm":24,"md":12,"lg":8,"xl":8,"xxl":6}},[_c('div',{staticStyle:{"min-width":"6em","max-width":"40%"}},[_vm._v(_vm._s(filter.title)+"：")]),_vm._v(" "),_c('div',{staticStyle:{"flex":"1"}},[(filter.inForm instanceof _vm.Field.FieldWithDict)?[_c('a-select',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name],"options":[{value: '', label: '无'}].concat(filter.inForm.options)},on:{"change":function (value){ return _vm.filterChange(filter.name, value); }}})]:(filter.inForm instanceof _vm.Field.DateFieldBase)?[_c('a-date-picker',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name] ? _vm.moment(_vm.$route.query[filter.name], filter.inForm.format) : null},on:{"change":function (moment){ return _vm.filterChange(filter.name, moment ? moment.format(filter.inForm.format) : ''); }}})]:[_c('a-input',{staticStyle:{"width":"100%"},attrs:{"name":filter.name,"placeholder":filter.inForm.placeholder,"defaultValue":_vm.$route.query[filter.name]},on:{"change":function (e){ return _vm.filterChange(filter.name, e.target.value); }}})]],2)])]})],2)],1)]),_vm._v(" "),_c('div',[_c('a-table',{attrs:{"columns":_vm.columnsData.columns,"rowSelection":_vm.cfConfig && _vm.cfConfig.enableSelect ? {selectedRowKeys: _vm.selectedRowKeys, onChange: _vm.onSelectChange} : undefined,"rowKey":"id","dataSource":_vm.list,"pagination":_vm.pagination,"loading":_vm.loading,"scroll":_vm.columnsData.tableScrollWidth ? { x: _vm.columnsData.tableScrollWidth } : undefined},on:{"change":_vm.handleTableChange},scopedSlots:_vm._u([{key:"operation",fn:function(text, record){return [_c('div',{staticClass:"operation buttons"},[_vm._l(((_vm.cfConfig ? _vm.cfConfig.realButtons.tableRowOperations : [])),function(button){return [_c('a-button',{key:button.key,attrs:{"type":button.type,"icon":button.icon},on:{"click":function($event){return _vm.onCFButtonClick(button.onClick, record)}}},[_vm._v(_vm._s(button.title))])]})],2)]}}])}),_vm._v(" "),_c('router-view')],1)],1),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(!_vm.cfConfig),expression:"!cfConfig"}]},[_c('h5',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('a-alert',{attrs:{"message":"[CFCommonView:props] cfConfig无效","type":"error"}})],1)])},
staticRenderFns: [],
    name: 'CFCommonViewWithDrawer',
    components: {CFCommonForm},
    props: {
      title: Array,
      cfConfig: null,
      path: null,
    },
    data () {
      return {
        formId: undefined,
        loading: false,
        selectedRowKeys: [],
        selectedRecords: [],
        list: [],
        pagination: {},
        openFilter: false,
        Field: Field,
        filterForm: this.$form.createForm(),
      }
    },
    computed: {
      openFilterEx: function() {
        let existFilterQuery = false;
        for(let queryKey in this.$route.query) {
          if(this.$route.query[queryKey]) {
            existFilterQuery = true;
            break;
          }
        }
        if(!this.checkPathIsCurView()) {
          return false
        }
        return this.openFilter || existFilterQuery
      },
      filters: function() {
        if(!this.cfConfig) { return [] }
        return this.cfConfig.fieldList.filter(field=>field.inForm && (field.inForm.position & FieldPosition.filter))
      },
      columnsData: function () {
        let containerWidth = document.body.offsetWidth - 200 - 40;
        let emToPxRatio = 14;
        if(!this.cfConfig) { return [] }
        let fieldListColumns = this.cfConfig.fieldList.filter(field => field.inTable && !!field.inTable.display).map(field => {
          let formatter = {};
          if(field.inForm && field.inForm.formatter) {
            formatter.customRender = field.inForm.formatter;
          }
          if(field.inTable.formatter) {
            formatter.customRender = field.inTable.formatter;
          }
          return {
            title: field.title,
            dataIndex: field.name,
            ...field.inTable.column,
            ...formatter
          }
        });
        let fullWidthConfig = true; // 是否所有显示的列都配置了宽度
        // 所有已配置宽度的列的总宽度
        let columnsWidthTotal = [0].concat(fieldListColumns).reduce((a, b)=>{
          fullWidthConfig = fullWidthConfig && !!b.width;
          let bWidth = b.width || 0;
          if(typeof bWidth === "string") {
            let match = bWidth.match(/^(\d+)(\w+)$/);
            if(match) {
              switch (match[2]) {
                case 'px':
                  bWidth = match[1] * 1;
                  break;
                case 'em':
                  bWidth = match[1] * emToPxRatio;
                  break;
                default:
                  // 对于不支持的类型默认认为0宽度
                  bWidth = 0;
              }
            }
          }
          // 谜之数据默认为宽度为0
          return a + (parseInt(bWidth) || 0);
        });
        let setDefaultColumnWidth = false; // 是否为各个列配置默认宽度，此时必然开启水平滑动
        if(columnsWidthTotal > containerWidth) {
          // 当表格中已配置宽度的列总宽度超过容器宽度时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true;
        } else if(fullWidthConfig) {
          // 当表格中已配置宽度的列总宽度小于容器宽度时，并且当所有列都配置了宽度时，本判定优先级高于显示的列数判定
          setDefaultColumnWidth = false;
        } else if(fieldListColumns.length > 9) {
          // 当表格中显示的列数超过9个时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true;
        }
        if(setDefaultColumnWidth) {
          // 配置默认列宽度 200px
          fieldListColumns.forEach(item=>{
            if(!item.width) {
              columnsWidthTotal += 200;
              item.width = 200;
            }
          });
        }
        fieldListColumns = fieldListColumns.concat({
          title: '操作',
          dataIndex: 'operation',
          align: 'center',
          width: 60,
          fixed: setDefaultColumnWidth ? 'right' : undefined,
          scopedSlots: { customRender: 'operation' },
        });
        return {columns: fieldListColumns, tableScrollWidth: columnsWidthTotal}
      }
    },
    watch: {
      // 如果路由有变化，会再次执行该方法
      '$route': 'routeChange'
    },
    created () {
      // 组件创建完后获取数据，
      // 此时 data 已经被 observed 了
      this.reload();
    },
    mounted() {
      this.filterData = {...this.$route.query};
      // console.log('mounted', this.filterData)
      // console.log("view:mounted")
      // addEventListener('keyup', this.keyPressEventHandle);
    },
    destroyed() {
      // console.log("view:destroyed")
      // removeEventListener('keyup', this.keyPressEventHandle)
    },
    // 带有字典数据且显示在table中或可搜索的字段列表
    fieldWithDictList: [],
    // 筛选数据
    filterData: {},
    methods: {
      moment(a, b, c) { return moment(a, b, c) },
      onCFButtonClick(buttonClickFn, record) {
        buttonClickFn(this.$router, this.cfConfig, this, this.$refs.form, this.selectedRecords, record);
      },
      checkPathIsCurView() {
        // props.path在创建菜单时自动生成
        return this.$route.matched.length === 0 || this.$route.matched[this.$route.matched.length - 1].path === this.path
        // meta在创建菜单时自动生成
        // return this.$route.meta && this.$route.meta.type === 'view'
      },
      reload() {
        this.$nextTick(()=>{
          this.getList().then(this.createForInlineForm);
        });
      },
      loadDict() {
        if(this.cfConfig) {
          this.fieldWithDictList = this.cfConfig.fieldList.filter(field=>field.inForm && field.inForm instanceof FieldWithDict && ((field.inForm.position & FieldPosition.filter) || (field.inTable && field.inTable.display)));
          let loadDict = this.fieldWithDictList.map(field=>field.inForm.loadData());
          return Promise.all(loadDict)
        }
        return Promise.resolve()
      },
      routeChange(a, b) {
        // console.log("routeChange", this.$route);
        if(this.checkPathIsCurView()) {
          this.reload();
        }
      },
      getList () {
        if(this.cfConfig) {
          this.loading = true;
          return this.loadDict().then(()=>this.cfConfig.getList(this.$route.query)).then(response => {
            let list = response.list;
            if(this.fieldWithDictList.length) {
              // 映射字典值
              list.forEach(item=>{
                for(let field of this.fieldWithDictList) {
                  let value = item[field.name];
                  let label = null;
                  if(Array.isArray(value)) {
                    label = value.map(v=>(field.inForm.options.find(option=>option.value === v) || {}).label || value).join(',');
                  } else {
                    label = (field.inForm.options.find(option=>option.value === value) || {}).label;
                  }
                  item[field.name] = label || value;
                }
              });
            }
            this.list = list;
          }).catch(e=>{
            this.list = [];
            console.error(e.message);
          }).finally(()=>{
            this.loading = false;
          })
        } else {
          return Promise.resolve();
        }
      },
      deleteRecord(record) {
        console.log(record);
        this.loading = true;
        this.cfConfig && this.cfConfig.deleteOne(record.id).then(response=>{
          this.reload();
        }).finally(()=>{
          this.loading = false;
        });
      },
      handleTableChange (pagination, filters, sorter) {
        console.log(pagination);
        // const pager = { ...this.pagination };
        // pager.current = pagination.current;
        // this.pagination = pager;
      },
      filterChange(name, value) {
        if(!this.filterData) { this.filterData = {}; }
        this.filterData[name] = value;
      },
      resetFilter() {
        this.filterData = {};
        if(Object.keys(this.$route.query).length) {
          this.$router.replace(this.$route.path);
        }
      },
      submitFilter(event) {
        const willQueryString = objectToQueryString(this.filterData);
        const curQueryString = objectToQueryString(this.$route.query);
        if(willQueryString !== curQueryString) {
          this.$router.replace('?' + willQueryString);
        }
      },
      onSelectChange(selectedRowKeys) {
        this.selectedRowKeys = selectedRowKeys;
        this.selectedRecords = this.list.filter(item=>this.selectedRowKeys.indexOf(item.id) >= 0);
        // 给所有按钮传递onSelectChange事件
        for(let button of this.cfConfig.buttonList) {
          button.onTableSelected && button.onTableSelected(this.selectedRecords);
        }
      },
      print() {
        print();
      },
      // 以下为form用方法
      loadDataForForm(id) {
        this.formId = id || undefined;
        this.$nextTick(()=>{
          this.$refs.form.loadData().then(()=>{
            // 滚动到顶部
            window.scrollTo(0, 0);
          });
        });
      },
      createForInlineForm() {
        this.formId = undefined;
        this.$refs.form && this.$refs.form.loadData();
      },
      onFormSaved() {
        this.createForInlineForm();
        this.reload();
      },
    }
  };

var CFCommonFormWithDrawer = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('a-drawer',{attrs:{"wrapClassName":"cf-common-form-drawer","placement":"right","closable":false,"maskClosable":false,"visible":_vm.visible,"width":"600","getContainer":"#drawer"},on:{"close":_vm.onClose}},[_c('template',{slot:"title"},[_c('div',{staticStyle:{"display":"flex","align-items":"center","justify-content":"space-between"}},[(Array.isArray(_vm.title) && _vm.title.length)?[_c('div',[(!this.id)?_c('span',[_vm._v("新增 - ")]):_c('span',[_vm._v("编辑 - ")]),_vm._v(_vm._s(_vm.title[_vm.title.length - 1]))])]:[_c('div',[(!this.id)?_c('span',[_vm._v("新增")]):_c('span',[_vm._v("编辑")])])]],2)]),_vm._v(" "),_c('div',[_c('common-form',{ref:"form",attrs:{"id":_vm.id,"cfConfig":_vm.cfConfig,"inlineForm":false,"initFormValues":_vm.initFormValues},on:{"on-saved":_vm.onClose}})],1)],2)],1)},
staticRenderFns: [],
stub: 1
};

var CFCommonParentView = {
render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('router-view')},
staticRenderFns: [],
    name: 'CommonParentView',
    components: {},
  };

const components = [
    CFCommonView,
    CFCommonForm,
    CFCommonViewWithDrawer,
    CFCommonFormWithDrawer,
    CFCommonParentView,
];
const install = function (Vue) {
    components.forEach(component => {
        Vue.component(component.name, component);
    });
};
// 自动注册组件
// @ts-ignore
if (typeof window !== 'undefined' && window.Vue) {
    // @ts-ignore
    install(window.Vue);
}

export default install;
export { CFButtonPosition, CFCommonForm, CFCommonFormWithDrawer, CFCommonParentView, CFCommonView, CFCommonViewWithDrawer, CFConfig, Field as CFField, CFNumberFieldFormatter, menuCreator };
//# sourceMappingURL=index.js.map
