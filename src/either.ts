/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-use-before-define */
import Monad from './monad'
import { curry1, unsafeProp } from './helpers'

import { MapCallback } from './types/common'

type MatcherFn<T, U> = (v: T) => U
export type Matcher<L, A, R, B> = { Left: MatcherFn<L, A>, Right: MatcherFn<R, B> }

export enum EitherVariant {
  Left = 'Left',
  Right = 'Right',
}

interface LeftJSON<L> {
  variant: EitherVariant.Left
  $value: L
}

interface RightJSON<R> {
  variant: EitherVariant.Right
  $value: R
}

type EitherJSON<L, R> = LeftJSON<L> | RightJSON<R>

export type Either<L, R> = Left<L> | Right<R>

interface EitherShape<L, R> extends Monad {
  readonly variant: EitherVariant
  isLeft (this: Either<L, R>): this is Left<L>
  isRight (this: Either<L, R>): this is Right<R>
  fold<L2, R2> (this: Either<L, R>, matcher: Matcher<L, L2, R, R2>): L2 | R2
  toJSON(this: Either<L, R>): EitherJSON<L, R>
  toString(this: Either<L, R>): string,
  pluck<R2> (this: Either<L, R>, prop: string): Either<L, R2>
  map<R2> (this: Either<L, R>, mapFn: MapCallback<R, R2>): Either<L, R2>
  chain<R2> (this: Either<L, R>, chainFn: (r: R) => Either<L, R2>): Either<L, R2>
  ap<R2, R3> (this: Either<L, (r: R2) => R3>, either2: Either<L, R2>): Either<L, R3> | Left<TypeError>
}

export class Left<L> implements EitherShape<L, never> {
  readonly $value: L
  readonly variant: EitherVariant.Left = EitherVariant.Left

  static of (): never {
    throw new Error('Cannot call "Left.of()", use "Either.of()" instead')
  }

  static get<L, R> (either: Either<L, R>):L | R {
    return either.$value
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

  get (this: Either<L, any>): typeof this.$value {
    return get<L, any>(this)
  }

  toJSON (this: Either<L, never>): EitherJSON<L, never> {
    return toJSON(this)
  }

  toString (this: Either<L, never>): string {
    return toString(this)
  }

  fold<A, B> (matcher: Matcher<L, A, any, B>): A {
    return fold<L, A, any, any>(matcher, this)
  }

  pluck (this: Either<L, never>): Either<L, never> {
    return this
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
  readonly variant: EitherVariant.Right = EitherVariant.Right

  static of (): never {
    throw new Error('Cannot call "Right.of()", use "Either.of()" instead')
  }

  static get<L, R> (either: Either<L, R>):L | R {
    return either.$value
  }

  constructor (value: R) {
    this.$value = value
  }

  isLeft (this: Either<any, R>): this is Left<never> {
    return false
  }

  isRight (this: Either<any, R>): this is Right<R> {
    return true
  }

  get (this: Either<any, R>): typeof this.$value {
    return get<any, R>(this)
  }

  toJSON (this: Either<any, R>): EitherJSON<any, R> {
    return toJSON(this)
  }

  toString (this: Either<any, R>): string {
    return toString(this)
  }

  fold<A, B> (matcher: Matcher<any, A, R, B>): B {
    return fold<any, any, R, B>(matcher, this)
  }

  pluck<R2> (this: Either<any, R>, prop: string): Either<any, R2> {
    return pluck<any, R, R2>(prop, this)
  }

  map<R2> (this: Either<any, R>, f: MapCallback<R, R2>): Either<any, R2> {
    return map<any, R, R2>(f, this)
  }

  chain<R2> (this: Either<any, R>, f: (r: R) => Either<any, R2>): Either<any, R2> {
    return chain<any, R, R2>(f, this)
  }

  ap <R2, R3> (this: Either<any, (r: R2) => R3>, either2: Either<any, R2>): Either<any, R3> | Left<TypeError> {
    return ap<any, R2, R3>(either2, this)
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
    return Either.of(fa()) as Right<R>
  } catch (err) {
    return new Left(fb(err)) as Left<L>
  }
}

/**
 * fetches the value of the Left or Right
 */
export function get<L, R> (either: Either<L, R>): L | R {
  return either.$value
}

/**
 * Serialize to string
 */
export function toString<L extends { toString (): string }, R extends { toString (): string }>(either: Either<L, R>): string {
  return `${either.variant}(${either.$value.toString()})`
}

/**
 * serialize to JSON representation
 */
export function toJSON<L, R> (either: Either<L, R>): EitherJSON<L, R> {
  return either.isRight()
    ? { variant: either.variant, $value: either.$value }
    : { variant: either.variant, $value: either.$value }
}

/**
 * Takes two functions, applies the leftmost one to the Left value
 * and the rightmost one to the Right value depending on which
 * one is present
 */
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>, either: Either<L, R>): L2 | R2
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>): (either: Either<L, R>) => L2 | R2
export function fold <L, L2, R, R2> (matcher: Matcher<L, L2, R, R2>, either?: Either<L, R>): L2 | R2 | ((either: Either<L, R>) => L2 | R2) {
  const op = (e: Either<L, R>) => e.isLeft()
    ? matcher.Left(e.$value)
    : matcher.Right(e.$value)
  return curry1(op, either)
}

/**
 * Equivalent to map(prop(x))
 */
export function pluck <L, R, R2> (prop: string, either: Either<L, R>): Either<L | string, R2>
export function pluck <L, R, R2> (prop: string): (either: Either<L, R>) => Either<L | string, R2>
export function pluck <L, R, R2> (prop: string, either?: Either<L, R>): Either<L | string, R2> | ((either: Either<L, R>) => Either<L | string, R2>) {
  const op = (e: Either<L, R>) => {
    if (e.isLeft()) { return e }
    const propValue = unsafeProp(prop, e.get())
    return propValue ? Either.of(propValue as R2) : left(`'${prop}' not found`)
  }
  return curry1(op, either)
}

/**
 * Applies the transformation (f) if Right
 */
export function map <L, R, R2> (f: MapCallback<R, R2>, either: Either<L, R>): Either<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>): (either: Either<L, R>) => Either<L, R2>
export function map <L, R, R2> (f: MapCallback<R, R2>, either?: Either<L, R>): Either<L, R2> | ((either: Either<L, R>) => Either<L, R2>) {
  const op = (e: Either<L, R>) => e.isLeft()
    ? e as Left<L> as Left<L>
    : of(f(e.$value)) as Right<R2>
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
  const op = (e: Either<L, (r: R2) => R3>) => {
    if (e.isLeft()) {
      return e
    }
    if (Monad.$valueIsMapCallback<R2, R3>(e.$value)) {
      return either2.map(e.$value)
    }
    return left(TypeError('Either.$value is not a function'))
  }
  return curry1(op, either)
}

export const Either = {
  get,
  toJSON,
  toString,
  of,
  isLeft,
  isRight,
  tryCatch,
  fold,
  pluck,
  map,
  chain,
  ap
}

export default Either
