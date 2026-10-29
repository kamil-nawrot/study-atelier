<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { Button, Icon, Tooltip } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { timelineTags } from '#lib/timeline/filter/filter.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';

	type Props = {
		filter: TimelineFilter;
		filtering: boolean;
		wide: boolean;
		panelOpen: boolean;
		ondialog: () => void;
		filters?: boolean;
	};

	let {
		filter,
		filtering,
		wide,
		panelOpen = $bindable(),
		ondialog,
		filters = true
	}: Props = $props();

	let filtersLabel = $derived(
		filtering
			? m.atelier.filters.buttonWithCount(timelineTags(filter).length)
			: m.atelier.filters.button
	);
</script>

<div class="actions">
	{#if filters}
		<Tooltip align="end" placement="bottom" text={filtersLabel}>
			{#snippet children(id)}
				<Button
					aria-describedby={id}
					aria-expanded={wide ? panelOpen : undefined}
					aria-haspopup={wide ? undefined : 'dialog'}
					aria-label={filtersLabel}
					onclick={() => (wide ? (panelOpen = !panelOpen) : ondialog())}
					variant={filtering ? 'primary' : 'secondary'}
				>
					<Icon icon={SlidersHorizontal} />
				</Button>
			{/snippet}
		</Tooltip>
	{/if}
	<Button href={resolve('/(app)/atelier/timeline/events/new')} variant="primary">
		<Icon icon={Plus} size="sm" />
		<span class="long">{m.timeline.add}</span>
		<span class="short">{m.common.add}</span>
	</Button>
</div>

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
