<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName
	} from '#lib/glossary/categories/categories.ts';
	import { loadTermDefinition } from '#lib/glossary/glossary-data/glossary-data.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { TermDefinitionResult } from '#lib/glossary/types/term-definition-result.ts';

	type Props = {
		term: GlossaryTerm;
		linked?: boolean;
	};

	let { term, linked = false }: Props = $props();

	let loaded = $state<{ id: string; result: TermDefinitionResult }>();

	const result = $derived(loaded?.id === term.id ? loaded.result : undefined);

	$effect(() => {
		const id = term.id;
		if (!term.hasDefinition) return;
		let current = true;
		void loadTermDefinition(id).then((answer) => {
			if (current) loaded = { id, result: answer };
		});
		return () => {
			current = false;
		};
	});
</script>

<span class="kind">
	<Icon icon={glossaryCategoryIcon(term.category)} size="sm" />
	{glossaryCategoryName(term.category)}
</span>
<span class="name">{term.name}</span>
{#if term.hasDefinition}
	{#if !result}
		<span class="message loading">{m.glossary.card.loading}</span>
	{:else if result.notFound}
		<span class="message">{m.glossary.card.deleted}</span>
	{:else if result.error}
		<span class="message">{m.glossary.card.failed}</span>
	{:else}
		{#if result.definition}
			<span class="definition">{result.definition}</span>
		{/if}
		{#if result.source}
			<span class="source">{m.glossary.card.source}</span>
		{/if}
	{/if}
{/if}
{#if linked && !result?.notFound}
	<a class="open" href={resolve('/(app)/atelier/glossary/[id]', { id: term.id })}>
		{m.glossary.card.open}
		<Icon icon={ArrowRight} size="sm" />
	</a>
{/if}

<style>
	.kind {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.definition {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: pre-line;
	}

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.loading {
		min-height: calc(var(--line-height-sm) * 3em);
	}

	.source {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
		padding-top: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-line);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	.open:hover {
		text-decoration: underline;
	}
</style>
