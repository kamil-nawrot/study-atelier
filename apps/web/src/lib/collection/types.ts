import type { ArtworkTileImage } from '@study-atelier/ui';

export type WallOrder = 'recent' | 'period';

export type EraCode =
	'prehistory' | 'antiquity' | 'middle_ages' | 'early_modern' | 'modern' | 'contemporary';

export type PeriodGroup = {
	code: EraCode;
	name: string;
	from: number | null;
	to: number | null;
	artworks: WallArtwork[];
};

export type CurrentPeriod = {
	index: number;
	progress: number;
};

export type WallArtwork = {
	id: string;
	number: number;
	title: string;
	authors: string[];
	date?: string;
	year: number | null;
	eraCode: EraCode | null;
	image?: ArtworkTileImage;
	imageUnavailable?: boolean;
	ownImagePath?: string | null;
	imageSignedAt?: number;
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

export type ValueLinks = {
	periodsByEra: Record<EraCode, string[]>;
	stylesByPeriod: Record<string, string[]>;
};

export type ValueLinksResult = {
	links: ValueLinks;
	error?: string;
};

export type ValueSuggestion = {
	kind: 'similar' | 'existing' | 'new';
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
	eraCode: EraCode | null;
	period: string | null;
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
	eraCode: EraCode | null;
	notes: string;
	image: ArtworkImageInput | null;
};
