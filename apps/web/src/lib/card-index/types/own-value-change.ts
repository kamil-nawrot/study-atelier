import type { OwnValue } from './own-value.ts';

export type OwnValueChange =
	| { kind: 'unchanged' }
	| { kind: 'empty' }
	| { kind: 'rename'; name: string }
	| { kind: 'merge'; target: OwnValue };
