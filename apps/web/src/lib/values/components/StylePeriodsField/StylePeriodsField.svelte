<script lang="ts">
	import { Select, Tag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { findRecord, lockedPeriodIds, valuesOf } from '#lib/card-index/card-index/card-index.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';

	type Props = {
		index: CardIndexData;
		styleId: string;
		periodIds: string[];
	};

	let { index, styleId, periodIds = $bindable() }: Props = $props();

	let locked = $derived(lockedPeriodIds(index, styleId));
	let periodOptions = $derived(
		valuesOf(index, 'period')
			.filter((period) => !periodIds.includes(period.id))
			.map((period) => ({ value: period.id, label: period.name }))
	);
	let selectedPeriods = $derived(
		periodIds.flatMap((id) => {
			const period = findRecord(index, id);
			return period ? [period] : [];
		})
	);

	function addPeriod(id: string): void {
		if (id) periodIds = [...periodIds, id];
	}

	function removePeriod(id: string): void {
		periodIds = periodIds.filter((period) => period !== id);
	}
</script>

<fieldset>
	<legend>{m.valueForm.periods}</legend>
	{#if selectedPeriods.length === 0}
		<p class="muted">{m.valueForm.noPeriods}</p>
	{:else}
		<div class="tags">
			{#each selectedPeriods as period (period.id)}
				<Tag
					onremove={() => removePeriod(period.id)}
					removeDisabled={locked.has(period.id)}
					removeLabel={m.valueForm.removePeriod(period.name)}
				>
					{period.name}
				</Tag>
			{/each}
		</div>
		{#each selectedPeriods.filter((period) => locked.has(period.id)) as period (period.id)}
			<p class="muted">
				{m.valueForm.periodLocked(period.name, locked.get(period.id) ?? 0)}
			</p>
		{/each}
	{/if}
	{#if periodOptions.length > 0}
		<Select
			label={m.valueForm.addPeriod}
			onchange={(event) => {
				addPeriod(event.currentTarget.value);
				event.currentTarget.value = '';
			}}
			options={periodOptions}
			placeholder={m.valueForm.choosePeriod}
		/>
	{/if}
</fieldset>

<style>
	fieldset {
		display: grid;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		margin-bottom: var(--spacing-2);
		padding: 0;
		font-weight: var(--font-weight-medium);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.muted {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
