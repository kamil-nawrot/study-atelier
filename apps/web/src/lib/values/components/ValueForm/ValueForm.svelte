<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Button,
		ChoiceTiles,
		Dialog,
		Form,
		FormActions,
		NotesEditor,
		SearchSelect,
		type NoteLinks,
		Select,
		TextArea,
		TextField
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadValuePageContent } from '#lib/card-index/card-index-data/card-index-data.ts';
	import { planEraMove, planNameChange } from '#lib/card-index/card-index/card-index.ts';
	import { validateAuthorForm } from '#lib/values/author-form/author-form.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { countryOptions } from '#lib/catalogue/countries/countries.ts';
	import { eraName } from '#lib/catalogue/eras/eras.ts';
	import { isPlaceType, placeTiles } from '#lib/catalogue/place-types/place-types.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { saveValueForm } from '#lib/values/value-form-save/value-form-save.ts';
	import {
		initialValueForm,
		mergeDescription,
		moveDescription,
		sameItems,
		valueFormChanged
	} from '#lib/values/value-form/value-form.ts';
	import { SUMMARY_MAX_LENGTH } from '#lib/card-index/value-pages/value-pages.ts';
	import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
	import type { ValueDetails } from '#lib/values/types/value-details.ts';
	import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';
	import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import AuthorLifeFields from '#lib/values/components/AuthorLifeFields/AuthorLifeFields.svelte';
	import PeriodErasField from '#lib/values/components/PeriodErasField/PeriodErasField.svelte';
	import StylePeriodsField from '#lib/values/components/StylePeriodsField/StylePeriodsField.svelte';

	type Props = {
		subject: ValueSubject;
		index: CardIndexData;
		details: ValueDetails;
		noteLinks?: NoteLinks;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let { subject, index, details, noteLinks, cancelHref, oncancel, onsaved }: Props = $props();

	const countries = countryOptions();
	const placeOptions = placeTiles();
	const record = untrack(() => (subject.kind === 'era' ? undefined : subject.record));
	const initialForm = (): ValueFormFields =>
		untrack(() => initialValueForm(record, index, details));

	let form = $state<ValueFormFields>(initialForm());
	let created = $state<ValueSubject>();
	let nameError = $state<string>();
	let authorErrors = $state<AuthorFieldErrors>({});
	let moveTo = $state('');
	let moveOpen = $state(false);
	let moveError = $state<string>();
	let mergeOpen = $state(false);
	let mergedHasContent = $state(false);
	const formState = new FormState<ValueFormFields>(initialForm());
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		valueFormChanged
	);

	let kind = $derived(record ? m.cardIndex.kinds[record.category] : undefined);
	let creating = $derived(record?.id === '');
	let change = $derived(record ? planNameChange(record, form.name, index) : undefined);
	let existing = $derived(change?.kind === 'merge' ? change.target : undefined);
	let mergeTarget = $derived(creating ? undefined : existing);
	let eraMove = $derived(
		record?.category === 'period'
			? planEraMove(index, record.id, form.eraCodes)
			: { count: 0, removed: [], remaining: [] }
	);
	let needsMove = $derived(eraMove.count > 0);
	let linksChanged = $derived(
		!sameItems(form.eraCodes, formState.saved.eraCodes) ||
			!sameItems(form.periodIds, formState.saved.periodIds)
	);
	let moveText = $derived(record ? moveDescription(record, eraMove) : '');
	let mergeText = $derived(
		record && mergeTarget && kind
			? mergeDescription(record, mergeTarget, kind.genitive, mergedHasContent)
			: ''
	);

	function choosePlaceType(value: string | null): void {
		if (form.location) form.location.placeType = isPlaceType(value) ? value : null;
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function submit(): void {
		if (formState.busy) return;
		formState.error = '';
		nameError =
			change?.kind === 'empty'
				? m.valueForm.nameRequired
				: creating && existing && kind
					? m.valueForm.exists(kind.accusative, existing.name)
					: undefined;
		authorErrors = form.author ? validateAuthorForm(form.author) : {};
		if (nameError || Object.keys(authorErrors).length > 0) return;
		if (needsMove) {
			moveError = undefined;
			moveOpen = true;
			return;
		}
		proceed();
	}

	function confirmMove(): void {
		if (eraMove.remaining.length > 1 && !moveTo) {
			moveError = m.cardIndex.moveConfirm.pickRequired;
			return;
		}
		moveOpen = false;
		proceed();
	}

	function proceed(): void {
		if (mergeTarget) void confirmMerge();
		else void save();
	}

	async function confirmMerge(): Promise<void> {
		if (!record) return;
		const recordId = record.id;
		await formState.run(async () => {
			const result = await loadValuePageContent(recordId);
			if (result.error) {
				formState.error = result.error;
				return;
			}
			mergedHasContent = result.content?.hasContent ?? false;
			mergeOpen = true;
		});
	}

	function save(): Promise<void> {
		return formState.run(async () => {
			const snapshot = $state.snapshot(form);
			const result = await saveValueForm({
				subject: created ?? subject,
				form: snapshot,
				saved: formState.saved,
				details,
				name: change?.kind === 'rename' ? change.name : (record?.name ?? ''),
				mergeTarget,
				moveTo: moveTo ? (moveTo as EraCode) : undefined,
				linksChanged
			});
			mergeOpen = false;
			if (result.error !== undefined) {
				created = result.created ?? created;
				formState.error = result.error;
				return;
			}
			formState.saved = snapshot;
			await onsaved(result.path, result.message);
		});
	}
</script>

<div class="page">
	<Form error={formState.error} errorTitle={m.valueForm.errorTitle} onsubmit={submit}>
		<div class="columns" class:author={form.author}>
			{#if form.author && record}
				<ImageField
					alt={record.name}
					query={{ kind: 'person', name: form.name }}
					searchReady={form.name.trim() !== ''}
					texts={m.valueForm.portrait}
					bind:image={form.author.image}
				/>
			{/if}
			<div class="fields">
				{#if record && kind}
					<TextField
						autocomplete="off"
						error={nameError}
						hint={mergeTarget
							? m.valueForm.mergeHint(
									kind.accusative,
									mergeTarget.name,
									m.atelier.count(mergeTarget.count)
								)
							: undefined}
						label={m.common.name}
						maxlength={VALUE_NAME_MAX_LENGTH}
						bind:value={form.name}
					/>
				{/if}

				{#if form.location}
					<SearchSelect
						hint={m.valueForm.countryHint}
						label={m.valueForm.country}
						options={countries}
						placeholder={m.valueForm.countryPlaceholder}
						bind:value={form.location.countryCode}
					/>
					<ChoiceTiles
						clearable
						label={m.valueForm.placeType}
						onchange={choosePlaceType}
						options={placeOptions}
						value={form.location.placeType}
					/>
				{/if}

				{#if form.author}
					<AuthorLifeFields errors={authorErrors} bind:author={form.author} />
				{/if}

				{#if record?.category === 'period'}
					<PeriodErasField bind:eraCodes={form.eraCodes} />
				{/if}

				{#if record?.category === 'style'}
					<StylePeriodsField {index} styleId={record.id} bind:periodIds={form.periodIds} />
				{/if}

				<TextArea
					counter
					label={m.valueForm.summary}
					maxlength={SUMMARY_MAX_LENGTH}
					placeholder={m.valueForm.summaryPlaceholder}
					rows={3}
					bind:value={form.details.summary}
				/>

				<NotesEditor
					hint={noteLinks ? m.valueForm.notesLinkHint : undefined}
					label={m.common.notes}
					links={noteLinks}
					placeholder={m.valueForm.notesPlaceholder}
					bind:value={form.details.notes}
				/>
			</div>
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.common.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.common.saving : m.common.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

<Dialog
	description={moveText}
	size="small"
	title={m.cardIndex.moveConfirm.title}
	bind:open={moveOpen}
>
	{#if eraMove.remaining.length > 1}
		<Select
			error={moveError}
			label={m.cardIndex.moveConfirm.pick}
			options={eraMove.remaining.map((code) => ({ value: code, label: eraName(code) }))}
			placeholder={m.valueForm.chooseEra}
			bind:value={moveTo}
		/>
	{/if}
	{#snippet footer()}
		<Button onclick={() => (moveOpen = false)}>
			{m.common.back}
		</Button>
		<Button disabled={formState.busy} onclick={confirmMove} variant="primary">
			{m.cardIndex.moveConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={mergeText}
	size="small"
	title={record && mergeTarget ? m.cardIndex.mergeConfirm.title(record.name, mergeTarget.name) : ''}
	bind:open={mergeOpen}
>
	{#snippet footer()}
		<Button onclick={() => (mergeOpen = false)}>
			{m.common.back}
		</Button>
		<Button disabled={formState.busy} onclick={save} variant="primary">
			{formState.busy ? m.cardIndex.mergeConfirm.merging : m.common.merge}
		</Button>
	{/snippet}
</Dialog>

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
		margin-bottom: calc(-1 * var(--spacing-12));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.columns {
		display: grid;
		gap: var(--spacing-8);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}

		.fields {
			max-width: var(--size-content-default);
		}

		.columns.author {
			grid-template-columns: minmax(220px, 1fr) minmax(0, 1.25fr);
			gap: var(--spacing-12);
		}
	}
</style>
