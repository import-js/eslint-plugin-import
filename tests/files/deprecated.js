// some line comment
/**
 * this function is terrible
 * @deprecated please use 'x' instead.
 * @return null
 */
// another line comment
// with two lines
export function fn() { return null }

/**
 * so terrible
 * @deprecated this is awful, use NotAsBadClass.
 */
export default class TerribleClass {

}

/**
 * this one is fine
 * @return {String} - great!
 */
export function fine() { return "great!" }

export function _undocumented() { return "sneaky!" }
