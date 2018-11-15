var a = 1
var b = 2

export {a, b}

var c = 3
export {c as d}

export class ExportedClass {

}


// destructuring exports

export var { destructuredProp } = {}
         , { destructingAssign = null } = {}
         , { destructingAssign: destructingRenamedAssign = null } = {}
         , [ arrayKeyProp ] = []
         , [ { deepProp } ] = []
         , { arr: [ ,, deepSparseElement ] } = {}
