<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { onMount } from 'svelte';
	import { Alert, Button, Icon, Section, Toast } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ArtworkView from '#lib/collection/components/ArtworkView.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { formatRecordNumber, parseRecordNumber } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let toast: Toast;
	let cameFromWall = false;

	let number = $derived(parseRecordNumber(params.number));
	let label = $derived(number === null ? params.number : formatRecordNumber(number));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: params.number }));
	let editPath = $derived(resolve('/(app)/atelier/[number]/edit', { number: params.number }));
	let title = $derived(
		data.artwork
			? data.artwork.title
			: data.notFound
				? m.artworkForm.notFoundTitle(label)
				: m.artworkForm.loadErrorTitle
	);

	afterNavigate(({ from }) => {
		cameFromWall = from?.route.id === '/(app)/atelier';
	});

	onMount(() => {
		const saved = page.state.saved;
		if (saved === undefined) return;
		toast.show(m.artworkForm.changesSaved(formatRecordNumber(saved)));
		void goto(artworkPath, { state: {}, shallow: true, replace: true });
	});

	function goBack(event: MouseEvent): void {
		if (!cameFromWall) return;
		event.preventDefault();
		history.back();
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} fill={data.artwork !== undefined} {title}>
	{#snippet bar()}
		<a class="back" href={atelierPath} onclick={goBack}>
			<Icon icon={ArrowLeft} />
			{m.artworkView.back}
		</a>
		{#if data.artwork}
			<Button aria-label={m.artworkView.edit} href={editPath}>
				<Icon icon={Pencil} size="sm" />
				<span class="label">
					{m.artworkView.edit}
				</span>
			</Button>
		{/if}
	{/snippet}

	{#if data.artwork}
		{#key data.artwork.id}
			<ArtworkView artwork={data.artwork} editHref={editPath} />
		{/key}
	{:else}
		<Section>
			<h1>{title}</h1>
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

<Toast bind:this={toast} />

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.label {
		display: none;
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
