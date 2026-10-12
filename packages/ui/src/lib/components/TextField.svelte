<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = Omit<HTMLInputAttributes, 'type' | 'value'> & {
		label: string;
		value?: string;
		type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
		hint?: string;
		error?: string;
		showPasswordLabel?: string;
		hidePasswordLabel?: string;
		labelAside?: Snippet;
	};

	let {
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error,
		showPasswordLabel = uiMessages().showPassword,
		hidePasswordLabel = uiMessages().hidePassword,
		labelAside,
		id,
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);

	let passwordVisible = $state(false);
	const inputType = $derived(type === 'password' && passwordVisible ? 'text' : type);
</script>

<div class="field">
	<div class="label-row">
		<label for={inputId}>{label}</label>
		{@render labelAside?.()}
	</div>
	<div class="control" class:invalid={!!error}>
		<input
			id={inputId}
			aria-describedby={message ? messageId : undefined}
			aria-invalid={error ? true : undefined}
			type={inputType}
			bind:value
			{...rest}
		/>
		{#if type === 'password'}
			<button
				class="reveal"
				aria-controls={inputId}
				aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
				onclick={() => (passwordVisible = !passwordVisible)}
				title={passwordVisible ? hidePasswordLabel : showPasswordLabel}
				type="button"
			>
				{#if passwordVisible}
					<Icon icon={EyeOff} size="sm" />
				{:else}
					<Icon icon={Eye} size="sm" />
				{/if}
			</button>
		{/if}
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

	.label-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-3);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.control {
		display: flex;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
	}

	.control.invalid {
		border-color: var(--color-danger);
	}

	.field:has(input:disabled) label {
		color: var(--color-fg-muted);
	}

	.control:has(input:disabled) {
		border-color: var(--color-tag);
		background: var(--color-tag);
	}

	input {
		flex: 1;
		min-width: 0;
		padding: var(--spacing-3);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	input::placeholder {
		color: var(--color-fg-muted);
	}

	input:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.reveal {
		display: grid;
		place-content: center;
		padding: 0 var(--spacing-3);
		border: none;
		border-left: var(--border-width-hairline) solid var(--color-fg-muted);
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.reveal:hover {
		color: var(--color-fg);
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
