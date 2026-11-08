<script lang="ts">
	import { resolve } from '$app/paths';
	import { Icon, SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName
	} from '#lib/glossary/categories/categories.ts';
	import { matchingTerms } from '#lib/exhibitions/editor/term-search/term-search.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

	type Props = {
		terms: readonly GlossaryTerm[];
		onpick: (term: GlossaryTerm) => void;
		ondrag?: (event: PointerEvent, term: GlossaryTerm) => void;
	};

	let { terms, onpick, ondrag }: Props = $props();

	let query = $state('');

	let shown = $derived(matchingTerms(terms, query));
	let status = $derived.by(() => {
		if (terms.length === 0) return m.exhibitions.panel.noTerms;
		if (query.trim() === '') return m.exhibitions.panel.termsByName;
		return shown.length > 0 ? m.exhibitions.panel.found(shown.length) : m.exhibitions.panel.noTerm;
	});
</script>

{#if terms.length > 0}
	<SearchField
		label={m.exhibitions.panel.searchTerm}
		placeholder={m.exhibitions.panel.searchTermPlaceholder}
		bind:value={query}
	/>
{/if}
<p class="caption">{status}</p>
{#if shown.length > 0}
	<ul class="terms">
		{#each shown as term (term.id)}
			<li>
				<button
					class="term"
					onclick={() => onpick(term)}
					onpointerdown={(event) => ondrag?.(event, term)}
					type="button"
				>
					<span class="category" title={glossaryCategoryName(term.category)}>
						<Icon icon={glossaryCategoryIcon(term.category)} size="sm" />
					</span>
					<span class="name">{term.name}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
<a class="browse" href={resolve('/(app)/atelier/glossary')} rel="external noopener" target="_blank">
	{m.exhibitions.panel.browseGlossary}
</a>

<style>
	.caption {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.terms {
		display: grid;
		margin: 0;
		padding: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	.term {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: 0;
		border: none;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: grab;
	}

	.term:hover .name {
		text-decoration: underline;
	}

	.category {
		display: inline-flex;
		color: var(--color-fg-muted);
	}

	.name {
		overflow: hidden;
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.browse {
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
