<script lang="ts">
	import { untrack } from 'svelte';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Ticket from '@lucide/svelte/icons/ticket';
	import {
		Button,
		ChoiceTiles,
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
	import { LiveErrors } from '#lib/shared/forms/live-errors/live-errors.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { saveVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
	import {
		draftOfVisitForm,
		emptyVisitForm,
		placeOf,
		suggestedArtworks,
		validateVisitForm,
		visitFormChanged,
		visitFormOf,
		withPlaceArtworks
	} from '#lib/chronicle/visit-form/visit-form.ts';
	import VisitDateField from '#lib/chronicle/components/VisitDateField/VisitDateField.svelte';
	import VisitArtworksField from '#lib/chronicle/components/VisitArtworksField/VisitArtworksField.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
	import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
	import type { Town } from '#lib/map/types/town.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
	import type { VisitFormErrors } from '#lib/chronicle/types/visit-form-errors.ts';
	import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

	type Props = {
		visit?: Visit;
		artworks: WallArtwork[];
		places: string[];
		tripPlaces?: TripPlace[];
		towns?: Town[];
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
		tripPlaces = [],
		towns = [],
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
	const source = () => ({ artworks, tripPlaces, towns });
	const initial = (): VisitFormState => {
		if (!existing) return emptyVisitForm();
		const start = emptyVisitForm(existing.kind);
		const suggested = untrack(() =>
			suggestedArtworks({ ...start, place: [existing.place] }, source())
		);
		return visitFormOf(
			existing,
			untrack(() => artworks),
			suggested
		);
	};

	const kinds = [
		{ value: 'visit', label: m.chronicle.kind, note: m.chronicle.form.visitTile, icon: Ticket },
		{ value: 'trip', label: m.chronicle.trip.kind, note: m.chronicle.form.tripTile, icon: Building2 }
	];

	let form = $state<VisitFormState>(initial());
	const errors = new LiveErrors<VisitFormErrors>(() => validateVisitForm(form, tripPlaces));

	const formState = new FormState<VisitFormState>(initial());
	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		visitFormChanged
	);

	let trip = $derived(form.kind === 'trip');
	let texts = $derived(trip ? m.chronicle.trip.form : m.chronicle.form);
	let placeKey = $derived(valueKey(placeOf(form)));
	let shownPlace = untrack(() => `${form.kind}:${placeKey}`);
	let suggested = $derived(suggestedArtworks(form, source()));
	let cities = $derived(
		tripPlaces.filter((place) => place.placeType === 'city').map((place) => place.name)
	);

	let placeOptions = $derived(
		trip
			? suggestValues({ query: form.placeQuery, existing: cities, selected: form.place })
			: suggestValues({
					query: form.placeQuery,
					existing: places,
					selected: form.place,
					starter: placeStarter?.museums,
					notes: placeStarter?.notes
				})
	);

	$effect(() => {
		const key = `${form.kind}:${placeKey}`;
		if (placeKey === '' || key === shownPlace) return;
		shownPlace = key;
		form = withPlaceArtworks(
			untrack(() => form),
			untrack(() => suggested),
			untrack(() => formState.saved)
		);
	});

	function chooseKind(value: string | null): void {
		form.kind = value === 'trip' ? 'trip' : 'visit';
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			if (!errors.check()) return;
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
	<Form error={formState.error} errorTitle={texts.errorTitle} onsubmit={submit}>
		<div class="columns">
			<div class="fields">
				{#if !existing}
					<ChoiceTiles
						label={m.chronicle.form.kind}
						onchange={chooseKind}
						options={kinds}
						value={form.kind}
					/>
				{/if}

				<ValueField
					error={errors.current.place}
					hint={existing ? undefined : texts.placeHint}
					label={texts.place}
					maxlength={VALUE_NAME_MAX_LENGTH}
					options={placeOptions}
					single
					bind:query={form.placeQuery}
					bind:values={form.place}
				/>

				<VisitDateField
					errors={errors.current}
					hint={trip ? m.chronicle.trip.form.startHint : undefined}
					legend={trip ? m.chronicle.trip.form.start : undefined}
					bind:day={form.day}
					bind:month={form.month}
					bind:year={form.year}
				/>

				{#if trip}
					<VisitDateField
						errors={{
							day: errors.current.endDay,
							month: errors.current.endMonth,
							year: errors.current.endYear
						}}
						hint={m.chronicle.trip.form.endHint}
						legend={m.chronicle.trip.form.end}
						bind:day={form.endDay}
						bind:month={form.endMonth}
						bind:year={form.endYear}
					/>
				{/if}

				<NotesEditor
					hint={noteLinks ? m.artworkForm.notesLinkHint : undefined}
					label={m.common.notes}
					links={noteLinks}
					placeholder={m.chronicle.form.notesPlaceholder}
					bind:value={form.notes}
				/>
			</div>

			<div class="fields">
				<VisitArtworksField
					{artworks}
					isNew={!existing}
					{onimagefailed}
					{onnearscreen}
					{suggested}
					bind:form
				/>
			</div>
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
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.columns {
		display: grid;
		gap: var(--spacing-6);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}

		.columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--spacing-12);
		}
	}
</style>
