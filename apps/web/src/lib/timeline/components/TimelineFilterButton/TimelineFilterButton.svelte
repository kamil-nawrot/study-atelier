<script lang="ts">
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { Button, Icon, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { timelineTags } from '#lib/timeline/filter/filter.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';

	type Props = {
		filter: TimelineFilter;
		filtering: boolean;
		wide: boolean;
		panelOpen: boolean;
		ondialog: () => void;
	};

	let { filter, filtering, wide, panelOpen = $bindable(), ondialog }: Props = $props();

	let label = $derived(
		filtering
			? m.atelier.filters.buttonWithCount(timelineTags(filter).length)
			: m.atelier.filters.button
	);
</script>

<Tooltip align="end" placement="bottom" text={label}>
	{#snippet children(id)}
		<Button
			aria-describedby={id}
			aria-expanded={wide ? panelOpen : undefined}
			aria-haspopup={wide ? undefined : 'dialog'}
			aria-label={label}
			data-on={filtering ? 'true' : undefined}
			onclick={() => (wide ? (panelOpen = !panelOpen) : ondialog())}
			variant={filtering ? 'primary' : 'secondary'}
		>
			<Icon icon={SlidersHorizontal} />
		</Button>
	{/snippet}
</Tooltip>
