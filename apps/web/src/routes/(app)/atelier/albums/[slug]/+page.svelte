<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { albumAddHref } from '#lib/albums/album-add-address/album-add-address.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AlbumGallery from '#lib/albums/components/AlbumGallery/AlbumGallery.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const albumsPath = resolve('/(app)/atelier/albums');

	async function add(entryIds: string[]): Promise<void> {
		await goto(albumAddHref(data.album?.slug ?? '', entryIds));
	}
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
		<AlbumGallery
			album={data.album}
			error={data.error}
			matches={data.matches}
			message={page.state.albumMessage}
			onadd={add}
		/>
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
