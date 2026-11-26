<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AlbumGallery from '#lib/albums/components/AlbumGallery/AlbumGallery.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const albumsPath = resolve('/(app)/atelier/albums');
</script>

<AtelierLayout
	email={data.session.user.email ?? ''}
	heading={Boolean(data.album)}
	title={data.album?.title ?? m.albums.title}
>
	{#snippet back()}
		<BackLink arrowOnly fallbackHref={albumsPath} fallbackName={m.albums.title} />
	{/snippet}

	{#if data.album}
		<AlbumGallery album={data.album} error={data.error} matches={data.matches} />
	{:else}
		<LoadFailure
			backHref={albumsPath}
			backLabel={m.albums.backToList}
			errorTitle={m.albums.albumLoadErrorTitle}
			heading={m.albums.title}
			message={data.notFound ? m.albums.notFound : (data.error ?? m.albums.loadError)}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
