<script lang="ts">
	import { tick, untrack } from 'svelte';
	import List from '@lucide/svelte/icons/list';
	import SquareCheck from '@lucide/svelte/icons/square-check';
	import Type from '@lucide/svelte/icons/type';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		FieldMessage,
		Form,
		FormActions,
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
		ownFieldDraft,
		ownFieldDraftChanged
	} from '#lib/card-index/own-field-form/own-field-form.ts';
	import {
		countArtworksOutsideTypes,
		createOwnField,
		updateOwnField
	} from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import {
		artworkTypeTiles,
		isArtworkTypeCode
	} from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';
	import type { OwnFieldKind } from '#lib/card-index/types/own-field-kind.ts';

	type Props = {
		fields: readonly OwnField[];
		edited?: OwnField;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (id: string, message: string) => void | Promise<void>;
	};

	let { fields, edited, cancelHref, oncancel, onsaved }: Props = $props();

	const formId = $props.id();
	const typesHintId = `${formId}-types`;
	const closedHintId = `${formId}-closed`;

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

	const initial = (): OwnFieldInput => untrack(() => ownFieldDraft(edited));
	let draft = $state<OwnFieldInput>(initial());
	const formState = new FormState<OwnFieldInput>(initial());
	const changes = new UnsavedChanges(
		() => $state.snapshot(draft) as OwnFieldInput,
		() => formState.saved,
		ownFieldDraftChanged
	);

	let nameError = $state<string>();
	let typesError = $state<string>();
	let outside = $state<number>();
	let typesGroup = $state<HTMLElement>();

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	async function narrowingAllowed(): Promise<boolean> {
		if (!edited || outside !== undefined || !narrowsTypes(edited, draft)) return true;
		const impact = await countArtworksOutsideTypes(edited, draft);
		if (!impact.error && impact.count === 0) return true;
		if (impact.error) formState.error = impact.error;
		else outside = impact.count;
		return false;
	}

	function submit(): Promise<void> {
		nameError = fieldNameError(draft.name, fields, edited?.id);
		typesError =
			draft.limited && draft.typeCodes.length === 0 ? m.ownFields.form.typesRequired : undefined;
		if (nameError || typesError) return Promise.resolve();
		return formState.run(save);
	}

	async function save(): Promise<void> {
		if (!(await narrowingAllowed())) return;
		const snapshot = $state.snapshot(draft) as OwnFieldInput;
		const result = edited
			? { ...(await updateOwnField(edited, snapshot)), id: edited.id }
			: await createOwnField(snapshot);
		if (result.error || !result.id) {
			formState.error = result.error ?? '';
			return;
		}
		formState.saved = snapshot;
		const name = snapshot.name.trim();
		await onsaved(result.id, edited ? m.ownFields.saved(name) : m.ownFields.created(name));
	}

	function chooseKind(value: string | null): void {
		if (value) draft.kind = value as OwnFieldKind;
	}

	function chooseTypes(values: string[]): void {
		draft.typeCodes = values.filter(isArtworkTypeCode);
		typesError = undefined;
		outside = undefined;
	}

	async function limit(): Promise<void> {
		typesError = undefined;
		outside = undefined;
		if (!draft.limited) return;
		await tick();
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		typesGroup?.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'instant' });
	}
</script>

{#snippet closedField()}
	<div class="group">
		<Checkbox
			aria-describedby={closedHintId}
			label={m.ownFields.form.closed}
			bind:checked={draft.closed}
		/>
		<FieldMessage id={closedHintId} hint={m.ownFields.form.closedHint} />
	</div>
{/snippet}

<div class="page">
	<Form error={formState.error} errorTitle={m.ownFields.form.errorTitle} onsubmit={submit}>
		<div class="fields">
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
				<div class="group">
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
					{@render closedField()}
				{/if}
			{:else if edited.kind === 'list'}
				{@render closedField()}
			{/if}
			<Checkbox label={m.ownFields.form.limited} onchange={limit} bind:checked={draft.limited} />
			{#if draft.limited}
				<div bind:this={typesGroup} class="group">
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
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.common.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{#if edited}
					{formState.busy
						? m.common.saving
						: outside !== undefined
							? m.ownFields.form.narrowConfirm
							: m.common.save}
				{:else}
					{formState.busy ? m.ownFields.form.creating : m.common.add}
				{/if}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	.group {
		display: grid;
		gap: var(--spacing-2);
	}

	.group p {
		margin: 0;
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}

		.fields {
			max-width: var(--size-content-default);
		}
	}
</style>
