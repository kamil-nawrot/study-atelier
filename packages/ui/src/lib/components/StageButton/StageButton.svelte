<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from '../Icon/Icon.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';

	type Props = Omit<HTMLButtonAttributes, 'aria-label' | 'children'> & {
		icon: LucideIcon;
		label: string;
		tooltip?: string;
		active?: boolean;
		unavailable?: boolean;
		children?: Snippet;
	};

	let {
		icon,
		label,
		tooltip = label,
		active = false,
		unavailable = false,
		children: content,
		...rest
	}: Props = $props();
</script>

<Tooltip align="end" placement="bottom" text={tooltip}>
	{#snippet children(describedby)}
		<button
			class="stage-button"
			class:active
			class:unavailable
			aria-describedby={describedby}
			aria-label={label}
			type="button"
			{...rest}
		>
			<Icon {icon} size="sm" />
			{@render content?.()}
		</button>
	{/snippet}
</Tooltip>

<style>
	.stage-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		cursor: pointer;
		opacity: 0.6;
	}

	.stage-button:hover,
	.stage-button:focus-visible,
	.stage-button.active {
		opacity: 1;
	}

	.stage-button.unavailable {
		cursor: default;
		opacity: 0.2;
	}
</style>
