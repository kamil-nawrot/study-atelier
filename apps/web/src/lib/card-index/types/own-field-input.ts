import type { OwnFieldKind } from './own-field-kind.ts';

export type OwnFieldInput = {
	name: string;
	description: string;
	kind: OwnFieldKind;
	multiple: boolean;
};
