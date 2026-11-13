<script lang="ts">
	import Star from '@lucide/svelte/icons/star';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import LensStrip from '#lib/pins/components/LensStrip/LensStrip.svelte';
	import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';

	type Props = {
		details: readonly SymbolDetail[];
		coverPinId?: string;
		onsetcover?: (pinId: string | null) => void;
	};

	let { details, coverPinId, onsetcover }: Props = $props();
</script>

<div class="details">
	<LensStrip
		backLabel={m.symbols.view.detailsBack}
		count={details.length}
		forwardLabel={m.symbols.view.detailsForward}
	>
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
				{#if onsetcover && detail.lens}
					{@const main = detail.pinId === coverPinId}
					<button
						class="star"
						class:main
						aria-label={main ? m.symbols.view.mainDetail : m.symbols.view.setMainDetail}
						aria-pressed={main}
						onclick={() => {
							if (!main) onsetcover(detail.pinId);
						}}
						type="button"
					>
						<Icon icon={Star} size="sm" />
					</button>
				{/if}
			</li>
		{/each}
	</LensStrip>
</div>

<style>
	.details {
		--detail-lens: 128px;
	}

	li {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: start;
		gap: var(--spacing-2);
	}

	.star {
		position: absolute;
		top: calc(var(--detail-lens) - var(--spacing-8));
		left: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		padding: 0;
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-bg);
		color: var(--color-fg-muted);
		cursor: pointer;
		transform: translateX(-50%);
	}

	.star:hover,
	.star:focus-visible,
	.star.main {
		color: var(--color-fg);
	}

	.star.main {
		cursor: default;
	}

	.star.main :global(svg) {
		fill: var(--color-fg);
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
