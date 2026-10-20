<script lang="ts">
	import { eraTitle } from '#lib/collection/eras.ts';
	import type { EraCode } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { stripLayout, stripPosition } from '../strip.ts';
	import { viewStart, type Era, type View } from '../time.ts';

	type Props = {
		eras: readonly Era[];
		current: EraCode;
		view: View;
		onselect: (code: EraCode) => void;
	};

	let { eras, current, view, onselect }: Props = $props();

	const NAME_MIN_WIDTH = 96;
	const FRAME_MIN_WIDTH = 4;

	let width = $state(0);

	let segments = $derived(width > 0 ? stripLayout(eras, width) : []);
	let era = $derived(eras.find((candidate) => candidate.code === current) as Era);
	let frame = $derived.by(() => {
		if (segments.length === 0) return undefined;
		const from = stripPosition(segments, eras, Math.max(viewStart(view), era.start));
		const to = stripPosition(segments, eras, Math.min(viewStart(view) + view.span, era.end));
		const size = Math.max(FRAME_MIN_WIDTH, to - from);
		return { from: Math.min(from, width - size), size };
	});
</script>

<nav class="strip" aria-label={m.timeline.strip} bind:clientWidth={width}>
	{#each segments as segment (segment.code)}
		<button
			style:left={`${segment.from}px`}
			style:width={`${segment.to - segment.from}px`}
			class="segment"
			class:current={segment.code === current}
			aria-current={segment.code === current ? 'true' : undefined}
			aria-label={eraTitle(segment.code)}
			onclick={() => onselect(segment.code)}
			type="button"
		>
			{#if segment.shortened}
				<svg class="break" aria-hidden="true" height="16" viewBox="0 0 8 16" width="8">
					<path d="M5 0 L2 6 L6 10 L3 16" />
				</svg>
			{/if}
			{#if segment.to - segment.from >= NAME_MIN_WIDTH}
				<span class="name" aria-hidden="true">{eraTitle(segment.code)}</span>
			{/if}
		</button>
	{/each}
	{#if frame}
		<span
			style:left={`${frame.from}px`}
			style:width={`${frame.size}px`}
			class="frame"
			aria-hidden="true"
		></span>
	{/if}
</nav>

<style>
	.strip {
		position: relative;
		overflow: hidden;
		height: var(--size-control);
	}

	.segment {
		position: absolute;
		top: var(--spacing-1);
		bottom: var(--spacing-1);
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		overflow: hidden;
		padding-inline: var(--spacing-2);
		border: 0;
		border-right: var(--border-width-base) solid var(--color-bg);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		white-space: nowrap;
		cursor: pointer;
	}

	.segment:hover {
		color: var(--color-fg);
	}

	.segment.current {
		background: var(--color-fg-muted);
		color: var(--color-on-fg);
	}

	.break {
		flex: none;
		width: var(--spacing-2);
		height: var(--spacing-4);
		fill: none;
		stroke: var(--color-bg);
		stroke-width: 2;
	}

	.frame {
		position: absolute;
		top: 0;
		bottom: 0;
		border: var(--border-width-base) solid var(--color-highlight);
		pointer-events: none;
	}
</style>
