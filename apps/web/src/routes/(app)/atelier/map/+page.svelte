<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import MapView from '#lib/map/components/MapView/MapView.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');
	const images = new WallImages();

	let artworks = $derived(images.apply(data.artworks));
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading={!data.error} title={m.map.title}>
	{#snippet back()}
		<BackLink arrowOnly fallbackHref={atelierPath} fallbackName={m.map.back} />
	{/snippet}

	{#if data.error}
		<LoadFailure
			backHref={atelierPath}
			backLabel={m.map.back}
			heading={m.map.title}
			message={data.error}
			notFound={false}
		/>
	{:else}
		<MapView {artworks} {images} places={data.places} />
	{/if}
</AtelierLayout>
