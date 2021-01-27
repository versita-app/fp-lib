/* eslint-disable no-use-before-define */
import { curry1 } from './helpers'
import Monad from './monad'

export enum MaybeVariant {
  Just = 'Just',
  Nothing = 'Nothing',
}

export type Maybe<T> = Just<T> | Nothing<T>

interface JustJSON<T> {
  variant: MaybeVariant.Just
  value: T
}

interface NothingJSON {
  variant: MaybeVariant.Nothing
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NOTHING: Nothing<any>

type MaybeJSON<T> = JustJSON<T> | NothingJSON

interface MaybeShape<T> extends Monad {
  readonly variant: MaybeVariant
  isJust(this: Maybe<T>): this is Just<T>
  isNothing(this: Maybe<T>): this is Nothing<T>
  map<U>(this: Maybe<T>, mapFn: (t: T) => U): Maybe<U>
  mapOr<U>(this: Maybe<T>, orU: U, mapFn: (t: T) => U): U
  mapOrElse<U>(this: Maybe<T>, orElseFn: () => U, mapFn: (t: T) => U): U
  fold<U>(this: Maybe<T>, matcher: Matcher<T, U>): U
  or(this: Maybe<T>, mOr: Maybe<T>): Maybe<T>
  orElse(this: Maybe<T>, orElseFn: () => Maybe<T>): Maybe<T>
  and<U>(this: Maybe<T>, mAnd: Maybe<U>): Maybe<U>
  chain<U>(this: Maybe<T>, chainFn: (t: T) => Maybe<U>): Maybe<U>
  flatMap<U>(this: Maybe<T>, flatMapFn: (t: T) => Maybe<U>): Maybe<U>
  unsafelyGet(): T | never
  getOrElse<U>(this: Maybe<T>, elseFn: () => U): T | U
  toString(this: Maybe<T>): string
  toJSON(this: Maybe<T>): MaybeJSON<T>
  equals(this: Maybe<T>, comparison: Maybe<T>): boolean
  ap<U>(this: Maybe<(val: T) => U>, val: Maybe<T>): Maybe<U>
}

export class Just<T> implements MaybeShape<T> {
  readonly variant: MaybeVariant.Just = MaybeVariant.Just
  readonly $value: T

  constructor (value?: T | null) {
    if (value == null) {
      throw new Error('Tried to construct `Just` with `null` or `undefined`')
    }

    this.$value = value
  }

  isJust (this: Maybe<T>): this is Just<T> {
    return true
  }

  isNothing (this: Maybe<T>): this is Nothing<T> {
    return false
  }

  map<U> (this: Maybe<T>, mapFn: (t: T) => U): Maybe<U> {
    return map(mapFn, this)
  }

  mapOr<U> (this: Maybe<T>, orU: U, mapFn: (t: T) => U): U {
    return mapOr(orU, mapFn, this)
  }

  mapOrElse<U> (this: Maybe<T>, orElseFn: () => U, mapFn: (t: T) => U): U {
    return mapOrElse(orElseFn, mapFn, this)
  }

  fold<U> (this: Maybe<T>, matcher: Matcher<T, U>): U {
    return fold(matcher, this)
  }

  or (this: Maybe<T>, mOr: Maybe<T>): Maybe<T> {
    return or(mOr, this)
  }

  orElse (this: Maybe<T>, orElseFn: () => Maybe<T>): Maybe<T> {
    return orElse(orElseFn, this)
  }

  and<U> (this: Maybe<T>, mAnd: Maybe<U>): Maybe<U> {
    return and(mAnd, this)
  }

  chain<U> (this: Maybe<T>, chainFn: (t: T) => Maybe<U>): Maybe<U> {
    return chain(chainFn, this)
  }

  flatMap<U> (this: Maybe<T>, flatMapFn: (t: T) => Maybe<U>): Maybe<U> {
    return this.chain(flatMapFn)
  }

  unsafelyGet (): T {
    return this.$value
  }

  getOr<U> (this: Maybe<T>, defaultValue: U): T | U {
    return getOr(defaultValue, this)
  }

  getOrElse<U> (this: Maybe<T>, elseFn: () => U): T | U {
    return getOrElse(elseFn, this)
  }

  toString (this: Maybe<T>): string {
    return toString(this)
  }

  toJSON (this: Maybe<T>): MaybeJSON<T> {
    return toJSON(this)
  }

  equals (this: Maybe<T>, comparison: Maybe<T>): boolean {
    return equals(comparison, this)
  }

  ap<A, B> (this: Maybe<(val: A) => B>, val: Maybe<A>): Maybe<B> {
    return ap(this, val)
  }
}

export class Nothing<T> implements MaybeShape<T> {
  readonly $value: never
  readonly variant: MaybeVariant.Nothing = MaybeVariant.Nothing
  constructor () {
    if (!NOTHING) {
      NOTHING = this
    }

    return NOTHING
  }

  isJust (this: Maybe<T>): this is Just<T> {
    return false
  }

  isNothing (this: Maybe<T>): this is Nothing<T> {
    return true
  }

  map<U> (this: Maybe<T>, mapFn: (t: T) => U): Maybe<U> {
    return map(mapFn, this)
  }

  mapOr<U> (this: Maybe<T>, orU: U, mapFn: (t: T) => U): U {
    return mapOr(orU, mapFn, this)
  }

  mapOrElse<U> (this: Maybe<T>, orElseFn: () => U, mapFn: (t: T) => U): U {
    return mapOrElse(orElseFn, mapFn, this)
  }

  fold<U> (this: Maybe<T>, matcher: Matcher<T, U>): U {
    return fold(matcher, this)
  }

  or (this: Maybe<T>, mOr: Maybe<T>): Maybe<T> {
    return or(mOr, this)
  }

  orElse (this: Maybe<T>, orElseFn: () => Maybe<T>): Maybe<T> {
    return orElse(orElseFn, this)
  }

  and<U> (this: Maybe<T>, mAnd: Maybe<U>): Maybe<U> {
    return and(mAnd, this)
  }

  chain<U> (this: Maybe<T>, chainFn: (t: T) => Maybe<U>): Maybe<U> {
    return chain(chainFn, this)
  }

  flatMap<U> (this: Maybe<T>, flatMapFn: (t: T) => Maybe<U>): Maybe<U> {
    return this.chain(flatMapFn)
  }

  unsafelyGet (): never {
    throw new Error('Tried to `unsafelyGet(Nothing)`')
  }

  getOr<U> (this: Maybe<T>, defaultValue: U): T | U {
    return getOr(defaultValue, this)
  }

  getOrElse<U> (this: Maybe<T>, elseFn: () => U): T | U {
    return getOrElse(elseFn, this)
  }

  toString (this: Maybe<T>): string {
    return toString(this)
  }

  toJSON (this: Maybe<T>): MaybeJSON<T> {
    return toJSON(this)
  }

  equals (this: Maybe<T>, comparison: Maybe<T>): boolean {
    return equals(comparison, this)
  }

  ap<A, B> (this: Maybe<(val: A) => B>, val: Maybe<A>): Maybe<B> {
    return ap(this, val)
  }

  get<K extends keyof T> (this: Maybe<T>, key: K): Maybe<NonNullable<T[K]>> {
    return this.chain(property(key))
  }
}

export type Matcher<T, A> = {
  Just: (value: T) => A
  Nothing: () => A
}

export function toString<T extends { toString (): string }>(maybe: Maybe<T>): string {
  const body = maybe.isJust() ? `(${maybe.$value.toString()})` : ''
  return `${maybe.variant}${body}`
}

export function toJSON<T> (maybe: Maybe<T>): MaybeJSON<T> {
  return maybe.isJust()
    ? { variant: maybe.variant, value: maybe.$value }
    : { variant: maybe.variant }
}

export function property<T, K extends keyof T>(key: K, obj: T): Maybe<NonNullable<T[K]>>
export function property<T, K extends keyof T>(key: K): (obj: T) => Maybe<NonNullable<T[K]>>
export function property<T, K extends keyof T> (
  key: K,
  obj?: T
): Maybe<NonNullable<T[K]>> | ((obj: T) => Maybe<NonNullable<T[K]>>) {
  const op = (a: T) => maybe(a[key]) as Maybe<NonNullable<T[K]>>
  return curry1(op, obj)
}

export function getOr<T, U>(defaultValue: U, maybe: Maybe<T>): T | U
export function getOr<T, U>(defaultValue: U): (maybe: Maybe<T>) => T | U
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getOr<T, U> (defaultValue: U, maybe?: Maybe<T>) {
  const op = (m: Maybe<T>) => (m.isJust() ? m.$value : defaultValue)
  return curry1(op, maybe)
}

export function getOrElse<T, U>(orElseFn: () => U, maybe: Maybe<T>): T | U
export function getOrElse<T, U>(orElseFn: () => U): (maybe: Maybe<T>) => T | U
export function getOrElse<T, U> (
  orElseFn: () => U,
  maybe?: Maybe<T>
): (T | U) | ((maybe: Maybe<T>) => T | U) {
  const op = (m: Maybe<T>) => (m.isJust() ? m.$value : orElseFn())
  return curry1(op, maybe)
}

export function and<T, U>(andMaybe: Maybe<U>, maybe: Maybe<T>): Maybe<U>
export function and<T, U>(andMaybe: Maybe<U>): (maybe: Maybe<T>) => Maybe<U>
export function and<T, U> (
  andMaybe: Maybe<U>,
  maybe?: Maybe<T>
): Maybe<U> | ((maybe: Maybe<T>) => Maybe<U>) {
  const op = (m: Maybe<T>) => (m.isJust() ? andMaybe : nothing<U>())
  return curry1(op, maybe)
}
export function chain<T, U>(thenFn: (t: T) => Maybe<U>, maybe: Maybe<T>): Maybe<U>
export function chain<T, U>(thenFn: (t: T) => Maybe<U>): (maybe: Maybe<T>) => Maybe<U>
export function chain<T, U> (
  thenFn: (t: T) => Maybe<U>,
  maybe?: Maybe<T>
): Maybe<U> | ((maybe: Maybe<T>) => Maybe<U>) {
  const op = (m: Maybe<T>) => (m.isJust() ? thenFn(m.$value) : nothing<U>())
  return maybe !== undefined ? op(maybe) : op
}

export function or<T>(defaultMaybe: Maybe<T>, maybe: Maybe<T>): Maybe<T>
export function or<T>(defaultMaybe: Maybe<T>): (maybe: Maybe<T>) => Maybe<T>
export function or<T> (
  defaultMaybe: Maybe<T>,
  maybe?: Maybe<T>
): Maybe<T> | ((maybe: Maybe<T>) => Maybe<T>) {
  const op = (m: Maybe<T>) => (m.isJust() ? m : defaultMaybe)
  return maybe !== undefined ? op(maybe) : op
}

export function orElse<T>(elseFn: () => Maybe<T>, maybe: Maybe<T>): Maybe<T>
export function orElse<T>(elseFn: () => Maybe<T>): (maybe: Maybe<T>) => Maybe<T>
export function orElse<T> (
  elseFn: () => Maybe<T>,
  maybe?: Maybe<T>
): Maybe<T> | ((maybe: Maybe<T>) => Maybe<T>) {
  const op = (m: Maybe<T>) => (m.isJust() ? m : elseFn())
  return curry1(op, maybe)
}

export function fold<T, A>(matcher: Matcher<T, A>, maybe: Maybe<T>): A
export function fold<T, A>(matcher: Matcher<T, A>): (maybe: Maybe<T>) => A
export function fold<T, A> (matcher: Matcher<T, A>, maybe?: Maybe<T>): A | ((maybe: Maybe<T>) => A) {
  return maybe !== undefined
    ? mapOrElse(matcher.Nothing, matcher.Just, maybe)
    : (curriedMaybe: Maybe<T>) => mapOrElse(matcher.Nothing, matcher.Just, curriedMaybe)
}

export function mapOr<T, U>(orU: U, mapFn: (t: T) => U, maybe: Maybe<T>): U
export function mapOr<T, U>(orU: U, mapFn: (t: T) => U): (maybe: Maybe<T>) => U
export function mapOr<T, U>(orU: U): (mapFn: (t: T) => U) => (maybe: Maybe<T>) => U
export function mapOr<T, U> (
  orU: U,
  mapFn?: (t: T) => U,
  maybe?: Maybe<T>
): U | ((maybe: Maybe<T>) => U) | ((mapFn: (t: T) => U) => (maybe: Maybe<T>) => U) {
  function fullOp (fn: (t: T) => U, m: Maybe<T>) {
    return m.isJust() ? fn(m.$value) : orU
  }

  function partialOp(fn: (t: T) => U): (maybe: Maybe<T>) => U
  function partialOp(fn: (t: T) => U, curriedMaybe: Maybe<T>): U
  function partialOp (fn: (t: T) => U, curriedMaybe?: Maybe<T>): U | ((maybe: Maybe<T>) => U) {
    return curriedMaybe !== undefined
      ? fullOp(fn, curriedMaybe)
      : (extraCurriedMaybe: Maybe<T>) => fullOp(fn, extraCurriedMaybe)
  }

  return mapFn === undefined
    ? partialOp
    : maybe === undefined
      ? partialOp(mapFn)
      : partialOp(mapFn, maybe)
}

export function mapOrElse<T, U>(orElseFn: () => U, mapFn: (t: T) => U, maybe: Maybe<T>): U
export function mapOrElse<T, U>(orElseFn: () => U, mapFn: (t: T) => U): (maybe: Maybe<T>) => U
export function mapOrElse<T, U>(orElseFn: () => U): (mapFn: (t: T) => U) => (maybe: Maybe<T>) => U
export function mapOrElse<T, U> (
  orElseFn: () => U,
  mapFn?: (t: T) => U,
  maybe?: Maybe<T>
): U | ((maybe: Maybe<T>) => U) | ((mapFn: (t: T) => U) => (maybe: Maybe<T>) => U) {
  function fullOp (fn: (t: T) => U, m: Maybe<T>) {
    return m.isJust() ? fn(m.$value) : orElseFn()
  }

  function partialOp(fn: (t: T) => U): (maybe: Maybe<T>) => U
  function partialOp(fn: (t: T) => U, curriedMaybe: Maybe<T>): U
  function partialOp (fn: (t: T) => U, curriedMaybe?: Maybe<T>): U | ((maybe: Maybe<T>) => U) {
    return curriedMaybe !== undefined
      ? fullOp(fn, curriedMaybe)
      : (extraCurriedMaybe: Maybe<T>) => fullOp(fn, extraCurriedMaybe)
  }

  if (mapFn === undefined) {
    return partialOp
  } else if (maybe === undefined) {
    return partialOp(mapFn)
  } else {
    return partialOp(mapFn, maybe)
  }
}

export function unsafelyGet<T> (maybe: Maybe<T>): T {
  return maybe.unsafelyGet()
}

export function equals<T>(mb: Maybe<T>, ma: Maybe<T>): boolean
export function equals<T>(mb: Maybe<T>): (ma: Maybe<T>) => boolean
export function equals<T> (mb: Maybe<T>, ma?: Maybe<T>): boolean | ((a: Maybe<T>) => boolean) {
  return ma !== undefined
    ? ma.fold({
      Just: (aVal) => mb.isJust() && mb.unsafelyGet() === aVal,
      Nothing: () => isNothing(mb)
    })
    : (maybeA: Maybe<T>) =>
      maybeA.fold({
        Nothing: () => isNothing(mb),
        Just: (aVal) => mb.isJust() && mb.unsafelyGet() === aVal
      })
}

export function ap<T, U>(maybeFn: Maybe<(t: T) => U>, maybe: Maybe<T>): Maybe<U>
export function ap<T, U>(maybeFn: Maybe<(t: T) => U>): (maybe: Maybe<T>) => Maybe<U>
export function ap<T, U> (
  maybeFn: Maybe<(t: T) => U>,
  maybe?: Maybe<T>
): Maybe<U> | ((val: Maybe<T>) => Maybe<U>) {
  const op = (m: Maybe<T>) =>
    m.fold({
      Just: (val) => maybeFn.map((fn) => fn(val)),
      Nothing: () => nothing<U>()
    })

  return curry1(op, maybe)
}

export function map<T, U>(mapFn: (t: T) => U): (maybe: Maybe<T>) => Maybe<U>
export function map<T, U>(mapFn: (t: T) => U, maybe: Maybe<T>): Maybe<U>
export function map<T, U> (
  mapFn: (t: T) => U,
  maybe?: Maybe<T>
): Maybe<U> | ((maybe: Maybe<T>) => Maybe<U>) {
  const op = (m: Maybe<T>) => (m.isJust() ? just(mapFn(m.$value)) : nothing<U>())
  return curry1(op, maybe)
}

export function just<T = unknown> (value?: T | null): Maybe<T> {
  return new Just<T>(value)
}

export function nothing<T = unknown> (): Maybe<T> {
  if (!NOTHING) NOTHING = new Nothing()
  return NOTHING
}

export function isJust<T> (maybe: Maybe<T>): maybe is Just<T> {
  return maybe.variant === MaybeVariant.Just
}

/**
  Is this result a `Nothing` instance?
  @typeparam T The type of the wrapped value.
  @param maybe The `Maybe` instance to check.
  @returns     `true` if `maybe` is `nothing`, `false` otherwise. In TypeScript,
               also narrows the type from `Maybe<T>` to `Nothing<T>`.
 */
export function isNothing<T> (maybe: Maybe<T>): maybe is Nothing<T> {
  return maybe.variant === MaybeVariant.Nothing
}

export function of<T> (value?: T | null): Maybe<T> {
  return value == null ? nothing<T>() : just(value)
}

export const maybe = of

export const Maybe = {
  MaybeVariant,
  Just,
  Nothing,
  isJust,
  isNothing,
  just,
  nothing,
  of,
  map,
  mapOr,
  mapOrElse,
  and,
  chain,
  or,
  orElse,
  unsafelyGet,
  getOr,
  getOrElse,
  toString,
  toJSON,
  fold,
  equals,
  ap,
  property
}

export default Maybe
