<script lang="ts">
	import { MetaLine, SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { searchRelatedArtworks } from '#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts';
	import type { ArtworkRelationMatch } from '#lib/artwork-relations/types/artwork-relation-match.ts';
	import type { RelatedArtwork } from '#lib/artwork-relations/types/related-artwork.ts';

	type Props = {
		id?: string;
		excluded: ReadonlySet<string>;
		invalid?: boolean;
		onpick: (artwork: RelatedArtwork) => void;
	};

	const SEARCH_DELAY_MS = 250;
	const SHOWN = 8;

	let { id, excluded, invalid = false, onpick }: Props = $props();

	let query = $state('');
	let found = $state<ArtworkRelationMatch[]>();
	let error = $state<string>();

	let phrase = $derived(query.trim());
	let results = $derived(
		(found ?? []).filter((artwork) => !excluded.has(artwork.id)).slice(0, SHOWN)
	);

	$effect(() => {
		const text = phrase;
		if (text === '') {
			found = undefined;
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			const result = await searchRelatedArtworks(text, controller.signal);
			if (controller.signal.aborted) return;
			found = result.artworks;
			error = result.error;
		}, SEARCH_DELAY_MS);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	function pick(artwork: ArtworkRelationMatch): void {
		onpick({ id: artwork.id, number: artwork.number, title: artwork.title });
	}
</script>

<div class="search">
	<SearchField
		{id}
		aria-invalid={invalid ? true : undefined}
		compact
		label={m.artworkRelations.search}
		placeholder={m.artworkRelations.search}
		bind:value={query}
	/>
	{#if error}
		<p class="caption">{error}</p>
	{:else if found !== undefined && phrase !== ''}
		{#if results.length > 0}
			<ul class="results">
				{#each results as artwork (artwork.id)}
					<li>
						<button class="result" onclick={() => pick(artwork)} type="button">
							<cite class="artwork-title">{artwork.title}</cite>
							<MetaLine class="caption" parts={[artwork.authors.join(', ')]} />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="caption">{m.artworkRelations.noMatch}</p>
		{/if}
	{/if}
</div>

<style>
	.search {
		display: grid;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.results {
		display: grid;
		margin: 0;
		padding: 0;
		border: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	.result {
		display: grid;
		width: 100%;
		padding: var(--spacing-2) var(--spacing-3);
		border: 0;
		background: transparent;
		color: var(--color-fg);
		text-align: start;
		cursor: pointer;
	}

	.result:hover,
	.result:focus-visible {
		background: var(--color-surface);
	}
</style>
