<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Form,
		FormActions,
		Select,
		NotesEditor,
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
		artworkTypeOptions,
		canSearchImage,
		emptyArtworkForm,
		formHasChanges
	} from '../artwork-form.ts';
	import { saveArtwork, validateArtwork } from '../artwork-record.ts';
	import { takesOneValue } from '../category-values.ts';
	import { DuplicateCheck } from '../duplicate-check.svelte.ts';
	import { sameTitleAndAuthors } from '../duplicates.ts';
	import { eraTiles, isEraCode } from '../eras.ts';
	import { formatRecordNumber } from '../format.ts';
	import { UnsavedChanges } from '../unsaved-changes.svelte.ts';
	import { suggestValues, valueKey } from '../value-suggestions.ts';
	import DiscardDialog from './DiscardDialog.svelte';
	import ImageField from './ImageField.svelte';
	import YearGroup from './YearGroup.svelte';
	import YearInput from './YearInput.svelte';
	import DuplicateDialog from './DuplicateDialog.svelte';
	import type {
		ArtworkFieldErrors,
		ArtworkFormState,
		ArtworkInput,
		ArtworkRecord,
		CategoryCode,
		CategoryValues,
		EraCode,
		ImageFieldTexts,
		ValueLinks,
		ValueSuggestion
	} from '../types.ts';

	type Props = {
		artwork?: ArtworkRecord;
		categoryValues: CategoryValues;
		valueLinks: ValueLinks;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (number: number, next: boolean) => void | Promise<void>;
	};

	let { artwork, categoryValues, valueLinks, cancelHref, oncancel, onsaved }: Props = $props();

	const titleId = $props.id();
	const formErrorId = `${titleId}-error`;
	const yearToId = `${titleId}-year-to`;
	const typeOptions = artworkTypeOptions();
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
	let saved = $state(initialForm());
	let fieldErrors = $state<ArtworkFieldErrors>({});
	let formError = $state('');
	let saving = $state<'save' | 'next' | null>(null);
	let next = false;
	let barHeight = $state(0);
	let toast: Toast;
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => saved,
		formHasChanges
	);
	const duplicateCheck = new DuplicateCheck();

	let imageSearchReady = $derived(canSearchImage(form));
	let imageAlt = $derived(artworkImageAlt(form));

	function initialForm(): ArtworkFormState {
		return artwork ? artworkFormFromRecord(artwork) : emptyArtworkForm();
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
			selected: form.values[code]
		});
	}

	function options(code: CategoryCode): ValueSuggestion[] {
		return suggestions(code, categoryValues[code]);
	}

	function periodOptions(): ValueSuggestion[] {
		return suggestions('period', form.eraCode ? valueLinks.periodsByEra[form.eraCode] : []);
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
		if (saving !== null) return;
		formError = '';
		const snapshot = $state.snapshot(form);
		const input = artworkInputFromForm(snapshot);
		fieldErrors = validateArtwork(input);
		if (Object.keys(fieldErrors).length > 0) return;

		saving = andNext ? 'next' : 'save';
		try {
			if (!(await confirmDuplicate(input))) return;
			const result = await saveArtwork(
				input,
				artwork ? { id: artwork.id, image: artwork.image } : undefined
			);
			if (!result.saved) {
				fieldErrors = result.fieldErrors;
				formError = result.error ?? '';
				await tick();
				document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
				return;
			}

			saved = snapshot;
			try {
				await onsaved(result.number, andNext);
			} catch {
				const number = formatRecordNumber(result.number);
				toast.show(artwork ? m.artworkForm.changesSaved(number) : m.artworkForm.saved(number));
				return;
			}
			if (!andNext) return;

			form = emptyArtworkForm();
			saved = emptyArtworkForm();
			toast.show(m.artworkForm.saved(formatRecordNumber(result.number)));
			window.scrollTo({ top: 0 });
			await tick();
			document.getElementById(titleId)?.focus();
		} finally {
			saving = null;
		}
	}
</script>

<Form onsubmit={submit}>
	{#if formError}
		<Alert id={formErrorId} title={m.artworkForm.errorTitle} tone="danger">
			{formError}
		</Alert>
	{/if}

	<div class="columns">
		<ImageField
			alt={imageAlt}
			query={{
				kind: 'artwork',
				title: form.title,
				authors: form.authorUnknown ? [] : form.values.author
			}}
			searchReady={imageSearchReady}
			texts={imageTexts}
			bind:image={form.image}
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

			<Select
				label={m.artworkForm.type}
				options={typeOptions}
				placeholder={m.artworkForm.typeNone}
				bind:value={form.typeCode}
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
				options={periodOptions()}
				placeholder={periodLocked ? m.artworkForm.periodLocked : undefined}
				single
				bind:query={form.queries.period}
				bind:values={() => form.values.period, choosePeriod}
			/>

			<ValueField
				label={m.artworkForm.style}
				locked={styleLocked}
				options={styleOptions()}
				placeholder={styleLocked ? m.artworkForm.styleLocked : undefined}
				bind:query={form.queries.style}
				bind:values={form.values.style}
			/>

			{#each describedCategories as category (category.code)}
				<ValueField
					hint={category.code === 'location' ? m.artworkForm.locationHint : undefined}
					label={category.label}
					options={options(category.code)}
					single={takesOneValue(category.code)}
					bind:query={form.queries[category.code]}
					bind:values={form.values[category.code]}
				/>
			{/each}

			<NotesEditor
				label={m.artworkForm.notes}
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
			<Button disabled={saving !== null} onclick={saveAndAddNext}>
				{saving === 'next' ? m.artworkForm.saving : m.artworkForm.saveAndNext}
			</Button>
		{/if}
		<Button disabled={saving !== null} type="submit" variant="primary">
			{saving === 'save' ? m.artworkForm.saving : m.artworkForm.save}
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
