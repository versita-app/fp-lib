/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapCallback } from './types/common'

export default abstract class Monad {
  $value: any

  // tslint:disable ban-types
  abstract map (_: any): any

  abstract ap (_: any): any

  abstract chain (_: any): any
  // tslint:enable ban-types

  static $valueIsMapCallback<T, U> (fn: unknown): fn is MapCallback<T, U> {
    if (typeof fn === 'function') {
      return true
    }

    return false
  }
}
