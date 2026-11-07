<script lang="ts">
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { returnPathOf } from '#lib/exhibitions/exhibition-return/exhibition-return.ts';
	import ArtworkForm from '#lib/artworks/components/ArtworkForm/ArtworkForm.svelte';
	import { FormSuggestions } from '#lib/artworks/form-suggestions/form-suggestions.svelte.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	const exhibitionPath = $derived(returnPathOf(page.url?.searchParams.get('return')));

	let form: ArtworkForm;
	let suggestions = $derived(data && new FormSuggestions());
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
		if (exhibitionPath) {
			await goto(exhibitionPath as ResolvedPathname, { invalidateAll: true });
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
		<BackLink
			fallbackHref={(exhibitionPath ?? atelierPath) as ResolvedPathname}
			fallbackName={m.artworkView.back}
		/>
		<h1 class="visually-hidden">{m.artworkForm.newTitle}</h1>
	{/snippet}

	<ArtworkForm
		bind:this={form}
		cancelHref={(exhibitionPath ?? atelierPath) as ResolvedPathname}
		oncancel={goBack}
		onsaved={showSaved}
		ownFields={data.ownFields}
		{suggestions}
	/>
</AtelierLayout>
