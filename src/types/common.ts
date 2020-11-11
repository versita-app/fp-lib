export type AnyUnaryFn = (a: any) => any
export type MapCallback<T = any, U = any> = ($value: T) => U
export type PartialMapCallback<T = any, U = any> = ($value?: T) => U
export type ArrayCallbackFn<T = any, U = any> = (v: T, index?: number, array?: T[]) => U
