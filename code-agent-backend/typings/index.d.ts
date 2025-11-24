export type ArrayTypes<T extends readonly any[]> = T[number];
/**
 * 将 T 中的除了 K 的属性都转换为可选属性
 */
export type PartialWithout<T, K extends keyof T> = Pick<T, K> &
  Partial<Omit<T, K>>;
