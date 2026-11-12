<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { IconButton } from '@study-atelier/ui';
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
	const HOLD_START = 400;
	const HOLD_FASTER = 0.8;
	const HOLD_FASTEST = 40;

	let timer: ReturnType<typeof setTimeout> | undefined;

	function step(by: 1 | -1): void {
		value = stepYear(value, by, bounds);
	}

	function hold(by: 1 | -1, event: PointerEvent): void {
		if (event.button !== 0) return;
		release();
		step(by);
		let delay = HOLD_START;
		const repeat = (): void => {
			const before = value;
			step(by);
			if (value === before) {
				release();
				return;
			}
			delay = Math.max(HOLD_FASTEST, delay * HOLD_FASTER);
			timer = setTimeout(repeat, delay);
		};
		timer = setTimeout(repeat, delay);
	}

	function release(): void {
		clearTimeout(timer);
		timer = undefined;
	}

	function press(by: 1 | -1, event: MouseEvent): void {
		if (event.detail === 0) step(by);
	}

	$effect(() => release);

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
	<div class="pick">
		<IconButton
			disabled={disabled || value <= bounds[0]}
			icon={Minus}
			label={m.review.year.earlier}
			onclick={(event) => press(-1, event)}
			onpointercancel={release}
			onpointerdown={(event) => hold(-1, event)}
			onpointerleave={release}
			onpointerup={release}
		/>
		<output class="year" for="year-slider">{text}</output>
		<IconButton
			disabled={disabled || value >= bounds[1]}
			icon={Plus}
			label={m.review.year.later}
			onclick={(event) => press(1, event)}
			onpointercancel={release}
			onpointerdown={(event) => hold(1, event)}
			onpointerleave={release}
			onpointerup={release}
		/>
	</div>
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

	.pick {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--spacing-2);
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
