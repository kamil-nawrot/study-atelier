<script lang="ts" module>
	export type SelectOption = {
		value: string;
		label: string;
	};
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Props = Omit<HTMLSelectAttributes, 'value' | 'multiple' | 'children'> & {
		label: string;
		options: readonly SelectOption[];
		value?: string;
		placeholder?: string;
		hint?: string;
		error?: string;
	};

	let {
		label,
		options,
		value = $bindable(''),
		placeholder,
		hint,
		error,
		id,
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	const selectId = $derived(id ?? generatedId);
	const messageId = $derived(`${selectId}-message`);
	const message = $derived(error ?? hint);
</script>

<div class="field">
	<label for={selectId}>{label}</label>
	<div class="control" class:invalid={!!error}>
		<select
			id={selectId}
			aria-describedby={message ? messageId : undefined}
			aria-invalid={error ? true : undefined}
			{...rest}
			bind:value
		>
			{#if placeholder !== undefined}
				<option value="">{placeholder}</option>
			{/if}
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<span class="chevron">
			<Icon icon={ChevronDown} size="sm" />
		</span>
	</div>
	{#if message}
		<span id={messageId} class="message" class:error={!!error}>{message}</span>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: var(--spacing-2);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.control {
		position: relative;
		display: flex;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
	}

	.control.invalid {
		border-color: var(--color-danger);
	}

	.control:has(select:disabled) {
		border-color: var(--color-fg-muted);
	}

	select {
		appearance: none;
		flex: 1;
		min-width: 0;
		padding: var(--spacing-3) var(--spacing-12) var(--spacing-3) var(--spacing-3);
		border: none;
		border-radius: var(--border-radius-none);
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		cursor: pointer;
	}

	select:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	option {
		background: var(--color-bg);
		color: var(--color-fg);
	}

	@supports (appearance: base-select) {
		select,
		select::picker(select) {
			appearance: base-select;
		}

		select::picker-icon {
			display: none;
		}

		select::picker(select) {
			width: calc(anchor-size(width) + 2 * var(--border-width-base));
			margin: var(--border-width-base) 0 0 calc(-1 * var(--border-width-base));
			padding: var(--spacing-1) 0;
			border: var(--border-width-base) solid var(--color-line);
			border-radius: var(--border-radius-none);
			background: var(--color-bg);
			color: var(--color-fg);
		}

		option {
			padding: var(--spacing-2) var(--spacing-3);
			font-size: var(--font-size-md);
			line-height: var(--line-height-md);
			cursor: pointer;
		}

		option::checkmark {
			display: none;
		}

		option:checked {
			font-weight: var(--font-weight-medium);
		}

		option:hover,
		option:focus-visible {
			outline: none;
			background: var(--color-tag);
		}
	}

	.chevron {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		display: grid;
		place-content: center;
		padding: 0 var(--spacing-3);
		color: var(--color-fg-muted);
		pointer-events: none;
	}

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
