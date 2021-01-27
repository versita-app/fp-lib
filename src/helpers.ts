export function curry1<T, U> (op: (t: T) => U, item?: T): U | ((t:T) => U) {
  return item !== undefined ? op(item) : op
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
