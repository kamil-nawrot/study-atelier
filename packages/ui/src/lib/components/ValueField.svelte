<script lang="ts" module>
	export type ValueOption = {
		kind: 'similar' | 'existing' | 'starting' | 'new';
		name: string;
	};
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = {
		label: string;
		values?: string[];
		query?: string;
		options?: readonly ValueOption[];
		single?: boolean;
		disabled?: boolean;
		hint?: string;
		error?: string;
		placeholder?: string;
		id?: string;
	};

	let {
		label,
		values = $bindable([]),
		query = $bindable(''),
		options = [],
		single = false,
		disabled = false,
		hint,
		error,
		placeholder,
		id
	}: Props = $props();

	const texts = uiMessages().valueField;
	const kinds: ValueOption['kind'][] = ['similar', 'existing', 'starting', 'new'];

	const generatedId = $props.id();
	const inputId = $derived(id ?? generatedId);
	const listId = $derived(`${inputId}-list`);
	const messageId = $derived(`${inputId}-message`);
	const message = $derived(error ?? hint);

	const ordered = $derived(
		kinds.flatMap((kind) => options.filter((option) => option.kind === kind))
	);
	const groups = $derived(
		(['existing', 'starting'] as const)
			.map((kind) => ({
				kind,
				title: texts[kind],
				items: ordered.filter((option) => option.kind === kind)
			}))
			.filter((group) => group.items.length > 0)
	);
	const similar = $derived(ordered.find((option) => option.kind === 'similar'));
	const added = $derived(ordered.find((option) => option.kind === 'new'));
	const full = $derived(single && values.length > 0);

	let control: HTMLDivElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let open = $state(false);
	let active = $state(0);

	const expanded = $derived(open && !disabled && !full && ordered.length > 0);
	const activeIndex = $derived(Math.min(active, ordered.length - 1));

	function optionId(option: ValueOption): string {
		return `${inputId}-option-${ordered.indexOf(option)}`;
	}

	function show(): void {
		open = true;
		active = 0;
	}

	async function pick(option: ValueOption): Promise<void> {
		values = single ? [option.name] : [...values, option.name];
		query = '';
		open = false;
		await tick();
		if (single) control?.querySelector<HTMLButtonElement>('.remove')?.focus();
		else input?.focus();
	}

	async function remove(index: number): Promise<void> {
		values = values.filter((_, i) => i !== index);
		await tick();
		input?.focus();
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
			pick(ordered[activeIndex]);
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
		if (event.target === event.currentTarget && !disabled) {
			event.preventDefault();
			input?.focus();
		}
	}

	function onoptionpointerdown(event: PointerEvent, option: ValueOption): void {
		event.preventDefault();
		pick(option);
	}
</script>

{#snippet item(option: ValueOption, text: string, note?: string)}
	<li
		id={optionId(option)}
		class={option.kind}
		class:active={ordered.indexOf(option) === activeIndex}
		aria-selected={ordered.indexOf(option) === activeIndex}
		onpointerdown={(event) => onoptionpointerdown(event, option)}
		role="option"
	>
		<span>{text}</span>
		{#if note}
			<small>{note}</small>
		{/if}
	</li>
{/snippet}

<div class="field">
	<label for={inputId}>{label}</label>
	<div
		bind:this={control}
		class="control"
		class:disabled
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
						onclick={() => remove(index)}
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
			{disabled}
			hidden={full}
			onblur={() => (open = false)}
			onfocus={show}
			oninput={show}
			{onkeydown}
			placeholder={values.length === 0 ? placeholder : undefined}
			role="combobox"
			type="text"
			bind:value={query}
		/>
		<ul id={listId} class="list" aria-label={label} hidden={!expanded} role="listbox">
			{#if similar}
				{@render item(similar, texts.similar(similar.name), texts.useSimilar)}
			{/if}
			{#each groups as group (group.kind)}
				<li role="presentation">
					<ul aria-labelledby={`${listId}-${group.kind}`} role="group">
						<li id={`${listId}-${group.kind}`} class="group" role="presentation">{group.title}</li>
						{#each group.items as option (option.name)}
							{@render item(option, option.name)}
						{/each}
					</ul>
				</li>
			{/each}
			{#if added}
				{@render item(added, similar ? texts.addAnyway(added.name) : texts.add(added.name))}
			{/if}
		</ul>
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
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2);
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

	.control.disabled {
		border-color: var(--color-fg-muted);
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

	input {
		flex: 1;
		min-width: 120px;
		padding: var(--spacing-1);
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

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
