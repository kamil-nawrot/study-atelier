<script lang="ts">
	import type { ChoiceTile } from '../../types/choice-tile';
	import Icon from '../Icon/Icon.svelte';

	type Tile = ChoiceTile & { count?: number };

	type Props = {
		label: string;
		options: readonly Tile[];
		values?: string[];
		columns?: number;
		onchange?: (values: string[]) => void;
	};

	let { label, options, values = $bindable([]), columns = 3, onchange }: Props = $props();

	function toggle(value: string): void {
		values = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
		onchange?.(values);
	}
</script>

<fieldset style:--columns={columns}>
	<legend>{label}</legend>
	<div class="tiles">
		{#each options as option (option.value)}
			<label class="tile" class:selected={values.includes(option.value)}>
				<input
					checked={values.includes(option.value)}
					onchange={() => toggle(option.value)}
					type="checkbox"
					value={option.value}
				/>
				{#if option.icon}
					<Icon icon={option.icon} />
				{/if}
				<span class="label">{option.label}</span>
				{#if option.note}
					<span class="note">{option.note}</span>
				{/if}
				{#if option.count !== undefined}
					<span class="count">{option.count}</span>
				{/if}
			</label>
		{/each}
	</div>
</fieldset>

<style>
	fieldset {
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
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
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
		padding: var(--spacing-3) 0;
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
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		white-space: nowrap;
	}

	.note,
	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		white-space: nowrap;
	}

	.count {
		font-variant-numeric: tabular-nums;
	}

	.tile.selected .note,
	.tile.selected .count {
		color: var(--color-on-fg);
	}
</style>
