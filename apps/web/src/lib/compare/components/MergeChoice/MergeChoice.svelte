<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Icon } from '@study-atelier/ui';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		picked: boolean;
		onpick: () => void;
		children: Snippet;
	};

	let { label, picked, onpick, children }: Props = $props();
</script>

<button
	class="choice"
	class:picked
	aria-label={label}
	aria-pressed={picked}
	onclick={onpick}
	type="button"
>
	{@render children()}
	<span class="mark" aria-hidden="true">
		{#if picked}
			<Icon icon={Check} size="xs" />
		{/if}
	</span>
</button>

<style>
	.choice {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
		min-height: var(--size-control);
		padding: var(--spacing-3) var(--spacing-12) var(--spacing-3) var(--spacing-4);
		border: var(--border-width-hairline) solid var(--color-line);
		background: transparent;
		color: var(--color-fg-muted);
		font: inherit;
		text-align: start;
		overflow-wrap: break-word;
		cursor: pointer;
	}

	.choice:hover:not(.picked) {
		background: var(--color-surface);
	}

	.choice.picked {
		border: var(--border-width-base) solid var(--color-highlight);
		background: color-mix(in srgb, var(--color-highlight) 10%, transparent);
		color: var(--color-fg);
	}

	.choice:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.mark {
		position: absolute;
		top: 50%;
		right: var(--spacing-3);
		display: grid;
		place-items: center;
		width: calc(var(--spacing-4) + var(--spacing-1));
		height: calc(var(--spacing-4) + var(--spacing-1));
		border: var(--border-width-base) solid var(--color-line);
		translate: 0 -50%;
	}

	.picked .mark {
		border-color: var(--color-highlight);
		background: var(--color-highlight);
		color: var(--color-bg);
	}
</style>
