<script lang="ts">
	import { resolve } from '$app/paths';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';

	type Props = {
		details: readonly SymbolDetail[];
	};

	let { details }: Props = $props();
</script>

<ul class="details">
	{#each details as detail (detail.pinId)}
		<li class:plain={!detail.lens}>
			<a
				href="{resolve('/(app)/atelier/[number]', {
					number: String(detail.number)
				})}?pin={encodeURIComponent(detail.pinId)}"
			>
				{#if detail.lens}
					<DetailLens lens={detail.lens} />
				{/if}
				<span class="title">{detail.title}</span>
				<span class="byline">{detail.byline}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.details {
		--detail-lens: 128px;

		display: flex;
		gap: var(--spacing-6);
		overflow-x: auto;
		padding: 0 0 var(--spacing-2);
		list-style: none;
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
	}

	li {
		flex: 0 0 var(--detail-lens);
		scroll-snap-align: start;
	}

	li.plain {
		flex-basis: auto;
		max-width: var(--size-content-narrow);
	}

	a {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		text-align: center;
		text-decoration: none;
	}

	.plain a {
		justify-items: start;
		text-align: start;
	}

	a:hover,
	a:focus-visible {
		--detail-lens-ring: var(--color-fg-muted);
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-md);
	}

	.byline {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (min-width: 768px) {
		.details {
			--detail-lens: 160px;
		}
	}
</style>
