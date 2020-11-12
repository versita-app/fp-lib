import Either, { Left, Right } from './either'
import { left } from './helpers'
import Task from './task'

export default class TaskEither extends Task {

  static tryCatch (f: () => any, g: (b: any) => any) {
    return new TaskEither(async (reject, resolve) => {
      try {
        const b = await f()
        resolve(Either.of(b))
      } catch (a) {
        reject(left(g(a)))
      }
    })
  }

  static fromEither (m: Left<any> | Right<any>) {
    return new TaskEither((resolve, reject) => {
      if (m.isLeft) {
        reject(left(m.value))
      } else {
        resolve(Either.of(m.value))
      }
    })
  }

  static runIfValid (x: TaskEither | Left<any> | Error): Left<any> | Error | Promise<Left<any> | Right<any>> {
    return x instanceof TaskEither
      ? new Promise((resolve) => {
        x.fork(resolve, resolve)
      })
      : x
  }

  map (f: (b: any) => void) {
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
