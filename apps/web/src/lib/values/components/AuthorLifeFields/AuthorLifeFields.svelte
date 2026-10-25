<script lang="ts">
	import { Checkbox, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';
	import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
	import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';

	type Props = {
		author: AuthorFormState;
		errors: AuthorFieldErrors;
	};

	let { author = $bindable(), errors }: Props = $props();
</script>

<YearGroup columns title={m.valueForm.lifeYears}>
	{#snippet aside()}
		<Checkbox label={m.artworkForm.yearApproximate} bind:checked={author.yearsApproximate} />
	{/snippet}
	<YearInput
		beforeCommonEraLabel={m.valueForm.birthBeforeCommonEra}
		error={errors.birthYear}
		label={m.valueForm.birthYear}
		placeholder={m.valueForm.birthYear}
		bind:value={author.birthYear}
		bind:beforeCommonEra={author.birthBeforeCommonEra}
	/>
	<YearInput
		beforeCommonEraLabel={m.valueForm.deathBeforeCommonEra}
		error={errors.deathYear}
		label={m.valueForm.deathYear}
		placeholder={m.valueForm.deathYear}
		bind:value={author.deathYear}
		bind:beforeCommonEra={author.deathBeforeCommonEra}
	/>
</YearGroup>

<div class="sort">
	<Checkbox label={m.valueForm.sortByOther} bind:checked={author.sortByOther} />
	{#if author.sortByOther}
		<TextField
			autocomplete="off"
			hint={m.valueForm.sortNameHint}
			label={m.valueForm.sortName}
			placeholder={m.valueForm.sortNamePlaceholder}
			bind:value={author.sortName}
		/>
	{/if}
</div>

<style>
	.sort {
		display: grid;
		gap: var(--spacing-3);
	}
</style>
