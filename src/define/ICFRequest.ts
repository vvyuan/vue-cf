/**
 * Request define
 */
export type CFDataBase = {
  id: number | string,
  [propName: string]: any,
}

export type CFListResponse<T extends CFDataBase> = {
  pageSize: number,
  page: number,
  total: number,
  list: T[],
  [propName: string]: any,
}

export default interface ICFRequest {
  request (url: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: CFDataBase | any, header?: any, map?: {[key: string]: string}): Promise<any>;
  get<T extends CFDataBase> (url: string, data?: CFDataBase | any, header?: any, map?: {[key: string]: string}): Promise<T | CFListResponse<T> | any>;
  post<T> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any>;
  put<T extends CFDataBase> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any>;
  delete (url: string, data?: any, header?: any, map?: {[key: string]: string}): Promise<any>;
}
