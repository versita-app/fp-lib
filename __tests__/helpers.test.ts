/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expectTypeOf } from 'expect-type'
import { Just, maybe, Nothing, nothing } from '../src/maybe'
import { prop, propOr, unsafeProp } from '../src/helpers'

type Neat = { neat: string }

describe('Helpers', () => {
  test('`propOr` function', () => {
    const object: Neat = { neat: 'string' }
    const propExists = propOr<Neat, string>('neat', 'nothing', object)
    const propDoesntExist = propOr('something else', 'nothing', object)
    const objectDoesntExist = propOr('something else', 'nothing', null)

    expect(propExists).toEqual('string')
    expect(propDoesntExist).toEqual('nothing')
    expect(objectDoesntExist).toEqual('nothing')
  })

  test('`prop` function', () => {
    const object: Neat = { neat: 'string' }
    const propExists = prop<Neat, string>('neat', object)
    const propDoesntExist = prop<Neat, string>('something else', object)
    const objectDoesntExist = prop<null, string>('something else', null)

    expect(propExists).toEqual(maybe('string'))
    expect(propDoesntExist).toEqual(nothing())
    expect(objectDoesntExist).toEqual(nothing())

    if (propExists.isJust()) {
      expectTypeOf(propExists).toEqualTypeOf<Just<string>>()
    } else {
      throw new Error('Test failed')
    }
    if (propDoesntExist.isNothing()) {
      expectTypeOf(propDoesntExist).toEqualTypeOf<Nothing<string>>()
    } else {
      throw new Error('Test failed')
    }
    if (objectDoesntExist.isNothing()) {
      expectTypeOf(propDoesntExist).toEqualTypeOf<Nothing<string>>()
    } else {
      throw new Error('Test failed')
    }
  })

  test('`unsafeProp` function', () => {
    const object: Neat = { neat: 'string' }
    const propExists = unsafeProp<Neat, string>('neat', object)
    const propDoesntExist = unsafeProp<Neat, string>('something else', object)
    const objectDoesntExist = unsafeProp<null, string>('something else', null)

    expect(propExists).toEqual('string')
    expect(propDoesntExist).toBeUndefined()
    expect(objectDoesntExist).toBeUndefined()
  })
})
