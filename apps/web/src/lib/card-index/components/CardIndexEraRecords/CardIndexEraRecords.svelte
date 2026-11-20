<script generics="T extends ListedRecord" lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { EmptyState, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import CardIndexEra from '#lib/card-index/components/CardIndexEra/CardIndexEra.svelte';
	import CardIndexTools from '#lib/card-index/components/CardIndexTools/CardIndexTools.svelte';
	import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import {
		sortRecords,
		type CardIndexSort
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import type { EraGroup } from '#lib/card-index/era-groups/era-groups.ts';
	import type { ListedRecord } from '#lib/card-index/types/listed-record.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { ResolvedPathname } from '$app/types';

	type Props = {
		eras: EraGroup<T>[];
		outside?: { title: string; records: T[] };
		empty: string;
		eraEmpty: string;
		searchLabel: string;
		foldingKey: string;
		href: (id: string) => ResolvedPathname;
		query?: string;
		sorts?: CardIndexSort[];
		sort?: CardIndexSort;
		actions?: Snippet;
	};

	let {
		eras,
		outside,
		empty,
		eraEmpty,
		searchLabel,
		foldingKey,
		href,
		query = $bindable(''),
		sorts = [],
		sort = $bindable('name'),
		actions
	}: Props = $props();

	let term = $derived(normalizeForSearch(query));
	function narrow(records: T[]): T[] {
		return sortRecords(
			term ? records.filter((record) => normalizeForSearch(record.name).includes(term)) : records,
			sort
		);
	}
	let shownEras = $derived(
		(sort === 'newest' ? [...eras].reverse() : eras)
			.map((era) => {
				const named = term !== '' && normalizeForSearch(m.eras[era.code].name).includes(term);
				return {
					code: era.code,
					records: named ? sortRecords(era.records, sort) : narrow(era.records),
					named
				};
			})
			.filter((era) => !term || era.named || era.records.length > 0)
	);
	let shownOutside = $derived(outside ? narrow(outside.records) : []);
	let isEmpty = $derived(
		eras.every((era) => era.records.length === 0) && (outside?.records.length ?? 0) === 0
	);
	let hasEras = $derived(shownEras.some((era) => era.records.length > 0));
	let noResults = $derived(
		term !== '' && shownEras.every((era) => era.records.length === 0) && shownOutside.length === 0
	);

	const folding = new TimelineFolding(
		() => ({ query, matched: [], periods: [] }),
		untrack(() => ({ folded: foldingKey, open: `${foldingKey}-open` }))
	);
</script>

{#snippet rows(records: T[])}
	<ul class="records">
		{#each records as record (record.id)}
			{@const note = record.note ?? m.atelier.count(record.count ?? 0)}
			<li>
				<a
					class="record"
					aria-label={m.cardIndex.openValue(record.name, note)}
					href={href(record.id)}
				>
					<span class="main">
						<span class="name">{record.name}</span>
						{#if record.icon}
							<span class="icon" title={record.iconLabel}>
								<Icon icon={record.icon} size="sm" />
							</span>
						{/if}
					</span>
					<span class="count">{note}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#if isEmpty}
	{#if actions}
		<div class="solo">{@render actions()}</div>
	{/if}
	<EmptyState icon={ListTree} text={empty} />
{:else}
	<div class="grouped">
		<CardIndexTools {actions} {searchLabel} {sorts} bind:query bind:sort />
		{#if noResults}
			<p class="lead">{m.cardIndex.noResults(query.trim())}</p>
		{/if}
		{#if hasEras}
			<ol class="eras">
				{#each shownEras as era (era.code)}
					<CardIndexEra code={era.code} empty={eraEmpty} filled={era.records.length > 0} {folding}>
						{@render rows(era.records)}
					</CardIndexEra>
				{/each}
			</ol>
		{/if}
		{#if outside && shownOutside.length > 0}
			<section class={['outside', { divided: hasEras }]}>
				<h2 class="group-title">{outside.title}</h2>
				{@render rows(shownOutside)}
			</section>
		{/if}
	</div>
{/if}

<style>
	.solo {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
	}

	.grouped {
		display: grid;
		gap: var(--spacing-6);
	}

	.eras {
		position: relative;
		display: grid;
		gap: var(--spacing-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.eras::before {
		content: '';
		position: absolute;
		top: var(--spacing-6);
		bottom: var(--spacing-6);
		left: var(--spacing-6);
		border-left: var(--border-width-hairline) solid var(--color-line);
	}

	.outside {
		display: grid;
		gap: var(--spacing-2);
	}

	.outside.divided {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.group-title {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		font-variant-caps: all-small-caps;
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-sm);
	}

	.records {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.records > li {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.records > li:last-child {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
		padding: var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
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
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-3);
		min-width: 0;
	}

	.name {
		min-width: 0;
	}

	.icon {
		align-self: center;
		display: inline-flex;
		color: var(--color-fg-muted);
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
