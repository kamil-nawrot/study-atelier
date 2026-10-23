<script lang="ts">
	import { Alert, Button, Dialog, Form, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { VALUE_NAME_MAX_LENGTH } from '../category-values.ts';
	import { changeOwnValue, planOwnValueChange } from '../own-fields.ts';
	import type { OwnField, OwnValue } from '../types.ts';

	type Props = {
		open?: boolean;
		field?: OwnField;
		value?: OwnValue;
		onsaved: (message: string) => Promise<void>;
	};

	let { open = $bindable(false), field, value, onsaved }: Props = $props();

	const formId = $props.id();

	let name = $state('');
	let nameError = $state<string>();
	let failure = $state<string>();
	let saving = $state(false);
	let confirmOpen = $state(false);

	let change = $derived(field && value ? planOwnValueChange(value, name, field) : undefined);
	let mergeTarget = $derived(change?.kind === 'merge' ? change.target : undefined);

	let mergeDescription = $derived.by(() => {
		if (!value || !mergeTarget) return '';
		const { mergeConfirm } = m.cardIndex;
		const first =
			value.count === 0
				? mergeConfirm.unused(value.name)
				: mergeConfirm.assigned(value.name, mergeTarget.name, value.count, m.ownFields.value.kind);
		return [first, mergeConfirm.irreversible].join(' ');
	});

	$effect(() => {
		if (!open || !value) return;
		name = value.name;
		nameError = undefined;
		failure = undefined;
	});

	async function save(): Promise<void> {
		if (!value || !change || saving) return;
		failure = undefined;
		saving = true;
		const { error } = await changeOwnValue(value, change);
		saving = false;
		confirmOpen = false;
		if (error) {
			failure = error;
			return;
		}
		open = false;
		await onsaved(
			change.kind === 'merge'
				? m.cardIndex.merged(change.target.name)
				: m.ownFields.saved(name.trim())
		);
	}

	function submit(): void {
		nameError = change?.kind === 'empty' ? m.ownFields.errors.nameRequired : undefined;
		if (nameError || !change) return;
		if (change.kind === 'unchanged') {
			open = false;
			return;
		}
		if (change.kind === 'merge') {
			confirmOpen = true;
			return;
		}
		void save();
	}
</script>

<Dialog
	description={field && value
		? m.ownFields.value.description(field.name, m.atelier.count(value.count))
		: undefined}
	title={value?.name ?? ''}
	bind:open
>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert title={m.ownFields.value.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		<TextField
			error={nameError}
			hint={mergeTarget
				? m.ownFields.value.mergeHint(mergeTarget.name, m.atelier.count(mergeTarget.count))
				: undefined}
			label={m.ownFields.value.name}
			maxlength={VALUE_NAME_MAX_LENGTH}
			bind:value={name}
		/>
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.ownFields.value.cancel}
		</Button>
		<Button disabled={saving} form={formId} type="submit" variant="primary">
			{#if saving}
				{m.ownFields.value.saving}
			{:else}
				{mergeTarget ? m.ownFields.value.merge : m.ownFields.value.save}
			{/if}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={mergeDescription}
	size="small"
	title={value && mergeTarget ? m.cardIndex.mergeConfirm.title(value.name, mergeTarget.name) : ''}
	bind:open={confirmOpen}
>
	{#snippet footer()}
		<Button onclick={() => (confirmOpen = false)}>
			{m.cardIndex.mergeConfirm.back}
		</Button>
		<Button disabled={saving} onclick={save} variant="primary">
			{saving ? m.cardIndex.mergeConfirm.merging : m.cardIndex.mergeConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>
