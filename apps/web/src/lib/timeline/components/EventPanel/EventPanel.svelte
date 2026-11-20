<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import X from '@lucide/svelte/icons/x';
	import { Icon, IconButton, MetaLine, TextButton } from '@study-atelier/ui';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { yearsLong } from '#lib/timeline/event-lanes/event-lanes.ts';
	import { eventPath } from '#lib/timeline/event-page/event-page.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type Props = {
		event: TimelineEvent;
		onclose: () => void;
		onwhole: () => void;
	};

	let { event, onclose, onwhole }: Props = $props();

	const id = $props.id();

	let period = $derived(event.yearFrom !== null);
	let length = $derived(yearsLong(event));
	let date = $derived(formatDate(event.yearFrom, event.yearTo, event.yearApproximate));
	let path = $derived(eventPath(event.id));

	function keydown(key: KeyboardEvent): void {
		if (key.key !== 'Escape') return;
		key.preventDefault();
		key.stopPropagation();
		onclose();
	}
</script>

<section class="panel" aria-labelledby="{id}-name" onkeydown={keydown}>
	<header>
		<div class="heading">
			<p class="overline">{period ? m.timeline.card.period : m.timeline.card.event}</p>
			<h2 id="{id}-name"><a href={path}>{event.name}</a></h2>
			<p class="caption">
				<MetaLine parts={[date, period && length > 0 ? m.timeline.card.length(length) : null]} />
			</p>
		</div>
		<IconButton
			icon={X}
			label={m.timeline.card.close}
			onclick={onclose}
			tooltipAlign="end"
			tooltipPlacement="bottom"
			variant="plain"
		/>
	</header>
	{#if event.description}
		<p class="description">{event.description}</p>
	{/if}
	{#if event.source}
		<p class="source">{m.timeline.card.source}</p>
	{/if}
	{#if period}
		<div>
			<TextButton inline onclick={onwhole}>{m.timeline.card.showWhole}</TextButton>
		</div>
	{/if}
	<a class="link" href={path}>
		{m.timeline.card.details}
		<Icon icon={ArrowRight} size="sm" />
	</a>
</section>

<style>
	.panel {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
	}

	header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	.heading {
		display: grid;
		gap: var(--spacing-1);
	}

	h2 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	h2 a {
		color: inherit;
		text-decoration: none;
	}

	h2 a:hover,
	.link:hover {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.description {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: pre-line;
	}

	.source {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		padding-top: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-line);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}
</style>
