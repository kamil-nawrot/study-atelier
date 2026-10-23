<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArtworkForm from '#lib/collection/components/ArtworkForm.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/collection/history.ts';
	import { formatRecordNumber, parseRecordNumber } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
	import BackLink from '#lib/navigation/components/BackLink.svelte';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let form = $state<ArtworkForm>();
	let cameFromApp = false;

	let number = $derived(parseRecordNumber(params.number));
	let label = $derived(number === null ? params.number : formatRecordNumber(number));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: params.number }));
	let title = $derived(
		data.artwork
			? m.artworkForm.editTitle(label)
			: data.notFound
				? m.artworkForm.notFoundTitle(label)
				: m.artworkForm.loadErrorTitle
	);

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(saved: number): Promise<void> {
		await goto(artworkPath, { replace: true, refreshAll: true, state: { saved } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<BackLink
			fallbackHref={data.artwork ? artworkPath : atelierPath}
			fallbackName={data.artwork?.title ?? m.artworkView.back}
		/>
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	{#if data.artwork}
		{#key data.artwork.id}
			<ArtworkForm
				bind:this={form}
				artwork={data.artwork}
				cancelHref={artworkPath}
				categoryValues={data.values}
				glossary={data.glossary}
				noteLinks={data.noteLinks}
				oncancel={goBack}
				onsaved={showSaved}
				ownFields={data.ownFields}
				ownValues={data.ownValues}
				pins={data.pins}
				placeStarter={data.placeStarter}
				valueLinks={data.links}
			/>
		{/key}
	{:else}
		<LoadFailure
			backHref={atelierPath}
			backLabel={m.artworkForm.back}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
