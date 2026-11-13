<script lang="ts">
	import { SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { RelatedAuthor } from '#lib/author-relations/types/related-author.ts';

	type Props = {
		id?: string;
		authors: readonly RelatedAuthor[];
		excluded: ReadonlySet<string>;
		invalid?: boolean;
		onpick: (author: RelatedAuthor) => void;
	};

	const SHOWN = 8;

	let { id, authors, excluded, invalid = false, onpick }: Props = $props();

	let query = $state('');

	let phrase = $derived(normalizeForSearch(query));
	let results = $derived(
		phrase === ''
			? []
			: authors
					.filter(
						(author) => !excluded.has(author.id) && normalizeForSearch(author.name).includes(phrase)
					)
					.slice(0, SHOWN)
	);
</script>

<div class="search">
	<SearchField
		{id}
		aria-invalid={invalid ? true : undefined}
		compact
		label={m.authorRelations.search}
		placeholder={m.authorRelations.search}
		bind:value={query}
	/>
	{#if phrase !== ''}
		{#if results.length > 0}
			<ul class="results">
				{#each results as author (author.id)}
					<li>
						<button
							class="result"
							onclick={() => onpick({ id: author.id, name: author.name })}
							type="button"
						>
							{author.name}
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="caption">{m.authorRelations.noMatch}</p>
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
