<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import {
		pageStep,
		stepYear,
		withoutZero,
		type Years
	} from '#lib/review/year-guess/year-guess.ts';

	type Props = {
		bounds: Years;
		value: number;
		disabled?: boolean;
		oncheck: () => void;
	};

	let { bounds, value = $bindable(), disabled = false, oncheck }: Props = $props();

	const TICKS = 9;

	let text = $derived(m.atelier.year(value, false));

	function input(event: Event & { currentTarget: HTMLInputElement }): void {
		value = withoutZero(Number(event.currentTarget.value), value);
	}

	function keydown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			event.preventDefault();
			oncheck();
			return;
		}
		const by = { PageUp: 1, PageDown: -1 }[event.key];
		if (by === undefined) return;
		event.preventDefault();
		value = stepYear(value, by * pageStep(bounds), bounds);
	}
</script>

<div class="slider">
	<output class="year" for="year-slider">{text}</output>
	<input
		id="year-slider"
		aria-label={m.review.year.slider}
		aria-valuetext={text}
		{disabled}
		max={bounds[1]}
		min={bounds[0]}
		oninput={input}
		onkeydown={keydown}
		step="1"
		type="range"
		{value}
	/>
	<div class="ticks" aria-hidden="true">
		{#each { length: TICKS + 2 }, index (index)}
			<span class="tick"></span>
		{/each}
	</div>
	<div class="ends">
		<span>{m.atelier.year(bounds[0], false)}</span>
		<span>{m.atelier.year(bounds[1], false)}</span>
	</div>
</div>

<style>
	.slider {
		display: grid;
		gap: var(--spacing-1);
	}

	.year {
		justify-self: center;
		font-family: var(--font-family-title);
		font-size: var(--font-size-3xl);
		font-style: italic;
		line-height: var(--line-height-3xl);
	}

	input {
		width: 100%;
		margin: 0;
		accent-color: var(--color-fg);
	}

	.ticks {
		display: flex;
		justify-content: space-between;
		padding: 0 var(--spacing-2);
	}

	.tick {
		width: var(--border-width-hairline);
		height: var(--spacing-2);
		background: var(--color-line);
	}

	.ends {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
