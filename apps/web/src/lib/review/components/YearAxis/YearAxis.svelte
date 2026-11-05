<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { band, placeOf, type Years } from '#lib/review/year-guess/year-guess.ts';

	type Props = {
		bounds: Years;
		years: Years;
		yearsText: string;
		guess: number;
	};

	let { bounds, years, yearsText, guess }: Props = $props();

	function percent(year: number): string {
		return `${placeOf(year, bounds) * 100}%`;
	}

	function width([from, to]: Years): string {
		return `${(placeOf(to, bounds) - placeOf(from, bounds)) * 100}%`;
	}

	let close = $derived(band(years, bounds, 'close'));
	let know = $derived(band(years, bounds, 'know'));
	let span = $derived(years[0] !== years[1]);
	let guessText = $derived(m.atelier.year(guess, false));
</script>

<div class="axis" aria-hidden="true">
	<div class="labels">
		<span style:left={percent(guess)} class="guess-label">{guessText}</span>
	</div>
	<div class="track">
		<span style:left={percent(close[0])} style:width={width(close)} class="band close"></span>
		<span style:left={percent(know[0])} style:width={width(know)} class="band know"></span>
		{#if span}
			<span style:left={percent(years[0])} style:width={width(years)} class="real span"></span>
		{:else}
			<span style:left={percent(years[0])} class="real year"></span>
		{/if}
		<span style:left={percent(guess)} class="guess"></span>
	</div>
	<div class="labels">
		<span style:left={percent((years[0] + years[1]) / 2)} class="real-label">{yearsText}</span>
	</div>
	<div class="ends">
		<span>{m.atelier.year(bounds[0], false)}</span>
		<span>{m.atelier.year(bounds[1], false)}</span>
	</div>
</div>

<style>
	.axis {
		display: grid;
		gap: var(--spacing-1);
	}

	.labels {
		position: relative;
		height: 1lh;
		font-family: var(--font-family-title);
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-md);
	}

	.guess-label,
	.real-label {
		position: absolute;
		translate: -50% 0;
		white-space: nowrap;
	}

	.track {
		position: relative;
		height: var(--spacing-6);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.band,
	.real,
	.guess {
		position: absolute;
		bottom: 0;
	}

	.band {
		height: 100%;
	}

	.close {
		background: color-mix(in srgb, var(--color-fg) 14%, transparent);
	}

	.know {
		background: color-mix(in srgb, var(--color-fg) 30%, transparent);
	}

	.real {
		height: 100%;
		background: var(--color-fg);
	}

	.year {
		width: var(--border-width-heavy);
		translate: -50% 0;
	}

	.span {
		min-width: var(--border-width-heavy);
	}

	.guess {
		width: var(--border-width-base);
		height: calc(100% + var(--spacing-2));
		translate: -50% 0;
		background: var(--color-highlight);
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
