import type { OwnValue } from './own-value.ts';
import type { OwnFieldDefinition } from './own-field-definition.ts';

export type OwnField = OwnFieldDefinition & {
	count: number;
	values: OwnValue[];
};
