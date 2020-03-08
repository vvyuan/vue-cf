export const NumberFieldFormatter = {
  moneyRMB: {
    parser: (value: string): number => parseFloat(value.replace("￥", '')),
    formatter: (value: number): string => "￥" + parseFloat(String(value || 0)).toFixed(2),
  }
};
