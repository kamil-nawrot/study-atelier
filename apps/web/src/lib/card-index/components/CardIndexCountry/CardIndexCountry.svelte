<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import CardIndexPlaceGroups from '#lib/card-index/components/CardIndexPlaceGroups/CardIndexPlaceGroups.svelte';
	import type { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import type { CardIndexCountry } from '#lib/card-index/types/card-index-country.ts';

	type Props = {
		country: CardIndexCountry;
		folding: TimelineFolding;
	};

	let { country, folding }: Props = $props();

	const uid = $props.id();
	let open = $derived(folding.isEraOpen(country.code));
</script>

<li class="country">
	<div class="head">
		<h2 id="{uid}-name" class="name">{country.name}</h2>
		<span class="count">{m.atelier.count(country.count)}</span>
		<button
			class="chevron"
			aria-controls="{uid}-groups"
			aria-expanded={open}
			aria-labelledby="{uid}-name"
			onclick={() => folding.toggleEra(country.code)}
			type="button"
		>
			<Icon icon={ChevronRight} size="sm" />
		</button>
	</div>
	{#if open}
		<div id="{uid}-groups">
			<CardIndexPlaceGroups {folding} groups={country.groups} />
		</div>
	{/if}
</li>

<style>
	.country {
		display: grid;
		align-content: start;
		min-width: 0;
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		min-height: var(--spacing-12);
	}

	.name {
		min-width: 0;
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.count {
		margin-inline-start: auto;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.chevron {
		display: grid;
		place-items: center;
		padding: var(--spacing-2) var(--spacing-3);
		border: none;
		background: none;
		color: var(--color-fg);
		cursor: pointer;
	}

	.chevron:hover {
		background: var(--color-tag);
	}

	@media (prefers-reduced-motion: no-preference) {
		.chevron > :global(svg) {
			transition: transform var(--duration-short) ease-out;
		}
	}

	.chevron[aria-expanded='true'] > :global(svg) {
		transform: rotate(90deg);
	}
</style>
