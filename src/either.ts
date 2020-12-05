import { curry } from './helpers'
import Monad from './monad'
import { MapCallback } from './types/common'

export default abstract class Either<L, R> extends Monad {
  static of<R> (b: R) {
    return new Right<R>(b)
  }

  static isLeft<L, R> (either: Left<L> | Right<R>) {
    return either.isLeft
  }

  static tryCatch<L, R> (fa: () => R, fb: (e: Error) => L) {
    try {
      return Either.of(fa())
    } catch (err) {
      return new Left(fb(err))
    }
  }

  static fold<L, R, T = any, U = any> (fa: (l: L) => T, fb: (r: R) => U) {
    return (e: Left<L> | Right<R>) => e instanceof Left
      ? fa(e.$value)
      : fb(e.$value)
  }

  $value: L | R

  constructor ($value: L | R) {
    super()
    this.$value = $value
  }

  get value () {
    return this.$value
  }
}

export class Left<L> extends Either<L, void> {
  static of (): never {
    throw new Error('Cannot call "Left.of()", use "Either.of()" instead')
  }

  $value: L

  constructor ($value: L) {
    super($value)
    // this.$value = x
  }

  get isLeft () {
    return true
  }

  get isRight () {
    return false
  }

  map (_: any) {
    return this
  }

  ap (_: any) {
    return this
  }

  chain (_: any) {
    return this
  }
}

export class Right<R> extends Either<void, R> {
  static of (): never {
    throw new Error('Cannot call "Right.of()", use "Either.of()" instead')
  }

  $value: R

  constructor ($value: R) {
    super($value)
    // this.$value = x
  }

  get isLeft () {
    return false
  }

  get isRight () {
    return true
  }

  // XXX: validate R1 = R
  map<R1 = any> (f: MapCallback<R, R1>) {
    return Either.of(f(this.$value))
  }

  ap <R1 = any> (right: Right<R1>) {
    if (Monad.$valueIsMapCallback<typeof right.$value, R>(this.$value)) {
      return right.map(this.$value)
    }

    throw new TypeError('Either.$value is not a function')
  }

  chain <T = any> (f: (r: R) => T) {
    return f(this.$value)
  }
}
