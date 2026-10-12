<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = Omit<HTMLInputAttributes, 'type' | 'value'> & {
		label: string;
		value?: string;
		clearLabel?: string;
		onclear?: () => void;
	};

	let {
		label,
		value = $bindable(''),
		clearLabel = uiMessages().clearSearch,
		onclear,
		...rest
	}: Props = $props();

	let input: HTMLInputElement;

	function clear(): void {
		value = '';
		input.focus();
		onclear?.();
	}
</script>

<div class="search">
	<Icon icon={Search} />
	<input
		bind:this={input}
		aria-label={label}
		autocomplete="off"
		enterkeyhint="search"
		type="search"
		bind:value
		{...rest}
	/>
	{#if value}
		<button class="clear" aria-label={clearLabel} onclick={clear} title={clearLabel} type="button">
			<Icon icon={X} size="sm" />
		</button>
	{/if}
</div>

<style>
	.search {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding-left: var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg-muted);
	}

	.search:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(var(--border-width-base) + var(--border-width-hairline));
	}

	input {
		flex: 1;
		min-width: 0;
		padding: var(--spacing-2) var(--spacing-3) var(--spacing-2) 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		appearance: none;
	}

	input::-webkit-search-cancel-button {
		appearance: none;
	}

	input::placeholder {
		color: var(--color-fg-muted);
	}

	.search:has(input:disabled) {
		border-color: var(--color-tag);
		background: var(--color-tag);
	}

	input:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.clear {
		display: grid;
		align-self: stretch;
		place-content: center;
		padding: 0 var(--spacing-3);
		border: none;
		border-left: var(--border-width-hairline) solid var(--color-fg-muted);
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.clear:hover {
		color: var(--color-fg);
	}

	@media (min-width: 768px) {
		input {
			padding: var(--spacing-3) var(--spacing-3) var(--spacing-3) 0;
			font-size: var(--font-size-lg);
			line-height: var(--line-height-lg);
		}
	}
</style>
