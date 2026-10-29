<script lang="ts">
	import { Alert, Button, Dialog, Form, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { planOwnValueChange } from '#lib/card-index/own-fields/own-fields.ts';
	import { addOwnValue } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';

	type Props = {
		open?: boolean;
		field?: OwnField;
		onsaved: (message: string) => Promise<void>;
	};

	let { open = $bindable(false), field, onsaved }: Props = $props();

	const formId = $props.id();

	let name = $state('');
	let nameError = $state<string>();
	let failure = $state<string>();
	let saving = $state(false);

	$effect(() => {
		if (!open) return;
		name = '';
		nameError = undefined;
		failure = undefined;
	});

	async function submit(): Promise<void> {
		if (!field || saving) return;
		const change = planOwnValueChange(
			{ id: '', fieldId: field.id, name: '', count: 0 },
			name,
			field
		);
		nameError =
			change.kind === 'empty'
				? m.ownFields.errors.nameRequired
				: change.kind === 'merge'
					? m.ownFields.valueExists(change.target.name)
					: undefined;
		if (nameError) return;
		failure = undefined;
		saving = true;
		const { error } = await addOwnValue(field, name);
		saving = false;
		if (error) {
			failure = error;
			return;
		}
		open = false;
		await onsaved(m.ownFields.added(name.trim()));
	}
</script>

<Dialog title={field ? m.ownFields.newValueTitle(field.name) : ''} bind:open>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert title={m.ownFields.value.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		<TextField
			error={nameError}
			label={m.common.name}
			maxlength={VALUE_NAME_MAX_LENGTH}
			bind:value={name}
		/>
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={saving} form={formId} type="submit" variant="primary">
			{saving ? m.common.saving : m.common.save}
		</Button>
	{/snippet}
</Dialog>
