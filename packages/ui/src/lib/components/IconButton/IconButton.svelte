<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from '../Icon/Icon.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';

	type Props = Omit<HTMLButtonAttributes, 'aria-label' | 'children'> & {
		icon: LucideIcon;
		label: string;
		variant?: 'secondary' | 'danger';
	};

	let { icon, label, variant = 'secondary', ...rest }: Props = $props();
</script>

<Tooltip text={label}>
	{#snippet children(describedby)}
		<button
			class="icon-button {variant}"
			aria-describedby={describedby}
			aria-label={label}
			type="button"
			{...rest}
		>
			<Icon {icon} size="sm" />
		</button>
	{/snippet}
</Tooltip>

<style>
	.icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		border: var(--border-width-base) solid var(--color-line);
		border-bottom-width: var(--border-width-button);
		border-radius: var(--border-radius-none);
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.danger {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.icon-button:hover:not(:disabled) {
		border-bottom-width: var(--border-width-heavy);
		padding-top: calc(var(--border-width-heavy) - var(--border-width-button));
	}

	.icon-button:disabled {
		border-color: var(--color-fg-muted);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
