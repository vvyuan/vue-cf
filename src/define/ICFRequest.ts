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
  pageTotal: number,
  list: T[],
  [propName: string]: any,
}

export type PageInfo = {
  page: number,
  pageSize: number,
}

export default interface ICFRequest {
  request (url: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: CFDataBase | any, header?: any): Promise<any>;
  getList<T extends CFDataBase> (url: string, pageInfo?: PageInfo, data?: CFDataBase): Promise<CFListResponse<T>>;
  get<T extends CFDataBase> (url: string, data?: CFDataBase | any, header?: any): Promise<T>;
  post<T> (url: string, data?: T, header?: any): Promise<any>;
  put<T extends CFDataBase> (url: string, data?: T, header?: any): Promise<any>;
  delete (url: string, data?: any, header?: any): Promise<any>;
}
