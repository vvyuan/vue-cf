import {WrappedFormUtils} from "ant-design-vue/types/form/form";

export interface ICFForm {
  cancel(): void;
  loadData(): void;
  save(e?: Event, otherData?: any): Promise<any>;
  form: WrappedFormUtils;
}

export interface ICFView {
  reload(): void;
  deleteRecord(record: any): void;
  // 清空当前inlineForm数据，清除内部id，可用于创建新数据
  resetForInlineForm(): void;
  // 根据id加载数据到inlineForm
  loadDataForForm(id: number | string): void;
}
