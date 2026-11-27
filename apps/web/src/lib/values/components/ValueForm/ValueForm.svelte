<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import {
		Button,
		Form,
		FormActions,
		NotesEditor,
		type NoteLinks,
		TextArea,
		TextButton,
		TextField
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadValuePageContent } from '#lib/card-index/card-index-data/card-index-data.ts';
	import { planEraMove, planNameChange } from '#lib/card-index/card-index/card-index.ts';
	import { portraitQuery } from '#lib/values/author-form/author-form.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { ownCities, withTown } from '#lib/values/city-options/city-options.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { LiveErrors } from '#lib/shared/forms/live-errors/live-errors.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { saveValueForm } from '#lib/values/value-form-save/value-form-save.ts';
	import {
		initialValueForm,
		appendedNotes,
		mergeDescription,
		moveDescription,
		sameItems,
		valueFormChanged
	} from '#lib/values/value-form/value-form.ts';
	import { SUMMARY_MAX_LENGTH } from '#lib/card-index/value-pages/value-pages.ts';
	import type { ValueDetails } from '#lib/values/types/value-details.ts';
	import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';
	import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { Town } from '#lib/map/types/town.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import PlaceField from '#lib/map/components/PlaceField/PlaceField.svelte';
	import PlaceFields from '#lib/values/components/PlaceFields/PlaceFields.svelte';
	import ValueFormDialogs from '#lib/values/components/ValueFormDialogs/ValueFormDialogs.svelte';
	import StagedFormColumns from '#lib/shared/forms/StagedFormColumns/StagedFormColumns.svelte';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import EraBoundsField from '#lib/values/components/EraBoundsField/EraBoundsField.svelte';
	import {
		valueFormErrors,
		type ValueFormErrors
	} from '#lib/values/value-form-errors/value-form-errors.ts';
	import AuthorSortField from '#lib/values/components/AuthorSortField/AuthorSortField.svelte';
	import AuthorFields from '#lib/values/components/AuthorFields/AuthorFields.svelte';
	import PeriodErasField from '#lib/values/components/PeriodErasField/PeriodErasField.svelte';
	import StylePeriodsField from '#lib/values/components/StylePeriodsField/StylePeriodsField.svelte';

	type Props = {
		subject: ValueSubject;
		index: CardIndexData;
		details: ValueDetails;
		prefill?: ValueDetails;
		appendNote?: string;
		secondary?: Snippet;
		labels?: { save: string; cancel: string };
		noteLinks?: NoteLinks;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let {
		subject,
		index,
		details,
		prefill,
		appendNote,
		secondary,
		labels,
		noteLinks,
		cancelHref,
		oncancel,
		onsaved
	}: Props = $props();

	const record = untrack(() => (subject.kind === 'era' ? undefined : subject.record));
	const era = untrack(() => (subject.kind === 'era' ? subject.code : undefined));
	let eraField = $state<EraBoundsField>();
	let barHeight = $state(0);

	let form = $state<ValueFormFields>(
		untrack(() => initialValueForm(record, index, prefill ?? details, era))
	);
	let created = $state<ValueSubject>();
	let moveTo = $state('');
	let moveOpen = $state(false);
	let moveError = $state<string>();
	let mergeOpen = $state(false);
	let mergedHasContent = $state(false);
	const formState = new FormState<ValueFormFields>(
		untrack(() => initialValueForm(record, index, details, era)),
		untrack(() => $state.snapshot(form))
	);
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.reference,
		valueFormChanged
	);

	let kind = $derived(record ? m.cardIndex.kinds[record.category] : undefined);
	let creating = $derived(record?.id === '');
	let change = $derived(record ? planNameChange(record, form.name, index) : undefined);
	let existing = $derived(change?.kind === 'merge' ? change.target : undefined);
	let cities = $derived(ownCities(index.values, record?.id));
	let hasPlaces = $derived(
		record?.category === 'location' && index.values.some((value) => value.cityId === record.id)
	);
	const errors = new LiveErrors<ValueFormErrors>(() =>
		valueFormErrors({ form, hasPlaces, era, change, creating, existing, kind: kind?.accusative })
	);
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
			? mergeDescription(record, mergeTarget, kind.genitive, mergedHasContent, index)
			: ''
	);

	function chooseTown(town: Town): void {
		if (form.location) form.location = withTown(form.location, town);
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	async function submit(): Promise<void> {
		if (formState.busy) return;
		formState.error = '';
		if (!errors.check()) return;
		if (eraField) {
			const { confirmed, error } = await eraField.confirmChange();
			if (error) formState.error = error;
			if (!confirmed) return;
		}
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
				linksChanged,
				junctions: eraField?.changedJunctions()
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

{#snippet nameFields()}
	{#if record && kind}
		<div class="name">
			<TextField
				autocomplete="off"
				error={errors.current.name}
				hint={mergeTarget
					? m.valueForm.mergeHint(
							kind.accusative,
							mergeTarget.name,
							m.atelier.count(mergeTarget.count)
						)
					: undefined}
				label={m.common.name}
				maxlength={VALUE_NAME_MAX_LENGTH}
				required
				bind:value={form.name}
			/>
			{#if form.author}
				<AuthorSortField bind:author={form.author} />
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet detailFields()}
	{#if form.location}
		<PlaceFields {cities} typeError={errors.current.placeType} bind:location={form.location} />
	{/if}

	{#if form.author}
		<AuthorFields
			authorId={record?.id}
			authors={index.values.filter((value) => value.category === 'author')}
			errors={errors.current.author ?? {}}
			bind:author={form.author}
		/>
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
		maxRows={8}
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
	{#if appendNote}
		<TextButton
			disabled={form.details.notes.includes(appendNote)}
			onclick={() => (form.details.notes = appendedNotes(form.details.notes, appendNote))}
		>
			{m.albums.closing.appendNote}
		</TextButton>
	{/if}

	{#if era && form.eraBounds}
		<EraBoundsField
			bind:this={eraField}
			code={era}
			errors={errors.current.eraBounds ?? {}}
			bind:bounds={form.eraBounds}
		/>
	{/if}
{/snippet}

<div class="page">
	<Form error={formState.error} errorTitle={m.valueForm.errorTitle} onsubmit={submit}>
		{#if form.author && record}
			<StagedFormColumns actionsHeight={barHeight}>
				{#snippet head()}
					{@render nameFields()}
				{/snippet}
				{#snippet images()}
					{#if form.author}
						<ImageField
							alt={form.name.trim() || record.name}
							compactEmpty
							query={portraitQuery(form.name, form.author)}
							searchReady={form.name.trim() !== ''}
							staged
							texts={m.valueForm.portrait}
							bind:image={form.author.image}
						/>
					{/if}
				{/snippet}
				{#snippet fields()}
					{@render detailFields()}
				{/snippet}
			</StagedFormColumns>
		{:else}
			<div class="columns">
				<div class="fields">
					{@render nameFields()}
					{@render detailFields()}
				</div>
				{#if form.location && !creating && !form.location.city}
					<PlaceField
						name={form.name}
						city={form.location.placeType === 'city'}
						oncountry={(code) => form.location && (form.location.countryCode = code)}
						ontown={form.location.placeType === 'city' ? undefined : chooseTown}
						bind:point={
							() => form.location?.point ?? null,
							(point) => form.location && (form.location.point = point)
						}
						bind:wikidataId={
							() => form.location?.wikidataId ?? null,
							(wikidataId) => form.location && (form.location.wikidataId = wikidataId)
						}
					/>
				{/if}
			</div>
		{/if}

		<FormActions staged={!!form.author && !!record} bind:height={barHeight}>
			<Button href={cancelHref} onclick={oncancel}>
				{labels?.cancel ?? m.common.cancel}
			</Button>
			{@render secondary?.()}
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.common.saving : (labels?.save ?? m.common.save)}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

<ValueFormDialogs
	busy={formState.busy}
	{mergeText}
	mergeTitle={record && mergeTarget
		? m.cardIndex.mergeConfirm.title(record.name, mergeTarget.name)
		: ''}
	{moveError}
	{moveText}
	onmerge={save}
	onmove={confirmMove}
	remaining={eraMove.remaining}
	bind:mergeOpen
	bind:moveOpen
	bind:moveTo
/>

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
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

	.name {
		display: grid;
		gap: var(--spacing-2);
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
