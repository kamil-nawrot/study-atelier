import type { ArtworkTypeCode, WallArtwork } from '#lib/collection/types.ts';
import type { WikipediaArticle } from '#lib/glossary/types.ts';
import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type LaneField = 'periods' | 'styles';

export type Lane = {
	field: LaneField;
	value: string;
};

export type ArtworkLane = {
	key: string;
	name: string;
	colour: string;
	artworks: readonly WallArtwork[];
};

export type TimelineFilter = {
	lanes: Lane[];
	favourites: boolean;
	types: ArtworkTypeCode[];
	authors: string[];
	unknownAuthor: boolean;
};

export type TimelineEvent = {
	id: string;
	name: string;
	yearFrom: number | null;
	yearTo: number;
	yearApproximate: boolean;
	description: string;
	source: WikipediaSource | null;
};

export type TimelineEventDraft = {
	name: string;
	yearFrom: number | null;
	yearTo: number | null;
	yearApproximate: boolean;
	description: string;
	source: WikipediaSource | null;
};

export type EventDates = {
	yearFrom: number | null;
	yearTo: number;
	approximate: boolean;
};

export type EventArticle = WikipediaArticle & {
	dates: EventDates;
};

export type TimelineEventsResult = {
	events: TimelineEvent[];
	error?: string;
};

export type TimelineEventResult = {
	event?: TimelineEvent;
	notFound?: boolean;
	error?: string;
};

export type TimelineEventSaveResult = {
	id?: string;
	error?: string;
};

export type TimelineEventDeleteResult = {
	error?: string;
};
