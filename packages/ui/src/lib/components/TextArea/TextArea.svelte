<script lang="ts">
	import FieldMessage from '../FieldMessage/FieldMessage.svelte';
	import FillingLines from '../FillingLines/FillingLines.svelte';
	import { overlayScrollbarBeside } from '../../overlay-scrollbar/overlay-scrollbar.ts';
	import type { Snippet } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Omit<HTMLTextareaAttributes, 'value'> & {
		label: string;
		value?: string;
		hint?: string;
		error?: string;
		counter?: boolean;
		filling?: boolean;
		fillingNote?: Snippet;
	};

	let {
		label,
		value = $bindable(''),
		hint,
		error,
		counter = false,
		filling = false,
		fillingNote,
		disabled,
		id,
		rows = 5,
		maxlength,
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const messageId = $derived(`${inputId}-message`);
	const counterId = $derived(`${inputId}-counter`);
	const message = $derived(error ?? hint);
	const counted = $derived(counter && typeof maxlength === 'number');
	const full = $derived(counted && value.length >= (maxlength ?? 0));
	const describedBy = $derived(
		[message ? messageId : '', counted ? counterId : ''].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="field">
	<label for={inputId}>{label}</label>
	<div class="control" class:filling>
		<textarea
			id={inputId}
			class:invalid={!!error}
			{@attach overlayScrollbarBeside()}
			aria-busy={filling || undefined}
			aria-describedby={describedBy}
			aria-invalid={error ? true : undefined}
			{disabled}
			{maxlength}
			readonly={filling || undefined}
			{rows}
			bind:value
			{...rest}></textarea>
		{#if filling}
			<FillingLines lines={Math.max(1, Math.min(4, Number(rows) - 2))} />
			{#if fillingNote}
				<div class="note">{@render fillingNote()}</div>
			{/if}
		{/if}
	</div>
	{#if message || counted}
		<div class="messages">
			{#if message}
				<FieldMessage id={messageId} {error} {hint} />
			{/if}
			{#if counted}
				<span class="counter">
					<FieldMessage
						id={counterId}
						error={full ? `${value.length}/${maxlength}` : undefined}
						hint={`${value.length}/${maxlength}`}
					/>
				</span>
			{/if}
		</div>
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
		--filling-inset: var(--border-width-base);

		position: relative;
		display: grid;
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

	.field:has(textarea:disabled) label {
		color: var(--color-fg-muted);
	}

	.control.filling textarea,
	.control.filling textarea::placeholder {
		color: transparent;
		caret-color: transparent;
	}

	.note {
		position: absolute;
		right: var(--spacing-3);
		bottom: var(--spacing-2);
		left: var(--spacing-3);
	}

	textarea:disabled {
		border-color: var(--color-tag);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.messages {
		display: flex;
		gap: var(--spacing-3);
	}

	.counter {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}
</style>
