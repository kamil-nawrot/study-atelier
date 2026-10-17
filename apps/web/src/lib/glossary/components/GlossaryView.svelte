<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { glossaryCategoryIcon, glossaryCategoryName } from '../categories.ts';
	import type { GlossaryEntry } from '../types.ts';
	import { WIKIPEDIA_LICENCE_URL } from '../wikipedia.ts';

	type Props = {
		entry: GlossaryEntry;
	};

	let { entry }: Props = $props();
</script>

<article>
	<header>
		<p class="kind">
			<Icon icon={glossaryCategoryIcon(entry.category)} size="sm" />
			{glossaryCategoryName(entry.category)}
		</p>
		<h1>{entry.name}</h1>
		{#if entry.forms.length > 0}
			<p class="caption">{m.glossary.view.also(entry.forms.join(', '))}</p>
		{/if}
	</header>

	{#if entry.definition}
		<blockquote>
			<p class="definition">{entry.definition}</p>
			{#if entry.source}
				<p class="caption">
					{m.glossary.view.sourcePrefix}<a
						href={entry.source.url}
						rel="external noreferrer"
						target="_blank">„{entry.source.title}”</a
					>,
					<a href={WIKIPEDIA_LICENCE_URL} rel="external noreferrer" target="_blank"
						>{entry.source.licence}</a
					>
				</p>
			{/if}
		</blockquote>
	{:else}
		<p class="empty">{m.glossary.view.noDefinition}</p>
	{/if}
</article>

<style>
	article,
	header {
		display: grid;
		gap: var(--spacing-2);
	}

	article {
		gap: var(--spacing-8);
		max-width: var(--size-content-default);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	blockquote {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding-left: var(--spacing-4);
		border-left: var(--border-width-button) solid var(--color-fg-muted);
	}

	.definition {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
		white-space: pre-line;
	}

	blockquote a {
		color: inherit;
		text-underline-offset: 0.2em;
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
