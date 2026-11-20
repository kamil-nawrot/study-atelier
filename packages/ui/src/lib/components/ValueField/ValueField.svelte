<script lang="ts">
	import type { ValueOption } from '../../types/value-option';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { uiMessages } from '../../messages/messages';
	import FieldMessage from '../FieldMessage/FieldMessage.svelte';
	import Icon from '../Icon/Icon.svelte';
	import FillingLines from '../FillingLines/FillingLines.svelte';
	import ValueSuggestions from '../ValueSuggestions/ValueSuggestions.svelte';

	type Props = {
		label: string;
		labelHidden?: boolean;
		values?: string[];
		query?: string;
		options?: readonly ValueOption[];
		single?: boolean;
		max?: number;
		maxlength?: number;
		disabled?: boolean;
		locked?: boolean;
		filling?: boolean;
		hint?: string;
		error?: string;
		invalid?: boolean;
		placeholder?: string;
		id?: string;
		required?: boolean;
		emptyText?: string;
		onpick?: (option: ValueOption) => void;
	};

	let {
		label,
		labelHidden = false,
		values = $bindable([]),
		query = $bindable(''),
		options = [],
		single = false,
		max,
		maxlength,
		disabled = false,
		locked = false,
		filling = false,
		hint,
		error,
		invalid = false,
		placeholder,
		id,
		required = false,
		emptyText,
		onpick
	}: Props = $props();

	const texts = uiMessages().valueField;
	const kinds: ValueOption['kind'][] = ['found', 'similar', 'existing', 'starter', 'new'];

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const listId = $derived(`${inputId}-list`);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);

	const ordered = $derived(
		kinds.flatMap((kind) => options.filter((option) => option.kind === kind))
	);
	const full = $derived(!single && values.length >= (max ?? Infinity));
	const chosen = $derived(single ? values[0] : undefined);

	let control: HTMLDivElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let open = $state(false);
	let active = $state(0);
	let quiet = false;
	let typed = $state(false);

	const shownText = $derived(chosen !== undefined && !typed ? chosen : query);

	const inactive = $derived(disabled || locked);
	const empty = $derived(
		emptyText !== undefined && ordered.length === 0 && query.trim() !== '' ? emptyText : undefined
	);
	const expanded = $derived(
		open && !inactive && !filling && !full && (ordered.length > 0 || empty !== undefined)
	);
	const activeIndex = $derived(Math.min(active, ordered.length - 1));

	function optionId(option: ValueOption): string {
		return `${inputId}-option-${ordered.indexOf(option)}`;
	}

	function show(): void {
		open = true;
		active = 0;
	}

	async function pick(option: ValueOption, keyboard = false): Promise<void> {
		values = single ? [option.name] : [...values, option.name];
		onpick?.(option);
		query = '';
		typed = false;
		if (single) {
			open = false;
			if (!keyboard) return;
			await tick();
			control?.querySelector<HTMLButtonElement>('.clear')?.focus();
		} else {
			show();
			input?.focus();
		}
	}

	async function remove(index: number, event: MouseEvent): Promise<void> {
		values = values.filter((_, i) => i !== index);
		if (event.detail > 0) return;
		await tick();
		const buttons = control?.querySelectorAll<HTMLButtonElement>('.remove') ?? [];
		const next = buttons[Math.min(index, buttons.length - 1)];
		if (next) {
			next.focus();
		} else {
			quiet = true;
			input?.focus();
		}
	}

	async function clear(): Promise<void> {
		values = [];
		query = '';
		typed = false;
		await tick();
		quiet = true;
		input?.focus();
	}

	function onfocus(): void {
		if (single) input?.select();
		if (quiet) quiet = false;
		else show();
	}

	function onblur(): void {
		open = false;
		if (!single || !typed) return;
		typed = false;
		query = '';
	}

	function oninput(event: Event & { currentTarget: HTMLInputElement }): void {
		query = event.currentTarget.value;
		typed = true;
		show();
	}

	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!expanded) {
				show();
				return;
			}
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = Math.min(Math.max(activeIndex + step, 0), ordered.length - 1);
		} else if (event.key === 'Enter') {
			if (!expanded) return;
			event.preventDefault();
			const option = ordered[activeIndex];
			if (option) pick(option, true);
		} else if (event.key === 'Escape') {
			if (!expanded) return;
			event.preventDefault();
			event.stopPropagation();
			open = false;
		} else if (
			event.key === 'Backspace' &&
			!single &&
			!filling &&
			query === '' &&
			values.length > 0
		) {
			values = values.slice(0, -1);
		}
	}

	function onfieldpointerdown(event: PointerEvent): void {
		if (event.target === event.currentTarget && !inactive) {
			event.preventDefault();
			input?.focus();
		}
	}
</script>

<div class="field">
	<label class:visually-hidden={labelHidden} for={inputId}
		>{label}{#if required && !inactive}<span class="required-mark" aria-hidden="true">*</span
			>{/if}</label
	>
	<div
		bind:this={control}
		class="control"
		class:disabled={inactive}
		class:filling
		class:invalid={!!error || invalid}
		aria-busy={filling || undefined}
		onpointerdown={onfieldpointerdown}
		role="presentation"
	>
		{#each single ? [] : values as value, index (value)}
			<span class="value">
				{value}
				{#if !disabled && !filling}
					<button
						class="remove"
						aria-label={texts.remove(value)}
						onclick={(event) => remove(index, event)}
						title={texts.remove(value)}
						type="button"
					>
						<Icon icon={X} size="sm" />
					</button>
				{/if}
			</span>
		{/each}
		<input
			bind:this={input}
			id={inputId}
			aria-activedescendant={expanded && ordered.length > 0
				? optionId(ordered[activeIndex])
				: undefined}
			aria-autocomplete="list"
			aria-controls={listId}
			aria-describedby={message ? messageId : undefined}
			aria-expanded={expanded}
			aria-invalid={error || invalid ? true : undefined}
			aria-required={(required && !inactive) || undefined}
			autocomplete="off"
			disabled={inactive}
			hidden={full}
			{maxlength}
			{onblur}
			{onfocus}
			{oninput}
			{onkeydown}
			placeholder={values.length === 0 ? placeholder : undefined}
			readonly={filling || undefined}
			role="combobox"
			type="text"
			value={shownText}
		/>
		{#if chosen !== undefined && !disabled && !filling}
			<button
				class="clear"
				aria-label={texts.remove(chosen)}
				onclick={clear}
				title={texts.remove(chosen)}
				type="button"
			>
				<Icon icon={X} size="sm" />
			</button>
		{/if}
		<ValueSuggestions
			{activeIndex}
			{empty}
			{expanded}
			{label}
			{listId}
			onpick={(option) => pick(option)}
			{optionId}
			options={ordered}
		/>
		{#if filling}
			<FillingLines />
		{/if}
	</div>
	{#if message}
		<FieldMessage id={messageId} {error} {hint} />
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
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-1) var(--spacing-2);
		min-height: var(--size-control);
		padding: var(--spacing-1) var(--spacing-2);
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		cursor: text;
	}

	.control:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(var(--border-width-base) + var(--border-width-hairline));
	}

	.control.invalid {
		border-color: var(--color-danger);
	}

	.field:has(.control.disabled) label {
		color: var(--color-fg-muted);
	}

	.control.disabled {
		border-color: var(--color-tag);
		background: var(--color-tag);
		cursor: not-allowed;
	}

	.value {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: 0 0 0 var(--spacing-2);
		border: var(--border-width-hairline) solid var(--color-fg-muted);
		background: var(--color-tag);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.control.disabled .value {
		padding-right: var(--spacing-2);
		color: var(--color-fg-muted);
	}

	.remove,
	.clear {
		display: grid;
		place-content: center;
		padding: var(--spacing-1);
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.remove:hover,
	.clear:hover {
		color: var(--color-fg);
	}

	.clear {
		margin-left: auto;
	}

	.remove:focus-visible {
		outline-offset: calc(-1 * var(--border-width-base));
	}

	input {
		flex: 1;
		min-width: 120px;
		padding: 0 var(--spacing-1);
		border: none;
		outline: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	input[hidden] {
		display: none;
	}

	input::placeholder {
		color: var(--color-fg-muted);
	}

	input:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
