<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import { symbolTimeline } from '#lib/symbols/symbol-timeline/symbol-timeline.ts';
	import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';

	type Props = {
		details: readonly SymbolDetail[];
	};

	let { details }: Props = $props();

	let timeline = $derived(symbolTimeline(details.filter((detail) => detail.lens)));
</script>

{#if timeline}
	<section class="timeline" aria-labelledby="symbol-axis">
		<h2 id="symbol-axis">{m.symbols.view.axis}</h2>
		<div class="scroll">
			<ul class="track" aria-label={m.symbols.view.axisLabel}>
				{#each timeline.ticks as tick (tick.year)}
					<li style:left="{tick.left}%" class="tick" aria-hidden="true">
						<span class="year">{tick.year}</span>
					</li>
				{/each}
				{#each timeline.placed as { detail, left } (detail.pinId)}
					<li style:left="{left}%" class="placed">
						<a
							href="{resolve('/(app)/atelier/[number]', {
								number: String(detail.number)
							})}?pin={encodeURIComponent(detail.pinId)}"
							title="{detail.title}, {detail.byline}"
						>
							{#if detail.lens}
								<DetailLens lens={detail.lens} />
							{/if}
							<span class="visually-hidden">{detail.title}, {detail.byline}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<style>
	.timeline {
		display: grid;
		gap: var(--spacing-6);
		padding: var(--spacing-8) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.scroll {
		overflow-x: auto;
		padding: 0 var(--spacing-12) var(--spacing-8);
		scrollbar-width: thin;
	}

	.track {
		--detail-lens: 72px;

		position: relative;
		min-width: var(--size-content-narrow);
		height: calc(var(--detail-lens) + var(--spacing-8));
		border-bottom: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: var(--border-width-hairline) solid var(--color-line);
	}

	.year {
		position: absolute;
		bottom: calc(-1 * var(--spacing-6));
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		transform: translateX(-50%);
	}

	.placed {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.placed a {
		display: block;
	}

	.placed a:hover,
	.placed a:focus-visible {
		--detail-lens-ring: var(--color-fg-muted);
	}

	@media (min-width: 768px) {
		.track {
			--detail-lens: 96px;

			min-width: var(--size-content-default);
		}
	}
</style>
