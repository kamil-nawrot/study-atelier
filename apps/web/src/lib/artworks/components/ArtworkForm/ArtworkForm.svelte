<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import {
		Button,
		Checkbox,
		ChoiceTiles,
		FieldMessage,
		Form,
		FormActions,
		NotesEditor,
		type NoteLinks,
		Switch,
		TextField,
		Toast,
		ValueField
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import {
		artworkFormFromRecord,
		artworkImageAlt,
		artworkInputFromForm,
		canSearchImage,
		emptyArtworkForm,
		formHasChanges
	} from '#lib/artworks/artwork-form/artwork-form.ts';
	import { validateArtwork } from '#lib/artworks/artwork-record/artwork-record.ts';
	import { saveArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
	import {
		artworkTypeTiles,
		isArtworkTypeCode
	} from '#lib/catalogue/artwork-types/artwork-types.ts';
	import {
		takesOneValue,
		VALUE_NAME_MAX_LENGTH
	} from '#lib/card-index/category-values/category-values.ts';
	import { DuplicateCheck } from '#lib/artworks/duplicate-check/duplicate-check.svelte.ts';
	import { sameTitleAndAuthors } from '#lib/artworks/duplicates/duplicates.ts';
	import { eraTiles, isEraCode } from '#lib/catalogue/eras/eras.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { OWN_TEXT_MAX_LENGTH } from '#lib/card-index/own-fields/own-fields.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { suggestValues, valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import ArtworkImages from '#lib/artworks/components/ArtworkImages/ArtworkImages.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import type { Pin } from '#lib/pins/types.ts';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';
	import DuplicateDialog from '#lib/artworks/components/DuplicateDialog/DuplicateDialog.svelte';
	import type { ArtworkFieldErrors } from '#lib/artworks/types/artwork-field-errors.ts';
	import type { ArtworkFormState } from '#lib/artworks/types/artwork-form-state.ts';
	import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
	import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
	import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
	import type { ValueSuggestion } from '#lib/card-index/types/value-suggestion.ts';
	import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		artwork?: ArtworkRecord;
		categoryValues: CategoryValues;
		valueLinks: ValueLinks;
		placeStarter?: PlaceStarter;
		noteLinks?: NoteLinks;
		ownFields?: OwnFieldDefinition[];
		ownValues?: Record<string, string[]>;
		pins?: Pin[];
		pinsError?: string;
		glossary?: GlossaryEntry[];
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (number: number, next: boolean) => void | Promise<void>;
	};

	let {
		artwork,
		categoryValues,
		valueLinks,
		placeStarter,
		noteLinks,
		ownFields,
		ownValues = {},
		pins = [],
		pinsError,
		glossary = [],
		cancelHref,
		oncancel,
		onsaved
	}: Props = $props();

	const titleId = $props.id();
	const yearToId = `${titleId}-year-to`;
	const typeTiles = artworkTypeTiles();
	const imageTexts: ImageFieldTexts = {
		label: m.artworkForm.image,
		find: m.artworkForm.findImage,
		findOther: m.artworkForm.chooseOtherImage,
		findHint: m.artworkForm.findImageHint,
		own: m.artworkForm.ownImage,
		changeOwn: m.artworkForm.changeOwnImage,
		ownTitle: m.artworkForm.ownImageTitle,
		changeOwnTitle: m.artworkForm.changeOwnImageTitle,
		remove: m.artworkForm.removeImage
	};
	const eraOptions = eraTiles();
	const describedCategories: { code: 'material' | 'location'; label: string }[] = [
		{ code: 'material', label: m.artworkForm.material },
		{ code: 'location', label: m.artworkForm.location }
	];

	let form = $state(initialForm());
	let fieldErrors = $state<ArtworkFieldErrors>({});
	let savingNext = $state(false);
	let next = false;
	let barHeight = $state(0);
	let toast: Toast;
	const formState = new FormState<ArtworkFormState>(initialForm());
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		formHasChanges
	);
	const duplicateCheck = new DuplicateCheck();

	let imageSearchReady = $derived(canSearchImage(form));
	let imageAlt = $derived(artworkImageAlt(form));
	let pinList = $derived(pins);

	function initialForm(): ArtworkFormState {
		return artwork ? artworkFormFromRecord(artwork, ownFields) : emptyArtworkForm(ownFields);
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	async function confirmDuplicate(input: ArtworkInput): Promise<boolean> {
		if (artwork && sameTitleAndAuthors(input, artwork)) return true;
		return duplicateCheck.confirm(input, artwork?.id);
	}

	onDestroy(() => {
		duplicateCheck.answer(false);
	});

	let periodLocked = $derived(form.eraCode === null);
	let styleLocked = $derived(form.values.period.length === 0);

	function suggestions(code: CategoryCode, existing: readonly string[]): ValueSuggestion[] {
		return suggestValues({
			query: form.queries[code],
			existing,
			selected: form.values[code],
			...(code === 'location' && placeStarter
				? { starter: placeStarter.museums, notes: placeStarter.notes }
				: {})
		});
	}

	function options(code: CategoryCode): ValueSuggestion[] {
		return suggestions(code, categoryValues[code]);
	}

	function periodOptions(): ValueSuggestion[] {
		return suggestions('period', form.eraCode ? valueLinks.periodsByEra[form.eraCode] : []);
	}

	function ownOptions(field: OwnFieldDefinition): ValueSuggestion[] {
		return suggestValues({
			query: form.ownQueries[field.id] ?? '',
			existing: ownValues[field.id] ?? [],
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

	function styleOptions(): ValueSuggestion[] {
		const period = form.values.period[0];
		return suggestions('style', period ? (valueLinks.stylesByPeriod[valueKey(period)] ?? []) : []);
	}

	function clearStyles(): void {
		form.values.style = [];
		form.queries.style = '';
	}

	function clearPeriod(): void {
		form.values.period = [];
		form.queries.period = '';
		clearStyles();
	}

	function chooseEra(code: string | null): void {
		const next: EraCode | null = isEraCode(code) ? code : null;
		if (form.eraCode !== null && next !== form.eraCode) clearPeriod();
		form.eraCode = next;
	}

	function chooseType(code: string | null): void {
		form.typeCode = isArtworkTypeCode(code) ? code : '';
	}

	function choosePeriod(values: string[]): void {
		const previous = form.values.period[0];
		form.values.period = values;
		if (previous !== undefined && previous !== values[0]) clearStyles();
	}

	function setAuthorUnknown(): void {
		if (!form.authorUnknown) return;
		form.values.author = [];
		form.queries.author = '';
	}

	function saveAndAddNext(event: MouseEvent): void {
		next = true;
		(event.currentTarget as HTMLButtonElement).form?.requestSubmit();
	}

	async function submit(): Promise<void> {
		const andNext = next;
		next = false;
		await formState.run(async () => {
			savingNext = andNext;
			const snapshot = $state.snapshot(form);
			const input = artworkInputFromForm(snapshot);
			fieldErrors = validateArtwork(input);
			if (Object.keys(fieldErrors).length > 0) return;
			if (!(await confirmDuplicate(input))) return;
			const result = await saveArtwork(
				input,
				artwork ? { id: artwork.id, image: artwork.image, images: artwork.images } : undefined
			);
			if (!result.saved) {
				fieldErrors = result.fieldErrors;
				formState.error = result.error ?? '';
				return;
			}
			formState.saved = snapshot;
			await afterSave(result.number, andNext);
		});
	}

	async function afterSave(recordNumber: number, andNext: boolean): Promise<void> {
		try {
			await onsaved(recordNumber, andNext);
		} catch {
			const number = formatRecordNumber(recordNumber);
			toast.show(artwork ? m.artworkForm.changesSaved(number) : m.artworkForm.saved(number));
			return;
		}
		if (!andNext) return;

		form = emptyArtworkForm(ownFields);
		formState.saved = emptyArtworkForm(ownFields);
		toast.show(m.artworkForm.saved(formatRecordNumber(recordNumber)));
		window.scrollTo({ top: 0 });
		await tick();
		document.getElementById(titleId)?.focus();
	}
</script>

<Form error={formState.error} errorTitle={m.artworkForm.errorTitle} onsubmit={submit}>
	<div class="columns">
		<ArtworkImages
			alt={imageAlt}
			autoMatch={!artwork}
			entries={glossary}
			{pinsError}
			query={{
				kind: 'artwork',
				title: form.title,
				authors: form.authorUnknown ? [] : form.values.author
			}}
			searchReady={imageSearchReady}
			texts={imageTexts}
			bind:image={form.image}
			bind:images={form.images}
			bind:pins={pinList}
		/>

		<div class="fields">
			<TextField
				id={titleId}
				autocomplete="off"
				error={fieldErrors.title}
				label={m.artworkForm.title}
				bind:value={form.title}
			/>

			<div class="group">
				<ValueField
					disabled={form.authorUnknown}
					error={fieldErrors.authors}
					label={m.artworkForm.authors}
					maxlength={VALUE_NAME_MAX_LENGTH}
					options={options('author')}
					bind:query={form.queries.author}
					bind:values={form.values.author}
				/>
				<Checkbox
					label={m.artworkForm.authorUnknown}
					onchange={setAuthorUnknown}
					bind:checked={form.authorUnknown}
				/>
			</div>

			<YearGroup
				columns={form.spanMode}
				labelFor={form.spanMode ? undefined : yearToId}
				title={form.spanMode ? m.artworkForm.spanTitle : m.artworkForm.year}
			>
				{#snippet aside()}
					<Checkbox label={m.artworkForm.yearApproximate} bind:checked={form.yearApproximate} />
					<Switch label={m.artworkForm.spanSwitch} bind:checked={form.spanMode} />
				{/snippet}
				{#if form.spanMode}
					<YearInput
						beforeCommonEraLabel={m.artworkForm.beforeCommonEraFrom}
						error={fieldErrors.yearFrom}
						label={m.artworkForm.spanFrom}
						placeholder={m.artworkForm.spanFrom}
						bind:value={form.yearFrom}
						bind:beforeCommonEra={form.fromBeforeCommonEra}
					/>
				{/if}
				<YearInput
					id={yearToId}
					beforeCommonEraLabel={form.spanMode ? m.artworkForm.beforeCommonEraTo : undefined}
					error={fieldErrors.yearTo}
					label={form.spanMode ? m.artworkForm.spanTo : m.artworkForm.year}
					placeholder={form.spanMode ? m.artworkForm.spanTo : undefined}
					bind:value={form.yearTo}
					bind:beforeCommonEra={form.toBeforeCommonEra}
				/>
			</YearGroup>

			<ChoiceTiles
				clearable
				columns={4}
				label={m.artworkForm.type}
				narrowColumns={2}
				onchange={chooseType}
				options={typeTiles}
				value={form.typeCode || null}
			/>

			<ChoiceTiles
				clearable
				label={m.artworkForm.era}
				onchange={chooseEra}
				options={eraOptions}
				value={form.eraCode}
			/>

			<ValueField
				label={m.artworkForm.period}
				locked={periodLocked}
				maxlength={VALUE_NAME_MAX_LENGTH}
				options={periodOptions()}
				placeholder={periodLocked ? m.artworkForm.periodLocked : undefined}
				single
				bind:query={form.queries.period}
				bind:values={() => form.values.period, choosePeriod}
			/>

			<ValueField
				label={m.artworkForm.style}
				locked={styleLocked}
				maxlength={VALUE_NAME_MAX_LENGTH}
				options={styleOptions()}
				placeholder={styleLocked ? m.artworkForm.styleLocked : undefined}
				bind:query={form.queries.style}
				bind:values={form.values.style}
			/>

			{#each describedCategories as category (category.code)}
				<ValueField
					hint={category.code === 'location' ? m.artworkForm.locationHint : undefined}
					label={category.label}
					maxlength={VALUE_NAME_MAX_LENGTH}
					options={options(category.code)}
					single={takesOneValue(category.code)}
					bind:query={form.queries[category.code]}
					bind:values={form.values[category.code]}
				/>
			{/each}

			{#if form.own}
				{#each ownFields ?? [] as field (field.id)}
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
								() => form.ownQueries[field.id] ?? '',
								(query) => (form.ownQueries[field.id] = query)
							}
							bind:values={() => ownList(field), (values) => setOwn(field, values)}
						/>
					{:else}
						<div class="group">
							<Checkbox
								aria-describedby={field.description ? `${titleId}-own-${field.id}` : undefined}
								label={field.name}
								bind:checked={() => ownFlag(field), (checked) => setOwn(field, checked)}
							/>
							{#if field.description}
								<FieldMessage id="{titleId}-own-{field.id}" hint={field.description} />
							{/if}
						</div>
					{/if}
				{/each}
			{/if}

			<NotesEditor
				hint={noteLinks ? m.artworkForm.notesLinkHint : undefined}
				label={m.artworkForm.notes}
				links={noteLinks}
				placeholder={m.artworkForm.notesPlaceholder}
				bind:value={form.notes}
			/>
		</div>
	</div>

	<FormActions bind:height={barHeight}>
		<Button href={cancelHref} onclick={oncancel}>
			{m.artworkForm.cancel}
		</Button>
		{#if !artwork}
			<Button disabled={formState.busy} onclick={saveAndAddNext}>
				{formState.busy && savingNext ? m.artworkForm.saving : m.artworkForm.saveAndNext}
			</Button>
		{/if}
		<Button disabled={formState.busy} type="submit" variant="primary">
			{formState.busy && !savingNext ? m.artworkForm.saving : m.artworkForm.save}
		</Button>
	</FormActions>
</Form>

<Toast bind:this={toast} offset={barHeight} />

<DiscardDialog {changes} description={m.artworkForm.discardDescription} />

<DuplicateDialog action="save" check={duplicateCheck} />

<style>
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

	.group {
		display: grid;
		gap: var(--spacing-3);
	}

	@media (min-width: 768px) {
		.columns {
			grid-template-columns: minmax(220px, 1fr) minmax(0, 1.25fr);
			gap: var(--spacing-12);
		}

		.fields {
			max-width: var(--size-content-default);
		}
	}
</style>
