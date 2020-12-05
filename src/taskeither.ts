import Either, { Left, Right } from './either'
import { left } from './helpers'
import Task, { TTaskCallback } from './task'

export default class TaskEither<A = any, B = any> extends Task {
  static of <B = any> (b: B) {
    const taskDefault: TTaskCallback = (_, resolve) => resolve(Either.of(b))
    return new TaskEither(taskDefault)
  }

  static rejected <A = any> (a: A) {
    const taskDefault: TTaskCallback = (_, resolve) => resolve(left(a))
    return new TaskEither(taskDefault)
  }

  static tryCatch (f: () => any, g: (b: any) => any) {
    return new TaskEither(async (_, resolve) => {
      try {
        const b = await f()
        resolve(Either.of(b))
      } catch (a) {
        resolve(left(g(a)))
      }
    })
  }

  static fromPromise <A = any, B = any> (promise: Promise<B>) {
    return new Task((_, resolve) => promise
      .then((b: B) => resolve(Either.of(b)))
      .catch((a: A) => resolve(left(a))))
  }

  static fromEither (m: Left<any> | Right<any>) {
    return new TaskEither((_, resolve) => resolve(m))
  }

  static fromTask (t: Task<any>) {
    const fork = t.fork
    const cleanup = t.cleanup

    return new TaskEither(
      (reject, resolve) => fork(
        (a) => reject(left(a)),
        (b) => resolve(Either.of(b))
      ),
      cleanup
    )
  }

  static runIfValid (x: TaskEither | Left<any> | Error): Left<any> | Error | Promise<Left<any> | Right<any>> {
    return x instanceof TaskEither
      ? new Promise((resolve) => {
        x.fork(resolve, resolve)
      })
      : x
  }

  run () {
    return new Promise((resolve, reject) => this.fork(reject, resolve)) as Promise<Left<A> | Right<B>>
  }

  map (f: (b: B) => void) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new TaskEither(
      (reject, resolve) => fork(
        reject,
        (b) => resolve(b.map(f))
      ),
      cleanup
    )
  }

  chain (f: (b: any) => Task) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new TaskEither(
      (reject, resolve) => fork(
        reject,
        (b: any) => f(b).fork(reject, resolve)
      ),
      cleanup
    )
  }
}
