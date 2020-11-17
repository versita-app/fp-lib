import { PartialMapCallback } from './types/common'
import Monad from './monad'

export type TTaskReject <A = any> = (a?: A) => void
export type TTaskResolve <B = any> = (b?: B) => void
export type TTaskCleanup <C = any> = (c?: C) => void
export type TTaskCallback <A = any, B = any> = (reject: TTaskReject<A>, resolve: TTaskResolve<B>) => any

export default class Task<A = any, B = any> extends Monad {

  static of <B = any> (b: B) {
    const taskDefault: TTaskCallback = (_, resolve) => resolve(b)
    return new Task(taskDefault)
  }

  static rejected <A = any> (a: A) {
    return new Task((reject: TTaskReject) => reject(a))
  }

  static fromPromise <T = any> (promise: Promise<T>) {
    return new Task((reject, resolve) => promise.then(resolve).catch(reject))
  }

  fork: TTaskCallback<A, B>
  cleanup: TTaskCleanup

  constructor (computation: TTaskCallback<A, B>, cleanup?: TTaskCleanup) {
    super()
    this.fork = computation
    this.cleanup = cleanup || (() => undefined)
  }

  run () {
    return new Promise((resolve, reject) => this.fork(reject, resolve)) as Promise<A | B>
  }

  /**
   * Returns a task that will never resolve
   */
  empty () {
    return new Task(() => undefined)
  }

  /**
   * Transforms a failure value into a new Task[a, b]. Does nothing if the
   * structure already contains a successful value.
   */
  orElse <A1 = any> (f: (a?: A) => Task) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new Task<A1, B>(
      (reject, resolve) => fork(
        (a) => f(a).fork(reject, resolve),
        resolve
      ),
      cleanup
    )
  }

  /**
   * Takes two functions, applies the leftmost one to the failure value
   * and the rightmost one to the successful value depending on which
   * one is present
   */
  fold <A1 = any, B1 = any> (fa: (a?: A) => any, fb: (b?: B) => B1) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new Task<A1, B1>(
      (_, resolve) => fork(
        (a) => resolve(fa(a)),
        (b) => resolve(fb(b))
      ),
      cleanup
    )
  }

  /**
   * Transforms the successful value of the task
   * using a regular unary function
   */
  map <B1 = any> (f: PartialMapCallback<B, B1>) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new Task<A, B1>(
      (reject, resolve) => fork(
        reject,
        (b) => resolve(f(b))
      ),
      cleanup
    )
  }

  /**
   * Apply the successful value of one task to another
   */
  ap <B1 = any> (task: Task): Task<A, B1> {
    return this.chain<B1>(task.map)
  }

  /**
   * Transforms the successful value of the task
   * using a function to a monad
   */
  chain <B1 = any> (f: (f: PartialMapCallback<B, B1>) => Task<A, B1>) {
    const fork = this.fork
    const cleanup = this.cleanup

    return new Task<A, B1>(
      (reject, resolve) => fork(
        reject,
        (b) => {
          if (Monad.$valueIsPartialMapCallback<B, B1>(b)) {
            f(b).fork(reject, resolve)
          }

          throw new TypeError('The value passed to resolve is not a function')
        }
      ),
      cleanup
    )
  }
}
