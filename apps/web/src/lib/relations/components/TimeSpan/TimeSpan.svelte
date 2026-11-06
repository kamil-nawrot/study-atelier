<script lang="ts">
	import { formatYear } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { RelatedEvent } from '#lib/relations/types/related-event.ts';
	import type { RelationsKind } from '#lib/relations/types/relations-kind.ts';
	import type { YearSpan } from '#lib/relations/types/year-span.ts';

	type Props = {
		kind: RelationsKind;
		years: number[];
		bounds?: YearSpan;
		events?: RelatedEvent[];
	};

	let { kind, years, bounds, events = [] }: Props = $props();

	let boundsKind = $derived(
		kind === 'era' || kind === 'author' || kind === 'event' ? kind : undefined
	);
	let dots = $derived(
		events.filter((event) => event.yearFrom === null || event.yearFrom === event.yearTo)
	);
	let edges = $derived([
		...years,
		...(bounds ? [bounds.from, bounds.to] : []),
		...dots.map((event) => event.yearTo)
	]);
	let low = $derived(Math.min(...edges));
	let high = $derived(Math.max(...edges));
	let ends = $derived(bounds ?? { from: years[0], to: years[years.length - 1] });
	let text = $derived(sentence());
	function year(value: number): string {
		return formatYear(value, false) ?? String(value);
	}

	function sentence(): string {
		const artworks =
			years.length > 0
				? m.relations.artworkYears(year(years[0]), year(years[years.length - 1]))
				: m.relations.noYears;
		if (!bounds || !boundsKind) return artworks;
		return `${artworks}, ${m.relations.bounds[boundsKind](year(bounds.from), year(bounds.to))}`;
	}

	function at(value: number): number {
		return high === low ? 50 : ((value - low) / (high - low)) * 100;
	}

	const NARROW = 20;

	let start = $derived(at(ends.from));
	let end = $derived(at(ends.to));
	let narrow = $derived(end - start < NARROW);
	let middle = $derived(Math.min(Math.max((start + end) / 2, NARROW / 2), 100 - NARROW / 2));
</script>

<section class="span" aria-labelledby="relations-span">
	<h3 id="relations-span" class="label">{m.relations.span}</h3>
	<p class="visually-hidden">{text}</p>
	<div class="strip" aria-hidden="true">
		<div class="track"></div>
		{#if bounds}
			<div style:left="{at(bounds.from)}%" style:right="{100 - at(bounds.to)}%" class="band"></div>
		{/if}
		{#each years as value, position (position)}
			<div style:left="{at(value)}%" class="tick"></div>
		{/each}
		{#each dots as event (event.id)}
			<svg style:left="{at(event.yearTo)}%" class="dot" viewBox="0 0 10 10">
				<circle cx="5" cy="5" r="4" />
			</svg>
		{/each}
	</div>
	<div class="ends caption" aria-hidden="true">
		{#if ends.from === undefined}{:else if narrow}
			<span style:left="{middle}%" class="middle"
				>{ends.to === ends.from
					? year(ends.from)
					: m.atelier.yearRange(year(ends.from), year(ends.to))}</span
			>
		{:else}
			<span style:left="{start}%">{year(ends.from)}</span>
			<span style:right="{100 - end}%">{year(ends.to)}</span>
		{/if}
	</div>
</section>

<style>
	.span {
		display: grid;
		gap: var(--spacing-2);
	}

	.strip {
		position: relative;
		height: var(--spacing-6);
	}

	.track,
	.band {
		position: absolute;
		top: 50%;
		height: var(--border-width-heavy);
		transform: translateY(-50%);
	}

	.track {
		inset-inline: 0;
		background: var(--color-tag);
	}

	.band {
		height: var(--spacing-2);
		background: var(--color-fg-muted);
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		width: var(--border-width-button);
		transform: translateX(-50%);
		background: var(--color-fg);
	}

	.dot {
		position: absolute;
		top: 50%;
		width: var(--spacing-3);
		height: var(--spacing-3);
		overflow: visible;
		transform: translate(-50%, -50%);
	}

	.dot circle {
		fill: var(--color-bg);
		stroke: var(--color-fg-muted);
		stroke-width: var(--border-width-base);
	}

	.ends {
		position: relative;
		height: var(--line-height-sm);
	}

	.ends span {
		position: absolute;
		top: 0;
		white-space: nowrap;
	}

	.ends .middle {
		transform: translateX(-50%);
	}

	.label {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
