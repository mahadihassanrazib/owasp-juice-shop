// VUL-5: Unsafe dynamic formatter using Function() (intentional)
export function applyKpiFormatter(rawValue: any, formatterExpression: string) {
  // unsafe: builds a new Function from untrusted input
  const format = new Function('value', formatterExpression); // 🚨 semgrep: detect-eval-with-expression
  return format(rawValue);
}

export default applyKpiFormatter;
