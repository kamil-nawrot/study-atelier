import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { OwnFieldKind } from './own-field-kind.ts';

export type OwnFieldDefinition = {
	id: string;
	name: string;
	description: string | null;
	kind: OwnFieldKind;
	multiple: boolean;
	typeCodes: ArtworkTypeCode[];
};
