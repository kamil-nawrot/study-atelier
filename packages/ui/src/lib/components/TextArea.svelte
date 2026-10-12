<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Omit<HTMLTextareaAttributes, 'value'> & {
		label: string;
		value?: string;
		hint?: string;
		error?: string;
	};

	let { label, value = $bindable(''), hint, error, id, rows = 5, ...rest }: Props = $props();

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);
</script>

<div class="field">
	<label for={inputId}>{label}</label>
	<textarea
		id={inputId}
		class:invalid={!!error}
		aria-describedby={message ? messageId : undefined}
		aria-invalid={error ? true : undefined}
		{rows}
		bind:value
		{...rest}></textarea>
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

	textarea {
		min-width: 0;
		padding: var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		resize: vertical;
	}

	textarea.invalid {
		border-color: var(--color-danger);
	}

	textarea::placeholder {
		color: var(--color-fg-muted);
	}

	textarea:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
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
