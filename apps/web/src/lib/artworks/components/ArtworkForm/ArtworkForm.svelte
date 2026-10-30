<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import {
		Button,
		Checkbox,
		ChoiceTiles,
		Form,
		FormActions,
		NotesEditor,
		Switch,
		TextField,
		Toast,
		ValueField
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		artworkFormFromRecord,
		artworkImageAlt,
		artworkInputFromForm,
		canSearchImage,
		describedCategories,
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
	import type { FormSuggestions } from '#lib/artworks/form-suggestions/form-suggestions.svelte.ts';
	import { DuplicateCheck } from '#lib/artworks/duplicate-check/duplicate-check.svelte.ts';
	import { sameTitleAndAuthors } from '#lib/artworks/duplicates/duplicates.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { suggestValues } from '#lib/card-index/value-suggestions/value-suggestions.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import ArtworkEraFields from '#lib/artworks/components/ArtworkEraFields/ArtworkEraFields.svelte';
	import ArtworkImages from '#lib/artworks/components/ArtworkImages/ArtworkImages.svelte';
	import ArtworkOwnFields from '#lib/artworks/components/ArtworkOwnFields/ArtworkOwnFields.svelte';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';
	import DuplicateDialog from '#lib/artworks/components/DuplicateDialog/DuplicateDialog.svelte';
	import type { ArtworkFieldErrors } from '#lib/artworks/types/artwork-field-errors.ts';
	import type { ArtworkFormState } from '#lib/artworks/types/artwork-form-state.ts';
	import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { ValueSuggestion } from '#lib/card-index/types/value-suggestion.ts';
	import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

	type Props = {
		artwork?: ArtworkRecord;
		suggestions: FormSuggestions;
		ownFields?: OwnFieldDefinition[];
		pins?: Pin[];
		pinsError?: string;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (number: number, next: boolean) => void | Promise<void>;
	};

	let {
		artwork,
		suggestions,
		ownFields,
		pins = [],
		pinsError,
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
	let form = $state(initialForm());
	let fieldErrors = $state<ArtworkFieldErrors>({});
	let savingNext = $state(false);
	let imageMatching = $state(false);
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

	function suggestionsFor(code: CategoryCode, existing: readonly string[]): ValueSuggestion[] {
		return suggestValues({
			query: form.queries[code],
			existing,
			selected: form.values[code],
			...(code === 'location'
				? { starter: suggestions.placeStarter.museums, notes: suggestions.placeStarter.notes }
				: {})
		});
	}

	function wantSuggestions(event: FocusEvent): void {
		const target = event.target as HTMLElement;
		if (target.matches('[role="combobox"], [contenteditable="true"]')) void suggestions.load();
	}

	function options(code: CategoryCode): ValueSuggestion[] {
		return suggestionsFor(code, suggestions.categoryValues[code]);
	}

	function chooseType(code: string | null): void {
		form.typeCode = isArtworkTypeCode(code) ? code : '';
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
	<div class="columns" onfocusin={wantSuggestions}>
		<ArtworkImages
			alt={imageAlt}
			autoMatch={!artwork}
			entries={suggestions.glossary}
			onmatching={(matching) => (imageMatching = matching)}
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

			<ArtworkEraFields valueLinks={suggestions.valueLinks} bind:form />

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
				<ArtworkOwnFields
					fields={ownFields ?? []}
					idPrefix={titleId}
					values={suggestions.ownValues}
					bind:form
				/>
			{/if}

			<NotesEditor
				hint={m.artworkForm.notesLinkHint}
				label={m.common.notes}
				links={suggestions.noteLinks}
				placeholder={m.artworkForm.notesPlaceholder}
				bind:value={form.notes}
			/>
		</div>
	</div>

	<FormActions bind:height={barHeight}>
		<Button href={cancelHref} onclick={oncancel}>
			{m.common.cancel}
		</Button>
		{#if !artwork}
			<Button disabled={formState.busy || imageMatching} onclick={saveAndAddNext}>
				{formState.busy && savingNext ? m.common.saving : m.artworkForm.saveAndNext}
			</Button>
		{/if}
		<Button disabled={formState.busy || imageMatching} type="submit" variant="primary">
			{formState.busy && !savingNext ? m.common.saving : m.common.save}
		</Button>
	</FormActions>
</Form>

<Toast bind:this={toast} offset={barHeight} />

<DiscardDialog {changes} description={m.common.discardDescription} />

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
