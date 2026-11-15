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
			<path class="legs" d="M9 10 5 8M9 13H4M9 16l-4 3M15 10l4-2M15 13h5M15 16l4 3" />
			<ellipse class="wing" cx="8" cy="9" rx="5" ry="2.5" transform="rotate(-35 8 9)" />
			<ellipse class="wing" cx="16" cy="9" rx="5" ry="2.5" transform="rotate(35 16 9)" />
			<ellipse class="body" cx="12" cy="14" rx="3" ry="5" />
			<circle class="body" cx="12" cy="7.5" r="2.5" />
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
		fill: var(--color-stage-fg-muted);
		opacity: 0.5;
	}

	.legs {
		fill: none;
		stroke: var(--color-stage-bg);
		stroke-width: 1;
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
