<script lang="ts">
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import Icon from '../Icon/Icon.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';

	type Props = {
		title: string;
		foldLabel: string;
		onfold: () => void;
		as?: 'h2' | 'p';
	};

	let { title, foldLabel, onfold, as = 'h2' }: Props = $props();
</script>

<div class="panel-header">
	<svelte:element this={as} class="title">{title}</svelte:element>
	<Tooltip align="end" placement="bottom" text={foldLabel}>
		<button class="fold" aria-label={foldLabel} onclick={onfold} type="button">
			<Icon icon={PanelRightClose} />
		</button>
	</Tooltip>
</div>

<style>
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
	}

	.title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	.fold {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}
</style>
