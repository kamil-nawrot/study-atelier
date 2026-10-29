<script lang="ts">
	import { Select, Tag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { ERA_CODES, eraName } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		eraCodes: EraCode[];
	};

	let { eraCodes = $bindable() }: Props = $props();

	let eraOptions = $derived(
		ERA_CODES.filter((code) => !eraCodes.includes(code)).map((code) => ({
			value: code,
			label: eraName(code)
		}))
	);

	function addEra(code: string): void {
		if (!code) return;
		eraCodes = ERA_CODES.filter((era) => era === code || eraCodes.includes(era));
	}

	function removeEra(code: EraCode): void {
		eraCodes = eraCodes.filter((era) => era !== code);
	}
</script>

<fieldset>
	<legend>{m.valueForm.eras}</legend>
	{#if eraCodes.length === 0}
		<p class="muted">{m.valueForm.noEras}</p>
	{:else}
		<div class="tags">
			{#each eraCodes as code (code)}
				<Tag onremove={() => removeEra(code)} removeLabel={m.valueForm.removeEra(eraName(code))}>
					{eraName(code)}
				</Tag>
			{/each}
		</div>
	{/if}
	{#if eraOptions.length > 0}
		<Select
			label={m.valueForm.addEra}
			onchange={(event) => {
				addEra(event.currentTarget.value);
				event.currentTarget.value = '';
			}}
			options={eraOptions}
			placeholder={m.valueForm.chooseEra}
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
