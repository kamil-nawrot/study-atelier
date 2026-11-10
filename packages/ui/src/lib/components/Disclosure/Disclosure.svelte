<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';
	import Count from '../Count/Count.svelte';
	import Icon from '../Icon/Icon.svelte';

	type Props = {
		title: string;
		level?: 2 | 3 | 4;
		count?: number;
		icon?: LucideIcon;
		muted?: boolean;
		plain?: boolean;
		room?: boolean;
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
		plain = false,
		room = false,
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
	class:plain
	class:room
	ontoggle={(event) => ontoggle?.(event.currentTarget.open)}
	bind:open
>
	<summary>
		{#if plain}
			<span {id} class="heading">{title}</span>
		{:else}
			<svelte:element this={`h${level}`} {id} class="heading">
				{#if icon}
					<Icon {icon} size={level === 2 ? 'md' : 'sm'} />
				{/if}
				{title}
				{#if count !== undefined}
					<Count outlined={muted} value={count} />
				{/if}
			</svelte:element>
		{/if}
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

	.muted .heading {
		color: var(--color-fg-muted);
		font-weight: var(--font-weight-medium);
	}

	.muted h2.heading {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	.plain > summary {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.plain[open] > summary {
		margin-bottom: var(--spacing-6);
	}

	.room {
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.room > summary {
		justify-content: space-between;
		gap: var(--spacing-4);
		width: 100%;
	}

	.room .heading {
		gap: var(--spacing-3);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.room[open] > summary {
		margin-bottom: var(--spacing-6);
	}

	@media (prefers-reduced-motion: no-preference) {
		summary > :global(svg) {
			transition: rotate var(--duration-short) ease-out;
		}
	}
</style>
