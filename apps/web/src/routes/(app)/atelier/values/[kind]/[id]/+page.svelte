<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { onMount } from 'svelte';
	import { Button, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { wallTexts } from '#lib/values/value-page-view/value-page-view.ts';
	import ArtworksSection from '#lib/wall/components/ArtworksSection/ArtworksSection.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import ValueView from '#lib/values/components/ValueView/ValueView.svelte';
	import CityPlaces from '#lib/values/components/CityPlaces/CityPlaces.svelte';
	import ValueDeleteAction from '#lib/values/components/ValueDeleteAction/ValueDeleteAction.svelte';
	import SymbolUses from '#lib/symbols/components/SymbolUses/SymbolUses.svelte';
	import RelationsBand from '#lib/relations/components/RelationsBand/RelationsBand.svelte';
	import {
		artworksOfValue,
		subjectId,
		subjectName,
		subjectPath,
		valueEditPath,
		valueParents
	} from '#lib/card-index/value-pages/value-pages.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let toast: Toast;
	const images = new WallImages();

	let subject = $derived(data.subject);
	let title = $derived(
		subject
			? subjectName(subject)
			: data.notFound
				? m.valuePage.notFoundTitle
				: m.valuePage.loadErrorTitle
	);
	let editHref = $derived(subject ? valueEditPath(subject.kind, subjectId(subject)) : undefined);
	let cityPlaces = $derived(data.cityPlaces ?? []);
	let names = $derived(cityPlaces.map((place) => place.name));
	let artworks = $derived(
		subject ? images.apply(artworksOfValue(data.artworks, subject, names)) : []
	);
	let parents = $derived(subject ? valueParents(data.index, subject) : []);
	let record = $derived(subject && subject.kind !== 'era' ? subject.record : undefined);
	let texts = $derived(subject && wallTexts(subject, data.cityPlaces !== undefined));

	$effect.pre(() => {
		void data.artworks;
		images.reset();
	});

	onMount(() => {
		const message = page.state.valueMessage;
		if (message === undefined || !subject) return;
		toast.show(message);
		void goto(subjectPath(subject), { state: {}, shallow: true, replace: true });
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={cardIndexPath} fallbackName={m.valuePage.back} />
		{#if editHref}
			<Button aria-label={m.common.edit} compact href={editHref} icon={Pencil}>
				{m.common.edit}
			</Button>
		{/if}
		{#if record}
			<ValueDeleteAction places={cityPlaces} {record} />
		{/if}
	{/snippet}

	{#if subject && editHref && texts}
		<div class="page">
			<ValueView
				{artworks}
				count={artworks.length}
				details={data.details}
				glossary={data.glossary}
				mentions={data.mentions}
				noteLinks={data.noteLinks}
				{parents}
				{subject}
				visits={data.visits}
			/>

			{#if cityPlaces.length > 0}
				<CityPlaces places={cityPlaces} />
			{/if}

			{#if data.relations}
				<RelationsBand relations={data.relations} />
			{/if}

			<SymbolUses
				error={data.symbolUsesError}
				title={m.valuePage.kinds[subject.kind].symbols}
				uses={data.symbolUses ?? []}
			/>

			<ArtworksSection {artworks} empty={texts.noArtworks} {images} title={texts.artworks} />
		</div>
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			heading={title}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	.page {
		display: grid;
		gap: var(--spacing-6);
	}
</style>
