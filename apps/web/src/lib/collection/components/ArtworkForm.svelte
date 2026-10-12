<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import { tick } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		Dialog,
		Form,
		Icon,
		Select,
		TextArea,
		TextField,
		Toast,
		ValueField
	} from '@study-atelier/ui';
	import { beforeNavigate, goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/index.ts';
	import { COMMONS_THUMBNAIL_WIDTHS, commonsFileUrl, commonsSrcset } from '#lib/images/commons.ts';
	import ImageSearchDialog from '#lib/images/components/ImageSearchDialog.svelte';
	import { commonsCredit } from '#lib/images/credit.ts';
	import type { ImageCandidate } from '#lib/images/types.ts';
	import {
		artworkInputFromForm,
		artworkTypeOptions,
		canSearchImage,
		emptyArtworkForm,
		formHasChanges,
		imageFromCandidate
	} from '../artwork-form.ts';
	import { saveArtwork, validateArtwork } from '../artwork-record.ts';
	import { startingValues, takesOneValue } from '../category-values.ts';
	import { formatRecordNumber } from '../format.ts';
	import { suggestValues } from '../value-suggestions.ts';
	import type {
		ArtworkFieldErrors,
		CategoryCode,
		CategoryValues,
		ValueSuggestion
	} from '../types.ts';

	type Props = {
		categoryValues: CategoryValues;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (number: number, next: boolean) => void | Promise<void>;
	};

	let { categoryValues, cancelHref, oncancel, onsaved }: Props = $props();

	const titleId = 'artwork-title';
	const PREVIEW_WIDTH = 500;
	const typeOptions = artworkTypeOptions();
	const describedCategories: { code: Exclude<CategoryCode, 'author'>; label: string }[] = [
		{ code: 'period', label: m.artworkForm.period },
		{ code: 'style', label: m.artworkForm.style },
		{ code: 'material', label: m.artworkForm.material },
		{ code: 'location', label: m.artworkForm.location }
	];

	let form = $state(emptyArtworkForm());
	let saved = $state(emptyArtworkForm());
	let fieldErrors = $state<ArtworkFieldErrors>({});
	let formError = $state('');
	let saving = $state<'save' | 'next' | null>(null);
	let next = false;
	let discardOpen = $state(false);
	let imageSearchOpen = $state(false);
	let barHeight = $state(0);
	let toast: Toast;
	let leaving = false;
	let answerDiscard: ((discard: boolean) => void) | null = null;

	let imageSearchReady = $derived(canSearchImage(form));
	let commonsImage = $derived(form.image?.kind === 'commons' ? form.image : null);
	let imageAlt = $derived(
		[
			form.title.trim(),
			form.authorUnknown ? m.artworkForm.authorUnknown : form.values.author.join(', ')
		]
			.filter((part) => part !== '')
			.join(', ')
	);

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

	function options(code: CategoryCode): ValueSuggestion[] {
		return suggestValues({
			query: form.queries[code],
			existing: categoryValues[code],
			starting: startingValues(code),
			selected: form.values[code]
		});
	}

	function pickImage(candidate: ImageCandidate): void {
		form.image = imageFromCandidate(candidate);
	}

	function previewSrcset(file: string, width: number | null): string {
		const widths = COMMONS_THUMBNAIL_WIDTHS.filter((size) => width === null || size <= width);
		return commonsSrcset(file, widths);
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
		const result = await saveArtwork(input);
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
		<section class="image" aria-label={m.artworkForm.image}>
			<figure class="mat">
				{#if commonsImage}
					<img
						alt={imageAlt}
						height={commonsImage.height}
						sizes="(min-width: 768px) 40vw, 100vw"
						src={commonsFileUrl(commonsImage.file, PREVIEW_WIDTH)}
						srcset={previewSrcset(commonsImage.file, commonsImage.width)}
						width={commonsImage.width}
					/>
				{:else}
					<div class="window">
						<Icon icon={ImageIcon} />
					</div>
				{/if}
			</figure>
			{#if commonsImage}
				<p class="caption">{commonsCredit(commonsImage.licence, commonsImage.attribution)}</p>
			{/if}
			<div class="image-actions">
				<Button disabled={!imageSearchReady} onclick={() => (imageSearchOpen = true)}>
					<Icon icon={Search} size="sm" />
					{commonsImage ? m.artworkForm.chooseOtherImage : m.artworkForm.findImage}
				</Button>
				<Button>
					<Icon icon={ImagePlus} size="sm" />
					{m.artworkForm.ownImage}
				</Button>
				{#if commonsImage}
					<Button onclick={() => (form.image = null)}>
						{m.artworkForm.removeImage}
					</Button>
				{/if}
			</div>
			{#if !imageSearchReady}
				<p class="caption">{m.artworkForm.findImageHint}</p>
			{/if}
		</section>

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

			<TextArea
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
		<Button disabled={saving !== null} onclick={saveAndAddNext}>
			{saving === 'next' ? m.artworkForm.saving : m.artworkForm.saveAndNext}
		</Button>
		<Button disabled={saving !== null} type="submit" variant="primary">
			{saving === 'save' ? m.artworkForm.saving : m.artworkForm.save}
		</Button>
	</footer>
</Form>

<Toast bind:this={toast} offset={barHeight} />

<ImageSearchDialog
	authors={form.authorUnknown ? [] : form.values.author}
	onpick={pickImage}
	title={form.title}
	bind:open={imageSearchOpen}
/>

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

<style>
	.columns {
		display: grid;
		gap: var(--spacing-8);
	}

	.image {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
	}

	.mat {
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.mat img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
	}

	.image-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.image-actions > :global(*) {
		flex: 1 1 auto;
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

		.image {
			position: sticky;
			top: var(--spacing-24);
		}

		.image-actions > :global(*) {
			flex: none;
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
