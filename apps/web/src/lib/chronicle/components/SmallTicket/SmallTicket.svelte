<script lang="ts">
	import { resolve } from '$app/paths';
	import { tripTicketDate } from '#lib/chronicle/trip-date/trip-date.ts';
	import TicketStub from '#lib/chronicle/components/TicketStub/TicketStub.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		stub?: string;
	};

	let { visit, stub }: Props = $props();

	let text = $derived(stub ?? visit.place);

	let date = $derived(tripTicketDate(visit));
</script>

<a
	class="ticket"
	class:trip={visit.endsOn !== null}
	href={resolve('/(app)/atelier/chronicle/[id]', { id: visit.id })}
>
	<span class="date">
		<span class="day" aria-hidden="true">{date.main}</span>
		{#if date.sub}
			<span class="month" aria-hidden="true">{date.sub}</span>
		{/if}
		<span class="visually-hidden">{date.label}</span>
	</span>
	<TicketStub small>
		{#if text}
			<span class="place">{text}</span>
		{/if}
	</TicketStub>
</a>

<style>
	.ticket {
		display: grid;
		grid-template-columns: var(--spacing-16) minmax(0, 1fr);
		color: var(--color-fg);
		text-decoration: none;
	}

	.trip {
		grid-template-columns: minmax(var(--spacing-16), max-content) minmax(0, 1fr);
	}

	.trip .day {
		font-size: var(--font-size-lg);
		white-space: nowrap;
	}

	.date {
		--period: 20px;
		--depth: 10px;
		--teeth-down: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 32' preserveAspectRatio='none'%3E%3Cpolygon points='0,0 14,0 0,16 14,32 0,32'/%3E%3C/svg%3E");

		display: grid;
		align-content: center;
		gap: var(--spacing-1);
		padding: var(--spacing-3) calc(var(--spacing-3) + var(--depth)) var(--spacing-3)
			var(--spacing-3);
		background: var(--color-surface);
		mask:
			var(--teeth-down) right top / var(--depth) var(--period) repeat-y,
			linear-gradient(currentColor, currentColor) left top / calc(100% - var(--depth)) 100%
				no-repeat;
	}

	.day,
	.place {
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
		font-weight: var(--font-weight-regular);
	}

	.day {
		font-size: var(--font-size-xl);
		line-height: var(--line-height-xl);
	}

	.month {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.place {
		overflow: hidden;
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ticket:hover .place,
	.ticket:focus-visible .place {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
	}
</style>
