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
		FieldMessage,
		Form,
		TextField,
		ToggleTiles,
		type ChoiceTile
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		FIELD_DESCRIPTION_MAX_LENGTH,
		FIELD_NAME_MAX_LENGTH,
		fieldNameError,
		narrowsTypes
	} from '#lib/card-index/own-fields/own-fields.ts';
	import {
		countArtworksOutsideTypes,
		createOwnField,
		updateOwnField
	} from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import {
		artworkTypeTiles,
		isArtworkTypeCode
	} from '#lib/catalogue/artwork-types/artwork-types.ts';
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

	const types = artworkTypeTiles();
	const typesHintId = `${formId}-types`;

	let draft = $state<OwnFieldInput>(emptyDraft());
	let nameError = $state<string>();
	let typesError = $state<string>();
	let outside = $state<number>();
	let failure = $state<string>();
	let saving = $state(false);

	function emptyDraft(): OwnFieldInput {
		return {
			name: '',
			description: '',
			kind: 'text',
			multiple: false,
			limited: false,
			typeCodes: []
		};
	}

	$effect(() => {
		if (!open) return;
		draft = edited
			? {
					name: edited.name,
					description: edited.description ?? '',
					kind: edited.kind,
					multiple: edited.multiple,
					limited: edited.typeCodes.length > 0,
					typeCodes: [...edited.typeCodes]
				}
			: emptyDraft();
		nameError = undefined;
		typesError = undefined;
		outside = undefined;
		failure = undefined;
	});

	async function narrowingAllowed(): Promise<boolean> {
		if (!edited || outside !== undefined || !narrowsTypes(edited, draft)) return true;
		const impact = await countArtworksOutsideTypes(edited, draft);
		if (!impact.error && impact.count === 0) return true;
		failure = impact.error;
		outside = impact.error ? undefined : impact.count;
		return false;
	}

	async function submit(): Promise<void> {
		if (saving) return;
		failure = undefined;
		nameError = fieldNameError(draft.name, fields, edited?.id);
		typesError =
			draft.limited && draft.typeCodes.length === 0 ? m.ownFields.form.typesRequired : undefined;
		if (nameError || typesError) return;
		saving = true;
		if (!(await narrowingAllowed())) {
			saving = false;
			return;
		}
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

	function chooseTypes(values: string[]): void {
		draft.typeCodes = values.filter(isArtworkTypeCode);
		typesError = undefined;
		outside = undefined;
	}

	function limit(): void {
		typesError = undefined;
		outside = undefined;
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
			label={m.common.name}
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
		<Checkbox label={m.ownFields.form.limited} onchange={limit} bind:checked={draft.limited} />
		{#if draft.limited}
			<div class="types">
				<ToggleTiles
					columns={4}
					label={m.ownFields.form.types}
					narrowColumns={2}
					onchange={chooseTypes}
					options={types}
					values={draft.typeCodes}
				/>
				<FieldMessage
					id={typesHintId}
					error={typesError}
					hint={typesError ? undefined : m.ownFields.form.typesHint}
				/>
			</div>
		{/if}
		{#if outside !== undefined}
			<Alert title={m.ownFields.form.narrowTitle} tone="warning">
				{m.ownFields.form.narrowDescription(outside)}
			</Alert>
		{/if}
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={saving} form={formId} type="submit" variant="primary">
			{#if edited}
				{saving
					? m.common.saving
					: outside !== undefined
						? m.ownFields.form.narrowConfirm
						: m.common.save}
			{:else}
				{saving ? m.ownFields.form.creating : m.common.add}
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

	.types {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
