import { ArrayCallbackFn } from './types/common'
import Monad from './monad'

export default class List<T> extends Monad {

  static of<T> ($value: T) {
    return new List<T>([$value])
  }

  $value: T[]

  constructor ($value: T[]) {
    super()
    this.$value = $value
  }

  concat<U> (x: U[]) {
    return new List<T | U>((this.$value as (T | U)[]).concat(x))
  }

  map <U = any> (f: ArrayCallbackFn<T, U>) {
    return new List(this.$value.map(f))
  }

  ap () {
    throw new Error('Not implemented: List.ap()')
  }

  chain <U = any> (f: ArrayCallbackFn<T, U>) {
    return this.$value.map(f)
  }
}
