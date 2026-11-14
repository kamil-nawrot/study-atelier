<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Button,
		Dialog,
		Form,
		FormActions,
		NotesEditor,
		type NoteLinks,
		Select,
		TextArea,
		TextField
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadValuePageContent } from '#lib/card-index/card-index-data/card-index-data.ts';
	import { planEraMove, planNameChange } from '#lib/card-index/card-index/card-index.ts';
	import {
		AUTHOR_COUNTRY_MAX_LENGTH,
		validateAuthorForm
	} from '#lib/values/author-form/author-form.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { eraName } from '#lib/catalogue/eras/eras.ts';
	import { cityOfTown, ownCities } from '#lib/values/city-options/city-options.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { LiveErrors } from '#lib/shared/forms/live-errors/live-errors.svelte.ts';
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
	import type { Town } from '#lib/map/types/town.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import PlaceField from '#lib/map/components/PlaceField/PlaceField.svelte';
	import PlaceFields from '#lib/values/components/PlaceFields/PlaceFields.svelte';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import EraBoundsField from '#lib/values/components/EraBoundsField/EraBoundsField.svelte';
	import { validateEraBounds } from '#lib/values/era-bounds-form/era-bounds-form.ts';
	import { eraJunctions } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
	import type { EraBoundsErrors } from '#lib/values/types/era-bounds-errors.ts';
	import AuthorSortField from '#lib/values/components/AuthorSortField/AuthorSortField.svelte';
	import AuthorLifeFields from '#lib/values/components/AuthorLifeFields/AuthorLifeFields.svelte';
	import AuthorRelationsField from '#lib/author-relations/components/AuthorRelationsField/AuthorRelationsField.svelte';
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

	const record = untrack(() => (subject.kind === 'era' ? undefined : subject.record));
	const era = untrack(() => (subject.kind === 'era' ? subject.code : undefined));
	const initialForm = (): ValueFormFields =>
		untrack(() => initialValueForm(record, index, details, era));
	let eraField = $state<EraBoundsField>();

	let form = $state<ValueFormFields>(initialForm());
	let created = $state<ValueSubject>();
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
	let cities = $derived(ownCities(index.values, record?.id));
	let hasPlaces = $derived(
		record?.category === 'location' && index.values.some((value) => value.cityId === record.id)
	);
	const errors = new LiveErrors<{
		placeType?: string;
		name?: string;
		author?: AuthorFieldErrors;
		eraBounds?: EraBoundsErrors;
	}>(() => ({
		placeType:
			hasPlaces && form.location?.placeType !== 'city' ? m.cardIndex.errors.cityType : undefined,
		name:
			change?.kind === 'empty'
				? m.valueForm.nameRequired
				: creating && existing && kind
					? m.valueForm.exists(kind.accusative, existing.name)
					: undefined,
		author: form.author ? validateAuthorForm(form.author) : undefined,
		eraBounds:
			era && form.eraBounds ? validateEraBounds(era, form.eraBounds, eraJunctions()) : undefined
	}));
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
		if (!form.location) return;
		const city = cityOfTown(town);
		form.location = { ...form.location, city, point: null, countryCode: city.countryCode ?? null };
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

<div class="page">
	<Form error={formState.error} errorTitle={m.valueForm.errorTitle} onsubmit={submit}>
		<div class="columns" class:author={form.author}>
			{#if form.author && record}
				<ImageField
					alt={form.name.trim() || record.name}
					query={{ kind: 'person', name: form.name }}
					searchReady={form.name.trim() !== ''}
					texts={m.valueForm.portrait}
					bind:image={form.author.image}
				/>
			{/if}
			<div class="fields">
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
							bind:value={form.name}
						/>
						{#if form.author}
							<AuthorSortField bind:author={form.author} />
						{/if}
					</div>
				{/if}

				{#if form.location}
					<PlaceFields
						{cities}
						typeError={errors.current.placeType}
						bind:location={form.location}
					/>
				{/if}

				{#if form.author}
					<AuthorLifeFields errors={errors.current.author ?? {}} bind:author={form.author} />
					<TextField
						autocomplete="off"
						hint={m.valueForm.authorCountryHint}
						label={m.valueForm.authorCountry}
						maxlength={AUTHOR_COUNTRY_MAX_LENGTH}
						bind:value={form.author.country}
					/>
					<AuthorRelationsField
						authorId={record?.id}
						authors={index.values.filter((value) => value.category === 'author')}
						error={errors.current.author?.relations}
						bind:rows={form.author.relations}
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

				{#if era && form.eraBounds}
					<EraBoundsField
						bind:this={eraField}
						code={era}
						errors={errors.current.eraBounds ?? {}}
						bind:bounds={form.eraBounds}
					/>
				{/if}
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

		.columns.author {
			grid-template-columns: minmax(220px, 1fr) minmax(0, 1.25fr);
			gap: var(--spacing-12);
		}
	}
</style>
