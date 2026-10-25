<script lang="ts">
	import { FieldMessage, Select, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { monthNames } from '#lib/chronicle/visit-date/visit-date.ts';
	import type { VisitFormErrors } from '#lib/chronicle/types/visit-form-errors.ts';

	type Props = {
		day: string;
		month: string;
		year: string;
		errors: VisitFormErrors;
	};

	let { day = $bindable(), month = $bindable(), year = $bindable(), errors }: Props = $props();

	const hintId = $props.id();
	const months = monthNames().map((name, index) => ({ value: String(index + 1), label: name }));
</script>

<fieldset class="date" aria-describedby={hintId}>
	<legend>{m.chronicle.form.date}</legend>
	<div class="parts">
		<TextField
			autocomplete="off"
			error={errors.day}
			hideLabel
			inputmode="numeric"
			label={m.chronicle.form.day}
			maxlength={2}
			placeholder={m.chronicle.form.day}
			bind:value={day}
		/>
		<Select
			error={errors.month}
			hideLabel
			label={m.chronicle.form.month}
			options={months}
			placeholder={m.chronicle.form.month}
			bind:value={month}
		/>
		<TextField
			autocomplete="off"
			error={errors.year}
			hideLabel
			inputmode="numeric"
			label={m.chronicle.form.year}
			maxlength={4}
			placeholder={m.chronicle.form.year}
			bind:value={year}
		/>
	</div>
	<FieldMessage id={hintId} hint={m.chronicle.form.dateHint} />
</fieldset>

<style>
	.date {
		display: grid;
		gap: var(--spacing-2);
		min-width: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.parts {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
		align-items: start;
		gap: var(--spacing-3);
	}
</style>
