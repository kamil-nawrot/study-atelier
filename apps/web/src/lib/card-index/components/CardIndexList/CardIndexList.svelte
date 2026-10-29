<script lang="ts">
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { EmptyState } from '@study-atelier/ui';
	import CardIndexTools from '#lib/card-index/components/CardIndexTools/CardIndexTools.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		sortRecords,
		type CardIndexSort,
		type SortableRecord
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { ResolvedPathname } from '$app/types';

	type ListedRecord = SortableRecord & { id: string; note?: string; detail?: string };

	type Props = {
		records: ListedRecord[];
		empty: string;
		searchLabel: string;
		query?: string;
		sorts?: CardIndexSort[];
		sort?: CardIndexSort;
		href?: (id: string) => ResolvedPathname;
		onchoose?: (id: string) => void;
	};

	let {
		records,
		empty,
		searchLabel,
		query = $bindable(''),
		sorts = [],
		sort = $bindable('name'),
		href,
		onchoose
	}: Props = $props();

	let term = $derived(normalizeForSearch(query));
	let matching = $derived(
		sortRecords(
			term ? records.filter((record) => normalizeForSearch(record.name).includes(term)) : records,
			sort
		)
	);
</script>

{#snippet label(record: ListedRecord)}
	<span class="name">{record.name}</span>
	{#if record.detail}
		<span class="detail">{record.detail}</span>
	{/if}
	<span class="count">{record.note ?? record.count}</span>
{/snippet}

{#if records.length === 0}
	<EmptyState icon={ListTree} text={empty} />
{:else}
	<div class="listing">
		<CardIndexTools {searchLabel} {sorts} bind:query bind:sort />
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
	</div>
{/if}

<style>
	.listing {
		display: grid;
		gap: var(--spacing-6);
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

	.detail {
		color: var(--color-fg-muted);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-regular);
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
