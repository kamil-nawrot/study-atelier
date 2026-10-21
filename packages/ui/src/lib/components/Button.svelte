<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type CompactProps =
		| { compact?: false; icon?: LucideIcon }
		| { compact: true; icon: LucideIcon; 'aria-label': string };

	type CommonProps = CompactProps & {
		variant?: 'primary' | 'secondary' | 'danger';
		fullWidth?: boolean;
		children: Snippet;
	};

	type ButtonProps = CommonProps & HTMLButtonAttributes & { href?: undefined };

	type LinkProps = CommonProps & HTMLAnchorAttributes & { href: string };

	type Props = ButtonProps | LinkProps;

	let {
		variant = 'secondary',
		fullWidth = false,
		icon,
		compact = false,
		children,
		...rest
	}: Props = $props();
</script>

{#snippet content()}
	{#if icon}
		<Icon {icon} size="sm" />
	{/if}
	{#if compact}
		<span class="label">
			{@render children()}
		</span>
	{:else}
		{@render children()}
	{/if}
{/snippet}

{#if rest.href === undefined}
	<button
		class="button {variant}"
		class:full-width={fullWidth}
		type="button"
		{...rest as HTMLButtonAttributes}
	>
		{@render content()}
	</button>
{:else}
	<a class="button {variant}" class:full-width={fullWidth} {...rest as HTMLAnchorAttributes}>
		{@render content()}
	</a>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		min-height: var(--size-control);
		padding: 0 var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		border-bottom-width: var(--border-width-button);
		border-radius: var(--border-radius-none);
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
		cursor: pointer;
	}

	.danger {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.secondary:hover:not(:disabled, [aria-disabled='true']),
	.danger:hover:not(:disabled, [aria-disabled='true']) {
		border-bottom-width: var(--border-width-heavy);
		padding-top: calc(var(--border-width-heavy) - var(--border-width-button));
	}

	.primary {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.primary:hover:not(:disabled, [aria-disabled='true']) {
		border-color: var(--color-fg-muted);
		background: var(--color-fg-muted);
	}

	.button:disabled,
	.button[aria-disabled='true'] {
		border-color: var(--color-fg-muted);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.primary:disabled,
	.primary[aria-disabled='true'] {
		background: transparent;
	}

	.full-width {
		width: 100%;
	}

	.label {
		display: none;
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
