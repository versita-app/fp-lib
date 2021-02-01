import { expectTypeOf } from 'expect-type'
import Maybe, { MaybeVariant, Nothing, Just, Matcher } from '../src/maybe'

type Neat = { neat: string }

const length = (s: string) => s.length

describe('`Maybe` pure functions', () => {
  test('`just`', () => {
    const theJust = Maybe.just('string')
    expect(theJust).toBeInstanceOf(Maybe.Just)
    switch (theJust.variant) {
      case Maybe.MaybeVariant.Just:
        expect(theJust.unsafelyGet()).toBe('string')
        break
      case Maybe.MaybeVariant.Nothing:
        expect(false).toBe(true) // because this should never happen
        break
      default:
        expect(false).toBe(true) // because those are the only cases
    }

    expect(() => Maybe.just(null)).toThrow()
    expect(() => Maybe.just(undefined)).toThrow()
  })

  test('`nothing`', () => {
    const theNothing = Maybe.nothing()
    expect(theNothing).toBeInstanceOf(Maybe.Nothing)
    switch (theNothing.variant) {
      case Maybe.MaybeVariant.Just:
        expect(true).toBe(false) // because this should never happen
        break
      case Maybe.MaybeVariant.Nothing:
        expect(true).toBe(true) // yay
        break
      default:
        expect(false).toBe(true) // because those are the only cases
    }

    const nothingOnType = Maybe.nothing<string>()
    expectTypeOf(nothingOnType).toEqualTypeOf<Maybe<string>>()
  })

  describe('`of`', () => {
    test('with `null', () => {
      const nothingFromNull = Maybe.of<string>(null)
      expectTypeOf(nothingFromNull).toEqualTypeOf<Maybe<string>>()
      expect(Maybe.isJust(nothingFromNull)).toBe(false)
      expect(Maybe.isNothing(nothingFromNull)).toBe(true)
      expect(() => Maybe.unsafelyGet(nothingFromNull)).toThrow()
    })

    test('with `undefined`', () => {
      const nothingFromUndefined = Maybe.of<number>(undefined)
      expectTypeOf(nothingFromUndefined).toEqualTypeOf<Maybe<number>>()
      expect(Maybe.isJust(nothingFromUndefined)).toBe(false)
      expect(Maybe.isNothing(nothingFromUndefined)).toBe(true)
      expect(() => Maybe.unsafelyGet(nothingFromUndefined)).toThrow()
    })

    test('with values', () => {
      const aJust = Maybe.of<Neat>({ neat: 'strings' })
      expectTypeOf(aJust).toEqualTypeOf<Maybe<Neat>>()
      const aNothing = Maybe.of<Neat>(null)
      expectTypeOf(aNothing).toEqualTypeOf<Maybe<Neat>>()

      const justANumber = Maybe.of(42)
      expectTypeOf(justANumber).toEqualTypeOf<Maybe<number>>()
      expect(Maybe.isJust(justANumber)).toBe(true)
      expect(Maybe.isNothing(justANumber)).toBe(false)
      expect(Maybe.unsafelyGet(justANumber)).toBe(42)
    })
  })

  test('`map`', () => {
    const justAString = Maybe.just('string')
    const itsLength = Maybe.map(length, justAString)
    expectTypeOf(itsLength).toEqualTypeOf<Maybe<number>>()
    expect(itsLength).toEqual(Maybe.just('string'.length))

    const none = Maybe.nothing<string>()
    const noLength = Maybe.map(length, none)
    expectTypeOf(none).toEqualTypeOf<Maybe<string>>()
    expect(noLength).toEqual(Maybe.nothing())
  })

  test('`mapOr`', () => {
    const justAString = Maybe.of('string')

    expect(Maybe.mapOr(0, length, justAString)).toEqual('string'.length)
    expect(Maybe.mapOr(0, length, Maybe.of<string>(null))).toEqual(0)

    expect(Maybe.mapOr<string, number>(0)(length)(justAString)).toEqual(
      Maybe.mapOr(0, length, justAString)
    )
    expect(Maybe.mapOr(0, length)(justAString)).toEqual(Maybe.mapOr(0, length, justAString))
  })

  test('`mapOrElse`', () => {
    const theValue = 'a string'
    const theDefault = 0
    const toDefault = () => theDefault
    const aJust = Maybe.just(theValue)
    const aNothing: Maybe<string> = Maybe.nothing()

    expect(Maybe.mapOrElse(toDefault, length, aJust)).toBe(theValue.length)
    expect(Maybe.mapOrElse(toDefault, length, aNothing)).toBe(theDefault)

    expect(Maybe.mapOrElse<string, number>(toDefault)(length)(aJust)).toEqual(
      Maybe.mapOrElse(toDefault, length, aJust)
    )
    expect(Maybe.mapOrElse(toDefault, length)(aJust)).toEqual(
      Maybe.mapOrElse(toDefault, length, aJust)
    )
  })

  test('`fold`', () => {
    const theValue = 'a string'
    const aJust = Maybe.just(theValue)
    const aNothing: Maybe<string> = Maybe.nothing()

    const matcher: Matcher<string, string> = {
      Just: (val) => val + ', yo',
      Nothing: () => 'rats, nothing'
    }

    expect(Maybe.fold(matcher, aJust)).toEqual('a string, yo')
    expect(Maybe.fold(matcher, aNothing)).toEqual('rats, nothing')

    expect(Maybe.fold(matcher)(aJust)).toEqual(Maybe.fold(matcher, aJust))
  })

  test('`and`', () => {
    const aJust = Maybe.just(42)
    const anotherJust = Maybe.just('a string')
    const aNothing: Maybe<Record<string, unknown>> = Maybe.nothing()
    expect(Maybe.and(anotherJust, aJust)).toBe(anotherJust)

    expect(Maybe.and(aNothing, aJust)).toEqual(aNothing)
    expect(Maybe.and(aNothing, aJust)).toEqual(aNothing)
    expect(Maybe.and(aNothing, aNothing)).toEqual(aNothing)

    expect(Maybe.and<number, Record<string, unknown>>(aNothing)(aJust)).toEqual(Maybe.and(aNothing, aJust))
  })

  test('`chain`', () => {
    const toMaybeNumber = (x: string) => Maybe.just(Number(x))
    const toNothing = () => Maybe.nothing<number>()

    const theValue = '42'
    const theJust = Maybe.just(theValue)
    const theExpectedResult = toMaybeNumber(theValue)
    const noString = Maybe.nothing<string>()
    const noNumber = Maybe.nothing<number>()

    expect(Maybe.chain(toMaybeNumber, theJust)).toEqual(theExpectedResult)
    expect(Maybe.chain(toNothing, theJust)).toEqual(noNumber)
    expect(Maybe.chain(toMaybeNumber, noString)).toEqual(noNumber)
    expect(Maybe.chain(toNothing, noString)).toEqual(noNumber)

    expect(Maybe.chain(toMaybeNumber)(theJust)).toEqual(Maybe.chain(toMaybeNumber, theJust))
  })

  test('`or`', () => {
    const justAnswer = Maybe.of('42')
    const justWaffles = Maybe.of('waffles')
    const nothing: Maybe<string> = Maybe.nothing()

    expect(Maybe.or(justAnswer, justWaffles)).toBe(justWaffles)
    expect(Maybe.or(nothing, justWaffles)).toBe(justWaffles)
    expect(Maybe.or(justAnswer, nothing)).toBe(justAnswer)
    expect(Maybe.or(nothing, nothing)).toBe(nothing)

    expect(Maybe.or(justAnswer)(justWaffles)).toEqual(Maybe.or(justAnswer, justWaffles))
  })

  test('`orElse`', () => {
    const getWaffles = () => Maybe.of('waffles')
    const just42 = Maybe.of('42')
    expect(Maybe.orElse(getWaffles, just42)).toEqual(Maybe.just('42'))
    expect(Maybe.orElse(getWaffles, Maybe.of(null as string | null))).toEqual(
      Maybe.just('waffles')
    )
    expect(Maybe.orElse(() => Maybe.of(null as string | null), just42)).toEqual(Maybe.just('42'))
    expect(
      Maybe.orElse(() => Maybe.of(null as string | null), Maybe.of(null as string | null))
    ).toEqual(Maybe.nothing())

    expect(Maybe.orElse(getWaffles)(just42)).toEqual(Maybe.orElse(getWaffles, just42))
  })

  test('`get`', () => {
    expect(Maybe.unsafelyGet(Maybe.of('42'))).toBe('42')
    expect(() => Maybe.unsafelyGet(Maybe.nothing())).toThrow()
  })

  test('`getOr`', () => {
    const theValue = [1, 2, 3]
    const theDefaultValue: number[] = []

    const theJust = Maybe.of(theValue)
    const theNothing = Maybe.nothing()

    expect(Maybe.getOr(theDefaultValue, theJust)).toEqual(theValue)
    expect(Maybe.getOr(theDefaultValue, theNothing)).toEqual(theDefaultValue)

    expect(Maybe.getOr(theDefaultValue)(theJust)).toEqual(
      Maybe.getOr(theDefaultValue, theJust)
    )

    // Make sure you can get to a different type, like undefined
    // For interop with "regular" code
    expectTypeOf(theJust).toEqualTypeOf<Maybe<number[]>>()
    const theJustOrUndefined = theJust.getOr(undefined)
    expectTypeOf(theJustOrUndefined).toEqualTypeOf<number[] | undefined>()
    expect(theJustOrUndefined).toEqual(theValue)
  })

  test('`getOrElse`', () => {
    const val = 100
    const getVal = () => val
    const just42 = Maybe.of(42)

    expect(Maybe.getOrElse(getVal, just42)).toBe(42)
    expect(Maybe.getOrElse(getVal, Maybe.nothing())).toBe(val)

    expect(Maybe.getOrElse(getVal)(just42)).toEqual(Maybe.getOrElse(getVal, just42))

    // test getting to undefined
    const noop = (): undefined => undefined
    const undefinedOr42 = Maybe.getOrElse(noop, just42)
    expectTypeOf(undefinedOr42).toEqualTypeOf<number | undefined>()
    expect(undefinedOr42).toEqual(42)
  })

  test('`toString`', () => {
    expect(Maybe.toString(Maybe.of(42))).toEqual('Just(42)')
    expect(Maybe.toString(Maybe.nothing<string>())).toEqual('Nothing')
  })

  test('`toJSON`', () => {
    expect(Maybe.toJSON(Maybe.of(42))).toEqual({ variant: Maybe.MaybeVariant.Just, $value: 42 })
    expect(Maybe.toJSON(Maybe.nothing())).toEqual({ variant: Maybe.MaybeVariant.Nothing })
    expect(Maybe.toJSON(Maybe.of({ a: 42, b: null }))).toEqual({
      variant: Maybe.MaybeVariant.Just,
      $value: { a: 42, b: null }
    })
  })

  test('`toJSON` through serialization', () => {
    const actualSerializedJust = JSON.stringify(Maybe.of(42))
    const actualSerializedNothing = JSON.stringify(Maybe.nothing())
    const expectedSerializedJust = JSON.stringify({ variant: Maybe.MaybeVariant.Just, $value: 42 })
    const expectedSerializedNothing = JSON.stringify({ variant: Maybe.MaybeVariant.Nothing })

    expect(actualSerializedJust).toEqual(expectedSerializedJust)
    expect(actualSerializedNothing).toEqual(expectedSerializedNothing)
  })

  test('`equals`', () => {
    const a = Maybe.of<string>('a')
    const b = Maybe.of<string>('a')
    const c = Maybe.nothing<string>()
    const d = Maybe.nothing<string>()
    expect(Maybe.equals(b, a)).toBe(true)
    expect(Maybe.equals(b)(a)).toBe(true)
    expect(Maybe.equals(c, b)).toBe(false)
    expect(Maybe.equals(c)(b)).toBe(false)
    expect(Maybe.equals(d, c)).toBe(true)
    expect(Maybe.equals(d)(c)).toBe(true)
  })

  test('`ap`', () => {
    const add = (a: number) => (b: number) => a + b
    const maybeAdd = Maybe.of(add)

    expect(maybeAdd.ap(Maybe.of(1)).ap(Maybe.of(5))).toEqual(Maybe.of(6))

    const maybeAdd3 = Maybe.of<(val: number) => number>(add(3))
    const val = Maybe.of(2)
    const nada: Maybe<number> = Maybe.of(null as number | null | undefined)

    expect(Maybe.ap(maybeAdd3, val)).toEqual(Maybe.just(5))
    expect(Maybe.ap(maybeAdd3)(nada)).toEqual(Maybe.nothing())
  })

  test('`prop`', () => {
    type Person = { name?: string }
    const chris: Person = { name: 'chris' }
    expect(Maybe.prop('name', chris)).toEqual(Maybe.just(chris.name))

    const nobody: Person = {}
    expect(Maybe.prop('name', nobody)).toEqual(Maybe.nothing())

    type Dict<T> = { [key: string]: T }
    const dict: Dict<string> = { quux: 'warble' }
    expect(Maybe.prop('quux', dict)).toEqual(Maybe.just('warble'))
    expect(Maybe.prop('wat', dict)).toEqual(Maybe.nothing())
  })

  test('`get`', () => {
    type Person = { name?: string }
    const chris: Person = { name: 'chris' }
    const justChris: Maybe<Person> = Maybe.just(chris)
    expect(Maybe.get('name', justChris)).toEqual(Maybe.just(chris.name))

    const nobody: Maybe<Person> = Maybe.nothing()
    expect(Maybe.get('name', nobody)).toEqual(Maybe.nothing())

    type Dict<T> = { [key: string]: T }
    const dict = Maybe.just({ quux: 'warble' } as Dict<string>)
    expect(Maybe.get('quux', dict)).toEqual(Maybe.just('warble'))
    expect(Maybe.get('wat', dict)).toEqual(Maybe.nothing())
  })
})

// We aren't even really concerned with the "runtime" behavior here, which we
// know to be correct from other tests. Instead, this test just checks whether
// the types are narrowed as they should be.
test('narrowing', () => {
  const oneJust = Maybe.of('something')
  if (oneJust.isJust()) {
    expectTypeOf(oneJust).toEqualTypeOf<Just<string>>()
    expect(oneJust.$value).toBeDefined()
  }

  // As above, narrowing directly on the type rather than with the lookup.
  const anotherJust = Maybe.of('something')
  if (anotherJust.variant === MaybeVariant.Just) {
    expectTypeOf(anotherJust).toEqualTypeOf<Just<string>>()
    expect(anotherJust.$value).toBeDefined()
  }

  const oneNothing = Maybe.nothing()
  if (oneNothing.isNothing()) {
    expectTypeOf(oneNothing).toEqualTypeOf<Nothing<unknown>>()
  }

  const anotherNothing = Maybe.nothing()
  if (anotherNothing.variant === MaybeVariant.Nothing) {
    expectTypeOf(anotherNothing).toEqualTypeOf<Nothing<unknown>>()
  }

  expect('this type checked, hooray').toBeTruthy()
})

describe('`Maybe.Just` class', () => {
  test('constructor', () => {
    const theJust = new Maybe.Just([])
    expect(theJust).toBeInstanceOf(Maybe.Just)
  })

  test('`value` property', () => {
    const val = 'hallo'
    const theJust = new Maybe.Just(val)
    expect(theJust.$value).toBe(val)
  })

  test('`get` static method', () => {
    const val = 42
    const theJust = new Maybe.Just(42)
    expect(Just.get(theJust)).toEqual(val)
  })

  test('`isJust` method', () => {
    const theJust = new Maybe.Just([])
    expect(theJust.isJust()).toBe(true)
  })

  test('`isNothing` method', () => {
    const theJust = new Maybe.Just([])
    expect(theJust.isNothing()).toBe(false)
  })

  test('`map` method', () => {
    const plus2 = (x: number) => x + 2
    const theValue = 12
    const theJust = new Maybe.Just(theValue)
    const theResult = new Maybe.Just(plus2(theValue))

    expect(theJust.map(plus2)).toEqual(theResult)
  })

  test('`mapOr` method', () => {
    const theValue = 42
    const theJust = new Maybe.Just(42)
    const theDefault = 1
    const double = (n: number) => n * 2

    expect(theJust.mapOr(theDefault, double)).toEqual(double(theValue))
  })

  test('`mapOrElse` method', () => {
    const theValue = 'this is a string'
    const theJust = new Maybe.Just(theValue)
    const aDefault = () => 0

    expect(theJust.mapOrElse(aDefault, length)).toEqual(length(theValue))
  })

  test('`fold` method', () => {
    const theValue = 'this is a string'
    const theJust = new Maybe.Just(theValue)

    expect(
      theJust.fold({
        Just: (val) => val + ', yo',
        Nothing: () => 'rats, nothing'
      })
    ).toEqual('this is a string, yo')
  })

  test('`or` method', () => {
    const theJust = new Maybe.Just({ neat: 'thing' })
    const anotherJust = new Maybe.Just({ neat: 'waffles' })
    const aNothing = new Maybe.Nothing<Neat>()

    expect(theJust.or(anotherJust)).toEqual(theJust)
    expect(theJust.or(aNothing)).toEqual(theJust)
  })

  test('`orElse` method', () => {
    const theJust = new Maybe.Just(12)
    const getAnotherJust = () => Maybe.just(42)

    expect(theJust.orElse(getAnotherJust)).toEqual(theJust)
  })

  test('`and` method', () => {
    const theJust = new Maybe.Just({ neat: 'thing' })
    const theConsequentJust = new Maybe.Just(['amazing', { tuple: 'thing' }])
    const aNothing = new Maybe.Nothing()

    expect(theJust.and(theConsequentJust)).toEqual(theConsequentJust)
    expect(theJust.and(aNothing)).toEqual(aNothing)
  })

  test('`chain` method', () => {
    const theValue = { Jedi: 'Luke Skywalker' }
    const theJust = new Maybe.Just(theValue)
    const toDescription = (dict: { [key: string]: string }) =>
      new Maybe.Just(
        Object.keys(dict)
          .map((key) => `${dict[key]} is a ${key}`)
          .join('\n')
      )

    const theExpectedResult = toDescription(theValue)
    expect(theJust.chain(toDescription)).toEqual(theExpectedResult)
  })

  test('`get` method', () => {
    const theValue = 'value'
    const theJust = new Maybe.Just(theValue)
    expect(theJust.unsafelyGet()).toEqual(theValue)
    expect(() => theJust.unsafelyGet()).not.toThrow()
  })

  test('`getOr` method', () => {
    const theValue = [1, 2, 3]
    const theJust = new Maybe.Just(theValue)
    const theDefaultValue: number[] = []

    expect(theJust.getOr(theDefaultValue)).toEqual(theValue)
  })

  test('`getOrElse` method', () => {
    const value = 'value'
    const theJust = new Maybe.Just(value)
    expect(theJust.getOrElse(() => 'other value')).toEqual(value)
  })

  test('`toString` method', () => {
    expect(Maybe.of(42).toString()).toEqual('Just(42)')
  })

  test('`toJSON` method', () => {
    expect(Maybe.of({ x: 42 }).toJSON()).toEqual({ variant: Maybe.MaybeVariant.Just, $value: { x: 42 } })
    expect(Maybe.of(Maybe.of(42)).toJSON()).toEqual({
      variant: Maybe.MaybeVariant.Just,
      $value: { variant: Maybe.MaybeVariant.Just, $value: 42 }
    })
  })

  test('`equals` method', () => {
    const a = new Maybe.Just('a')
    const b = new Maybe.Just('a')
    const c = new Maybe.Just('b')
    const d = new Maybe.Nothing<string>()
    expect(a.equals(b)).toBe(true)
    expect(b.equals(c)).toBe(false)
    expect(c.equals(d)).toBe(false)
  })

  test('`ap` method', () => {
    const toString = (a: number) => a.toString()
    const fn: Maybe<typeof toString> = new Maybe.Just(toString)
    const val = new Maybe.Just(3)

    const result = fn.ap(val)

    expect(result.equals(Maybe.of('3'))).toBe(true)
  })

  test('`prop` method', () => {
    type DeepType = { something?: { with?: { deeper?: { 'key names'?: string } } } }

    const allSet: DeepType = { something: { with: { deeper: { 'key names': 'like this' } } } }
    const deepResult = new Maybe.Just(allSet)
      .get('something')
      .get('with')
      .get('deeper')
      .get('key names')
    expect(deepResult).toEqual(Maybe.just('like this'))

    const allEmpty: DeepType = {}
    const emptyResult = new Maybe.Just(allEmpty)
      .get('something')
      .get('with')
      .get('deeper')
      .get('key names')
    expect(emptyResult).toEqual(Maybe.nothing())
  })
})

describe('`Maybe.Nothing` class', () => {
  test('constructor', () => {
    const theNothing = new Maybe.Nothing()
    expect(theNothing).toBeInstanceOf(Maybe.Nothing)
  })

  test('`isJust` method', () => {
    const theNothing = new Maybe.Nothing()
    expect(theNothing.isJust()).toBe(false)
  })

  test('`isNothing` method', () => {
    const theNothing = new Maybe.Nothing()
    expect(theNothing.isNothing()).toBe(true)
  })

  test('`map` method', () => {
    const theNothing = new Maybe.Nothing<string>()
    expect(theNothing.map(length)).toEqual(theNothing)
  })

  test('`mapOr` method', () => {
    const theNothing = new Maybe.Nothing<number>()
    const theDefaultValue = 'yay'
    expect(theNothing.mapOr(theDefaultValue, String)).toEqual(theDefaultValue)
  })

  test('`mapOrElse` method', () => {
    const theDefaultValue = 'potatoes'
    const getDefaultValue = () => theDefaultValue
    const getNeat = (x: Neat) => x.neat
    const theNothing = new Maybe.Nothing<Neat>()
    expect(theNothing.mapOrElse(getDefaultValue, getNeat)).toBe(theDefaultValue)
  })

  test('`match` method', () => {
    const nietzsche = Maybe.nothing()
    const soDeepMan = [
      'Whoever fights monsters should see to it that in the process he does not become a monster.',
      'And if you gaze long enough into an abyss, the abyss will gaze back into you.'
    ].join(' ')

    expect(
      nietzsche.fold({
        Just: (s) => s + ', yo',
        Nothing: () => soDeepMan
      })
    ).toBe(soDeepMan)
  })

  test('`or` method', () => {
    const theNothing = new Maybe.Nothing<boolean>() // the worst: optional booleans!
    const theDefaultValue = Maybe.just(false)

    expect(theNothing.or(theDefaultValue)).toBe(theDefaultValue)
  })

  test('`orElse` method', () => {
    const theNothing = new Maybe.Nothing<{ here: string[] }>()
    const justTheFallback = Maybe.just({ here: ['to', 'see'] })
    const getTheFallback = () => justTheFallback

    expect(theNothing.orElse(getTheFallback)).toEqual(justTheFallback)
  })

  test('`and` method', () => {
    const theNothing = new Maybe.Nothing<string[]>()
    const theConsequentJust = new Maybe.Just('blaster bolts')
    const anotherNothing = new Maybe.Nothing<string>()
    expect(theNothing.and(theConsequentJust)).toEqual(theNothing)
    expect(theNothing.and(anotherNothing)).toEqual(theNothing)
  })

  test('`chain` method', () => {
    const theNothing = new Maybe.Nothing()
    const theDefaultValue = 'string'
    const getDefaultValue = () => Maybe.just(theDefaultValue)

    expect(theNothing.chain(getDefaultValue)).toEqual(theNothing)
  })

  test('`unsafelyGet` method', () => {
    const noStuffAtAll = new Maybe.Nothing()
    expect(() => noStuffAtAll.unsafelyGet()).toThrow()
  })

  test('`getOr` method', () => {
    const theNothing = new Maybe.Nothing<number[]>()
    const theDefaultValue: number[] = []
    expect(theNothing.getOr(theDefaultValue)).toEqual(theDefaultValue)
  })

  test('`getOrElse` method', () => {
    const theNothing = new Maybe.Nothing()
    const theDefaultValue = 'it be all fine tho'
    expect(theNothing.getOrElse(() => theDefaultValue)).toEqual(theDefaultValue)
  })

  test('`toString` method', () => {
    expect(Maybe.nothing().toString()).toEqual('Nothing')
  })

  test('`toJSON` method', () => {
    expect(Maybe.nothing().toJSON()).toEqual({ variant: Maybe.MaybeVariant.Nothing })
    expect(Maybe.of(Maybe.nothing()).toJSON()).toEqual({
      variant: Maybe.MaybeVariant.Just,
      $value: { variant: Maybe.MaybeVariant.Nothing }
    })
  })

  test('`equals` method', () => {
    const a = new Maybe.Just<string>('a')
    const b = new Maybe.Nothing<string>()
    const c = new Maybe.Nothing<string>()
    expect(a.equals(b)).toBe(false)
    expect(b.equals(c)).toBe(true)
  })

  test('`ap` method', () => {
    const fn = new Maybe.Nothing<(val: string) => number>()
    const val = new Maybe.Just('three')

    const result = fn.ap(val)

    expect(result.isNothing()).toBe(true)
  })

  test('`prop` method', () => {
    type DeepType = { something?: { with?: { deeper?: { 'key names'?: string } } } }

    const result = new Maybe.Nothing<DeepType>()
      .get('something')
      .get('with')
      .get('deeper')
      .get('key names')
    expect(result).toEqual(Maybe.nothing())
  })
})

test('`Maybe` classes interacting', () => {
  const aMaybe: Maybe<string> = Maybe.nothing()
  const mapped = aMaybe.map(length)
  expect(mapped).toBeInstanceOf(Maybe.Nothing)
  expect(mapped).not.toBeInstanceOf(Maybe.Just)

  const anotherMaybe: Maybe<number> = Maybe.just(10)
  const anotherMapped = anotherMaybe.mapOr('nada', (n) => `The number was ${n}`)
  expect(anotherMapped).toEqual('The number was 10')
})
