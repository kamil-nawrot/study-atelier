<script lang="ts">
	import { ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { searchRelatedArtworks } from '#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts';
	import type { ArtworkRelationMatch } from '#lib/artwork-relations/types/artwork-relation-match.ts';
	import type { RelatedArtwork } from '#lib/artwork-relations/types/related-artwork.ts';

	type Props = {
		id?: string;
		artwork: RelatedArtwork | null;
		excluded: ReadonlySet<string>;
		invalid?: boolean;
	};

	const SEARCH_DELAY_MS = 250;
	const SHOWN = 8;

	let { id, artwork = $bindable(), excluded, invalid = false }: Props = $props();

	let query = $state('');
	let found = $state<ArtworkRelationMatch[]>();
	let error = $state<string>();

	let phrase = $derived(query.trim());
	let matches = $derived((found ?? []).filter((match) => !excluded.has(match.id)).slice(0, SHOWN));
	let options = $derived<ValueOption[]>(
		matches.map((match) => ({
			kind: 'found',
			id: match.id,
			name: match.title,
			note: match.authors.join(', ')
		}))
	);
	let hint = $derived(
		error ??
			(phrase !== '' && found !== undefined && matches.length === 0
				? m.artworkRelations.noMatch
				: undefined)
	);

	$effect(() => {
		const text = phrase;
		const leftOut = [...excluded];
		if (text === '') {
			found = undefined;
			error = undefined;
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			const result = await searchRelatedArtworks(text, leftOut, controller.signal);
			if (controller.signal.aborted) return;
			found = result.artworks;
			error = result.error;
		}, SEARCH_DELAY_MS);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	function pick(option: ValueOption): void {
		const match = matches.find((candidate) => candidate.id === option.id);
		if (match) artwork = { id: match.id, number: match.number, title: match.title };
	}

	function values(): string[] {
		return artwork ? [artwork.title] : [];
	}

	function setValues(next: string[]): void {
		if (next.length === 0) artwork = null;
	}
</script>

<ValueField
	{id}
	{hint}
	{invalid}
	label={m.artworkRelations.search}
	labelHidden
	onpick={pick}
	{options}
	placeholder={m.artworkRelations.search}
	single
	bind:query
	bind:values={values, setValues}
/>
