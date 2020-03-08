/**
 * Request define
 */
export type DataBase = {
  id: number | string,
  [propName: string]: any,
}

export type ListResponse<T extends DataBase> = {
  pageSize: number,
  page: number,
  total: number,
  list: T[],
  [propName: string]: any,
}

export default interface IRequest {
  request (url: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: DataBase | any, header?: any, map?: {[key: string]: string}): Promise<any>;
  get<T extends DataBase> (url: string, data?: DataBase | any, header?: any, map?: {[key: string]: string}): Promise<T | ListResponse<T> | any>;
  post<T> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any>;
  put<T extends DataBase> (url: string, data?: T, header?: any, map?: {[key: string]: string}): Promise<any>;
  delete (url: string, data?: any, header?: any, map?: {[key: string]: string}): Promise<any>;
}
