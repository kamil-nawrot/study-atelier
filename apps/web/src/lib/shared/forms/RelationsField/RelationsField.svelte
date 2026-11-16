<script generics="Row extends { key: string; type: string }" lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { tick, type Snippet } from 'svelte';
	import {
		FieldMessage,
		Icon,
		IconButton,
		Select,
		TextButton,
		type SelectOption
	} from '@study-atelier/ui';

	type Texts = {
		add: string;
		title: string;
		type: string;
		choose: string;
		removeEmpty: string;
	};

	type Props = {
		rows: Row[];
		error?: string;
		texts: Texts;
		options: readonly SelectOption[];
		emptyRow: () => Row;
		hasTarget: (row: Row) => boolean;
		removeLabel: (row: Row) => string;
		onchoose: (row: Row, value: string) => void;
		search: Snippet<[row: Row, invalid: boolean]>;
	};

	let {
		rows = $bindable(),
		error,
		texts,
		options,
		emptyRow,
		hasTarget,
		removeLabel,
		onchoose,
		search
	}: Props = $props();

	const fieldId = $props.id();

	async function add(): Promise<void> {
		const row = emptyRow();
		rows = [...rows, row];
		await tick();
		document.getElementById(`${fieldId}-${row.key}-type`)?.focus();
	}

	function remove(key: string): void {
		rows = rows.filter((row) => row.key !== key);
	}
</script>

{#snippet addButton()}
	<div class="add">
		<TextButton inline onclick={add}>
			<Icon icon={Plus} size="sm" />
			{texts.add}
		</TextButton>
	</div>
{/snippet}

{#if rows.length === 0}
	{@render addButton()}
{:else}
	<fieldset class="field" aria-describedby={error ? `${fieldId}-message` : undefined}>
		<legend>{texts.title}</legend>
		<ul class="rows">
			{#each rows as row (row.key)}
				<li class="row">
					<Select
						id="{fieldId}-{row.key}-type"
						aria-invalid={error && row.type === '' && hasTarget(row) ? true : undefined}
						compact
						hideLabel
						label={texts.type}
						onchange={(event) => onchoose(row, event.currentTarget.value)}
						{options}
						placeholder={texts.choose}
						placeholderUntilChosen
						value={row.type}
					/>
					{@render search(row, !!error && !hasTarget(row) && row.type !== '')}
					<IconButton
						icon={X}
						label={hasTarget(row) ? removeLabel(row) : texts.removeEmpty}
						onclick={() => remove(row.key)}
						tone="danger"
						variant="plain"
					/>
				</li>
			{/each}
		</ul>
		{#if error}
			<FieldMessage id="{fieldId}-message" {error} live />
		{/if}
		{@render addButton()}
	</fieldset>
{/if}

<style>
	.add {
		display: flex;
	}

	.add :global(.text-button) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	.field {
		display: grid;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0 0 var(--spacing-2);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.rows {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr) auto;
		gap: var(--spacing-3);
		align-items: start;
	}

	@media (max-width: 767.98px) {
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.row > :global(:nth-child(2)) {
			grid-row: 2;
			grid-column: 1 / -1;
		}
	}
</style>
