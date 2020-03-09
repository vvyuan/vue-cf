import mockStorage from './MockStorage'
import CFIRequest, {CFDataBase, CFListResponse} from "../define/CFIRequest";

abstract class ARequest implements CFIRequest {
  abstract request (url: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: CFDataBase | any, header?: any, map?: {[key: string]: string}): Promise<any>;
  get<T extends CFDataBase> (url: string, data?: CFDataBase | any, header?: any, map?: {[key: string]: string}): Promise<T | CFListResponse<T> | any> {
    return this.request(url, 'GET', data, header, map)
  }
  post<T> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any> {
    return this.request(url, 'POST', data, header, map)
  }
  put<T extends CFDataBase> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any> {
    return this.request(url, 'PUT', data, header, map)
  }
  delete (url: string, data?: any, header?: any, map?: {[key: string]: string}): Promise<any> {
    return this.request(url, 'DELETE', data, header, map)
  }
}

export class MockRequest extends ARequest {
  request (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: CFDataBase | any, header?: any): Promise<any> {
    return mockStorage.ready().then(() => {
      let id = data ? data.id : undefined;
      return new Promise((resolve, reject) => {
        setTimeout(()=>{
          switch (method) {
            case 'GET':
              if (id) {
                resolve(mockStorage.get(url, id))
              } else {
                resolve(mockStorage.getAll(url, data).then(response=>{
                  return {
                    list: response,
                    pageSize: response.length,
                    total: 1,
                    page: 1,
                  }
                }))
              }
              break;
            case 'POST':
              if (data) {
                resolve(mockStorage.add(url, data))
              } else {
                resolve()
              }
              break;
            case 'PUT':
              if (id && data) {
                resolve(mockStorage.update(url, id, data))
              } else {
                reject(new Error('id或要更新的数据不存在'))
              }
              break;
            case 'DELETE':
              if (id) {
                resolve(mockStorage.delete(url, id))
              } else {
                reject(new Error('必须传入id'))
              }
              break;
          }
        }, Math.random() * 500)
      });
    }).catch((e: Error)=>{
      throw e
    })
  }
}

/**
 * 将数据映射到报文字段名
 * @param map key: 视图使用字段名 value: 报文使用字段名
 * @param formData
 */
export function mapDataForRequest(map: {[key: string]: string}, formData: {[key: string]: any}): {[key: string]: any} {
  let tempData: {[key: string]: any} = {};
  for(let key in formData) {
    tempData[map[key] || key] = formData[key]
  }
  return tempData
}
/**
 * 将数据映射到视图字段名
 * @param map key: 视图使用字段名 value: 报文使用字段名
 * @param responseData
 */
export function mapDataForView(map: {[key: string]: string}, responseData: {[key: string]: any}): {[key: string]: any} {
  let mapZ: {[key: string]: string} = {};
  for(let key in map) {
    mapZ[map[key]] = key;
  }
  return mapDataForRequest(mapZ, responseData);
}

class MockRequestEx extends MockRequest {
  private counter: number = 0;
  private readonly colors = [
    '#b14242', '#f18e3a', '#179c07', '#6bc1b9', '#75c16b',
    '#169e92', '#1859a9', '#7651d0', '#cc72d2', '#e299bb',
  ];
  request(url: string, method: "GET" | "POST" | "PUT" | "DELETE", data?: CFDataBase | any, header?: any, map?: {[key: string]: string}): Promise<any> {
    this.counter += 1;
    const counter = this.counter;
    const color = this.colors[counter % 10];
    if(map) {
      data = mapDataForRequest(map, data);
    }
    console.time(`[Mock][Request:${counter}] expend time`);
    console.log(`%c [Mock] %c [Request:${counter}] `, 'color: white; background: black', 'color: white; background: ' + color, url, method, data, header);
    return super.request(url, method, data, header).then(response=>{
      let responseData = response ? response.data || response : null;
      if(responseData && map) {
        if(responseData.list) {
          responseData.list = responseData.list.map((item: any)=>mapDataForView(map, item));
        } else {
          responseData = mapDataForView(map, responseData);
        }
      }
      console.log(`%c [Mock] %c [Request:response:${counter}] `, 'color: white; background: black', 'color: white; background: ' + color, url, method, responseData);
      return response
    }).catch(e=>{
      // message.error(e.message);
      console.log(`%c [Mock] %c [Request:response:${counter}] %c ${e.message}`, 'color: white; background: black', 'color: white; background: ' + color, 'color: red');
      throw e;
    }).finally(()=>{
      console.timeEnd(`[Mock][Request:${counter}] expend time`);
    });
  }
}

export default new MockRequestEx()
