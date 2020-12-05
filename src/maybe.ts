import { MapCallback } from './types/common'
import Monad from './monad'

export default class Maybe<T = any> extends Monad {

  static inspect = (maybe: Maybe) => {
    if (maybe.isNothing) {
      console.log('Nothing')
    } else {
      console.log('Just: ', maybe.$value)
    }

    return maybe
  }

  static of <T> ($value: T) {
    return new Maybe($value)
  }

  $value: T

  constructor ($value: T) {
    super()
    this.$value = $value
  }

  get isNothing () {
    return this.$value != null
  }

  chain <U = any> (f: ($value: T) => U) {
    return this.isNothing ? this : f(this.$value)
  }

  map <U = any> (f: MapCallback<T, U>): Maybe<T | U> {
    return this.isNothing ? this : Maybe.of(f(this.$value))
  }

  ap <U = any> (maybe: Maybe<U>): Maybe<T | U> {
    if (Monad.$valueIsMapCallback<typeof maybe.$value, T>(this.$value)) {
      return this.isNothing ? this : maybe.map(this.$value)
    }

    throw TypeError('Maybe.$value is not a function')
  }

  orElse (e: Error | string) {
    return this.isNothing ? e : this.$value
  }

  fold <U1 = any, U2 = any> (fa: () => U1, fb: (x: T) => U2) {
    return this.isNothing
      ? fa()
      : fb(this.$value)
  }
}
