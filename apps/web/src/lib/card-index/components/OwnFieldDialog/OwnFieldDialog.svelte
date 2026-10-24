<script lang="ts">
	import List from '@lucide/svelte/icons/list';
	import SquareCheck from '@lucide/svelte/icons/square-check';
	import Type from '@lucide/svelte/icons/type';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		Form,
		TextField,
		type ChoiceTile
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import {
		FIELD_DESCRIPTION_MAX_LENGTH,
		FIELD_NAME_MAX_LENGTH,
		createOwnField,
		fieldNameError,
		updateOwnField
	} from '#lib/card-index/own-fields/own-fields.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';
	import type { OwnFieldKind } from '#lib/card-index/types/own-field-kind.ts';

	type Props = {
		open?: boolean;
		fields: readonly OwnField[];
		edited?: OwnField;
		onsaved: (message: string) => Promise<void>;
	};

	let { open = $bindable(false), fields, edited, onsaved }: Props = $props();

	const formId = $props.id();

	const kinds: ChoiceTile[] = [
		{ value: 'text', label: m.ownFields.kinds.text, note: m.ownFields.kindNotes.text, icon: Type },
		{ value: 'list', label: m.ownFields.kinds.list, note: m.ownFields.kindNotes.list, icon: List },
		{
			value: 'flag',
			label: m.ownFields.kinds.flag,
			note: m.ownFields.kindNotes.flag,
			icon: SquareCheck
		}
	];

	let draft = $state<OwnFieldInput>(emptyDraft());
	let nameError = $state<string>();
	let failure = $state<string>();
	let saving = $state(false);

	function emptyDraft(): OwnFieldInput {
		return { name: '', description: '', kind: 'text', multiple: false };
	}

	$effect(() => {
		if (!open) return;
		draft = edited
			? {
					name: edited.name,
					description: edited.description ?? '',
					kind: edited.kind,
					multiple: edited.multiple
				}
			: emptyDraft();
		nameError = undefined;
		failure = undefined;
	});

	async function submit(): Promise<void> {
		if (saving) return;
		failure = undefined;
		nameError = fieldNameError(draft.name, fields, edited?.id);
		if (nameError) return;
		saving = true;
		const { error } = edited ? await updateOwnField(edited, draft) : await createOwnField(draft);
		saving = false;
		if (error) {
			failure = error;
			return;
		}
		const name = draft.name.trim();
		open = false;
		await onsaved(edited ? m.ownFields.saved(name) : m.ownFields.created(name));
	}

	function chooseKind(value: string | null): void {
		if (value) draft.kind = value as OwnFieldKind;
	}
</script>

<Dialog title={edited ? edited.name : m.ownFields.form.newTitle} bind:open>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert title={m.ownFields.form.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		<TextField
			error={nameError}
			label={m.ownFields.form.name}
			maxlength={FIELD_NAME_MAX_LENGTH}
			bind:value={draft.name}
		/>
		<TextField
			hint={m.ownFields.form.descriptionHint}
			label={m.ownFields.form.description}
			maxlength={FIELD_DESCRIPTION_MAX_LENGTH}
			bind:value={draft.description}
		/>
		{#if !edited}
			<div class="kind">
				<ChoiceTiles
					columns={3}
					label={m.ownFields.form.kind}
					narrowColumns={1}
					onchange={chooseKind}
					options={kinds}
					value={draft.kind}
				/>
				<p class="caption">{m.ownFields.form.kindFixed}</p>
			</div>
			{#if draft.kind === 'list'}
				<Checkbox label={m.ownFields.form.multiple} bind:checked={draft.multiple} />
			{/if}
		{/if}
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.ownFields.form.cancel}
		</Button>
		<Button disabled={saving} form={formId} type="submit" variant="primary">
			{#if edited}
				{saving ? m.ownFields.form.saving : m.ownFields.form.save}
			{:else}
				{saving ? m.ownFields.form.creating : m.ownFields.form.create}
			{/if}
		</Button>
	{/snippet}
</Dialog>

<style>
	.kind {
		display: grid;
		gap: var(--spacing-1);
	}

	.kind p {
		margin: 0;
	}
</style>
