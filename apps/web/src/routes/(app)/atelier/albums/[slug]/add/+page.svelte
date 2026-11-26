<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AlbumWalkBar from '#lib/albums/components/AlbumWalkBar/AlbumWalkBar.svelte';
	import AlbumWalkForm from '#lib/albums/components/AlbumWalkForm/AlbumWalkForm.svelte';
	import { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const albumsPath = resolve('/(app)/atelier/albums');
	const albumPath = untrack(() =>
		resolve('/(app)/atelier/albums/[slug]', { slug: data.album?.slug ?? '' })
	);
	const walk = untrack(() => (data.album ? new AlbumWalk(data.album, data.artworks) : undefined));

	let view = $state<AlbumWalkForm>();

	void walk?.open();

	async function proceed(): Promise<void> {
		if (!walk?.finished) {
			await invalidateAll();
			return;
		}
		const message = m.albums.walk.done(walk.album.title, walk.added);
		await goto(albumPath, { refreshAll: true, state: { albumMessage: message } });
	}

	async function saved(): Promise<void> {
		await walk?.saved();
		await proceed();
	}

	async function skip(): Promise<void> {
		await walk?.skip();
		await proceed();
	}

	async function finish(): Promise<void> {
		walk?.finish();
		await proceed();
	}
</script>

<AtelierLayout
	confirmLeave={async () => (await view?.confirmLeave()) ?? true}
	email={data.session.user.email ?? ''}
	heading={Boolean(walk)}
	title={data.album?.title ?? m.albums.title}
>
	{#snippet back()}
		<BackLink
			arrowOnly
			fallbackHref={walk ? albumPath : albumsPath}
			fallbackName={m.albums.title}
		/>
	{/snippet}

	{#snippet bar()}
		{#if walk}
			<AlbumWalkBar {walk} />
		{/if}
	{/snippet}

	{#if walk}
		<AlbumWalkForm
			bind:this={view}
			cancelHref={albumPath}
			onfinish={finish}
			onsaved={saved}
			onskip={skip}
			ownFields={data.ownFields}
			{walk}
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
