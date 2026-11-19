<script lang="ts">
	import { StepSelect } from '@study-atelier/ui';
	import { GROUPING_STEPS, type WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		view: WallView;
		fill?: boolean;
	};

	let { view, fill = false }: Props = $props();
</script>

<div class="grouping-panel" class:fill>
	<StepSelect
		label={m.atelier.grouping.label}
		size="lg"
		steps={GROUPING_STEPS}
		bind:value={
			() => (view.grouping === 'none' ? '' : view.grouping), (value) => view.chooseGrouping(value)
		}
	/>
	<p class="caption">{m.atelier.grouping.hint}</p>
</div>

<style>
	.grouping-panel {
		display: grid;
		gap: var(--spacing-3);
		width: max-content;
	}

	.grouping-panel.fill {
		width: auto;
	}

	.grouping-panel:not(.fill) :global(.steps .label) {
		flex: none;
		width: 0;
		min-width: 100%;
		margin-inline-end: calc(-1 * var(--spacing-3));
	}

	.grouping-panel:not(.fill) .caption {
		width: 0;
		min-width: 100%;
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}
</style>
