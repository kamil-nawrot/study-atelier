<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, EmptyState, Icon, ToggleTag } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		categoriesOf,
		glossaryCategoryIcon,
		glossaryCategoryName,
		NO_CATEGORY_ICON
	} from '#lib/glossary/categories/categories.ts';
	import {
		countByCategory,
		filterEntries,
		GLOSSARY_INDEX_MIN_ENTRIES,
		groupByLetter
	} from '#lib/glossary/glossary/glossary.ts';
	import {
		GLOSSARY_SORTS,
		newestFirst,
		rememberedGlossarySort,
		rememberGlossarySort,
		type GlossarySort
	} from '#lib/glossary/glossary-sort/glossary-sort.ts';
	import GlossaryRow from '#lib/glossary/components/GlossaryRow/GlossaryRow.svelte';
	import LetterIndex from '#lib/glossary/components/LetterIndex/LetterIndex.svelte';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
	import type { GlossaryFilter } from '#lib/glossary/types/glossary-filter.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';

	type Props = {
		kind: GlossaryKind;
		entries: GlossaryEntry[];
		query?: string;
		chosen?: GlossaryFilter[];
	};

	let { kind, entries, query = $bindable(''), chosen = $bindable([]) }: Props = $props();

	let categories = $derived(categoriesOf(kind));
	let texts = $derived(kind === 'figure' ? m.glossary.figures : m.glossary);
	let newHref = $derived(
		kind === 'figure'
			? `${resolve('/(app)/atelier/glossary/new')}?kind=figure`
			: resolve('/(app)/atelier/glossary/new')
	);

	let sort = $state<GlossarySort>(rememberedGlossarySort());

	const sorts = GLOSSARY_SORTS.map((value) => ({ value, label: m.glossary.sorts[value] }));

	let counts = $derived(countByCategory(entries));
	let matching = $derived(filterEntries(entries, new Set(chosen), query));
	let recent = $derived(sort === 'recent');
	let groups = $derived(recent ? [] : groupByLetter(matching));
	let newest = $derived(recent ? newestFirst(matching) : []);
	let indexed = $derived(entries.length >= GLOSSARY_INDEX_MIN_ENTRIES && groups.length > 1);

	function toggle(category: GlossaryFilter): void {
		chosen = chosen.includes(category)
			? chosen.filter((item) => item !== category)
			: [...chosen, category];
	}

	function choose(value: string): void {
		sort = value === 'recent' ? 'recent' : 'name';
		rememberGlossarySort(sort);
	}
</script>

{#if entries.length === 0}
	<EmptyState icon={BookA} text={texts.empty} title={texts.emptyTitle}>
		<Button href={newHref}>
			<Icon icon={Plus} />
			{texts.addFirst}
		</Button>
	</EmptyState>
{:else}
	<div class="filter">
		<ListTools
			options={sorts}
			searchLabel={texts.search}
			sortLabel={m.glossary.sortLabel}
			bind:query
			bind:sort={() => sort, choose}
		>
			{#snippet actions()}
				<Button aria-label={texts.add} compact href={newHref} icon={Plus} variant="primary">
					{texts.add}
				</Button>
			{/snippet}
		</ListTools>

		<ul class="categories" aria-label={m.glossary.categories}>
			{#each categories as category (category)}
				<li>
					<ToggleTag
						count={counts[category]}
						disabled={counts[category] === 0 && !chosen.includes(category)}
						onclick={() => toggle(category)}
						pressed={chosen.includes(category)}
					>
						<Icon icon={glossaryCategoryIcon(category)} size="sm" />
						{glossaryCategoryName(category)}
					</ToggleTag>
				</li>
			{/each}
			{#if counts.none > 0 || chosen.includes('none')}
				<li>
					<ToggleTag
						count={counts.none}
						onclick={() => toggle('none')}
						pressed={chosen.includes('none')}
					>
						<Icon icon={NO_CATEGORY_ICON} size="sm" />
						{m.glossary.noCategory}
					</ToggleTag>
				</li>
			{/if}
		</ul>
	</div>

	{#if matching.length === 0}
		<p class="lead">{m.glossary.noResults(query.trim())}</p>
	{/if}

	{#if indexed}
		<LetterIndex letters={groups.map((group) => group.letter)} />
	{/if}

	{#if recent}
		<ul class="newest">
			{#each newest as entry (entry.id)}
				<li><GlossaryRow {entry} /></li>
			{/each}
		</ul>
	{:else}
		<div class="groups" class:indexed>
			{#each groups as group (group.letter)}
				<section class="group" aria-labelledby={`letter-${group.letter}`}>
					<h2 id={`letter-${group.letter}`}>{group.letter}</h2>
					<ul>
						{#each group.entries as entry (entry.id)}
							<li><GlossaryRow {entry} /></li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
{/if}

<style>
	ul {
		margin: 0;
		list-style: none;
	}

	.filter {
		display: grid;
		gap: var(--spacing-4);
		margin-bottom: var(--spacing-6);
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.groups {
		display: grid;
		gap: var(--spacing-12);
	}

	.groups.indexed {
		padding-right: var(--spacing-8);
	}

	.group {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
		scroll-margin-top: calc(var(--bar-height) + var(--spacing-4));
	}

	h2 {
		padding-bottom: var(--spacing-2);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
		color: var(--color-fg-muted);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.newest {
		display: grid;
		padding: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.newest li,
	.group li:not(:last-child) {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	@media (max-width: 767.98px) {
		.filter {
			gap: var(--spacing-3);
		}

		.categories {
			flex-wrap: nowrap;
			overflow-x: auto;
			margin-inline: calc(-1 * var(--page-inline));
			padding-inline: var(--page-inline);
			scrollbar-width: none;
		}

		.categories > li {
			flex: none;
		}

		.groups {
			gap: var(--spacing-6);
		}

		.group {
			gap: var(--spacing-2);
		}

		h2 {
			position: sticky;
			top: var(--bar-height);
			z-index: 1;
			padding-top: var(--spacing-1);
			background: var(--color-bg);
			font-size: var(--font-size-lg);
			line-height: var(--line-height-lg);
		}
	}

	@media (min-width: 768px) {
		.group {
			grid-template-columns: 80px minmax(0, 1fr);
			gap: 0;
		}

		.group + .group {
			padding-top: var(--spacing-12);
			border-top: var(--border-width-hairline) solid var(--color-line);
		}

		h2 {
			position: sticky;
			top: calc(var(--bar-height) + var(--spacing-8));
			align-self: start;
			padding-top: var(--spacing-3);
			padding-bottom: 0;
			border-bottom: none;
		}
	}
</style>
