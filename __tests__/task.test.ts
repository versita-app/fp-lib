/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expectTypeOf } from 'expect-type'
import Task, { Matcher } from '../src/task'

type Neat = { neat: string }

const length = (s: string) => s.length

describe('`Task` pure functions', () => {
  test('`run`', () => {
    const aTask = new Task<Neat>((_, resolve) => resolve({ neat: 'strings' }))
    Task.run(aTask).then(result => {
      expectTypeOf(result).toEqualTypeOf<Neat>()
      expect(result).toEqual({ neat: 'strings' })
    })
  })

  test('`of`', async () => {
    expect.assertions(1)
    const anOf = Task.of<Neat>({ neat: 'strings' })
    expectTypeOf(anOf).toEqualTypeOf<Task<Neat>>()

    const anotherOf = Task.of<number>(42)
    expectTypeOf(anotherOf).toEqualTypeOf<Task<number>>()

    await expect(Task.run(anotherOf)).resolves.toEqual(42)
  })

  test('`reject`', async () => {
    expect.assertions(1)
    const failedTask = Task.reject('something')
    expectTypeOf(failedTask).toEqualTypeOf<Task<never>>()

    await expect(failedTask.run()).rejects.toEqual('something')
  })

  test('`fromPromise`', async () => {
    expect.assertions(2)
    const aPromise = Promise.resolve<Neat>({ neat: 'strings' })
    const aTask = Task.fromPromise(aPromise)

    expectTypeOf(aTask).toEqualTypeOf<Task<Neat>>()

    await expect(aTask.run()).resolves.toEqual({ neat: 'strings' })

    const aFailedPromise = Promise.reject('failed')
    const aFailedTask = Task.fromPromise(aFailedPromise)

    expectTypeOf(aFailedTask).toEqualTypeOf<Task<never>>()

    await expect(aFailedTask.run()).rejects.toEqual('failed')
  })

  test('`empty`', () => {
    const aTask = Task.empty()
    const aCallback = jest.fn()
    aTask.fork(aCallback, aCallback)
    expect(aCallback).not.toHaveBeenCalled()
  })

  test('`orElse`', async () => {
    expect.assertions(1)
    const aTask = Task.reject('broken')
    const combined = Task.orElse(error => Task.of('the task is: ' + error), aTask)
    await expect(combined.run()).resolves.toEqual('the task is: broken')
  })

  test('`fold`', async () => {
    expect.assertions(2)
    const successVal = 'buff'
    const errorVal = 'duff'
    const goodTask = Task.of(successVal)
    const badTask = Task.reject(errorVal)

    const matcher: Matcher<string, string, string> = {
      Error: (e) => {
        return e.toString()
      },
      Success: (val) => {
        expectTypeOf(val).toEqualTypeOf<string>()
        return val + '!'
      }
    }

    await expect(Task.fold(matcher, goodTask)).resolves.toEqual(successVal + '!')
    await expect(Task.fold(matcher, badTask)).resolves.toEqual(errorVal)
  })

  test('`pluck`', async () => {
    expect.assertions(2)
    const taskA = Task.of({ neat: 'string' })
    const taskB = Task.pluck<Neat, Neat['neat']>('neat', taskA)
    const taskC = Task.pluck('something_invalid', taskA)

    expectTypeOf(taskB).toEqualTypeOf<Task<string>>()
    await expect(taskB.run()).resolves.toEqual('string')

    await expect(taskC.run()).rejects.toEqual("'something_invalid' not found")
  })

  test('`map`', async () => {
    expect.assertions(1)
    const taskA = Task.of('string')
    const taskB = Task.map(length, taskA)
    expectTypeOf(taskB).toEqualTypeOf<Task<number>>()
    await expect(taskB.run()).resolves.toEqual(6)
  })

  test('`chain`', async () => {
    expect.assertions(1)
    const aTask = Task.of('Hello')
    const transform = (str:string) => Task.of(str + ', World!')

    await expect(Task.chain(transform, aTask).run()).resolves.toEqual('Hello, World!')
  })

  test('`ap`', async () => {
    expect.assertions(1)
    const add = (a: number) => (b: number) => a + b
    const addTask = Task.of(add)

    const combinedA = Task.ap(Task.of(1), addTask)
    const combinedB = Task.ap(Task.of(5), combinedA)

    await expect(combinedB.run()).resolves.toEqual(6)

    // @ts-ignore
    // eslint-disable-next-line no-unused-expressions
    Task.of('not a function').ap(Task.of(5)).run().catch(err => expectTypeOf(err).toEqualTypeOf<TypeError>())
  })
})

describe('`Task` class', () => {
  test('constructor', () => {
    const theTask = new Task(() => null)
    expect(theTask).toBeInstanceOf(Task)
  })

  test('`run` method', async () => {
    expect.assertions(1)
    const aTask = Task.of(5)
    await expect(aTask.run()).resolves.toEqual(5)
  })

  test('`empty` method', () => {
    const aTask = Task.of(5)
    const aCallback = jest.fn()
    aTask.empty().fork(aCallback, aCallback)
    expect(aCallback).not.toHaveBeenCalled()
  })

  test('`orElse` method', async () => {
    expect.assertions(1)
    const aTask = Task.reject('broken')
    const combined = aTask.orElse(error => Task.of('the task is: ' + error))
    await expect(combined.run()).resolves.toEqual('the task is: broken')
  })

  test('`fold` method', async () => {
    expect.assertions(2)
    const successVal = 'buff'
    const errorVal = 'duff'
    const goodTask = Task.of(successVal)
    const badTask = Task.reject(errorVal)

    const matcher: Matcher<string, string, string> = {
      Error: (e) => {
        return e.toString()
      },
      Success: (val) => {
        expectTypeOf(val).toEqualTypeOf<string>()
        return val + '!'
      }
    }

    await expect(goodTask.fold(matcher)).resolves.toEqual(successVal + '!')
    await expect(badTask.fold(matcher)).resolves.toEqual(errorVal)
  })

  test('`pluck` method', async () => {
    expect.assertions(2)
    const taskA = Task.of({ neat: 'string' })
    const taskB = taskA.pluck<Neat['neat']>('neat')
    const taskC = taskA.pluck('something_invalid')

    expectTypeOf(taskB).toEqualTypeOf<Task<string>>()
    await expect(taskB.run()).resolves.toEqual('string')

    await expect(taskC.run()).rejects.toEqual("'something_invalid' not found")
  })

  test('`map` method', async () => {
    expect.assertions(1)
    const taskA = Task.of('string')
    const taskB = taskA.map(length)
    expectTypeOf(taskB).toEqualTypeOf<Task<number>>()
    await expect(taskB.run()).resolves.toEqual(6)
  })

  test('`chain` method', async () => {
    expect.assertions(1)
    const aTask = Task.of('Hello')
    const transform = (str:string) => Task.of(str + ', World!')

    await expect(aTask.chain(transform).run()).resolves.toEqual('Hello, World!')
  })

  test('`ap` method', async () => {
    expect.assertions(1)
    const add = (a: number) => (b: number) => a + b
    const addTask = Task.of(add)

    const combined = addTask.ap(Task.of(1)).ap(Task.of(5))

    await expect(combined.run()).resolves.toEqual(6)
  })
})
