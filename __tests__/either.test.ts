/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expectTypeOf } from 'expect-type'
import Either, { Matcher, Left, left, Right, EitherVariant } from '../src/either'

type Neat = { neat: string }

const length = (s: string) => s.length

describe('`Either` pure functions', () => {
  test('`left`', () => {
    const theLeft = left('something')
    expect(theLeft).toBeInstanceOf(Left)

    const leftType = left<Neat>({ neat: 'strings' })
    expectTypeOf(leftType).toEqualTypeOf<Left<Neat>>()
  })

  test('`of`', () => {
    const anOf = Either.of<Neat>({ neat: 'strings' })
    expectTypeOf(anOf).toEqualTypeOf<Right<Neat>>()

    const anotherOf = Either.of<number>(42)
    expectTypeOf(anotherOf).toEqualTypeOf<Right<number>>()
    expect(Either.isRight(anotherOf)).toBe(true)
    expect(Either.isLeft(anotherOf)).toBe(false)
    expect(Either.get<never, number>(anotherOf)).toBe(42)
  })

  test('`isLeft`', () => {
    const aLeft = new Left(null)
    expect(Either.isLeft(aLeft)).toBe(true)
    expect(Either.isRight(aLeft)).toBe(false)
  })

  test('`isRight`', () => {
    const aRight = Either.of('something')
    expect(Either.isRight(aRight)).toBe(true)
    expect(Either.isLeft(aRight)).toBe(false)
  })

  describe('`tryCatch`', () => {
    test('with valid function', () => {
      const shouldBeRight = Either.tryCatch(() => ({ neat: 'strings' }), e => e)
      if (shouldBeRight.isRight()) {
        expectTypeOf(shouldBeRight).toEqualTypeOf<Right<Neat>>()
        expectTypeOf(Either.get<never, Neat>(shouldBeRight)).toEqualTypeOf<Neat>()
      } else {
        throw Error('tryCatch test failed: expected Right and got Left')
      }
    })
    test('with invalid function', () => {
      const shouldBeLeft = Either.tryCatch(() => { throw Error('it broke') }, e => e.toString())
      expect(Either.isLeft(shouldBeLeft)).toBe(true)
      expect(Either.get(shouldBeLeft)).toEqual('Error: it broke')
      if (shouldBeLeft.isLeft()) {
        expectTypeOf(shouldBeLeft).toEqualTypeOf<Left<string>>()
        expectTypeOf(Either.get<string, never>(shouldBeLeft)).toEqualTypeOf<string>()
      } else {
        throw Error('tryCatch test failed: expected Left and got Right')
      }
    })
  })

  test('`get`', () => {
    const rightValue = 'harry'
    const leftValue = 'potter'
    const aRight = Either.of(rightValue)
    expect(Either.get(aRight)).toEqual(rightValue)
    const aLeft = new Left(leftValue)
    expect(Either.get(aLeft)).toEqual(leftValue)
  })

  test('`fold`', () => {
    const rightValue = 'this is right'
    const leftValue = 'this is left'
    const aRight = Either.of(rightValue)
    const aLeft = new Left(leftValue)

    const matcher: Matcher<string, string, string, string> = {
      Left: (val) => {
        expectTypeOf(val).toEqualTypeOf<string>()
        return 'Left ' + val
      },
      Right: (val) => {
        expectTypeOf(val).toEqualTypeOf<string>()
        return 'Right ' + val
      }
    }

    expect(Either.fold(matcher, aRight)).toEqual('Right ' + rightValue)
    expect(Either.fold(matcher, aLeft)).toEqual('Left ' + leftValue)

    expect(Either.fold(matcher)(aRight)).toEqual(Either.fold(matcher, aRight))
  })

  describe('`pluck`', () => {
    test('on a Right', () => {
      const rightNeat = Either.of({ neat: 'string' })
      const aString = Either.pluck<never, Neat, string>('neat', rightNeat)
      const shouldntWork = Either.pluck('duff', rightNeat)

      if (Either.isRight(aString)) {
        expectTypeOf(aString).toEqualTypeOf<Right<string>>()
      } else {
        throw Error('map test failed: expected Right and got Left')
      }
      expect(aString).toEqual(Either.of('string'))
      expect(shouldntWork).toEqual(left("'duff' not found"))
    })
    test('`on a Left`', () => {
      const leftNeat = new Left({ neat: 'string' })
      const noChange = Either.pluck<Neat, never, never>('neat', leftNeat)
      const shouldntWork = Either.pluck('duff', leftNeat)

      if (Either.isLeft(noChange)) {
        expectTypeOf(noChange).toEqualTypeOf<Left<Neat | string>>()
      } else {
        throw Error('map test failed: expected Left and got Right')
      }
      expect(noChange).toEqual(new Left({ neat: 'string' }))
      expect(shouldntWork).toEqual(new Left({ neat: 'string' }))
    })
  })

  describe('`map`', () => {
    test('on a Right', () => {
      const rightString = Either.of('string')
      const itsLength = Either.map(length, rightString)
      if (Either.isRight(itsLength)) {
        expectTypeOf(itsLength).toEqualTypeOf<Right<number>>()
      } else {
        throw Error('map test failed: expected Right and got Left')
      }
      expect(itsLength).toEqual(Either.of('string'.length))
    })
    test('`on a Left`', () => {
      const left = new Left('string')
      const noChange = Either.map(length, left)
      if (Either.isLeft(noChange)) {
        expectTypeOf(noChange).toEqualTypeOf<Left<string>>()
      } else {
        throw Error('map test failed: expected Left and got Right')
      }
      expect(noChange).toEqual(new Left('string'))
    })
  })

  describe('`chain`', () => {
    test('with two Rights', () => {
      const helloEither = Either.of('hello')
      const hiWorldEither = Either.chain(value => Either.of(value + ', world!'), helloEither)

      if (Either.isRight(hiWorldEither)) {
        expectTypeOf(hiWorldEither).toEqualTypeOf<Right<string>>()
        expect(Either.get(hiWorldEither)).toEqual('hello, world!')
      } else {
        throw Error('map test failed: expected Right and got Left')
      }
      expect(hiWorldEither).toEqual(Either.of('hello, world!'))
    })
    test('`with a Left First`', () => {
      const helloEither = new Left('hello')
      const hiWorldEither = Either.chain(value => Either.of(value + ', world!'), helloEither)

      if (Either.isLeft(hiWorldEither)) {
        expectTypeOf(hiWorldEither).toEqualTypeOf<Left<string>>()
        expect(Either.get(hiWorldEither)).toEqual('hello')
      } else {
        throw Error('map test failed: expected Left and got Right')
      }
      expect(hiWorldEither).toEqual(new Left('hello'))
    })
    test('`with a Left Second`', () => {
      const helloEither = Either.of('hello')
      const hiWorldEither = Either.chain(value => new Left(value + ', world!'), helloEither)

      if (Either.isLeft(hiWorldEither)) {
        expectTypeOf(hiWorldEither).toEqualTypeOf<Left<string>>()
        expect(Either.get(hiWorldEither)).toEqual('hello, world!')
      } else {
        throw Error('map test failed: expected Left and got Right')
      }
      expect(hiWorldEither).toEqual(new Left('hello, world!'))
    })
  })

  test('`ap`', () => {
    const add = (a: number) => (b: number) => a + b
    const addEither = Either.of(add)

    expect(addEither.ap(Either.of(1)).ap(Either.of(5))).toEqual(Either.of(6))

    const add3 = Either.of<(val: number) => number>(add(3))
    const val = Either.of(2)
    const nada = new Left(null)

    expect(Either.ap(val, add3)).toEqual(Either.of(5))
    expect(Either.ap(add3)(nada)).toEqual(new Left(null))
  })
})

// We aren't even really concerned with the "runtime" behavior here, which we
// know to be correct from other tests. Instead, this test just checks whether
// the types are narrowed as they should be.
test('narrowing', () => {
  const aRight = Either.of('something')
  if (aRight.isRight()) {
    expectTypeOf(aRight).toEqualTypeOf<Right<string>>()
    expect(aRight.$value).toBeDefined()
  }

  // As above, narrowing directly on the type rather than with the lookup.
  const anotherRight = Either.of('something')
  if (anotherRight.variant === EitherVariant.Right) {
    expectTypeOf(anotherRight).toEqualTypeOf<Right<string>>()
    expect(anotherRight.$value).toBeDefined()
  }

  const aLeft = new Left('string')
  if (aLeft.isLeft()) {
    expectTypeOf(aLeft).toEqualTypeOf<Left<string>>()
  }

  const anotherLeft = new Left('string')
  if (anotherLeft.variant === EitherVariant.Left) {
    expectTypeOf(anotherLeft).toEqualTypeOf<Left<string>>()
  }

  expect('this type checked, hooray').toBeTruthy()
})

describe('`Either.Right` class', () => {
  test('constructor', () => {
    const theRight = new Right([])
    expect(theRight).toBeInstanceOf(Right)
  })

  test('`of` static method', () => {
    expect(() => Right.of()).toThrowError()
  })

  test('`value` property', () => {
    const val = 'hallo'
    const theRight = new Right(val)
    expect(theRight.$value).toBe(val)
  })

  test('`get` static method', () => {
    const val = 42
    const theRight = new Right(42)
    expect(Right.get(theRight)).toEqual(val)
  })

  test('`isRight` method', () => {
    const theRight = new Right([])
    expect(theRight.isRight()).toBe(true)
  })

  test('`isLeft` method', () => {
    const theRight = new Right([])
    expect(theRight.isLeft()).toBe(false)
  })

  test('`get` method', () => {
    const theValue = 'value'
    const theRight = new Right(theValue)
    expect(theRight.get()).toEqual(theValue)
    expect(() => theRight.get()).not.toThrow()
  })

  test('`toString` method', () => {
    expect(Either.of(42).toString()).toEqual('Right(42)')
  })

  test('`toJSON` method', () => {
    expect(Either.of({ x: 42 }).toJSON()).toEqual({ variant: EitherVariant.Right, $value: { x: 42 } })
    expect(Either.of(Either.of(42)).toJSON()).toEqual({
      variant: EitherVariant.Right,
      $value: { variant: EitherVariant.Right, $value: 42 }
    })
  })

  test('`fold` method', () => {
    const theValue = 'this is a string'
    const theRight = new Right(theValue)

    expect(
      theRight.fold({
        Right: (val) => val + ', yo',
        Left: () => 'nooooop'
      })
    ).toEqual('this is a string, yo')
  })

  describe('`pluck`', () => {
    const rightNeat = Either.of({ neat: 'string' })
    const aString = rightNeat.pluck<string>('neat')
    const shouldntWork = rightNeat.pluck('duff')

    if (Either.isRight(aString)) {
      expectTypeOf(aString).toEqualTypeOf<Right<string>>()
    } else {
      throw Error('map test failed: expected Right and got Left')
    }
    expect(aString).toEqual(Either.of('string'))
    expect(shouldntWork).toEqual(left("'duff' not found"))
  })

  test('`map` method', () => {
    const plus2 = (x: number) => x + 2
    const theValue = 12
    const theRight = new Right(theValue)
    const theResult = new Right(plus2(theValue))

    expect(theRight.map(plus2)).toEqual(theResult)
  })

  test('`chain` method', () => {
    const theValue = { Jedi: 'Luke Skywalker' }
    const theRight = new Right(theValue)
    const toDescription = (dict: { [key: string]: string }) =>
      new Right(
        Object.keys(dict)
          .map((key) => `${dict[key]} is a ${key}`)
          .join('\n')
      )

    const theExpectedResult = toDescription(theValue)
    expect(theRight.chain(toDescription)).toEqual(theExpectedResult)
  })

  test('`ap` method', () => {
    const toString = (a: number) => a.toString()
    const fn = new Right(toString)
    const val = new Right(3)

    expect(fn.ap(val)).toEqual(Either.of('3'))

    // @ts-ignore
    // eslint-disable-next-line no-unused-expressions
    expectTypeOf(Either.of('not a function').ap(Either.of(5))).toEqualTypeOf<Left<TypeError>>()
  })
})

describe('`Either.Left` class', () => {
  test('constructor', () => {
    const theLeft = new Left([])
    expect(theLeft).toBeInstanceOf(Left)
  })

  test('`of` static method', () => {
    expect(() => Left.of()).toThrowError()
  })

  test('`value` property', () => {
    const val = 'hallo'
    const theLeft = new Left(val)
    expect(theLeft.$value).toBe(val)
  })

  test('`get` static method', () => {
    const val = 42
    const theLeft = new Left(42)
    expect(Left.get(theLeft)).toEqual(val)
  })

  test('`isRight` method', () => {
    const theLeft = new Left([])
    expect(theLeft.isRight()).toBe(false)
  })

  test('`isLeft` method', () => {
    const theLeft = new Left([])
    expect(theLeft.isLeft()).toBe(true)
  })

  test('`get` method', () => {
    const theValue = 'value'
    const theLeft = new Left(theValue)
    expect(theLeft.get()).toEqual(theValue)
    expect(() => theLeft.get()).not.toThrow()
  })

  test('`toString` method', () => {
    expect(new Left(42).toString()).toEqual('Left(42)')
  })

  test('`toJSON` method', () => {
    expect(new Left({ x: 42 }).toJSON()).toEqual({ variant: EitherVariant.Left, $value: { x: 42 } })
    expect(new Left(new Left(42)).toJSON()).toEqual({
      variant: EitherVariant.Left,
      $value: { variant: EitherVariant.Left, $value: 42 }
    })
  })

  test('`fold` method', () => {
    const theValue = 'this is a string'
    const theLeft = new Left(theValue)

    expect(
      theLeft.fold({
        Right: () => 'this will never happen though',
        Left: (val) => val + ', yo'
      })
    ).toEqual('this is a string, yo')
  })

  describe('`pluck`', () => {
    const leftNeat = new Left<Neat>({ neat: 'string' })
    const noChange = leftNeat.pluck()
    const shouldntWork = leftNeat.pluck()

    if (Either.isLeft(noChange)) {
      expectTypeOf(noChange).toEqualTypeOf<Left<Neat>>()
    } else {
      throw Error('map test failed: expected Left and got Right')
    }
    expect(noChange).toEqual(new Left({ neat: 'string' }))
    expect(shouldntWork).toEqual(new Left({ neat: 'string' }))
  })

  test('`map` method', () => {
    const theValue = 12
    const theLeft = new Left(theValue)

    expect(theLeft.map()).toEqual(theLeft)
  })

  test('`chain` method', () => {
    const theValue = { Jedi: 'Luke Skywalker' }
    const theLeft = new Left(theValue)

    expect(theLeft.chain()).toEqual(theLeft)
  })

  test('`ap` method', () => {
    const toString = (a: number) => a.toString()
    const fn = new Left(toString)
    const result = fn.ap()

    expect(result).toEqual(fn)
  })
})
