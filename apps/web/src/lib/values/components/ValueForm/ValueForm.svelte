<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		Form,
		FormActions,
		NotesEditor,
		SearchSelect,
		type NoteLinks,
		Select,
		Tag,
		TextArea,
		TextField
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/index.ts';
	import {
		loadValuePageContent,
		saveValue
	} from '#lib/card-index/card-index-data/card-index-data.ts';
	import {
		erasOfPeriod,
		findRecord,
		lockedPeriodIds,
		periodsOfStyle,
		planEraMove,
		planNameChange,
		valuesOf
	} from '#lib/card-index/card-index/card-index.ts';
	import {
		authorDetailsFromForm,
		authorFormFromDetails,
		emptyAuthorDetails,
		validateAuthorForm
	} from '#lib/values/author-form/author-form.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { countryOptions } from '#lib/catalogue/countries/countries.ts';
	import { ERA_CODES, eraName } from '#lib/catalogue/eras/eras.ts';
	import { isPlaceType, placeTiles } from '#lib/catalogue/place-types/place-types.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import {
		saveValueDetails,
		valueDetailsChanged
	} from '#lib/values/value-details/value-details.ts';
	import {
		SUMMARY_MAX_LENGTH,
		subjectPath,
		valuePath
	} from '#lib/card-index/value-pages/value-pages.ts';
	import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
	import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';
	import type { LocationDetails } from '#lib/values/types/location-details.ts';
	import type { ValueDetails } from '#lib/values/types/value-details.ts';
	import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';

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

	type ValueFormFields = {
		name: string;
		eraCodes: EraCode[];
		periodIds: string[];
		details: ValueDetails;
		author: AuthorFormState | null;
		location: LocationDetails | null;
	};

	const countries = countryOptions();
	const placeOptions = placeTiles();
	const record = untrack(() => (subject.kind === 'era' ? undefined : subject.record));

	let form = $state<ValueFormFields>(initialForm());
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
		hasChanges
	);

	let kind = $derived(record ? m.cardIndex.kinds[record.category] : undefined);
	let change = $derived(record ? planNameChange(record, form.name, index) : undefined);
	let mergeTarget = $derived(change?.kind === 'merge' ? change.target : undefined);
	let eraMove = $derived(
		record?.category === 'period'
			? planEraMove(index, record.id, form.eraCodes)
			: { count: 0, removed: [], remaining: [] }
	);
	let needsMove = $derived(eraMove.count > 0);
	let locked = $derived(
		record?.category === 'style' ? lockedPeriodIds(index, record.id) : new Map<string, number>()
	);
	let linksChanged = $derived(
		!sameItems(form.eraCodes, formState.saved.eraCodes) ||
			!sameItems(form.periodIds, formState.saved.periodIds)
	);
	let eraOptions = $derived(
		ERA_CODES.filter((code) => !form.eraCodes.includes(code)).map((code) => ({
			value: code,
			label: eraName(code)
		}))
	);
	let periodOptions = $derived(
		valuesOf(index, 'period')
			.filter((period) => !form.periodIds.includes(period.id))
			.map((period) => ({ value: period.id, label: period.name }))
	);
	let selectedPeriods = $derived(
		form.periodIds.flatMap((id) => {
			const period = findRecord(index, id);
			return period ? [period] : [];
		})
	);
	let moveDescription = $derived.by(() => {
		if (!record) return '';
		const { moveConfirm } = m.cardIndex;
		const removed = eraMove.removed.map(eraName).join(', ');
		if (eraMove.remaining.length === 0) {
			return moveConfirm.toNone(record.name, removed, eraMove.count);
		}
		if (eraMove.remaining.length === 1) {
			return moveConfirm.toEra(record.name, removed, eraMove.count, eraName(eraMove.remaining[0]));
		}
		return moveConfirm.toPicked(record.name, removed, eraMove.count);
	});
	let mergeDescription = $derived.by(() => {
		if (!record || !mergeTarget || !kind) return '';
		const { mergeConfirm } = m.cardIndex;
		const merged = record.name;
		const kept = mergeTarget.name;
		const ending = [
			...(mergedHasContent ? [mergeConfirm.pageContent(merged)] : []),
			mergeConfirm.irreversible
		];
		if (record.count === 0) return [mergeConfirm.unused(merged), ...ending].join(' ');
		if (record.category === 'period') {
			return [
				mergeConfirm.periodAssigned(merged, kept, record.count),
				mergeConfirm.periodLinks(merged, kept),
				...ending
			].join(' ');
		}
		return [mergeConfirm.assigned(merged, kept, record.count, kind.genitive), ...ending].join(' ');
	});

	function initialForm(): ValueFormFields {
		return {
			name: record?.name ?? '',
			eraCodes: record?.category === 'period' ? erasOfPeriod(index, record.id) : [],
			periodIds:
				record?.category === 'style'
					? periodsOfStyle(index, record.id).map((period) => period.id)
					: [],
			details: { summary: details.summary, notes: details.notes },
			author:
				record?.category === 'author'
					? authorFormFromDetails(details.author ?? emptyAuthorDetails())
					: null,
			location:
				record?.category === 'location'
					? { ...(details.location ?? { countryCode: null, placeType: null }) }
					: null
		};
	}

	function choosePlaceType(value: string | null): void {
		if (form.location) form.location.placeType = isPlaceType(value) ? value : null;
	}

	function setYearsApproximate(value: boolean): void {
		if (form.author) form.author.yearsApproximate = value;
	}

	function detailsOf(state: ValueFormFields): ValueDetails {
		return {
			...state.details,
			author: state.author ? authorDetailsFromForm(state.author) : undefined,
			location: state.location ? { ...state.location } : undefined
		};
	}

	function sameItems(a: readonly string[], b: readonly string[]): boolean {
		return a.length === b.length && a.every((item) => b.includes(item));
	}

	function hasChanges(current: ValueFormFields, reference: ValueFormFields): boolean {
		return (
			current.name.trim() !== reference.name.trim() ||
			!sameItems(current.eraCodes, reference.eraCodes) ||
			!sameItems(current.periodIds, reference.periodIds) ||
			valueDetailsChanged(current.details, reference.details) ||
			JSON.stringify(current.author) !== JSON.stringify(reference.author) ||
			JSON.stringify(current.location) !== JSON.stringify(reference.location)
		);
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function addEra(code: string): void {
		if (!code) return;
		form.eraCodes = ERA_CODES.filter((era) => era === code || form.eraCodes.includes(era));
	}

	function removeEra(code: EraCode): void {
		form.eraCodes = form.eraCodes.filter((era) => era !== code);
	}

	function addPeriod(id: string): void {
		if (id) form.periodIds = [...form.periodIds, id];
	}

	function removePeriod(id: string): void {
		form.periodIds = form.periodIds.filter((period) => period !== id);
	}

	function submit(): void {
		if (formState.busy) return;
		formState.error = '';
		nameError = change?.kind === 'empty' ? m.valueForm.nameRequired : undefined;
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
			const target = mergeTarget;
			if (!target && valueDetailsChanged(detailsOf(snapshot), detailsOf(formState.saved))) {
				const result = await saveValueDetails(subject, detailsOf(snapshot), details);
				if (result.error) {
					mergeOpen = false;
					formState.error = result.error;
					return;
				}
			}
			if (record) {
				const result = await saveValue({
					record,
					name: change?.kind === 'rename' ? change.name : record.name,
					eraCodes: record.category === 'period' && linksChanged ? snapshot.eraCodes : undefined,
					moveTo: moveTo ? (moveTo as EraCode) : undefined,
					periodIds: record.category === 'style' && linksChanged ? snapshot.periodIds : undefined,
					mergeInto: target
				});
				if (result.error) {
					mergeOpen = false;
					formState.error = result.error;
					return;
				}
			}
			formState.saved = snapshot;
			mergeOpen = false;
			if (target && record) {
				await onsaved(valuePath(record.category, target.id), m.cardIndex.merged(target.name));
			} else {
				await onsaved(subjectPath(subject), m.valuePage.saved);
			}
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
						label={m.valueForm.name}
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
					<YearGroup columns title={m.valueForm.lifeYears}>
						{#snippet aside()}
							<Checkbox
								label={m.artworkForm.yearApproximate}
								bind:checked={() => form.author?.yearsApproximate ?? false, setYearsApproximate}
							/>
						{/snippet}
						<YearInput
							beforeCommonEraLabel={m.valueForm.birthBeforeCommonEra}
							error={authorErrors.birthYear}
							label={m.valueForm.birthYear}
							placeholder={m.valueForm.birthYear}
							bind:value={form.author.birthYear}
							bind:beforeCommonEra={form.author.birthBeforeCommonEra}
						/>
						<YearInput
							beforeCommonEraLabel={m.valueForm.deathBeforeCommonEra}
							error={authorErrors.deathYear}
							label={m.valueForm.deathYear}
							placeholder={m.valueForm.deathYear}
							bind:value={form.author.deathYear}
							bind:beforeCommonEra={form.author.deathBeforeCommonEra}
						/>
					</YearGroup>

					<div class="sort">
						<Checkbox label={m.valueForm.sortByOther} bind:checked={form.author.sortByOther} />
						{#if form.author.sortByOther}
							<TextField
								autocomplete="off"
								hint={m.valueForm.sortNameHint}
								label={m.valueForm.sortName}
								placeholder={m.valueForm.sortNamePlaceholder}
								bind:value={form.author.sortName}
							/>
						{/if}
					</div>
				{/if}

				{#if record?.category === 'period'}
					<fieldset>
						<legend>{m.valueForm.eras}</legend>
						{#if form.eraCodes.length === 0}
							<p class="muted">{m.valueForm.noEras}</p>
						{:else}
							<div class="tags">
								{#each form.eraCodes as code (code)}
									<Tag
										onremove={() => removeEra(code)}
										removeLabel={m.valueForm.removeEra(eraName(code))}
									>
										{eraName(code)}
									</Tag>
								{/each}
							</div>
						{/if}
						{#if eraOptions.length > 0}
							<Select
								label={m.valueForm.addEra}
								onchange={(event) => {
									addEra(event.currentTarget.value);
									event.currentTarget.value = '';
								}}
								options={eraOptions}
								placeholder={m.valueForm.chooseEra}
							/>
						{/if}
					</fieldset>
				{/if}

				{#if record?.category === 'style'}
					<fieldset>
						<legend>{m.valueForm.periods}</legend>
						{#if selectedPeriods.length === 0}
							<p class="muted">{m.valueForm.noPeriods}</p>
						{:else}
							<div class="tags">
								{#each selectedPeriods as period (period.id)}
									<Tag
										onremove={() => removePeriod(period.id)}
										removeDisabled={locked.has(period.id)}
										removeLabel={m.valueForm.removePeriod(period.name)}
									>
										{period.name}
									</Tag>
								{/each}
							</div>
							{#each selectedPeriods.filter( (period) => locked.has(period.id) ) as period (period.id)}
								<p class="muted">
									{m.valueForm.periodLocked(period.name, locked.get(period.id) ?? 0)}
								</p>
							{/each}
						{/if}
						{#if periodOptions.length > 0}
							<Select
								label={m.valueForm.addPeriod}
								onchange={(event) => {
									addPeriod(event.currentTarget.value);
									event.currentTarget.value = '';
								}}
								options={periodOptions}
								placeholder={m.valueForm.choosePeriod}
							/>
						{/if}
					</fieldset>
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
					label={m.valueForm.notes}
					links={noteLinks}
					placeholder={m.valueForm.notesPlaceholder}
					bind:value={form.details.notes}
				/>
			</div>
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.valueForm.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.valueForm.saving : m.valueForm.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.valueForm.discardDescription} />

<Dialog
	description={moveDescription}
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
			{m.cardIndex.moveConfirm.back}
		</Button>
		<Button disabled={formState.busy} onclick={confirmMove} variant="primary">
			{m.cardIndex.moveConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={mergeDescription}
	size="small"
	title={record && mergeTarget ? m.cardIndex.mergeConfirm.title(record.name, mergeTarget.name) : ''}
	bind:open={mergeOpen}
>
	{#snippet footer()}
		<Button onclick={() => (mergeOpen = false)}>
			{m.cardIndex.mergeConfirm.back}
		</Button>
		<Button disabled={formState.busy} onclick={save} variant="primary">
			{formState.busy ? m.cardIndex.mergeConfirm.merging : m.cardIndex.mergeConfirm.confirm}
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

	.sort {
		display: grid;
		gap: var(--spacing-3);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	fieldset {
		display: grid;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		margin-bottom: var(--spacing-2);
		padding: 0;
		font-weight: var(--font-weight-medium);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.muted {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
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
