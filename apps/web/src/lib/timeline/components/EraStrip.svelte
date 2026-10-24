<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { eraIcon, eraTitle } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
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

	const NAME_ROOM = 9;
	const ICON_ROOM = 40;
	const FRAME_MIN_WIDTH = 4;
	const FALLBACK_HEIGHT = 40;

	let width = $state(0);
	let height = $state(0);

	let segments = $derived(width > 0 ? stripLayout(eras, width, height || FALLBACK_HEIGHT) : []);
	let era = $derived(eras.find((candidate) => candidate.code === current) as Era);
	let frame = $derived.by(() => {
		if (segments.length === 0) return undefined;
		const from = stripPosition(segments, eras, Math.max(viewStart(view), era.start));
		const to = stripPosition(segments, eras, Math.min(viewStart(view) + view.span, era.end));
		const size = Math.max(FRAME_MIN_WIDTH, to - from);
		return { from: Math.min(from, width - size), size };
	});

	function showsName(code: EraCode, size: number): boolean {
		return size >= ICON_ROOM + eraTitle(code).length * NAME_ROOM;
	}
</script>

<nav
	class="strip"
	aria-label={m.timeline.strip}
	bind:clientHeight={height}
	bind:clientWidth={width}
>
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
			<Icon icon={eraIcon(segment.code)} size="sm" />
			{#if showsName(segment.code, segment.to - segment.from)}
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
		top: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-2);
		overflow: hidden;
		padding-inline: var(--spacing-1);
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
		position: absolute;
		left: var(--spacing-1);
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
