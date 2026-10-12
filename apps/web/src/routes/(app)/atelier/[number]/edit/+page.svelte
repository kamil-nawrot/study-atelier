<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Button, Icon, Section } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArtworkForm from '#lib/collection/components/ArtworkForm.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { formatRecordNumber, parseRecordNumber } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
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
		cameFromApp = from !== null;
	});

	function goBack(event: MouseEvent): void {
		if (!cameFromApp) return;
		event.preventDefault();
		history.back();
	}

	async function showSaved(saved: number): Promise<void> {
		await goto(artworkPath, { replace: true, state: { saved } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<a class="back" aria-label={m.artworkForm.goBack} href={artworkPath} onclick={goBack}>
			<Icon icon={ArrowLeft} />
		</a>
		<h1>{title}</h1>
	{/snippet}

	{#if data.artwork}
		{#key data.artwork.id}
			<ArtworkForm
				bind:this={form}
				artwork={data.artwork}
				cancelHref={artworkPath}
				categoryValues={data.values}
				oncancel={goBack}
				onsaved={showSaved}
			/>
		{/key}
	{:else}
		<Section>
			{#if data.notFound}
				<p class="lead">{data.error}</p>
			{:else}
				<Alert tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={atelierPath}>
				{m.artworkForm.back}
			</Button>
		</div>
	{/if}
</AtelierLayout>

<style>
	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		align-self: center;
	}
</style>
