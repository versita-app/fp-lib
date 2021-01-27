/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-use-before-define */
import Monad from './monad'
import { curry1 } from './helpers'

import { MapCallback } from './types/common'

type MatcherFn<T, U> = (v: T) => U
type Matcher<L, A, R, B> = [MatcherFn<L, A>, MatcherFn<R, B>]

export enum EitherVariant {
  Left = 'Left',
  Right = 'Right',
}

export type Either<L, R> = Left<L> | Right<R>

interface EitherShape<L, R> extends Monad {
  isLeft (this: Either<L, R>): this is Left<L>
  isRight (this: Either<L, R>): this is Right<R>
  fold<L2, R2> (this: Either<L, R>, matcher: Matcher<L, L2, R, R2>): L2 | R2
  map<R2> (this: Either<L, R>, mapFn: MapCallback<R, R2>): Either<L, R2>
  chain<R2> (this: Either<L, R>, chainFn: (r: R) => Either<L, R2>): Either<L, R2>
  ap<R2, R3> (this: Either<L, (r: R2) => R3>, either2: Either<L, R2>): Either<L, R3>
}

export class Left<L> implements EitherShape<L, never> {
  readonly $value: L
  readonly variant: EitherVariant.Left

  static of (): never {
    throw new Error('Cannot call "Left.of()", use "Either.of()" instead')
  }

  constructor (value: L) {
    this.$value = value
  }

  isLeft (this: Either<L, any>): this is Left<L> {
    return true
  }

  isRight (this: Either<L, any>): this is Right<never> {
    return false
  }

  fold<A, B> (matcher: Matcher<L, A, any, B>): A {
    return fold<L, A, any, any>(matcher, this)
  }

  map (): this {
    return this
  }

  chain (): this {
    return this
  }

  ap (): this {
    return this
  }
}

export class Right<R> implements EitherShape<any, R> {
  readonly $value: R
  readonly variant: EitherVariant.Right

  constructor (value: R) {
    this.$value = value
  }

  isLeft (this: Either<any, R>): this is Left<any> {
    return false
  }

  isRight (this: Either<any, R>): this is Right<R> {
    return true
  }

  fold<A, B> (matcher: Matcher<any, A, R, B>): B {
    return fold<any, any, R, B>(matcher, this)
  }

  map<R2> (this: Either<any, R>, f: MapCallback<R, R2>): Either<any, R2> {
    return map<any, R, R2>(f, this)
  }

  chain<R2> (this: Either<any, R>, f: (r: R) => Either<any, R2>): Either<any, R2> {
    return chain<any, R, R2>(f, this)
  }

  ap <R2, R3> (this: Either<any, (r: R2) => R3>, either2: Either<any, R2>): Either<any, R3> {
    if (Monad.$valueIsMapCallback<R2, R3>(this.$value)) {
      return ap<any, R2, R3>(either2, this)
    }

    return left<TypeError>(TypeError('Either.$value is not a function'))
  }
}

/**
 * creates a new left
 */
export function left<L> (l: L): Left<L> {
  return new Left<L>(l)
}

/**
 * creates a new Right of r
 */
export function of<R> (r: R): Right<R> {
  return new Right<R>(r)
}

/**
 * checks if the Either contains a Left
 */
export function isLeft (either: Either<any, any>): either is Left<any> {
  return either.isLeft()
}

/**
 * checks if the Either contains a Right
 */
export function isRight (either: Either<any, any>): either is Right<any> {
  return either.isRight()
}

/**
 * Takes a function and returns a Right of the result of a Left of the Error
 */
export function tryCatch<L, R> (fa: () => R, fb: (e: Error) => L): Left<L> | Right<R> {
  try {
    return Either.of(fa())
  } catch (err) {
    return new Left(fb(err))
  }
}

/**
 * Takes two functions, applies the leftmost one to the Left value
 * and the rightmost one to the Right value depending on which
 * one is present
 */
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>, either: Either<L, R>): L2 | R2
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>): (either: Either<L, R>) => L2 | R2
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>, either?: Either<L, R>): L2 | R2 | ((either: Either<L, R>) => L2 | R2) {
  const [fl, fr] = matcher
  const op = (e: Either<L, R>) => e.isLeft()
    ? fl(e.$value)
    : fr(e.$value)
  return curry1(op, either)
}

/**
 * Applies the transformation (f) if Right
 */
export function map <L, R, R2> (f: MapCallback<R, R2>, either: Either<L, R>): Either<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>): (either: Either<L, R>) => Either<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>, either?: Either<L, R>): Either<L, R2> | ((either: Either<L, R>) => Either<L, R2>) {
  const op = (e: Either<L, R>) => e.isLeft()
    ? e
    : of(f(e.$value))
  return curry1(op, either)
}

/**
 * Applies the transformation (f) if Right and joins multiple Eithers
 */
export function chain <L, R, R2> (f: (r:R) => Either<L, R2>, either: Either<L, R>): Either<L, R2>
export function chain <L, R, R2> (f: (r:R) => Either<L, R2>): (either: Either<L, R>) => Either<L, R2>
export function chain <L, R, R2> (f: (r:R) => Either<L, R2>, either?: Either<L, R>): Either<L, R2> | ((either: Either<L, R>) => Either<L, R2>) {
  const op = (e: Either<L, R>) => e.isLeft()
    ? e
    : f(e.$value)
  return curry1(op, either)
}

/**
 * Applies the value of one Right to another. Returns first Left enountered (if any)
 */
export function ap <L, R2, R3> (either2: Either<L, R2>, either: Either<L, (r: R2) => R3>): Either<L, R3>
export function ap <L, R2, R3> (either2: Either<L, R2>): (either: Either<L, (r: R2) => R3>) => Either<L, R3>
export function ap <L, R2, R3> (either2: Either<L, R2>, either?: Either<L, (r: R2) => R3>): Either<L, R3> | ((either: Either<L, (r: R2) => R3>) => Either<L, R3>) {
  const op = (e: Either<L, (r: R2) => R3>) => e.isLeft()
    ? e
    : either2.map(e.$value)
  return curry1(op, either)
}

export const Either = {
  of,
  isLeft,
  isRight,
  tryCatch,
  fold,
  map,
  chain,
  ap
}

export default Either
