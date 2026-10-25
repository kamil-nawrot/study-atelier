<script lang="ts">
	import { TextArea, TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { DefinitionSearch } from '#lib/glossary/definition-search/definition-search.svelte.ts';
	import { DEFINITION_MAX_LENGTH } from '#lib/glossary/glossary/glossary.ts';

	type Props = {
		search: DefinitionSearch;
	};

	let { search }: Props = $props();
</script>

<div class="definition">
	<TextArea
		hint={search.hint}
		label={m.glossary.form.definition}
		maxlength={DEFINITION_MAX_LENGTH}
		placeholder={search.placeholder}
		rows={7}
		bind:value={search.form.definition}
	/>
	{#if search.status === 'failed'}
		<div class="links">
			<TextButton inline onclick={() => search.search(true)}>
				{m.glossary.form.searchAgain}
			</TextButton>
		</div>
	{/if}
	{#if search.searchable}
		<div class="links">
			<TextButton inline onclick={() => search.search(true)}>
				{m.glossary.form.searchDefinition}
			</TextButton>
		</div>
	{/if}
	{#if search.form.source}
		<div class="links">
			<span class="caption">
				{m.common.wikipediaSource}„{search.form.source.title}”, {search.form.source.licence}
			</span>
			<TextButton inline onclick={() => search.openArticles()}>
				{m.glossary.form.pickArticle}
			</TextButton>
			<TextButton inline onclick={() => search.removeSource()}>
				{m.glossary.form.removeSource}
			</TextButton>
		</div>
	{/if}
</div>

<style>
	.definition {
		display: grid;
		gap: var(--spacing-2);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-4);
	}
</style>
