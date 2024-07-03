import { Rule, Scope } from 'eslint';

declare function declaredScope(
    context: Rule.RuleContext,
    name: string
): Scope.Scope['type'] | undefined;

export default declaredScope;
