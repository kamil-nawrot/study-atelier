import type { PlannedScope } from './planned-scope.ts';
import type { ScopeChoice } from './scope-choice.ts';

export type ReviewPlan = {
	scopes: PlannedScope[];
	free: ScopeChoice[];
	tomorrow: number;
};
