<script lang="ts">
	import type { ChoiceTile } from '../../types/choice-tile';
	import Icon from '../Icon/Icon.svelte';

	type Props = {
		label: string;
		options: readonly ChoiceTile[];
		value?: string | null;
		clearable?: boolean;
		columns?: number;
		narrowColumns?: number;
		disabled?: boolean;
		onchange?: (value: string | null) => void;
	};

	let {
		label,
		options,
		value = $bindable(null),
		clearable = false,
		columns,
		narrowColumns,
		disabled = false,
		onchange
	}: Props = $props();

	const groupName = $props.id();

	function choose(next: string | null): void {
		value = next;
		onchange?.(next);
	}

	function clearChosen(event: Event, option: ChoiceTile): void {
		if (!clearable || value !== option.value) return;
		(event.currentTarget as HTMLInputElement).checked = false;
		choose(null);
	}

	function onkeydown(event: KeyboardEvent, option: ChoiceTile): void {
		if (event.key !== ' ' || !clearable || value !== option.value) return;
		event.preventDefault();
		clearChosen(event, option);
	}
</script>

<fieldset
	style:--columns={columns ?? options.length}
	style:--narrow-columns={narrowColumns ?? (options.length === 4 ? 2 : 3)}
	{disabled}
>
	<legend>{label}</legend>
	<div class="tiles">
		{#each options as option (option.value)}
			<label class="tile" class:selected={value === option.value}>
				<input
					name={groupName}
					checked={value === option.value}
					onchange={() => choose(option.value)}
					onclick={(event) => clearChosen(event, option)}
					onkeydown={(event) => onkeydown(event, option)}
					type="radio"
					value={option.value}
				/>
				{#if option.icon}
					<Icon icon={option.icon} />
				{/if}
				<span class="label">{option.label}</span>
				{#if option.note}
					<span class="note">{option.note}</span>
				{/if}
			</label>
		{/each}
	</div>
</fieldset>

<style>
	fieldset {
		container-type: inline-size;
		display: grid;
		gap: var(--spacing-2);
		min-width: 0;
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

	.tiles {
		display: grid;
		grid-template-columns: repeat(var(--narrow-columns), minmax(0, 1fr));
		gap: var(--border-width-base);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-line);
	}

	.tile {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: start;
		gap: var(--spacing-1);
		padding: var(--spacing-3) var(--spacing-2);
		background: var(--color-bg);
		color: var(--color-fg);
		text-align: center;
		cursor: pointer;
	}

	.tile:hover:not(.selected) {
		background: var(--color-surface);
	}

	.tile.selected {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.tile:has(input:focus-visible) {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(-3 * var(--border-width-base));
	}

	.tile.selected:has(input:focus-visible) {
		outline-color: var(--color-on-fg);
	}

	input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}

	.label {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		text-wrap: balance;
	}

	.note {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		white-space: nowrap;
	}

	.tile.selected .note {
		color: var(--color-on-fg);
	}

	fieldset:disabled .tile {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	@container (min-width: 600px) {
		.tiles {
			grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		}
	}
</style>
