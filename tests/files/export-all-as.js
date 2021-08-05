import { foo } from './sibling-with-names' // ensure importing exported name doesn't block
export * as foo from './sibling-with-names'
