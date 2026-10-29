<script lang="ts">
	import { Checkbox, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		id?: string;
		label: string;
		placeholder?: string;
		beforeCommonEraLabel?: string;
		error?: string;
		value: string;
		beforeCommonEra: boolean;
		filling?: boolean;
	};

	let {
		id,
		label,
		placeholder,
		beforeCommonEraLabel,
		error,
		value = $bindable(),
		beforeCommonEra = $bindable(),
		filling = false
	}: Props = $props();
</script>

<div class="year">
	<TextField
		{id}
		autocomplete="off"
		{error}
		{filling}
		hideLabel
		inputmode="numeric"
		{label}
		{placeholder}
		bind:value
	/>
	<Checkbox
		aria-label={beforeCommonEraLabel}
		disabled={filling}
		label={m.artworkForm.beforeCommonEra}
		bind:checked={beforeCommonEra}
	/>
</div>

<style>
	.year {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-content: start;
		gap: var(--spacing-3);
		min-width: 0;
	}
</style>
