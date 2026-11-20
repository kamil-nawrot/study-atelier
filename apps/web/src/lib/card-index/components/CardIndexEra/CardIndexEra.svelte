<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { eraIcon, eraYearsText } from '#lib/catalogue/eras/eras.ts';
	import type { Snippet } from 'svelte';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import type { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		code: EraCode;
		folding: TimelineFolding;
		filled: boolean;
		empty: string;
		children: Snippet;
	};

	let { code, folding, filled, empty, children }: Props = $props();

	const uid = $props.id();
	let open = $derived(folding.isEraOpen(code));
</script>

<li class="era">
	<span class="marker" aria-hidden="true">
		<Icon icon={eraIcon(code)} />
	</span>
	<div class="body">
		<div class="head">
			<div class="title">
				<h2 class="name">
					<a id="{uid}-name" href={valuePath('era', code)}>{m.eras[code].name}</a>
				</h2>
				<span class="years">{eraYearsText(code)}</span>
			</div>
			<button
				class="chevron"
				aria-controls="{uid}-periods"
				aria-expanded={open}
				aria-labelledby="{uid}-name"
				onclick={() => folding.toggleEra(code)}
				type="button"
			>
				<Icon icon={ChevronRight} size="sm" />
			</button>
		</div>
		{#if open}
			<div id="{uid}-periods">
				{#if filled}
					{@render children()}
				{:else}
					<p class="empty">{empty}</p>
				{/if}
			</div>
		{/if}
	</div>
</li>

<style>
	.era {
		position: relative;
		display: grid;
		grid-template-columns: var(--spacing-12) minmax(0, 1fr);
		gap: var(--spacing-6);
	}

	.marker {
		display: grid;
		place-items: center;
		width: var(--spacing-12);
		height: var(--spacing-12);
		background: var(--color-fg);
		color: var(--color-bg);
	}

	.body {
		display: grid;
		align-content: start;
		min-width: 0;
	}

	@media (max-width: 767.98px) {
		.body {
			row-gap: var(--spacing-2);
		}
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		min-height: var(--spacing-12);
	}

	.title {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-1);
		min-width: 0;
	}

	@media (min-width: 768px) {
		.title {
			flex-flow: row wrap;
			align-items: center;
			gap: var(--spacing-2) var(--spacing-3);
		}
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.name a {
		color: var(--color-fg);
		text-decoration: none;
	}

	.name a:hover {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.years {
		padding: var(--spacing-1) var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-line);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: nowrap;
	}

	.chevron {
		display: grid;
		place-items: center;
		margin-inline-start: auto;
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

	.empty {
		padding-block: var(--spacing-2);
		color: var(--color-fg-muted);
	}
</style>
