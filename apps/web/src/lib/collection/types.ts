import type { ArtworkTileImage } from '@study-atelier/ui';

export type WallOrder = 'recent' | 'period' | 'author';

export type EraCode =
	'prehistory' | 'antiquity' | 'middle_ages' | 'early_modern' | 'modern' | 'contemporary';

export type PeriodGroup = {
	key: string;
	code: EraCode | null;
	name: string;
	from: number | null;
	to: number | null;
	artworks: WallArtwork[];
};

export type CurrentPeriod = {
	index: number;
	progress: number;
};

export type ArtworkValueRow = {
	position: number;
	category_values: { category_code: string; name: string } | null;
};

export type ImageSize = {
	width: number;
	height: number;
};

export type PendingImage = {
	sourceFile?: string;
	ownPath?: string;
	size?: ImageSize;
};

export type WallArtwork = {
	id: string;
	number: number;
	title: string;
	authors: string[];
	date?: string;
	yearFrom: number | null;
	yearTo: number | null;
	eraCode: EraCode | null;
	typeCode: ArtworkTypeCode | null;
	period: string | null;
	styles: string[];
	materials: string[];
	location: string | null;
	hasImage: boolean;
	image?: ArtworkTileImage;
	imageUnavailable?: boolean;
	pendingImage?: PendingImage;
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
	yearFrom: number | null;
	fromBeforeCommonEra: boolean;
	yearTo: number | null;
	toBeforeCommonEra: boolean;
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

export type ArtworkFieldErrors = Partial<
	Record<'title' | 'authors' | 'yearFrom' | 'yearTo', string>
>;

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
	spanMode: boolean;
	yearFrom: string;
	fromBeforeCommonEra: boolean;
	yearTo: string;
	toBeforeCommonEra: boolean;
	yearApproximate: boolean;
	typeCode: ArtworkTypeCode | '';
	eraCode: EraCode | null;
	notes: string;
	image: ArtworkImageInput | null;
};

export type CardIndexRecord = {
	id: string;
	category: CategoryCode;
	name: string;
	count: number;
};

export type CardIndexData = {
	values: CardIndexRecord[];
	periodEras: { periodId: string; eraCode: EraCode; count: number }[];
	stylePeriods: { styleId: string; periodId: string; count: number }[];
};

export type CardIndexResult = {
	index: CardIndexData;
	error?: string;
};

export type CardIndexEntry = {
	id: string;
	name: string;
	count: number;
};

export type CardIndexPeriod = CardIndexEntry & {
	styles: CardIndexEntry[];
};

export type CardIndexEra = {
	code: EraCode;
	periods: CardIndexPeriod[];
};

export type CardIndexTimeline = {
	eras: CardIndexEra[];
	periodsWithoutEra: CardIndexPeriod[];
	stylesWithoutPeriod: CardIndexEntry[];
};

export type NameChange =
	| { kind: 'unchanged' }
	| { kind: 'empty' }
	| { kind: 'rename'; name: string }
	| { kind: 'merge'; target: CardIndexRecord };

export type EraMove = {
	count: number;
	removed: EraCode[];
	remaining: EraCode[];
};

export type MissingData = 'image' | 'year' | 'era' | 'period' | 'type';

export type FilterField =
	| 'eras'
	| 'types'
	| 'years'
	| 'authors'
	| 'periods'
	| 'styles'
	| 'materials'
	| 'locations'
	| 'missing';

export type CollectionFilter = {
	eras: EraCode[];
	types: ArtworkTypeCode[];
	yearFrom: number | null;
	yearTo: number | null;
	authors: string[];
	unknownAuthor: boolean;
	periods: string[];
	styles: string[];
	materials: string[];
	locations: string[];
	missing: MissingData[];
};

export type FilterTag = {
	id: string;
	field: FilterField;
	value: string;
};

export type TagParts = {
	field: string;
	value: string;
};

export type FilterOption = {
	value: string;
	count: number;
};

export type FlipDirection = 'previous' | 'next';

export type WallSequence = {
	query: string;
	numbers: number[];
};

export type Neighbours = Record<FlipDirection, number | null>;
