<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AlbumClosingStep from '#lib/albums/components/AlbumClosingStep/AlbumClosingStep.svelte';
	import AlbumItemBar from '#lib/albums/components/AlbumItemBar/AlbumItemBar.svelte';
	import AlbumItemForm from '#lib/albums/components/AlbumItemForm/AlbumItemForm.svelte';
	import AlbumWalkBar from '#lib/albums/components/AlbumWalkBar/AlbumWalkBar.svelte';
	import AlbumWalkForm from '#lib/albums/components/AlbumWalkForm/AlbumWalkForm.svelte';
	import { AlbumAdd } from '#lib/albums/album-add/album-add.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const albumsPath = resolve('/(app)/atelier/albums');
	const albumPath = untrack(() =>
		data.album ? resolve('/(app)/atelier/albums/[slug]', { slug: data.album.slug }) : albumsPath
	);
	const add = untrack(() => (data.album ? new AlbumAdd(data.album, data.artworks) : undefined));

	let view = $state<{ confirmLeave: () => Promise<boolean> }>();

	void add?.start();

	async function proceed(step: Promise<void>): Promise<void> {
		await step;
		if (add?.phase === 'done') {
			await goto(albumPath, { refreshAll: true, state: { albumMessage: add.message } });
		} else {
			await invalidateAll();
		}
	}
</script>

<AtelierLayout
	confirmLeave={async () => (await view?.confirmLeave()) ?? true}
	email={data.session.user.email ?? ''}
	heading={Boolean(add)}
	title={data.album?.title ?? m.albums.title}
>
	{#snippet back()}
		<BackLink arrowOnly fallbackHref={add ? albumPath : albumsPath} fallbackName={m.albums.title} />
	{/snippet}

	{#snippet bar()}
		{#if add?.phase === 'artworks'}
			<AlbumWalkBar walk={add.walk} />
		{:else if add?.phase === 'items'}
			<AlbumItemBar position={add.position + 1} total={add.queue.length} />
		{/if}
	{/snippet}

	{#if add?.phase === 'artworks'}
		<AlbumWalkForm
			bind:this={view}
			cancelHref={albumPath}
			onfinish={() => proceed(add.artworksFinished())}
			onsaved={() => proceed(add.artworkSaved())}
			onskip={() => proceed(add.artworkSkipped())}
			ownFields={data.ownFields}
			walk={add.walk}
		/>
	{:else if add?.phase === 'loading'}
		<p class="lead">{m.albums.walk.loading}</p>
	{:else if add?.phase === 'choose'}
		<AlbumClosingStep
			error={add.error}
			items={add.items}
			onadd={() => proceed(Promise.resolve(add.addSelected()))}
			onskipall={() => proceed(Promise.resolve(add.skipAll()))}
			ontoggle={(item) => add.toggle(item)}
			selected={add.selected}
		/>
	{:else if add?.phase === 'items' && add.current && add.index}
		<AlbumItemForm
			bind:this={view}
			cancelHref={albumPath}
			index={add.index}
			item={add.current}
			last={add.lastItem}
			onfinish={() => proceed(Promise.resolve(add.itemsFinished()))}
			onsaved={() => proceed(Promise.resolve(add.itemSaved()))}
			onskip={() => proceed(Promise.resolve(add.itemSkipped()))}
			terms={add.terms}
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
