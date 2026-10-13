<script lang="ts">
	import { tick } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		Form,
		Select,
		NotesEditor,
		TextField,
		Toast,
		ValueField
	} from '@study-atelier/ui';
	import { beforeNavigate, goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
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
	import { findDuplicates, formatRecordNumbers, sameTitleAndAuthors } from '../duplicates.ts';
	import { eraTiles, isEraCode } from '../eras.ts';
	import { formatRecordNumber } from '../format.ts';
	import { suggestValues, valueKey } from '../value-suggestions.ts';
	import ArtworkImageField from './ArtworkImageField.svelte';
	import type {
		ArtworkFieldErrors,
		ArtworkFormState,
		ArtworkInput,
		ArtworkRecord,
		CategoryCode,
		CategoryValues,
		EraCode,
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

	const titleId = 'artwork-title';
	const typeOptions = artworkTypeOptions();
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
	let discardOpen = $state(false);
	let barHeight = $state(0);
	let toast: Toast;
	let leaving = false;
	let answerDiscard: ((discard: boolean) => void) | null = null;
	let duplicateOpen = $state(false);
	let duplicates = $state<number[]>([]);
	let answerDuplicate: ((save: boolean) => void) | null = null;

	let imageSearchReady = $derived(canSearchImage(form));
	let imageAlt = $derived(artworkImageAlt(form));

	function initialForm(): ArtworkFormState {
		return artwork ? artworkFormFromRecord(artwork) : emptyArtworkForm();
	}

	export function confirmLeave(): Promise<boolean> {
		if (leaving || !formHasChanges(form, saved)) return Promise.resolve(true);
		discardOpen = true;
		return new Promise((resolve) => {
			answerDiscard = (discard) => {
				answerDiscard = null;
				leaving = discard;
				resolve(discard);
			};
		});
	}

	function answer(discard: boolean): void {
		answerDiscard?.(discard);
		discardOpen = false;
	}

	async function confirmDuplicate(input: ArtworkInput): Promise<boolean> {
		if (artwork && sameTitleAndAuthors(input, artwork)) return true;
		const numbers = await findDuplicates(input, artwork?.id);
		if (numbers.length === 0) return true;
		duplicates = numbers;
		duplicateOpen = true;
		return new Promise((resolve) => {
			answerDuplicate = (save) => {
				answerDuplicate = null;
				resolve(save);
			};
		});
	}

	function answerDuplicateDialog(save: boolean): void {
		answerDuplicate?.(save);
		duplicateOpen = false;
	}

	beforeNavigate((navigation) => {
		if (leaving || !formHasChanges(form, saved)) return;
		navigation.cancel();
		const url = navigation.to?.url;
		if (navigation.type === 'leave' || !url) return;
		const target = `${url.pathname}${url.search}${url.hash}` as ResolvedPathname;
		const popstate = navigation.type === 'popstate' ? navigation.delta : null;
		void confirmLeave().then((discard) => {
			if (!discard) return;
			if (popstate === null) void goto(target);
			else history.go(popstate);
		});
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
		formError = '';
		const input = artworkInputFromForm(form);
		fieldErrors = validateArtwork(input);
		if (Object.keys(fieldErrors).length > 0) return;

		saving = andNext ? 'next' : 'save';
		if (!(await confirmDuplicate(input))) {
			saving = null;
			return;
		}
		const result = await saveArtwork(
			input,
			artwork ? { id: artwork.id, image: artwork.image } : undefined
		);
		if (!result.saved) {
			fieldErrors = result.fieldErrors;
			formError = result.error ?? '';
			saving = null;
			return;
		}

		saved = $state.snapshot(form);
		await onsaved(result.number, andNext);
		saving = null;
		if (!andNext) return;

		form = emptyArtworkForm();
		saved = emptyArtworkForm();
		toast.show(m.artworkForm.saved(formatRecordNumber(result.number)));
		window.scrollTo({ top: 0 });
		await tick();
		document.getElementById(titleId)?.focus();
	}
</script>

<Form onsubmit={submit}>
	{#if formError}
		<Alert title={m.artworkForm.errorTitle} tone="danger">
			{formError}
		</Alert>
	{/if}

	<div class="columns">
		<ArtworkImageField
			alt={imageAlt}
			searchAuthors={form.authorUnknown ? [] : form.values.author}
			searchReady={imageSearchReady}
			searchTitle={form.title}
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

			<div class="group">
				<TextField
					autocomplete="off"
					error={fieldErrors.year}
					inputmode="numeric"
					label={m.artworkForm.year}
					bind:value={form.year}
				/>
				<div class="checks">
					<Checkbox label={m.artworkForm.beforeCommonEra} bind:checked={form.beforeCommonEra} />
					<Checkbox label={m.artworkForm.yearApproximate} bind:checked={form.yearApproximate} />
				</div>
			</div>

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

	<footer class="actions" bind:offsetHeight={barHeight}>
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
	</footer>
</Form>

<Toast bind:this={toast} offset={barHeight} />

<Dialog
	description={m.artworkForm.discardDescription}
	onclose={() => answerDiscard?.(false)}
	size="small"
	title={m.artworkForm.discardTitle}
	bind:open={discardOpen}
>
	{#snippet footer()}
		<Button onclick={() => answer(false)}>
			{m.artworkForm.keepEditing}
		</Button>
		<Button onclick={() => answer(true)} variant="primary">
			{m.artworkForm.discard}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={m.artworkForm.duplicateDescription(
		formatRecordNumbers(duplicates),
		duplicates.length
	)}
	onclose={() => answerDuplicate?.(false)}
	size="small"
	title={m.artworkForm.duplicateTitle}
	bind:open={duplicateOpen}
>
	{#snippet footer()}
		<Button onclick={() => answerDuplicateDialog(false)}>
			{m.artworkForm.keepEditing}
		</Button>
		<Button onclick={() => answerDuplicateDialog(true)} variant="primary">
			{m.artworkForm.saveAnyway}
		</Button>
	{/snippet}
</Dialog>

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

	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-4);
	}

	.actions {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-3);
		padding: var(--spacing-3) 0;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.actions > :global(*) {
		flex: 1 1 auto;
	}

	.actions > :global(:first-child) {
		order: 3;
		flex-basis: 100%;
	}

	@media (min-width: 768px) {
		.columns {
			grid-template-columns: minmax(220px, 1fr) minmax(0, 1.25fr);
			gap: var(--spacing-12);
		}

		.fields {
			max-width: var(--size-content-default);
		}

		.actions {
			justify-content: flex-end;
			padding: var(--spacing-4) 0;
		}

		.actions > :global(*) {
			flex: none;
		}

		.actions > :global(:first-child) {
			order: 0;
			flex-basis: auto;
			margin-right: auto;
		}
	}
</style>
