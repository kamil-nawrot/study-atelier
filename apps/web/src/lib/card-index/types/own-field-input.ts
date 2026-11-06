import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { OwnFieldKind } from './own-field-kind.ts';

export type OwnFieldInput = {
	name: string;
	description: string;
	kind: OwnFieldKind;
	multiple: boolean;
	limited: boolean;
	typeCodes: ArtworkTypeCode[];
};
