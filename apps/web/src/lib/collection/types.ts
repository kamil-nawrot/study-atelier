import type { ArtworkTileImage } from '@study-atelier/ui';

export type WallArtwork = {
	id: string;
	number: number;
	title: string;
	authors: string[];
	date?: string;
	image?: ArtworkTileImage;
};

export type AtelierResult = {
	artworks: WallArtwork[];
	error?: string;
};

export type TrashArtwork = WallArtwork & {
	deletedAt: string;
	ownImagePath: string | null;
};

export type TrashResult = {
	artworks: TrashArtwork[];
	error?: string;
};

export type ArtworkTypeCode =
	| 'architecture'
	| 'painting'
	| 'sculpture'
	| 'drawing'
	| 'printmaking'
	| 'applied_arts'
	| 'photography'
	| 'other';

export type CategoryCode = 'author' | 'period' | 'style' | 'material' | 'location';

export type CategoryValues = Record<CategoryCode, string[]>;

export type CategoryValuesResult = {
	values: CategoryValues;
	error?: string;
};

export type ValueSuggestion = {
	kind: 'similar' | 'existing' | 'starting' | 'new';
	name: string;
};

export type ArtworkImageInput =
	| {
			kind: 'commons';
			wikidataId: string;
			file: string;
			licence: string | null;
			licenceUrl: string | null;
			attribution: string | null;
			width: number | null;
			height: number | null;
	  }
	| { kind: 'file'; file: File; previewUrl: string; width: number; height: number }
	| {
			kind: 'upload';
			path: string;
			previewUrl?: string;
			width: number | null;
			height: number | null;
	  }
	| { kind: 'url'; url: string; width: number | null; height: number | null };

export type ArtworkInput = {
	title: string;
	authors: string[];
	authorUnknown: boolean;
	year: number | null;
	beforeCommonEra: boolean;
	yearApproximate: boolean;
	typeCode: ArtworkTypeCode | null;
	periods: string[];
	styles: string[];
	materials: string[];
	location: string | null;
	notes: string;
	image: ArtworkImageInput | null;
};

export type ArtworkRecord = ArtworkInput & {
	id: string;
	number: number;
};

export type ExistingArtwork = {
	id: string;
	image: ArtworkImageInput | null;
};

export type ArtworkFieldErrors = Partial<Record<'title' | 'authors' | 'year', string>>;

export type SaveArtworkResult =
	| { saved: true; id: string; number: number }
	| { saved: false; error?: string; fieldErrors: ArtworkFieldErrors };

export type LoadArtworkResult = {
	artwork?: ArtworkRecord;
	error?: string;
	notFound?: boolean;
};

export type ArtworkFormState = {
	title: string;
	values: CategoryValues;
	queries: Record<CategoryCode, string>;
	authorUnknown: boolean;
	year: string;
	beforeCommonEra: boolean;
	yearApproximate: boolean;
	typeCode: ArtworkTypeCode | '';
	notes: string;
	image: ArtworkImageInput | null;
};
