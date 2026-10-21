<script lang="ts" module>
	import { overlayScrollbar } from '../overlay-scrollbar.ts';
	export type ValueOption = {
		kind: 'similar' | 'existing' | 'starter' | 'new';
		name: string;
		note?: string;
	};
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { uiMessages } from '../messages';
	import FieldMessage from './FieldMessage.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		label: string;
		labelHidden?: boolean;
		values?: string[];
		query?: string;
		options?: readonly ValueOption[];
		single?: boolean;
		max?: number;
		disabled?: boolean;
		locked?: boolean;
		hint?: string;
		error?: string;
		placeholder?: string;
		id?: string;
	};

	let {
		label,
		labelHidden = false,
		values = $bindable([]),
		query = $bindable(''),
		options = [],
		single = false,
		max,
		disabled = false,
		locked = false,
		hint,
		error,
		placeholder,
		id
	}: Props = $props();

	const texts = uiMessages().valueField;
	const kinds: ValueOption['kind'][] = ['similar', 'existing', 'starter', 'new'];

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const listId = $derived(`${inputId}-list`);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);

	const ordered = $derived(
		kinds.flatMap((kind) => options.filter((option) => option.kind === kind))
	);
	const existing = $derived(ordered.filter((option) => option.kind === 'existing'));
	const starter = $derived(ordered.filter((option) => option.kind === 'starter'));
	const similar = $derived(ordered.find((option) => option.kind === 'similar'));
	const added = $derived(ordered.find((option) => option.kind === 'new'));
	const full = $derived(values.length >= (single ? 1 : (max ?? Infinity)));

	let control: HTMLDivElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let open = $state(false);
	let active = $state(0);
	let quiet = false;

	const inactive = $derived(disabled || locked);
	const expanded = $derived(open && !inactive && !full && ordered.length > 0);
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
		query = '';
		if (single) {
			open = false;
			if (!keyboard) return;
			await tick();
			control?.querySelector<HTMLButtonElement>('.remove')?.focus();
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

	function onfocus(): void {
		if (quiet) quiet = false;
		else show();
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
			pick(ordered[activeIndex], true);
		} else if (event.key === 'Escape') {
			if (!expanded) return;
			event.preventDefault();
			event.stopPropagation();
			open = false;
		} else if (event.key === 'Backspace' && query === '' && values.length > 0) {
			values = values.slice(0, -1);
		}
	}

	function onfieldpointerdown(event: PointerEvent): void {
		if (event.target === event.currentTarget && !inactive) {
			event.preventDefault();
			input?.focus();
		}
	}

	function onoptionpointerdown(event: PointerEvent): void {
		event.preventDefault();
	}
</script>

{#snippet item(option: ValueOption, text: string, note?: string)}
	<li
		id={optionId(option)}
		class={option.kind}
		class:active={ordered.indexOf(option) === activeIndex}
		aria-selected={ordered.indexOf(option) === activeIndex}
		onpointerdown={onoptionpointerdown}
		onpointerup={() => pick(option)}
		role="option"
	>
		<span>{text}</span>
		{#if note}
			<small>{note}</small>
		{/if}
	</li>
{/snippet}

<div class="field">
	<label class:visually-hidden={labelHidden} for={inputId}>{label}</label>
	<div
		bind:this={control}
		class="control"
		class:disabled={inactive}
		class:invalid={!!error}
		onpointerdown={onfieldpointerdown}
		role="presentation"
	>
		{#each values as value, index (value)}
			<span class="value">
				{value}
				{#if !disabled}
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
			aria-activedescendant={expanded ? optionId(ordered[activeIndex]) : undefined}
			aria-autocomplete="list"
			aria-controls={listId}
			aria-describedby={message ? messageId : undefined}
			aria-expanded={expanded}
			aria-invalid={error ? true : undefined}
			autocomplete="off"
			disabled={inactive}
			hidden={full}
			onblur={() => (open = false)}
			{onfocus}
			oninput={show}
			{onkeydown}
			placeholder={values.length === 0 ? placeholder : undefined}
			role="combobox"
			type="text"
			bind:value={query}
		/>
		<ul
			id={listId}
			class="list"
			{@attach overlayScrollbar()}
			aria-label={label}
			hidden={!expanded}
			role="listbox"
		>
			{#if similar}
				{@render item(similar, texts.similar(similar.name), texts.useSimilar)}
			{/if}
			{#if existing.length > 0}
				<li role="presentation">
					<ul aria-labelledby={`${listId}-existing`} role="group">
						<li id={`${listId}-existing`} class="group" role="presentation">{texts.existing}</li>
						{#each existing as option (option.name)}
							{@render item(option, option.name, option.note)}
						{/each}
					</ul>
				</li>
			{/if}
			{#if starter.length > 0}
				<li role="presentation">
					<ul aria-labelledby={`${listId}-starter`} role="group">
						<li id={`${listId}-starter`} class="group" role="presentation">{texts.starter}</li>
						{#each starter as option (option.name)}
							{@render item(option, option.name, option.note)}
						{/each}
					</ul>
				</li>
			{/if}
			{#if added}
				{@render item(added, similar ? texts.addAnyway(added.name) : texts.add(added.name))}
			{/if}
		</ul>
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

	.remove {
		display: grid;
		place-content: center;
		padding: var(--spacing-1);
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.remove:hover {
		color: var(--color-fg);
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

	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		right: calc(-1 * var(--border-width-base));
		left: calc(-1 * var(--border-width-base));
		z-index: 1;
		max-height: 280px;
		margin: 0;
		padding: var(--spacing-1) 0;
		overflow-y: auto;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		list-style: none;
	}

	.list[hidden] {
		display: none;
	}

	.list ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	[role='option'] {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		cursor: pointer;
	}

	[role='option'].active {
		background: var(--color-tag);
	}

	[role='option'] small {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.group {
		padding: var(--spacing-2) var(--spacing-3) 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-xs);
		text-transform: uppercase;
	}

	.similar {
		flex-direction: column;
		gap: 0;
		border-left: var(--border-width-button) solid var(--color-line);
	}

	.new {
		font-weight: var(--font-weight-medium);
	}

	.similar ~ .new {
		color: var(--color-fg-muted);
		font-weight: var(--font-weight-regular);
	}
</style>
