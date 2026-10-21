<script lang="ts">
	import { BackHeading } from '@study-atelier/ui';
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
		<BackHeading
			backLabel={m.artworkForm.back}
			href={atelierPath}
			onclick={backToAtelier}
			title={m.artworkForm.newTitle}
		/>
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
