<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Icon } from '@study-atelier/ui';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArtworkForm from '#lib/collection/components/ArtworkForm.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let cameFromAtelier = false;

	afterNavigate(({ from }) => {
		cameFromAtelier = from?.route.id === '/(app)/atelier';
	});

	function backToAtelier(event: MouseEvent): void {
		if (!cameFromAtelier) return;
		event.preventDefault();
		history.back();
	}

	async function showSaved(number: number, next: boolean): Promise<void> {
		if (next) {
			await invalidateAll();
			return;
		}
		await goto(atelierPath, { state: { highlight: number } });
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.artworkForm.newTitle}>
	{#snippet bar()}
		<a class="back" aria-label={m.artworkForm.back} href={atelierPath} onclick={backToAtelier}>
			<Icon icon={ArrowLeft} />
		</a>
		<h1>{m.artworkForm.newTitle}</h1>
	{/snippet}

	<ArtworkForm
		cancelHref={atelierPath}
		categoryValues={data.values}
		oncancel={backToAtelier}
		onsaved={showSaved}
	/>
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
