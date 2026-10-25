<script lang="ts">
	import { resolve } from '$app/paths';
	import { ticketDate, visitWeekday } from '#lib/chronicle/visit-date/visit-date.ts';
	import TicketStub from '#lib/chronicle/components/TicketStub/TicketStub.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
	};

	let { visit }: Props = $props();

	let date = $derived(ticketDate(visit.date));
	let weekday = $derived(visitWeekday(visit.date));
</script>

<a class="ticket" href={resolve('/(app)/atelier/chronicle/[id]', { id: visit.id })}>
	<span class="date">
		<span class="day" aria-hidden="true">{date.main}</span>
		{#if date.sub}
			<span class="month" aria-hidden="true">{date.sub}</span>
		{/if}
		<span class="visually-hidden">{date.label}</span>
	</span>
	<TicketStub small>
		<span class="place">{visit.place}</span>
		{#if weekday}
			<span class="caption">{weekday}</span>
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

	.date {
		display: grid;
		align-content: center;
		gap: var(--spacing-1);
		padding: var(--spacing-3);
		background: var(--color-surface);
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
