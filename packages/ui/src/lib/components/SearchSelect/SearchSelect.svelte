<script lang="ts" module>
	import { overlayScrollbar } from '../../overlay-scrollbar/overlay-scrollbar.ts';
	export type SearchSelectOption = {
		value: string;
		label: string;
	};

	export function searchKey(text: string): string {
		return text
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.replace(/ł/g, 'l')
			.replace(/Ł/g, 'L')
			.toLocaleLowerCase()
			.trim();
	}
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { uiMessages } from '../../messages/messages';
	import FieldMessage from '../FieldMessage/FieldMessage.svelte';
	import Icon from '../Icon/Icon.svelte';

	type Props = {
		label: string;
		options: readonly SearchSelectOption[];
		value?: string | null;
		placeholder?: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		id?: string;
	};

	let {
		label,
		options,
		value = $bindable(null),
		placeholder,
		hint,
		error,
		disabled = false,
		id
	}: Props = $props();

	const texts = uiMessages().searchSelect;

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const listId = $derived(`${inputId}-list`);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);

	let input: HTMLInputElement | undefined = $state();
	let list: HTMLUListElement | undefined = $state();
	let open = $state(false);
	let typed = $state(false);
	let query = $state('');
	let active = $state(0);

	const selected = $derived(options.find((option) => option.value === value));
	const shown = $derived(
		typed && searchKey(query) !== ''
			? options.filter((option) => searchKey(option.label).includes(searchKey(query)))
			: options
	);
	const expanded = $derived(open && !disabled);
	const activeIndex = $derived(Math.min(active, shown.length - 1));

	$effect(() => {
		if (!open) query = selected?.label ?? '';
	});

	function optionId(index: number): string {
		return `${inputId}-option-${index}`;
	}

	function show(): void {
		open = true;
		const index = shown.findIndex((option) => option.value === value);
		active = Math.max(index, 0);
		void scrollToActive();
	}

	async function scrollToActive(): Promise<void> {
		await tick();
		list?.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
	}

	function close(): void {
		open = false;
		typed = false;
		query = selected?.label ?? '';
	}

	function pick(option: SearchSelectOption): void {
		value = option.value;
		open = false;
		typed = false;
		query = option.label;
	}

	async function clear(): Promise<void> {
		value = null;
		query = '';
		await tick();
		input?.focus();
	}

	function oninput(): void {
		typed = true;
		open = true;
		active = 0;
	}

	function onfocus(): void {
		input?.select();
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
			active = Math.min(Math.max(activeIndex + step, 0), shown.length - 1);
			void scrollToActive();
		} else if (event.key === 'Enter') {
			if (!expanded) return;
			event.preventDefault();
			const option = shown[activeIndex];
			if (option) pick(option);
		} else if (event.key === 'Escape') {
			if (!expanded) return;
			event.preventDefault();
			event.stopPropagation();
			close();
		}
	}

	function onoptionpointerdown(event: PointerEvent): void {
		event.preventDefault();
	}
</script>

<div class="field">
	<label for={inputId}>{label}</label>
	<div class="control" class:disabled class:invalid={!!error}>
		<input
			bind:this={input}
			id={inputId}
			aria-activedescendant={expanded && shown.length > 0 ? optionId(activeIndex) : undefined}
			aria-autocomplete="list"
			aria-controls={listId}
			aria-describedby={message ? messageId : undefined}
			aria-expanded={expanded}
			aria-invalid={error ? true : undefined}
			autocomplete="off"
			{disabled}
			onblur={close}
			{onfocus}
			{oninput}
			{onkeydown}
			{placeholder}
			role="combobox"
			type="text"
			bind:value={query}
		/>
		{#if value !== null && !disabled}
			<button
				class="clear"
				aria-label={texts.clear(selected?.label ?? value)}
				onclick={clear}
				title={texts.clear(selected?.label ?? value)}
				type="button"
			>
				<Icon icon={X} size="sm" />
			</button>
		{/if}
		<ul
			bind:this={list}
			id={listId}
			class="list"
			{@attach overlayScrollbar()}
			aria-label={label}
			hidden={!expanded}
			role="listbox"
		>
			{#each shown as option, index (option.value)}
				<li
					id={optionId(index)}
					class:active={index === activeIndex}
					aria-selected={option.value === value}
					onpointerdown={onoptionpointerdown}
					onpointerup={() => pick(option)}
					role="option"
				>
					{option.label}
				</li>
			{:else}
				<li class="empty" role="presentation">{texts.empty}</li>
			{/each}
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
		align-items: center;
		gap: var(--spacing-2);
		min-height: var(--size-control);
		padding: 0 var(--spacing-1) 0 var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
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
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: none;
		outline: none;
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

	.clear {
		display: grid;
		place-content: center;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.clear:hover {
		color: var(--color-fg);
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

	[role='option'],
	.empty {
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	[role='option'] {
		cursor: pointer;
	}

	[role='option'].active {
		background: var(--color-tag);
	}

	[role='option'][aria-selected='true'] {
		font-weight: var(--font-weight-medium);
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
