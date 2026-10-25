<script lang="ts">
	import Footprints from '@lucide/svelte/icons/footprints';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { countryName } from '#lib/catalogue/countries/countries.ts';
	import { placeTypeIcon, placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { noteExcerpt } from '#lib/chronicle/note-excerpt/note-excerpt.ts';
	import { ticketDate, visitWeekday } from '#lib/chronicle/visit-date/visit-date.ts';
	import TicketStub from '#lib/chronicle/components/TicketStub/TicketStub.svelte';
	import VisitBackdrop from '#lib/chronicle/components/VisitBackdrop/VisitBackdrop.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		count: number;
		linked?: boolean;
		backdrop?: WallArtwork;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { visit, count, linked = false, backdrop, onnearscreen, onimagefailed }: Props = $props();

	let header = $derived(!linked);
	let date = $derived(ticketDate(visit.date, header));
	let place = $derived(
		[
			visit.placeType ? placeTypeName(visit.placeType) : null,
			visit.countryCode ? countryName(visit.countryCode) : null
		]
			.filter((part) => part !== null)
			.join(' · ')
	);
	let weekday = $derived(header ? visitWeekday(visit.date) : undefined);
	let excerpt = $derived(header ? '' : noteExcerpt(visit.notes));
</script>

<article class="ticket" class:header>
	<div class="main">
		<time class="date" class:year={visit.date.precision === 'year'} datetime={visit.date.on}>
			<span class="day" aria-hidden="true">{date.main}</span>
			{#if date.sub}
				<span class="month" aria-hidden="true">{date.sub}</span>
			{/if}
			<span class="visually-hidden">{date.label}</span>
		</time>
		<div class="body">
			{#if header}
				<p class="kind">{m.chronicle.kind}</p>
				<h1 class="place">{visit.place}</h1>
			{:else}
				<h3 class="place">
					<a href={resolve('/(app)/atelier/chronicle/[id]', { id: visit.id })}>{visit.place}</a>
				</h3>
			{/if}
			<p class="meta caption">
				{#if place}
					<span class="part">
						{#if visit.placeType}
							<Icon icon={placeTypeIcon(visit.placeType)} size="sm" />
						{/if}
						{place}
					</span>
				{/if}
				{#if weekday}
					<span class="part">{weekday}</span>
				{/if}
				{#if !header}
					<span class="part">
						<Icon icon={Footprints} size="sm" />
						{m.chronicle.seen(count)}
					</span>
				{/if}
			</p>
			{#if excerpt}
				<p class="excerpt">{excerpt}</p>
			{/if}
		</div>
	</div>
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
</article>

<style>
	.ticket {
		position: relative;
		display: grid;
	}

	.main {
		display: grid;
		grid-template-columns: var(--spacing-12) minmax(0, 1fr);
		gap: var(--spacing-4);
		padding: var(--spacing-6);
		background: var(--color-surface);
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

	.year .day {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.month,
	.kind {
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
			padding: var(--spacing-8);
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
