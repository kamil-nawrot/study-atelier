<script lang="ts">
	import { MetaLine } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { fieldKindLine } from '#lib/card-index/own-fields/own-fields.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';

	type Props = {
		field: OwnField;
	};

	let { field }: Props = $props();
</script>

<header>
	<div class="title">
		<p class="kind"><MetaLine text={fieldKindLine(field)} /></p>
		<h1>{field.name}</h1>
	</div>
	{#if field.description}
		<p class="description">{field.description}</p>
	{/if}
	<p class="types">
		<span class="label">{m.ownFields.page.appliesTo}</span>
		{#if field.typeCodes.length === 0}
			<span class="badge">{m.ownFields.page.allTypes}</span>
		{:else}
			{#each field.typeCodes as code (code)}
				<span class="badge">{m.artworkTypes[code]}</span>
			{/each}
		{/if}
	</p>
</header>

<style>
	header {
		display: grid;
		gap: var(--spacing-4);
		max-width: var(--size-content-default);
	}

	.title {
		display: grid;
		gap: var(--spacing-2);
	}

	.kind {
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

	.types {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.label {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.badge {
		padding: 0 var(--spacing-2);
		border: var(--border-width-hairline) solid var(--color-line);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: nowrap;
	}
</style>
