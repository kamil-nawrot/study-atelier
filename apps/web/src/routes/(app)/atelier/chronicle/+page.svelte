<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { onMount } from 'svelte';
	import { Alert, Button, Icon, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import VisitList from '#lib/chronicle/components/VisitList/VisitList.svelte';
	import { seenCount } from '#lib/chronicle/seen/seen.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const images = new WallImages();

	let toast: Toast;
	let artworks = $derived(
		new Map(images.apply(data.artworks).map((artwork) => [artwork.id, artwork]))
	);

	onMount(() => {
		const message = page.state.chronicleMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/chronicle'), { state: {}, shallow: true, replace: true });
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.chronicle.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				<Button href={resolve('/(app)/atelier/chronicle/new')} variant="primary">
					<Icon icon={Plus} size="sm" />
					<span class="long">{m.chronicle.add}</span>
					<span class="short">{m.common.add}</span>
				</Button>
			</div>
		{/if}
	{/snippet}

	<header>
		<div class="title">
			<h1>{m.chronicle.title}</h1>
			{#if !data.error && data.visits.length > 0}
				<span class="caption">
					{m.chronicle.count(data.visits.length, seenCount(data.visits, artworks))}
				</span>
			{/if}
		</div>
		<p class="lead">{m.chronicle.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.chronicle.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<VisitList
			{artworks}
			onimagefailed={(artwork) => images.failed(artwork)}
			onnearscreen={(artwork) => images.request(artwork)}
			visits={data.visits}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
