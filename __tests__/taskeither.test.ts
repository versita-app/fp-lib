/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import Either, { left, Left } from '../src/either'
import Task from '../src/task'
import { expectTypeOf } from 'expect-type'
import TaskEither from '../src/taskeither'

type Neat = { neat: string }

const length = (s: string) => s.length

describe('`TaskEither` pure functions', () => {
  test('`run`', () => {
    const aTaskE = new TaskEither<never, Neat>((resolve) => resolve(Either.of<Neat>({ neat: 'strings' })))
    TaskEither.run(aTaskE).then(result => {
      expectTypeOf(result).toEqualTypeOf<Either<never, Neat>>()
      expect(result.get()).toEqual({ neat: 'strings' })
    })
  })

  test('`runIfValid`', async () => {
    expect.assertions(2)
    const anEither = Either.of<Neat>({ neat: 'strings' })
    const aTaskE = new TaskEither<never, Neat>((resolve) => resolve(anEither))
    await expect(TaskEither.runIfValid(aTaskE)).resolves.toEqual(anEither)
    await expect(TaskEither.runIfValid('not a task either')).resolves.toEqual('not a task either')
  })

  test('`of`', async () => {
    expect.assertions(1)
    const anOf = TaskEither.of<Neat>({ neat: 'strings' })
    expectTypeOf(anOf).toEqualTypeOf<TaskEither<any, Neat>>()

    const anotherOf = TaskEither.of(42)
    expectTypeOf(anotherOf).toEqualTypeOf<TaskEither<any, number>>()

    await expect(TaskEither.run(anotherOf)).resolves.toEqual(Either.of(42))
  })

  test('`reject`', async () => {
    expect.assertions(1)
    const anOf = TaskEither.reject<string>('bust')
    expectTypeOf(anOf).toEqualTypeOf<TaskEither<string, never>>()

    const anotherOf = TaskEither.reject('broken')

    await expect(TaskEither.run(anotherOf)).resolves.toEqual(left('broken'))
  })

  test('`tryCatch`', async () => {
    expect.assertions(2)
    const workingTryCatch = TaskEither.tryCatch(() => 'fine', () => null)

    expectTypeOf(workingTryCatch).toEqualTypeOf<TaskEither<null, string>>()
    await expect(TaskEither.run(workingTryCatch)).resolves.toEqual(Either.of('fine'))

    const failingTryCatch = TaskEither.tryCatch(() => { throw new Error('not fine') }, e => e.toString())

    expectTypeOf(failingTryCatch).toEqualTypeOf<TaskEither<string, never>>()
    await expect(TaskEither.run(failingTryCatch)).resolves.toEqual(left('Error: not fine'))
  })

  test('`fromPromise`', async () => {
    expect.assertions(2)
    const aPromise = Promise.resolve<Neat>({ neat: 'strings' })
    const aTaskE = TaskEither.fromPromise(aPromise)

    expectTypeOf(aTaskE).toEqualTypeOf<TaskEither<unknown, Neat>>()

    await expect(aTaskE.run()).resolves.toEqual(Either.of({ neat: 'strings' }))

    const aFailedPromise = Promise.reject('failed')
    const aFailedTaskE = TaskEither.fromPromise(aFailedPromise)

    await expect(aFailedTaskE.run()).resolves.toEqual(left('failed'))
  })

  test('`fromEither`', async () => {
    expect.assertions(2)
    const aRight = Either.of('dogs')
    const aTaskE = TaskEither.fromEither(aRight)

    expectTypeOf(aTaskE).toEqualTypeOf<TaskEither<unknown, string>>()

    await expect(aTaskE.run()).resolves.toEqual(aRight)

    const aLeft = left('cats')
    const anotherTaskE = TaskEither.fromEither(aLeft)

    expectTypeOf(anotherTaskE).toEqualTypeOf<TaskEither<string, unknown>>()

    await expect(anotherTaskE.run()).resolves.toEqual(aLeft)
  })

  test('`fromTask`', async () => {
    expect.assertions(2)
    const aTask = Task.of('a task')
    const aTaskE = TaskEither.fromTask(aTask)

    expectTypeOf(aTaskE).toEqualTypeOf<TaskEither<unknown, string>>()

    await expect(aTaskE.run()).resolves.toEqual(Either.of('a task'))

    const aFailedTask = Task.reject('failed')
    const aFailedTaskE = TaskEither.fromTask(aFailedTask)

    await expect(aFailedTaskE.run()).resolves.toEqual(left('failed'))
  })

  test('`pluck`', async () => {
    const aTask = TaskEither.of({ neat: 'string' })
    const validProp = TaskEither.pluck<unknown, Neat, string>('neat', aTask)
    const invalidProp = TaskEither.pluck<unknown, Neat, string>('guff', aTask)
    const onALeft = TaskEither.pluck('guff', TaskEither.reject('duff'))

    expectTypeOf(validProp).toEqualTypeOf<TaskEither<string | unknown, string>>()
    await expect(validProp.run()).resolves.toEqual(Either.of('string'))
    await expect(invalidProp.run()).resolves.toEqual(left("'guff' not found"))
    await expect(onALeft.run()).resolves.toEqual(left('duff'))
  })

  test('`map`', async () => {
    expect.assertions(2)
    const taskA = TaskEither.of('string')
    const taskB = TaskEither.map(length, taskA)
    const taskC = TaskEither.map(length, TaskEither.reject('nope'))
    expectTypeOf(taskB).toEqualTypeOf<TaskEither<any, number>>()
    await expect(taskB.run()).resolves.toEqual(Either.of(6))
    await expect(taskC.run()).resolves.toEqual(left('nope'))
  })

  test('`chain`', async () => {
    expect.assertions(2)
    const aTask = TaskEither.of('Hello')
    const transform = (str:string) => TaskEither.of(str + ', World!')

    await expect(TaskEither.chain(transform, aTask).run()).resolves.toEqual(Either.of('Hello, World!'))

    // with a rejected promise
    const badTaskE = TaskEither.reject('broken')
    const badChain = TaskEither.chain(() => TaskEither.of('we shouldnt see this'), badTaskE)

    await expect(badChain.run()).resolves.toEqual(left('broken'))
  })

  test('`ap`', async () => {
    expect.assertions(1)
    const add = (a: number) => (b: number) => a + b
    const addTask = TaskEither.of(add)

    const combinedA = TaskEither.ap(TaskEither.of(1), addTask)
    const combinedB = TaskEither.ap(TaskEither.of(5), combinedA)

    await expect(combinedB.run()).resolves.toEqual(Either.of(6))

    // @ts-ignore
    // eslint-disable-next-line no-unused-expressions
    TaskEither.of('not a function').ap(TaskEither.of(5)).run().then(err => expectTypeOf(err).toEqualTypeOf<Left<TypeError>>()).catch(console.log)
  })
})

describe('`TaskEither` class', () => {
  test('constructor', () => {
    const theTaskEither = new TaskEither(() => null)
    expect(theTaskEither).toBeInstanceOf(TaskEither)
  })

  test('`run`', () => {
    const aTaskE = new TaskEither<never, Neat>((resolve) => resolve(Either.of<Neat>({ neat: 'strings' })))
    aTaskE.run().then(result => {
      expectTypeOf(result).toEqualTypeOf<Either<never, Neat>>()
      expect(result.get()).toEqual({ neat: 'strings' })
    })
  })

  test('`runIfValid`', async () => {
    expect.assertions(1)
    const anEither = Either.of<Neat>({ neat: 'strings' })
    const aTaskE = new TaskEither<never, Neat>((resolve) => resolve(anEither))
    await expect(aTaskE.runIfValid()).resolves.toEqual(anEither)
  })

  test('`pluck`', async () => {
    const aTask = TaskEither.of<Neat>({ neat: 'string' })
    const validProp = aTask.pluck<string>('neat')
    const invalidProp = aTask.pluck<string>('guff')
    const onALeft = TaskEither.reject('duff').pluck('guff')

    expectTypeOf(validProp).toEqualTypeOf<TaskEither<any | string, string>>()
    await expect(validProp.run()).resolves.toEqual(Either.of('string'))
    await expect(invalidProp.run()).resolves.toEqual(left("'guff' not found"))
    await expect(onALeft.run()).resolves.toEqual(left('duff'))
  })

  test('`map`', async () => {
    expect.assertions(1)
    const taskA = TaskEither.of('string')
    const taskB = taskA.map(length)
    expectTypeOf(taskB).toEqualTypeOf<TaskEither<any, number>>()
    await expect(taskB.run()).resolves.toEqual(Either.of(6))
  })

  test('`chain`', async () => {
    expect.assertions(1)
    const aTask = TaskEither.of('Hello')
    const transform = (str:string) => TaskEither.of(str + ', World!')

    await expect(aTask.chain(transform).run()).resolves.toEqual(Either.of('Hello, World!'))
  })

  test('`ap`', async () => {
    expect.assertions(1)
    const add = (a: number) => (b: number) => a + b
    const addTask = TaskEither.of(add)

    const combined = addTask.ap(TaskEither.of(1)).ap(TaskEither.of(5))

    await expect(combined.run()).resolves.toEqual(Either.of(6))

    // @ts-ignore
    // eslint-disable-next-line no-unused-expressions
    TaskEither.of('not a function').ap(TaskEither.of(5)).run().then(err => expectTypeOf(err).toEqualTypeOf<Left<TypeError>>()).catch(console.log)
  })
})
