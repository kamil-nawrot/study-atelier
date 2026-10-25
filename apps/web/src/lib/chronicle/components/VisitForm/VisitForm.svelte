<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Button,
		Form,
		FormActions,
		NotesEditor,
		ValueField,
		type NoteLinks
	} from '@study-atelier/ui';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { suggestValues, valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { saveVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
	import {
		draftOfVisitForm,
		emptyVisitForm,
		placeOf,
		validateVisitForm,
		visitFormChanged,
		visitFormOf,
		withPlaceArtworks
	} from '#lib/chronicle/visit-form/visit-form.ts';
	import VisitDateField from '#lib/chronicle/components/VisitDateField/VisitDateField.svelte';
	import VisitArtworksField from '#lib/chronicle/components/VisitArtworksField/VisitArtworksField.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
	import type { VisitFormErrors } from '#lib/chronicle/types/visit-form-errors.ts';
	import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

	type Props = {
		visit?: Visit;
		artworks: WallArtwork[];
		places: string[];
		placeStarter?: PlaceStarter;
		noteLinks?: NoteLinks;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
		onsaved: (draft: VisitDraft, id: string) => void | Promise<void>;
	};

	let {
		visit,
		artworks,
		places,
		placeStarter,
		noteLinks,
		cancelHref,
		oncancel,
		onnearscreen,
		onimagefailed,
		onsaved
	}: Props = $props();

	const existing = untrack(() => visit);
	const known = untrack(() => new Set(artworks.map((artwork) => artwork.id)));
	const kept = existing?.artworkIds.filter((id) => !known.has(id)) ?? [];
	const initial = (): VisitFormState =>
		existing
			? visitFormOf(
					existing,
					untrack(() => artworks)
				)
			: emptyVisitForm();

	let form = $state<VisitFormState>(initial());
	let errors = $state<VisitFormErrors>({});

	const formState = new FormState<VisitFormState>(initial());
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		visitFormChanged
	);

	let placeKey = $derived(valueKey(placeOf(form)));
	let shownPlace = untrack(() => placeKey);

	let placeOptions = $derived(
		suggestValues({
			query: form.placeQuery,
			existing: places,
			selected: form.place,
			starter: placeStarter?.museums,
			notes: placeStarter?.notes
		})
	);

	$effect(() => {
		const key = placeKey;
		if (key === '' || key === shownPlace) return;
		shownPlace = key;
		form = withPlaceArtworks(
			untrack(() => form),
			untrack(() => artworks),
			formState.saved
		);
	});

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			errors = validateVisitForm(form);
			if (Object.keys(errors).length > 0) return;
			const snapshot = $state.snapshot(form);
			const draft = draftOfVisitForm(snapshot, kept);
			const result = await saveVisit(draft, existing?.id);
			if (result.error || !result.id) {
				formState.error = result.error ?? m.common.unexpectedError;
				return;
			}
			formState.saved = snapshot;
			await onsaved(draft, result.id);
		});
	}
</script>

<div class="page">
	<Form error={formState.error} errorTitle={m.chronicle.form.errorTitle} onsubmit={submit}>
		<div class="fields">
			<ValueField
				error={errors.place}
				hint={existing ? undefined : m.chronicle.form.placeHint}
				label={m.chronicle.form.place}
				maxlength={VALUE_NAME_MAX_LENGTH}
				options={placeOptions}
				single
				bind:query={form.placeQuery}
				bind:values={form.place}
			/>

			<VisitDateField {errors} bind:day={form.day} bind:month={form.month} bind:year={form.year} />

			<NotesEditor
				hint={noteLinks ? m.artworkForm.notesLinkHint : undefined}
				label={m.common.notes}
				links={noteLinks}
				placeholder={m.chronicle.form.notesPlaceholder}
				bind:value={form.notes}
			/>

			<VisitArtworksField {artworks} isNew={!existing} {onimagefailed} {onnearscreen} bind:form />
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

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6) - var(--spacing-12));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}
</style>
