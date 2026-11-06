<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LucideIcon } from '@lucide/svelte';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { EmptyState, Icon } from '@study-atelier/ui';
	import CardIndexTools from '#lib/card-index/components/CardIndexTools/CardIndexTools.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		sortRecords,
		type CardIndexSort,
		type SortableRecord
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { ResolvedPathname } from '$app/types';

	type ListedRecord = SortableRecord & {
		id: string;
		note?: string;
		detail?: string;
		icon?: LucideIcon;
		iconLabel?: string;
	};

	type Props = {
		records: ListedRecord[];
		empty: string;
		searchLabel: string;
		query?: string;
		sorts?: CardIndexSort[];
		sort?: CardIndexSort;
		href?: (id: string) => ResolvedPathname;
		onchoose?: (id: string) => void;
		actions?: Snippet;
	};

	let {
		records,
		empty,
		searchLabel,
		query = $bindable(''),
		sorts = [],
		sort = $bindable('name'),
		href,
		onchoose,
		actions
	}: Props = $props();

	let term = $derived(normalizeForSearch(query));
	let sorted = $derived(sortRecords(records, sort));
	let matching = $derived(
		term ? sorted.filter((record) => normalizeForSearch(record.name).includes(term)) : sorted
	);
</script>

{#snippet label(record: ListedRecord)}
	<span class="main">
		<span class="name">{record.name}</span>
		{#if record.icon}
			<span class="icon" title={record.iconLabel}>
				<Icon icon={record.icon} size="sm" />
			</span>
		{/if}
		{#if record.detail}
			<span class="detail">{record.detail}</span>
		{/if}
	</span>
	<span class="count">{record.note ?? m.atelier.count(record.count ?? 0)}</span>
{/snippet}

{#if records.length === 0}
	{#if actions}
		<div class="solo">{@render actions()}</div>
	{/if}
	<EmptyState icon={ListTree} text={empty} />
{:else}
	<div class="listing">
		<CardIndexTools {actions} {searchLabel} {sorts} bind:query bind:sort />
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
	.solo {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
	}

	.listing {
		display: grid;
		gap: var(--spacing-6);
	}

	ul {
		display: grid;
		margin: 0;
		padding: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	li {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
		width: 100%;
		padding: var(--spacing-4) var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-decoration: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.record {
			transition: background var(--duration-short) ease-out;
		}
	}

	.record:hover {
		background: var(--color-tag);
	}

	.main {
		min-width: 0;
	}

	.icon {
		display: inline-flex;
		color: var(--color-fg-muted);
		vertical-align: middle;
	}

	button.record {
		border: 0;
		background: none;
		font-family: inherit;
		text-align: start;
		cursor: pointer;
	}

	.detail {
		color: var(--color-fg-muted);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-regular);
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
