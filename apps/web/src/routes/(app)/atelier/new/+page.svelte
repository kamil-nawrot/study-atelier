<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Icon } from '@study-atelier/ui';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArtworkForm from '#lib/collection/components/ArtworkForm.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let form: ArtworkForm;
	let cameFromAtelier = false;

	afterNavigate(({ from }) => {
		cameFromAtelier = from?.route.id === '/(app)/atelier';
	});

	function backToAtelier(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromAtelier);
	}

	async function showSaved(number: number, next: boolean): Promise<void> {
		if (next) {
			await invalidateAll();
			return;
		}
		await goto(atelierPath, { refreshAll: true, state: { highlight: number } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form.confirmLeave()}
	email={data.session.user.email ?? ''}
	title={m.artworkForm.newTitle}
>
	{#snippet bar()}
		<div class="heading">
			<a class="back" aria-label={m.artworkForm.back} href={atelierPath} onclick={backToAtelier}>
				<Icon icon={ArrowLeft} />
			</a>
			<h1>{m.artworkForm.newTitle}</h1>
		</div>
	{/snippet}

	<ArtworkForm
		bind:this={form}
		cancelHref={atelierPath}
		categoryValues={data.values}
		noteLinks={data.noteLinks}
		oncancel={backToAtelier}
		onsaved={showSaved}
		placeStarter={data.placeStarter}
		valueLinks={data.links}
	/>
</AtelierLayout>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding-block: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
