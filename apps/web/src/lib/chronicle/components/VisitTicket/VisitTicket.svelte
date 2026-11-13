<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import Tickets from '@lucide/svelte/icons/tickets';
	import { Icon, MetaLine } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { countryName } from '#lib/catalogue/countries/countries.ts';
	import { placeTypeIcon, placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { noteExcerpt } from '#lib/chronicle/note-excerpt/note-excerpt.ts';
	import { tripOverline, tripTicketDate } from '#lib/chronicle/trip-date/trip-date.ts';
	import TicketStub from '#lib/chronicle/components/TicketStub/TicketStub.svelte';
	import VisitBackdrop from '#lib/chronicle/components/VisitBackdrop/VisitBackdrop.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		count: number;
		visitCount?: number;
		linked?: boolean;
		backdrop?: WallArtwork;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let {
		visit,
		count,
		visitCount = 0,
		linked = false,
		backdrop,
		onnearscreen,
		onimagefailed
	}: Props = $props();

	let header = $derived(!linked);
	let trip = $derived(visit.kind === 'trip');
	let whole = $derived(trip && !header);
	let date = $derived(tripTicketDate(visit, header));
	let place = $derived([
		visit.placeType ? placeTypeName(visit.placeType) : null,
		visit.countryCode ? countryName(visit.countryCode) : null
	]);
	let excerpt = $derived(header ? '' : noteExcerpt(visit.notes));
</script>

<article class="ticket" class:header class:trip class:whole>
	<span class="paper" aria-hidden="true"></span>
	<div class="main">
		<time class="date" class:year={visit.date.precision === 'year'} datetime={visit.date.on}>
			<span class="day" aria-hidden="true">{date.main}</span>
			{#if date.sub}
				<span class="month" aria-hidden="true">{date.sub}</span>
			{/if}
			<span class="visually-hidden">{date.label}</span>
		</time>
		<div class="body">
			{#if trip}
				<p class="overline kind">{tripOverline(visit)}</p>
			{:else if header}
				<p class="overline">{m.chronicle.kind}</p>
			{/if}
			{#if header}
				<h1 class="place">{visit.place}</h1>
			{:else}
				<h3 class="place">
					<a href={resolve('/(app)/atelier/chronicle/[id]', { id: visit.id })}>{visit.place}</a>
				</h3>
			{/if}
			<p class="meta caption">
				{#if visit.placeType || visit.countryCode}
					<span class="part">
						{#if visit.placeType}
							<Icon icon={placeTypeIcon(visit.placeType)} size="sm" />
						{/if}
						<MetaLine parts={place} />
					</span>
				{/if}
				{#if !header}
					<span class="part">
						<Icon icon={Footprints} size="sm" />
						{m.chronicle.seen(count)}
					</span>
					{#if visitCount > 0}
						<span class="part">
							<Icon icon={Tickets} size="sm" />
							{m.chronicle.trip.visits(visitCount)}
						</span>
					{/if}
				{/if}
			</p>
			{#if excerpt}
				<p class="excerpt">{excerpt}</p>
			{/if}
		</div>
	</div>
	{#if !whole}
		<TicketStub>
			{#if header}
				<p class="count">
					<span class="number">{count}</span>
					<span class="caption">{m.chronicle.seenCount(count)}</span>
				</p>
			{:else}
				{#if backdrop}
					<VisitBackdrop artwork={backdrop} {onimagefailed} {onnearscreen} />
				{/if}
			{/if}
		</TicketStub>
	{/if}
</article>

<style>
	.ticket {
		--depth: 14px;

		position: relative;
		display: grid;
		isolation: isolate;
	}

	.paper {
		--period: 32px;
		--teeth-across: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 14' preserveAspectRatio='none'%3E%3Cpolygon points='0,0 32,0 32,14 16,0 0,14'/%3E%3C/svg%3E");
		--teeth-down: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 32' preserveAspectRatio='none'%3E%3Cpolygon points='0,0 14,0 0,16 14,32 0,32'/%3E%3C/svg%3E");

		position: relative;
		z-index: -1;
		grid-area: 1 / 1;
		background: var(--color-surface);
		mask:
			var(--teeth-across) left bottom / var(--period) var(--depth) repeat-x,
			linear-gradient(currentColor, currentColor) left top / 100% calc(100% - var(--depth))
				no-repeat;
	}

	.whole {
		--depth: 0px;
	}

	.main {
		display: grid;
		grid-area: 1 / 1;
		grid-template-columns: var(--spacing-12) minmax(0, 1fr);
		gap: var(--spacing-4);
		padding: var(--spacing-6) var(--spacing-6) calc(var(--spacing-6) + var(--depth));
	}

	.date {
		display: grid;
		align-content: start;
		gap: var(--spacing-1);
	}

	.day,
	.place,
	.number {
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
		font-weight: var(--font-weight-regular);
	}

	.day {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}

	.trip .main {
		grid-template-columns: minmax(var(--spacing-12), max-content) minmax(0, 1fr);
	}

	.trip .day {
		font-size: var(--font-size-lg);
		white-space: nowrap;
	}

	.kind {
		color: var(--color-highlight);
	}

	.year .day {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.month {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.body {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.place {
		font-size: var(--font-size-xl);
		line-height: var(--line-height-xl);
	}

	.header .place {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}

	.place a {
		text-decoration: none;
	}

	.place a::after {
		position: absolute;
		z-index: 1;
		inset: 0;
		content: '';
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-4);
	}

	.part {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	.excerpt {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.count {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
	}

	.number {
		font-size: var(--font-size-3xl);
		line-height: var(--line-height-3xl);
	}

	@media (min-width: 768px) {
		.ticket {
			grid-template-columns: minmax(0, 1fr) minmax(0, 200px);
		}

		.main {
			grid-template-columns: var(--spacing-16) minmax(0, 1fr);
			gap: var(--spacing-6);
			padding: var(--spacing-8) calc(var(--spacing-8) + var(--depth)) var(--spacing-8)
				var(--spacing-8);
		}

		.paper {
			mask:
				var(--teeth-down) right top / var(--depth) var(--period) repeat-y,
				linear-gradient(currentColor, currentColor) left top / calc(100% - var(--depth)) 100%
					no-repeat;
		}

		.trip .main {
			grid-template-columns: minmax(var(--spacing-16), max-content) minmax(0, 1fr);
		}

		.whole {
			grid-template-columns: minmax(0, 1fr);
		}

		.trip .day {
			font-size: var(--font-size-xl);
		}

		.header {
			grid-template-columns: minmax(0, 1fr) minmax(0, 180px);
		}

		.count {
			flex-direction: column;
			align-items: flex-end;
			gap: var(--spacing-1);
		}
	}
</style>
