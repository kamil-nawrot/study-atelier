import type { GlossaryEntry } from '#lib/glossary/types.ts';
import type { ArtworkTileImage, NoteLinks } from '@study-atelier/ui';
import type { Mention } from './mentions.ts';
import type { ValueSummaries } from './value-summaries.ts';

export type WallOrder = 'recent' | 'year' | 'author';

export type WallGrouping = 'none' | 'era' | 'period' | 'style';

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

export type WallSection = {
	key: string;
	level: number;
	code: EraCode | null;
	name: string;
	artworks: WallArtwork[];
	sections: WallSection[];
};

export type CurrentPeriod = {
	index: number;
	distance: number;
};

export type ArtworkValueRow = {
	position: number;
	category_values: {
		category_code: string;
		name: string;
		author_details?: { sort_name: string | null }[];
	} | null;
};

export type FieldEntryRow = { field_id: string; text_value: string | null };

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
	authorSortNames?: (string | null)[];
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
	favourite: boolean;
	own?: OwnEntries;
	image?: ArtworkTileImage;
	imageUnavailable?: boolean;
	pendingImage?: PendingImage;
	ownImagePath?: string | null;
	imageSignedAt?: number;
};

export type AtelierResult = {
	artworks: WallArtwork[];
	ownFields?: OwnFieldDefinition[];
	error?: string;
};

export type TrashArtwork = WallArtwork & {
	deletedAt: string;
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
	ownValues: Record<string, string[]>;
	error?: string;
};

export type PlaceStarter = {
	museums: StarterValue[];
	notes: Record<string, string>;
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
	kind: 'similar' | 'existing' | 'starter' | 'new';
	name: string;
	note?: string;
};

export type StarterValue = {
	name: string;
	aliases: readonly string[];
	note: string;
};

type ImageSource =
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

export type ArtworkImageInput = ImageSource & { id?: string };

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
	images: ArtworkImageInput[];
	own?: OwnEntries;
};

export type ArtworkRecord = ArtworkInput & {
	id: string;
	number: number;
	favourite: boolean;
};

export type ExistingArtwork = {
	id: string;
	image: ArtworkImageInput | null;
	images: ArtworkImageInput[];
};

export type ArtworkFieldErrors = Partial<
	Record<'title' | 'authors' | 'yearFrom' | 'yearTo', string>
>;

export type SaveArtworkResult =
	| { saved: true; id: string; number: number }
	| { saved: false; error?: string; fieldErrors: ArtworkFieldErrors };

export type LoadArtworkResult = {
	artwork?: ArtworkRecord;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	summaries?: ValueSummaries;
	ownFields?: OwnFieldDefinition[];
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
	images: (ArtworkImageInput | null)[];
	own?: OwnEntries;
	ownQueries: Record<string, string>;
};

export type CardIndexRecord = {
	id: string;
	category: CategoryCode;
	name: string;
	count: number;
	sortName?: string;
};

export type CardIndexData = {
	values: CardIndexRecord[];
	periodEras: { periodId: string; eraCode: EraCode; count: number }[];
	stylePeriods: { styleId: string; periodId: string; count: number }[];
};

export type CardIndexResult = {
	index: CardIndexData;
	ownValues: OwnValue[];
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
	| 'missing'
	| 'favourites';

export type CollectionFilter = {
	favourites: boolean;
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
	own: Record<string, string[]>;
	ownTexts: Record<string, string>;
	ticked: string[];
};

export type OwnFilterKind = 'own' | 'ownText' | 'ticked';

export type FilterTag = {
	id: string;
	field: FilterField | OwnFilterKind;
	value: string;
	fieldId?: string;
	parts?: TagParts;
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

export type ValueKind = 'era' | CategoryCode;

export type ValueSubject =
	{ kind: 'era'; code: EraCode } | { kind: CategoryCode; record: CardIndexRecord };

export type AuthorDetails = {
	image: ArtworkImageInput | null;
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	sortName: string | null;
};

export type PlaceType = 'museum' | 'gallery' | 'private_collection' | 'on_site';

export type LocationDetails = {
	countryCode: string | null;
	placeType: PlaceType | null;
};

export type ValueDetails = {
	summary: string;
	notes: string;
	author?: AuthorDetails;
	location?: LocationDetails;
};

export type AuthorFormState = {
	image: ArtworkImageInput | null;
	birthYear: string;
	birthBeforeCommonEra: boolean;
	deathYear: string;
	deathBeforeCommonEra: boolean;
	yearsApproximate: boolean;
	sortByOther: boolean;
	sortName: string;
};

export type AuthorFieldErrors = Partial<Record<'birthYear' | 'deathYear', string>>;

export type ValueDetailsResult = {
	details: ValueDetails;
	error?: string;
};

export type ValuePageResult = {
	subject?: ValueSubject;
	index: CardIndexData;
	artworks: WallArtwork[];
	details: ValueDetails;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	notFound?: boolean;
	error?: string;
};

export type ImageFieldTexts = {
	label: string;
	find: string;
	findOther: string;
	findHint: string;
	own: string;
	changeOwn: string;
	ownTitle: string;
	changeOwnTitle: string;
	remove: string;
};

export type OwnFieldKind = 'text' | 'list' | 'flag';

export type OwnValue = {
	id: string;
	fieldId: string;
	name: string;
	count: number;
};

export type OwnFieldDefinition = {
	id: string;
	name: string;
	description: string | null;
	kind: OwnFieldKind;
	multiple: boolean;
};

export type OwnField = OwnFieldDefinition & {
	count: number;
	values: OwnValue[];
};

export type OwnEntry = string | string[] | boolean;

export type OwnEntries = Record<string, OwnEntry>;

export type OwnFieldDefinitionsResult = {
	fields: OwnFieldDefinition[];
	error?: string;
};

export type OwnFieldInput = {
	name: string;
	description: string;
	kind: OwnFieldKind;
	multiple: boolean;
};

export type OwnFieldsResult = {
	fields: OwnField[];
	error?: string;
};

export type OwnValueChange =
	| { kind: 'unchanged' }
	| { kind: 'empty' }
	| { kind: 'rename'; name: string }
	| { kind: 'merge'; target: OwnValue };
