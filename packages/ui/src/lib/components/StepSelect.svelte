<script lang="ts" module>
	export type StepOption = {
		value: string;
		label: string;
	};
</script>

<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Icon from './Icon.svelte';

	type Props = {
		label: string;
		options: readonly StepOption[];
		value?: string;
		summary?: string;
		icon?: LucideIcon;
		inline?: boolean;
		disabled?: boolean;
	};

	let {
		label,
		options,
		value = $bindable(options[0]?.value ?? ''),
		summary,
		icon,
		inline = false,
		disabled = false
	}: Props = $props();

	const id = $props.id();
	const listId = `${id}-list`;

	let open = $state(false);
	let active = $state(0);

	let chosen = $derived(
		Math.max(
			0,
			options.findIndex((option) => option.value === value)
		)
	);

	function optionId(index: number): string {
		return `${id}-option-${index}`;
	}

	function included(index: number): boolean {
		return index === chosen || (index > 0 && index < chosen);
	}

	function show(): void {
		active = chosen;
		open = true;
	}

	function choose(index: number): void {
		value = options[index].value;
		open = false;
	}

	function onkeydown(event: KeyboardEvent): void {
		const last = options.length - 1;
		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
				event.preventDefault();
				show();
			}
			return;
		}
		if (event.key === 'ArrowDown') active = Math.min(last, active + 1);
		else if (event.key === 'ArrowUp') active = Math.max(0, active - 1);
		else if (event.key === 'Home') active = 0;
		else if (event.key === 'End') active = last;
		else if (event.key === 'Enter' || event.key === ' ') choose(active);
		else if (event.key === 'Escape') open = false;
		else if (event.key === 'Tab') {
			open = false;
			return;
		} else return;
		event.preventDefault();
	}

	function closeOutside(element: HTMLElement): () => void {
		const pointerdown = (event: PointerEvent): void => {
			if (open && !element.contains(event.target as Node)) open = false;
		};
		document.addEventListener('pointerdown', pointerdown);
		return () => document.removeEventListener('pointerdown', pointerdown);
	}
</script>

{#snippet step(option: StepOption, index: number)}
	<span class="check">
		{#if included(index)}
			<Icon icon={Check} size="sm" />
		{/if}
	</span>
	<span style:--step={Math.max(0, index - 1)} class="label" class:nested={index > 1}>
		{option.label}
	</span>
{/snippet}

{#if inline}
	<fieldset class="inline" {disabled}>
		<legend>{label}</legend>
		{#each options as option, index (option.value)}
			<label class="step" class:included={included(index)}>
				<input name={id} checked={index === chosen} onchange={() => choose(index)} type="radio" />
				{@render step(option, index)}
			</label>
		{/each}
	</fieldset>
{:else}
	<div class="select" {@attach closeOutside}>
		<button
			class="control"
			aria-activedescendant={open ? optionId(active) : undefined}
			aria-controls={listId}
			aria-expanded={open}
			aria-haspopup="listbox"
			aria-label={label}
			{disabled}
			onblur={() => (open = false)}
			onclick={() => (open ? (open = false) : show())}
			{onkeydown}
			role="combobox"
			type="button"
		>
			{#if icon}
				<Icon {icon} />
			{/if}
			<span class="summary">{summary ?? options[chosen]?.label}</span>
			<span class="chevron">
				<Icon icon={ChevronDown} size="sm" />
			</span>
		</button>
		<ul id={listId} class="list" aria-label={label} hidden={!open} role="listbox">
			{#each options as option, index (option.value)}
				<li
					id={optionId(index)}
					class="step"
					class:active={open && index === active}
					class:included={included(index)}
					aria-selected={index === chosen}
					onpointerdown={(event) => event.preventDefault()}
					onpointerenter={() => (active = index)}
					onpointerup={() => choose(index)}
					role="option"
				>
					{@render step(option, index)}
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.select {
		position: relative;
	}

	.control {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-height: var(--size-control);
		padding: 0 var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		white-space: nowrap;
		cursor: pointer;
	}

	.control:disabled {
		border-color: var(--color-tag);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.chevron {
		display: grid;
		color: var(--color-fg-muted);
	}

	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		left: 0;
		z-index: 1;
		min-width: 100%;
		margin: 0;
		padding: var(--spacing-1) 0;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		list-style: none;
	}

	.list[hidden] {
		display: none;
	}

	.step {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-4) var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		white-space: nowrap;
		cursor: pointer;
	}

	.step.active {
		background: var(--color-tag);
	}

	.step.included {
		font-weight: var(--font-weight-medium);
	}

	.check {
		display: grid;
		flex: none;
		width: 20px;
	}

	.label {
		position: relative;
		padding-inline-start: calc(var(--step) * var(--spacing-6));
	}

	.label.nested::before {
		position: absolute;
		top: calc(-1 * var(--spacing-3));
		left: calc((var(--step) - 1) * var(--spacing-6) + var(--spacing-2));
		width: var(--spacing-3);
		height: calc(var(--spacing-3) + 0.6em);
		border-bottom: var(--border-width-base) solid var(--color-fg-muted);
		border-left: var(--border-width-base) solid var(--color-fg-muted);
		content: '';
	}

	.inline {
		display: grid;
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		margin-bottom: var(--spacing-2);
		padding: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.inline .step {
		padding-inline: 0;
	}

	.inline input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.inline .step:has(input:focus-visible) {
		outline: var(--border-width-button) solid var(--color-fg);
	}
</style>
