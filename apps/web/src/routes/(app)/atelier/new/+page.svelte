<script lang="ts">
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArtworkForm from '#lib/collection/components/ArtworkForm.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let form: ArtworkForm;
	let cameFromApp = false;

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
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
		<BackLink fallbackHref={atelierPath} fallbackName={m.artworkView.back} />
		<h1 class="visually-hidden">{m.artworkForm.newTitle}</h1>
	{/snippet}

	<ArtworkForm
		bind:this={form}
		cancelHref={atelierPath}
		categoryValues={data.values}
		noteLinks={data.noteLinks}
		oncancel={goBack}
		onsaved={showSaved}
		ownFields={data.ownFields}
		ownValues={data.ownValues}
		placeStarter={data.placeStarter}
		valueLinks={data.links}
	/>
</AtelierLayout>
