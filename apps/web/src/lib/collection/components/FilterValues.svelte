<script lang="ts">
	import { SearchField, ToggleTag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { normalizeForSearch } from '../search.ts';
	import type { FilterOption } from '../types.ts';

	type Props = {
		title: string;
		options: FilterOption[];
		chosen: string[];
		name: (value: string) => string;
		onchoose: (value: string) => void;
		searchLabel?: string;
		limit?: number;
	};

	let { title, options, chosen, name, onchoose, searchLabel, limit }: Props = $props();

	let query = $state('');
	let expanded = $state(false);

	let term = $derived(normalizeForSearch(query));
	let matching = $derived(
		term
			? options.filter((option) => normalizeForSearch(name(option.value)).includes(term))
			: options
	);
	let shown = $derived(
		expanded || term || limit === undefined
			? matching
			: matching.filter((option, index) => index < limit || chosen.includes(option.value))
	);
	let hidden = $derived(matching.length - shown.length);
</script>

{#if options.length > 0}
	<section>
		<h3>{title}</h3>
		{#if searchLabel}
			<SearchField label={searchLabel} placeholder={searchLabel} bind:value={query} />
		{/if}
		<ul>
			{#each shown as option (option.value)}
				<li>
					<ToggleTag
						count={option.count}
						onclick={() => onchoose(option.value)}
						pressed={chosen.includes(option.value)}
					>
						{name(option.value)}
					</ToggleTag>
				</li>
			{/each}
		</ul>
		{#if hidden > 0}
			<button class="more" onclick={() => (expanded = true)} type="button">
				{m.atelier.filters.showMore}
			</button>
		{:else if expanded && limit !== undefined && matching.length > limit}
			<button class="more" onclick={() => (expanded = false)} type="button">
				{m.atelier.filters.showLess}
			</button>
		{/if}
	</section>
{/if}

<style>
	section {
		display: grid;
		gap: var(--spacing-3);
	}

	h3 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.more {
		justify-self: start;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: var(--spacing-1);
		cursor: pointer;
	}
</style>
