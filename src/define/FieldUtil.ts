export const CFNumberFieldFormatter = {
  moneyRMB: {
    parser: (value: string): number => parseFloat(value.replace("￥", '')),
    formatter: (value: number): string => "￥" + parseFloat(String(value || 0)).toFixed(2),
  }
};

export type CFDictData = {value: string | number, label: string, children?: CFDictData[], isLeaf?: boolean}

export enum FieldPosition {
  both = 3,
  filter = 2,
  form = 1,
}
