/**
 * Same as the classic array.flat() method, which I cannot use
 * because that does not pass some CI pipelines. I'm guessing
 * there is somehow differently configured transpilation.
 * Didn't have time to get into the details.
 */
export const arrayFlat = (arrayOfArrays) => {
  return arrayOfArrays.reduce((acc, item) => {
    return acc.concat(item)
  }, [])
}
