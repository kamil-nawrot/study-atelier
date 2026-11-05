<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { streakWeek } from '#lib/review/streak-week/streak-week.ts';

	type Props = {
		streak: number;
		reviewedToday: boolean;
		today?: Date;
	};

	let { streak, reviewedToday, today = new Date() }: Props = $props();

	let week = $derived(streakWeek(streak, reviewedToday, today));
</script>

<div class="streak">
	<p class="caption">{m.review.streakCaption}</p>
	<p class="count" aria-hidden="true">
		<span class="number">{streak}</span>
		<span class="days">{m.review.streakDays(streak)}</span>
	</p>
	<ol class="week" aria-hidden="true">
		{#each week as day, index (index)}
			<li class:today={day.today}>
				<span class="square" class:filled={day.filled}></span>
				<span class="day">{day.today ? m.review.today : m.review.weekdays[day.weekday]}</span>
			</li>
		{/each}
	</ol>
	<p class="visually-hidden">{m.review.streakWeek(streak, reviewedToday)}</p>
</div>

<style>
	.streak {
		display: grid;
		gap: var(--spacing-3);
		justify-items: start;
	}

	.count {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.number {
		color: var(--color-case-gold);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		line-height: 1;
	}

	.days {
		font-weight: var(--font-weight-medium);
	}

	.week {
		display: flex;
		gap: var(--spacing-2);
		list-style: none;
	}

	li {
		display: grid;
		justify-items: center;
		gap: var(--spacing-1);
	}

	.square {
		width: var(--spacing-4);
		height: var(--spacing-4);
		background: var(--color-tag);
	}

	.today .square:not(.filled) {
		border: var(--border-width-base) dashed var(--color-fg-muted);
		background: none;
	}

	.square.filled {
		background: var(--color-fg);
	}

	.day {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.today .day {
		color: var(--color-fg);
		font-weight: var(--font-weight-medium);
	}
</style>
