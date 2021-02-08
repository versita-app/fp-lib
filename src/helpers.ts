import { Maybe, maybe } from './maybe'

export function curry1<T, U> (op: (t: T) => U, item?: T): U | ((t:T) => U) {
  return item !== undefined ? op(item) : op
}

/**
 * returns a property based on supplied key if it exists
 * or the specified fallback if not
 */
export function propOr<T, U = unknown, V = unknown> (prop: string, fallback: V, object: T): U |V
export function propOr<T, U = unknown, V = unknown> (prop: string, fallback: V): (object: T) => U | V
export function propOr<T, U = unknown, V = unknown> (prop: string, fallback: V, object?: T): U | ((object: T) => U) | V {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op = (o:any) => o?.[prop] || fallback
  return curry1(op, object)
}

/**
 * returns a property based on supplied key wrapped in a Maybe
 */
export function prop<T, U = unknown> (prop: string, object: T): Maybe<U>
export function prop<T, U = unknown> (prop: string): (object: T) => Maybe<U>
export function prop<T, U = unknown> (prop: string, object?: T): Maybe<U> | ((object: T) => Maybe<U>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op = (o:any): Maybe<U> => maybe(o?.[prop])
  return curry1(op, object)
}

/**
 * returns a property based on supplied key (unsafe)
 */
export function unsafeProp<T, U = unknown> (prop: string, object: T): U
export function unsafeProp<T, U = unknown> (prop: string): (object: T) => U
export function unsafeProp<T, U = unknown> (prop: string, object?: T): U | ((object: T) => U) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op = (o:any): U => o?.[prop]
  return curry1(op, object)
}
// curry with max. three nestable curried function calls (extendable)
type SubTuple<T extends unknown[], U extends unknown[]> = {
  [K in keyof T]: Extract<keyof U, K> extends never ?
    never :
    T[K] extends U[Extract<keyof U, K>] ?
    T[K]
      : never
}

export declare function curry<T extends unknown[], R>(fn: (...ts: T) => R):
  <U extends unknown[]>(...args: SubTuple<U, T>) => ((...ts: T) => R) extends ((...args: [...U, ...infer V]) => R) ?
    V['length'] extends 0 ? R :
    <W extends unknown[]>(...args: SubTuple<W, V>) => ((...ts: V) => R) extends ((...args: [...W, ...infer X]) => R) ?
      X['length'] extends 0 ? R :
      <Y extends unknown[]>(...args: SubTuple<Y, X>) => ((...ts: X) => R) extends ((...args: [...Y, ...infer Z]) => R) ?
        Z['length'] extends 0 ? R : never
        : never
      : never
    : never
