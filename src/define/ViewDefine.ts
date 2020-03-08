import {WrappedFormUtils} from "ant-design-vue/types/form/form";

export interface ICommonForm {
  cancel(): void;
  loadData(): void;
  save(e?: Event, otherData?: any): void;
  form: WrappedFormUtils;
}

export interface ICommonView {
  reload(): void;
  deleteRecord(record: any): void;
  // 清空当前inlineForm数据，清除内部id，可用于创建新数据
  createForInlineForm(): void;
  // 根据id加载数据到inlineForm
  loadDataForForm(id: number | string): void;
}
