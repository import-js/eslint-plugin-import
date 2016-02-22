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
 * some flux action type maybe
 * @deprecated please stop sending/handling this action type.
 * @type {String}
 */
export const MY_TERRIBLE_ACTION = "ugh"

/**
 * this one is fine
 * @return {String} - great!
 */
export function fine() { return "great!" }

export function _undocumented() { return "sneaky!" }
