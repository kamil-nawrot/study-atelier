<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import BookA from '@lucide/svelte/icons/book-a';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, EmptyState, Icon, SearchField, Select, ToggleTag } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName,
		GLOSSARY_CATEGORIES
	} from '#lib/glossary/categories/categories.ts';
	import {
		countByCategory,
		filterEntries,
		GLOSSARY_SEARCH_MIN_ENTRIES,
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
	import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

	type Props = {
		entries: GlossaryEntry[];
		query?: string;
		chosen?: GlossaryCategory[];
	};

	let { entries, query = $bindable(''), chosen = $bindable([]) }: Props = $props();

	let sort = $state<GlossarySort>(rememberedGlossarySort());

	const sorts = GLOSSARY_SORTS.map((value) => ({ value, label: m.glossary.sorts[value] }));

	let counts = $derived(countByCategory(entries));
	let matching = $derived(filterEntries(entries, new Set(chosen), query));
	let recent = $derived(sort === 'recent');
	let groups = $derived(recent ? [] : groupByLetter(matching));
	let newest = $derived(recent ? newestFirst(matching) : []);
	let indexed = $derived(entries.length >= GLOSSARY_SEARCH_MIN_ENTRIES && groups.length > 1);

	function toggle(category: GlossaryCategory): void {
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
	<EmptyState icon={BookA} text={m.glossary.empty} title={m.glossary.emptyTitle}>
		<Button href={resolve('/(app)/atelier/glossary/new')}>
			<Icon icon={Plus} />
			{m.glossary.addFirst}
		</Button>
	</EmptyState>
{:else}
	<div class="filter">
		{#if entries.length > 1}
			<div class="tools">
				{#if entries.length >= GLOSSARY_SEARCH_MIN_ENTRIES}
					<SearchField
						compact
						label={m.glossary.search}
						placeholder={m.glossary.search}
						bind:value={query}
					/>
				{/if}
				<Select
					compact
					hideLabel
					icon={ArrowUpDown}
					iconOnPhone
					label={m.glossary.sortLabel}
					options={sorts}
					bind:value={() => sort, choose}
				/>
			</div>
		{/if}

		<ul class="categories" aria-label={m.glossary.categories}>
			{#each GLOSSARY_CATEGORIES as category (category)}
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
		margin: var(--spacing-4) 0;
		padding-bottom: var(--spacing-6);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.tools {
		display: grid;
		gap: var(--spacing-4);
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

	.group ul,
	.newest {
		display: grid;
		gap: var(--spacing-2);
		max-width: var(--size-content-default);
	}

	@media (max-width: 767.98px) {
		.filter {
			gap: var(--spacing-3);
			margin-top: 0;
			padding-bottom: var(--spacing-4);
		}

		.tools {
			grid-template-columns: minmax(0, 1fr) auto;
			gap: var(--spacing-2);
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
		.tools {
			grid-template-columns: minmax(0, var(--size-content-default)) auto;
			justify-content: start;
		}

		.group {
			grid-template-columns: 80px minmax(0, 1fr);
			gap: 0;
		}

		.group ul {
			max-width: calc(var(--size-content-default) - 80px);
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
