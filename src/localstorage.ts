import Either from './either'
import { curry, partial, pipe } from './helpers'
/**
 * Pure version of localStorage.getItem that won't throw
 *
 * @param key localStorage property to retrieve
 * @returns Either error deserialized value
 */
export const getItem = (key: string) => {
  return Either.tryCatch(
    () => pipe(
      localStorage.getItem.bind(localStorage),
      String,
      JSON.parse.bind(JSON)
    )(key),
    (reason) => new Error(String(reason))
  )
}

/**
 * Curried, pure version of localStorage.setItem that won't throw
 *
 * @Remarks curried
 * @param key localStorage property to set
 * @param value value to serialize and write to localStorage
 * @returns Either error or null
 */
export const setItem = curry((key: string, value: any) => {
  return Either.tryCatch(
    () => {
      const writeToLS = partial(localStorage.setItem.bind(localStorage), [key])
      pipe(
        JSON.stringify.bind(JSON),
        writeToLS,
      )(value)
      return null
    },
    (reason) => new Error(String(reason))
  )
})

/**
 * Pure version of localStorage.removeItem that won't throw
 *
 * @param key localStorage property to remove
 * @returns Either error or void
 */
export const removeItem = (key: string) => {
  return Either.tryCatch(
    () => localStorage.removeItem.bind(localStorage)(key),
    (reason) => new Error(String(reason))
  )
}
