import { MapCallback, PartialMapCallback } from './types/common'

export default abstract class Monad {

  $value: any

  // tslint:disable ban-types
  abstract map (_: Function): any

  abstract ap (_: any): any

  abstract chain (_: Function): any
  // tslint:enable ban-types

  protected static $valueIsMapCallback<T, U> (fn: any): fn is MapCallback<T, U> {
    if (typeof fn === 'function' && fn.length === 1) {
      return true
    }

    return false
  }

  protected static $valueIsPartialMapCallback<T, U> (fn: any): fn is PartialMapCallback<T, U> {
    if (typeof fn === 'function' && fn.length === 1) {
      return true
    }

    return false
  }

  // tslint:disable-next-line:no-console
  inspect (f = console.log) {
    f(`${this.constructor.name}:`, this.$value)
    return this
  }
}
