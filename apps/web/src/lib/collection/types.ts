import type { GlossaryEntry } from '#lib/glossary/types.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { Pin } from '#lib/pins/types.ts';
import type { Preferences } from '#lib/profile/types.ts';
import type { Mention } from './mentions.ts';
import type { ValueSummaries } from './value-summaries.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { OwnEntries } from '#lib/catalogue/types/own-entries.ts';
import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type WallOrder = 'recent' | 'year' | 'author';

export type WallGrouping = 'none' | 'era' | 'period' | 'style';

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
	pins?: Pin[];
	pinsError?: string;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	summaries?: ValueSummaries;
	ownFields?: OwnFieldDefinition[];
	preferences?: Preferences;
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
