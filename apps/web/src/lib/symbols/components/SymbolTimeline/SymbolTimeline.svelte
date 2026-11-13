<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
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
	<section aria-labelledby="symbol-axis">
		<Disclosure id="symbol-axis" count={timeline.placed.length} room title={m.symbols.view.axis}>
			<div class="scroll">
				<ul class="track" aria-label={m.symbols.view.axisLabel}>
					{#each timeline.ticks as tick (tick.year)}
						<li style:left="{tick.left}%" class="tick" aria-hidden="true">
							<span class="year">{tick.year}</span>
						</li>
					{/each}
					<li class="line" aria-hidden="true"></li>
					{#each timeline.breaks as left (left)}
						<li style:left="{left}%" class="break" aria-hidden="true"></li>
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
		</Disclosure>
	</section>
{/if}

<style>
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
		list-style: none;
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: var(--border-width-hairline) solid var(--color-line);
	}

	.line {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.break {
		position: absolute;
		bottom: calc(-1 * var(--spacing-2));
		width: var(--spacing-3);
		height: var(--spacing-4);
		background:
			linear-gradient(
					-60deg,
					transparent calc(50% - var(--border-width-hairline)),
					var(--color-fg-muted) calc(50% - var(--border-width-hairline)),
					var(--color-fg-muted) calc(50% + var(--border-width-hairline)),
					transparent calc(50% + var(--border-width-hairline))
				)
				left / 50% 100% no-repeat,
			linear-gradient(
					-60deg,
					transparent calc(50% - var(--border-width-hairline)),
					var(--color-fg-muted) calc(50% - var(--border-width-hairline)),
					var(--color-fg-muted) calc(50% + var(--border-width-hairline)),
					transparent calc(50% + var(--border-width-hairline))
				)
				right / 50% 100% no-repeat,
			var(--color-bg);
		transform: translateX(-50%);
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
