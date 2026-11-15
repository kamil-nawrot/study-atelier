<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import {
		followGiottoFly,
		landFly,
		swatGiottoFly,
		type FlySpot
	} from '#lib/career/giotto-fly/giotto-fly.ts';
	import { m } from '#lib/i18n/i18n.ts';

	const FLY_AWAY_MS = 600;

	type Props = {
		artwork: string;
	};

	let { artwork }: Props = $props();

	let spot = $state<FlySpot>();
	let away = $state(false);

	$effect(() => followGiottoFly(page.data.session?.user.id, page.data.giottoFlyRecorded === true));
	$effect(() => {
		void artwork;
		away = false;
		spot = untrack(() => landFly());
	});

	function swat(): void {
		away = true;
		void swatGiottoFly(page.data.careerShown !== false);
		setTimeout(() => (spot = undefined), FLY_AWAY_MS);
	}
</script>

{#if spot}
	<button
		style:left="{spot.left}%"
		style:top="{spot.top}%"
		style:--turn="{spot.turn}deg"
		class="fly"
		class:away
		aria-label={m.artworkView.swatFly}
		disabled={away}
		onclick={swat}
		type="button"
	>
		<svg aria-hidden="true" viewBox="0 0 24 24">
			<path
				class="legs"
				d="M10.4 9.8 7.4 8M13.6 9.8l3-1.8M10.2 11.4 6.6 12.4M13.8 11.4l3.6 1M10.6 12.8 8.8 16.2M13.4 12.8l1.8 3.4"
			/>
			<path
				class="wing"
				d="M11.2 11.2C8.4 12.6 5.4 16 5.6 19.2c.1 1.2 1.6 1.4 2.6.4 1.8-1.8 3.4-4.8 3.8-7.4z"
			/>
			<path
				class="wing"
				d="M12.8 11.2c2.8 1.4 5.8 4.8 5.6 8-.1 1.2-1.6 1.4-2.6.4-1.8-1.8-3.4-4.8-3.8-7.4z"
			/>
			<ellipse class="body" cx="12" cy="15.2" rx="2.4" ry="2.9" />
			<ellipse class="body" cx="12" cy="11" rx="2.7" ry="2.4" />
			<ellipse class="body" cx="12" cy="7.8" rx="2.5" ry="1.5" />
		</svg>
	</button>
{/if}

<style>
	.fly {
		position: absolute;
		display: grid;
		place-items: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		padding: var(--spacing-2);
		border: 0;
		background: none;
		cursor: pointer;
		transform: translate(-50%, -50%) rotate(var(--turn));
	}

	.fly:focus-visible {
		outline: var(--border-width-base) dashed var(--color-mat-bg);
	}

	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.body {
		fill: var(--color-stage-bg);
	}

	.wing {
		fill: var(--color-stage-bg);
		opacity: 0.55;
	}

	.legs {
		fill: none;
		stroke: var(--color-stage-bg);
		stroke-width: 0.8;
		stroke-linecap: round;
	}

	.away {
		opacity: 0;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.away {
			transition:
				transform calc(var(--duration-short) * 4) ease-in,
				opacity calc(var(--duration-short) * 4) ease-in;
			transform: translate(200%, -400%) rotate(var(--turn)) scale(0.5);
		}
	}
</style>
