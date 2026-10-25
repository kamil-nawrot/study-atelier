<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { yearAt } from '#lib/timeline/time/time.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { Orientation } from '#lib/timeline/types/orientation.ts';
	import type { View } from '#lib/timeline/types/view.ts';

	type Props = {
		era: Era;
		view: View;
		orientation: Orientation;
		onkeypan: (share: number) => void;
		onstep: (direction: 1 | -1) => void;
	};

	let { era, view, orientation, onkeypan, onstep }: Props = $props();

	const KEY_PAN = 0.25;

	let readingYear = $derived(yearAt(view.center));

	function keydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') onkeypan(-KEY_PAN);
		else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') onkeypan(KEY_PAN);
		else if (event.key === '+' || event.key === '=') onstep(1);
		else if (event.key === '-') onstep(-1);
		else return;
		event.preventDefault();
		event.stopPropagation();
	}
</script>

<div class="reading" class:vertical={orientation === 'vertical'}>
	<span
		class="reading-year"
		aria-label={m.timeline.stage}
		aria-orientation={orientation}
		aria-valuemax={yearAt(era.end - 1)}
		aria-valuemin={yearAt(era.start)}
		aria-valuenow={readingYear}
		aria-valuetext={m.atelier.year(readingYear, false)}
		onkeydown={keydown}
		role="slider"
		tabindex="0">{m.atelier.year(readingYear, false)}</span
	>
</div>

<style>
	.reading {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		z-index: 4;
		width: 0;
		border-left: var(--border-width-hairline) solid var(--color-highlight);
		pointer-events: none;
	}

	.reading.vertical {
		top: 50%;
		right: 0;
		bottom: auto;
		left: var(--spacing-16);
		width: auto;
		height: 0;
		border-top: var(--border-width-hairline) solid var(--color-highlight);
		border-left: 0;
	}

	.reading-year {
		position: absolute;
		bottom: var(--spacing-2);
		padding-inline: var(--spacing-2);
		background: var(--color-highlight);
		color: var(--color-on-fg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		transform: translateX(-50%);
	}

	.reading-year:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.vertical .reading-year {
		right: var(--spacing-2);
		bottom: auto;
		transform: translateY(-50%);
	}
</style>
