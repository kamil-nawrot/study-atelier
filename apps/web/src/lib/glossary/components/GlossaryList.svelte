<script lang="ts">
	import { Icon, SearchField, ToggleTag } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName,
		GLOSSARY_CATEGORIES
	} from '../categories.ts';
	import {
		countByCategory,
		filterEntries,
		firstSentence,
		GLOSSARY_SEARCH_MIN_ENTRIES,
		groupByLetter
	} from '../glossary.ts';
	import type { GlossaryCategory, GlossaryEntry } from '../types.ts';

	type Props = {
		entries: GlossaryEntry[];
	};

	let { entries }: Props = $props();

	let chosen = $state<GlossaryCategory[]>([]);
	let query = $state('');

	let counts = $derived(countByCategory(entries));
	let matching = $derived(filterEntries(entries, new Set(chosen), query));
	let groups = $derived(groupByLetter(matching));

	function toggle(category: GlossaryCategory): void {
		chosen = chosen.includes(category)
			? chosen.filter((item) => item !== category)
			: [...chosen, category];
	}
</script>

{#if entries.length === 0}
	<p class="lead">{m.glossary.empty}</p>
{:else}
	<ul class="categories" aria-label={m.glossary.categories}>
		{#each GLOSSARY_CATEGORIES as category (category)}
			<li>
				<ToggleTag
					count={counts[category]}
					disabled={counts[category] === 0 && !chosen.includes(category)}
					onclick={() => toggle(category)}
					pressed={chosen.includes(category)}
				>
					<span class="tag">
						<Icon icon={glossaryCategoryIcon(category)} size="sm" />
						{glossaryCategoryName(category)}
					</span>
				</ToggleTag>
			</li>
		{/each}
	</ul>

	{#if entries.length >= GLOSSARY_SEARCH_MIN_ENTRIES}
		<div class="search">
			<SearchField label={m.glossary.search} placeholder={m.glossary.search} bind:value={query} />
		</div>
	{/if}

	{#if matching.length === 0}
		<p class="lead">{m.glossary.noResults(query.trim())}</p>
	{/if}

	<div class="groups">
		{#each groups as group (group.letter)}
			<section class="group" aria-labelledby={`letter-${group.letter}`}>
				<h2 id={`letter-${group.letter}`}>{group.letter}</h2>
				<ul>
					{#each group.entries as entry (entry.id)}
						<li>
							<a href={resolve('/(app)/atelier/glossary/[id]', { id: entry.id })}>
								<span class="head">
									<span class="name">{entry.name}</span>
									<span class="category">
										<Icon icon={glossaryCategoryIcon(entry.category)} size="sm" />
										{glossaryCategoryName(entry.category)}
									</span>
								</span>
								{#if entry.definition}
									<span class="sentence">{firstSentence(entry.definition)}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	.search,
	.groups {
		max-width: var(--size-content-default);
	}

	.groups {
		display: grid;
		gap: var(--spacing-8);
	}

	.group {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
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

	.group ul {
		display: grid;
		gap: var(--spacing-6);
	}

	a {
		display: grid;
		gap: var(--spacing-1);
		color: var(--color-fg);
		text-decoration: none;
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-3);
	}

	.name {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	a:hover .name {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.category {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.sentence {
		display: -webkit-box;
		overflow: hidden;
		color: var(--color-fg-muted);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	@media (min-width: 768px) {
		.group {
			grid-template-columns: 80px minmax(0, 1fr);
			gap: 0;
		}

		h2 {
			padding-bottom: 0;
			border-bottom: none;
		}
	}
</style>
