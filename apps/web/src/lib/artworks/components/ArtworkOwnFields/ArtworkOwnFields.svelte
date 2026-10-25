<script lang="ts">
	import { Checkbox, FieldMessage, TextField, ValueField } from '@study-atelier/ui';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { OWN_TEXT_MAX_LENGTH } from '#lib/card-index/own-fields/own-fields.ts';
	import { suggestValues } from '#lib/card-index/value-suggestions/value-suggestions.ts';
	import type { ArtworkFormState } from '#lib/artworks/types/artwork-form-state.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { ValueSuggestion } from '#lib/card-index/types/value-suggestion.ts';

	type Props = {
		form: ArtworkFormState;
		fields: OwnFieldDefinition[];
		values: Record<string, string[]>;
		idPrefix: string;
	};

	let { form = $bindable(), fields, values, idPrefix }: Props = $props();

	function ownOptions(field: OwnFieldDefinition): ValueSuggestion[] {
		return suggestValues({
			query: form.ownQueries[field.id] ?? '',
			existing: values[field.id] ?? [],
			selected: ownList(field)
		});
	}

	function ownText(field: OwnFieldDefinition): string {
		const entry = form.own?.[field.id];
		return typeof entry === 'string' ? entry : '';
	}

	function ownList(field: OwnFieldDefinition): string[] {
		const entry = form.own?.[field.id];
		return Array.isArray(entry) ? entry : [];
	}

	function ownFlag(field: OwnFieldDefinition): boolean {
		return form.own?.[field.id] === true;
	}

	function setOwn(field: OwnFieldDefinition, entry: string | string[] | boolean): void {
		if (form.own) form.own[field.id] = entry;
	}
</script>

{#each fields as field (field.id)}
	{#if field.kind === 'text'}
		<TextField
			autocomplete="off"
			hint={field.description ?? undefined}
			label={field.name}
			maxlength={OWN_TEXT_MAX_LENGTH}
			bind:value={() => ownText(field), (value) => setOwn(field, value)}
		/>
	{:else if field.kind === 'list'}
		<ValueField
			hint={field.description ?? undefined}
			label={field.name}
			maxlength={VALUE_NAME_MAX_LENGTH}
			options={ownOptions(field)}
			single={!field.multiple}
			bind:query={
				() => form.ownQueries[field.id] ?? '', (query) => (form.ownQueries[field.id] = query)
			}
			bind:values={() => ownList(field), (values) => setOwn(field, values)}
		/>
	{:else}
		<div class="group">
			<Checkbox
				aria-describedby={field.description ? `${idPrefix}-own-${field.id}` : undefined}
				label={field.name}
				bind:checked={() => ownFlag(field), (checked) => setOwn(field, checked)}
			/>
			{#if field.description}
				<FieldMessage id="{idPrefix}-own-{field.id}" hint={field.description} />
			{/if}
		</div>
	{/if}
{/each}

<style>
	.group {
		display: grid;
		gap: var(--spacing-3);
	}
</style>
