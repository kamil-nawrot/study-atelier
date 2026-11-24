import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';

export type ImageSearchQuery =
	| {
			kind: 'artwork';
			title: string;
			authors: string[];
			typeCode?: ArtworkTypeCode | '';
			year?: number | null;
	  }
	| { kind: 'person'; name: string; figure?: boolean; born?: number | null; died?: number | null };
