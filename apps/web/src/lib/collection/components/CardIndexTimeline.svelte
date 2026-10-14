<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { eraIcon } from '../eras.ts';
	import type { CardIndexEntry, CardIndexPeriod, CardIndexTimeline } from '../types.ts';

	type Props = {
		timeline: CardIndexTimeline;
		onopen: (id: string) => void;
	};

	let { timeline, onopen }: Props = $props();

	let isEmpty = $derived(
		timeline.eras.every((era) => era.periods.length === 0) &&
			timeline.periodsWithoutEra.length === 0 &&
			timeline.stylesWithoutPeriod.length === 0
	);

	function label(entry: CardIndexEntry): string {
		return m.cardIndex.openValue(entry.name, m.atelier.count(entry.count));
	}
</script>

{#snippet periodList(periods: CardIndexPeriod[])}
	<ul class="periods">
		{#each periods as period (period.id)}
			<li>
				<button
					class="period"
					aria-label={label(period)}
					onclick={() => onopen(period.id)}
					type="button"
				>
					<span class="period-name">{period.name}</span>
					<span class="count">{period.count}</span>
				</button>
				{#if period.styles.length > 0}
					<ul class="styles">
						{#each period.styles as style (style.id)}
							<li>
								<button
									class="style"
									aria-label={label(style)}
									onclick={() => onopen(style.id)}
									type="button"
								>
									<span>{style.name}</span>
									<span class="count">{style.count}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{#if isEmpty}
	<p class="lead">{m.cardIndex.emptyTimeline}</p>
{/if}

<ol class="eras">
	{#each timeline.eras as era (era.code)}
		<li class="era">
			<span class="marker" aria-hidden="true">
				<Icon icon={eraIcon(era.code)} />
			</span>
			<div class="era-body">
				<h2 class="era-name">{m.eras[era.code].name}</h2>
				<span class="years">{m.eras[era.code].years}</span>
				{#if era.periods.length > 0}
					{@render periodList(era.periods)}
				{:else}
					<p class="empty">{m.cardIndex.emptyEra}</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>

{#if timeline.periodsWithoutEra.length > 0}
	<section class="group">
		<h2 class="group-title">{m.cardIndex.periodsWithoutEra}</h2>
		{@render periodList(timeline.periodsWithoutEra)}
	</section>
{/if}

{#if timeline.stylesWithoutPeriod.length > 0}
	<section class="group">
		<h2 class="group-title">{m.cardIndex.stylesWithoutPeriod}</h2>
		<ul class="styles">
			{#each timeline.stylesWithoutPeriod as style (style.id)}
				<li>
					<button
						class="style"
						aria-label={label(style)}
						onclick={() => onopen(style.id)}
						type="button"
					>
						<span>{style.name}</span>
						<span class="count">{style.count}</span>
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	ol,
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.eras {
		position: relative;
		display: grid;
		gap: var(--spacing-12);
	}

	.eras::before {
		content: '';
		position: absolute;
		top: var(--spacing-6);
		bottom: var(--spacing-6);
		left: var(--spacing-6);
		border-left: var(--border-width-hairline) solid var(--color-line);
	}

	.era {
		position: relative;
		display: grid;
		grid-template-columns: var(--spacing-12) minmax(0, 1fr);
		gap: var(--spacing-6);
	}

	.marker {
		display: grid;
		place-items: center;
		justify-self: center;
		width: var(--spacing-12);
		height: var(--spacing-12);
		background: var(--color-fg);
		color: var(--color-bg);
	}

	.era-body {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
		min-width: 0;
		padding-top: var(--spacing-2);
	}

	.era-name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.years {
		margin-top: calc(-1 * var(--spacing-2));
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.empty {
		color: var(--color-fg-muted);
	}

	.periods {
		display: grid;
		gap: var(--spacing-6);
		margin-top: var(--spacing-3);
	}

	.period,
	.style {
		font-family: inherit;
		color: var(--color-fg);
		cursor: pointer;
	}

	.period {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-3);
		padding: 0;
		border: none;
		background: none;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-align: left;
	}

	.period:hover .period-name {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
	}

	.styles {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
	}

	.style {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-3);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	.style:hover {
		background: var(--color-surface);
	}

	.group {
		display: grid;
		gap: var(--spacing-4);
		margin-top: var(--spacing-12);
	}

	.group-title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xl);
	}
</style>
