import type { Rule } from 'eslint';
import type { Node } from 'estree';

type ModuleSystem = 'import' | 'require';
type Visitor = (source: Node, importer: unknown, moduleSystem?: ModuleSystem) => any;

type Options = {
    amd?: boolean;
    commonjs?: boolean;
    esmodule?: boolean;
    requireResolve?: boolean;
    ignore?: string[];
};

declare function moduleVisitor(
    visitor: Visitor,
    options?: Options,
): object;

export default moduleVisitor;

export type Schema = NonNullable<Rule.RuleModule['schema']>;

declare function makeOptionsSchema(additionalProperties?: Partial<Schema>): Schema

declare const optionsSchema: Schema;

export { makeOptionsSchema, optionsSchema };
