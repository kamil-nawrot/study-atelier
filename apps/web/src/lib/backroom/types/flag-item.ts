import type { FlagPin } from './flag-pin.ts';

export type FlagItem =
	| { kind: 'artwork'; id: string; title: string; imageId?: string; pin?: FlagPin }
	| { kind: 'term'; id: string; name: string }
	| { kind: 'symbol'; id: string; name: string };
