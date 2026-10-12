<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import { tick } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		Form,
		Icon,
		TextArea,
		TextField,
		ValueField
	} from '@study-atelier/ui';
	import { beforeNavigate } from '$app/navigation';
	import { m } from '#lib/i18n/index.ts';
	import {
		artworkInputFromForm,
		canSearchImage,
		emptyArtworkForm,
		formHasChanges
	} from '../artwork-form.ts';
	import { saveArtwork, validateArtwork } from '../artwork-record.ts';
	import { startingValues, takesOneValue } from '../category-values.ts';
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

	let imageSearchReady = $derived(canSearchImage(form));

	beforeNavigate(({ type, cancel }) => {
		if (type === 'leave' && formHasChanges(form, saved)) cancel();
	});

	function options(code: CategoryCode): ValueSuggestion[] {
		return suggestValues({
			query: form.queries[code],
			existing: categoryValues[code],
			starting: startingValues(code),
			selected: form.values[code]
		});
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
			<div class="mat">
				<div class="window">
					<Icon icon={ImageIcon} />
				</div>
			</div>
			<div class="image-actions">
				<Button disabled={!imageSearchReady}>
					<Icon icon={Search} size="sm" />
					{m.artworkForm.findImage}
				</Button>
				<Button>
					<Icon icon={ImagePlus} size="sm" />
					{m.artworkForm.ownImage}
				</Button>
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

	<footer class="actions">
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
		flex: 1 1 0;
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
