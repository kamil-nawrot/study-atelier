import type { Snippet } from 'svelte';
import type { FormSuggestions } from '#lib/artworks/form-suggestions/form-suggestions.svelte.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import type { AlbumLink } from './album-link.ts';
import type { ArtworkInput } from './artwork-input.ts';
import type { ArtworkRecord } from './artwork-record.ts';

export type ArtworkFormProps = {
	artwork?: ArtworkRecord;
	prefill?: ArtworkInput;
	album?: AlbumLink;
	newValues?: CategoryValues;
	secondary?: Snippet;
	saveAndNext?: boolean;
	suggestions: FormSuggestions;
	ownFields?: OwnFieldDefinition[];
	pins?: Pin[];
	pinsError?: string;
	cancelHref: string;
	oncancel?: (event: MouseEvent) => void;
	onsaved: (number: number, next: boolean) => void | Promise<void>;
	labels?: { save: string; cancel: string };
};
