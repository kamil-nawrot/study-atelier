<script lang="ts">
	import { SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { CARD_INDEX_SEARCH_MIN_VALUES } from '#lib/card-index/card-index/card-index.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { ResolvedPathname } from '$app/types';

	type ListedRecord = { id: string; name: string; count?: number; note?: string };

	type Props = {
		records: ListedRecord[];
		empty: string;
		searchLabel: string;
		query?: string;
		href?: (id: string) => ResolvedPathname;
		onchoose?: (id: string) => void;
	};

	let { records, empty, searchLabel, query = $bindable(''), href, onchoose }: Props = $props();

	let term = $derived(normalizeForSearch(query));
	let matching = $derived(
		term ? records.filter((record) => normalizeForSearch(record.name).includes(term)) : records
	);
</script>

{#snippet label(record: ListedRecord)}
	<span class="name">{record.name}</span>
	<span class="count">{record.note ?? record.count}</span>
{/snippet}

{#if records.length === 0}
	<p class="lead">{empty}</p>
{:else}
	{#if records.length >= CARD_INDEX_SEARCH_MIN_VALUES}
		<div class="search">
			<SearchField label={searchLabel} placeholder={searchLabel} bind:value={query} />
		</div>
	{/if}
	{#if matching.length === 0}
		<p class="lead">{m.cardIndex.noResults(query.trim())}</p>
	{/if}
	<ul>
		{#each matching as record (record.id)}
			<li>
				{#if href}
					<a
						class="record"
						aria-label={m.cardIndex.openValue(
							record.name,
							record.note ?? m.atelier.count(record.count ?? 0)
						)}
						href={href(record.id)}
					>
						{@render label(record)}
					</a>
				{:else}
					<button
						class="record"
						aria-label={m.cardIndex.openValue(
							record.name,
							record.note ?? m.atelier.count(record.count ?? 0)
						)}
						onclick={() => onchoose?.(record.id)}
						type="button"
					>
						{@render label(record)}
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.search {
		max-width: var(--size-content-default);
		margin-block-end: var(--spacing-6);
	}

	ul {
		display: grid;
		gap: var(--spacing-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.record {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-decoration: none;
	}

	button.record {
		padding: 0;
		border: 0;
		background: none;
		font-family: inherit;
		text-align: start;
		cursor: pointer;
	}

	.record:hover .name {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
