<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		level?: 2 | 3 | 4;
		count?: number;
		icon?: LucideIcon;
		muted?: boolean;
		open?: boolean;
		lazy?: boolean;
		id?: string;
		ontoggle?: (open: boolean) => void;
		children: Snippet;
	};

	let {
		title,
		level = 2,
		count,
		icon,
		muted = false,
		open = $bindable(true),
		lazy = false,
		id,
		ontoggle,
		children
	}: Props = $props();
</script>

<details
	class="disclosure"
	class:muted
	ontoggle={(event) => ontoggle?.(event.currentTarget.open)}
	bind:open
>
	<summary>
		<svelte:element this={`h${level}`} {id} class="heading">
			{#if icon}
				<Icon {icon} size={level === 2 ? 'md' : 'sm'} />
			{/if}
			{title}
			{#if count !== undefined}
				<span class="count">{count}</span>
			{/if}
		</svelte:element>
		<Icon icon={ChevronDown} size="sm" />
	</summary>
	{#if open || !lazy}
		{@render children()}
	{/if}
</details>

<style>
	summary {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		width: fit-content;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.disclosure[open] > summary {
		margin-bottom: var(--spacing-4);
	}

	.disclosure[open] > summary > :global(svg) {
		rotate: 180deg;
	}

	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.count {
		min-width: 16px;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.muted .heading {
		color: var(--color-fg-muted);
		font-weight: var(--font-weight-medium);
	}

	.muted .count {
		outline: var(--border-width-hairline) solid var(--color-fg-muted);
		outline-offset: calc(-1 * var(--border-width-hairline));
		background: transparent;
		color: var(--color-fg-muted);
	}

	@media (prefers-reduced-motion: no-preference) {
		summary > :global(svg) {
			transition: rotate var(--duration-short) ease-out;
		}
	}
</style>
