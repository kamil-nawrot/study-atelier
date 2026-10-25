<script lang="ts">
	import { LoadFailure, type NoteLinks } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { visitDateName } from '#lib/chronicle/visit-date/visit-date.ts';
	import VisitForm from '#lib/chronicle/components/VisitForm/VisitForm.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
	import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
	import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';

	type Props = {
		data: VisitResult & {
			artworks: WallArtwork[];
			places: string[];
			placeStarter?: PlaceStarter;
			noteLinks?: NoteLinks;
		};
	};

	let { data }: Props = $props();

	const chroniclePath = resolve('/(app)/atelier/chronicle');
	const images = new WallImages();

	let form = $state<VisitForm>();
	let cameFromApp = false;
	let cameFrom: string | undefined;

	let failed = $derived(data.error !== undefined || data.notFound === true);
	let artworks = $derived(images.apply(data.artworks));
	let cancelHref = $derived(
		data.visit ? resolve('/(app)/atelier/chronicle/[id]', { id: data.visit.id }) : chroniclePath
	);

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
		cameFrom = from?.url?.pathname;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	export function confirmLeave(): Promise<boolean> {
		return form?.confirmLeave() ?? Promise.resolve(true);
	}

	async function showSaved(draft: VisitDraft, id: string): Promise<void> {
		const path = resolve('/(app)/atelier/chronicle/[id]', { id });
		const options = {
			replace: true,
			refreshAll: true,
			state: { chronicleMessage: m.chronicle.saved(draft.place, visitDateName(draft.date)) }
		};
		if (cameFrom !== path) {
			await goto(path, options);
			return;
		}
		addEventListener('popstate', () => void goto(path, options), { once: true });
		history.back();
	}
</script>

{#if failed}
	<LoadFailure
		backHref={chroniclePath}
		backLabel={m.chronicle.back}
		errorTitle={m.chronicle.form.loadErrorTitle}
		message={data.notFound ? m.chronicle.errors.notFound : (data.error ?? '')}
		notFound={data.notFound === true}
	/>
{:else}
	<VisitForm
		bind:this={form}
		{artworks}
		{cancelHref}
		noteLinks={data.noteLinks}
		oncancel={goBack}
		onnearscreen={(artwork) => images.request(artwork)}
		onsaved={showSaved}
		placeStarter={data.placeStarter}
		places={data.places}
		visit={data.visit}
	/>
{/if}
