<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import OwnFieldForm from '#lib/card-index/components/OwnFieldForm/OwnFieldForm.svelte';
	import { ownFieldPath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');
	const title = m.ownFields.form.newTitle;

	let form = $state<OwnFieldForm>();
	let cameFromApp = false;

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(id: string, message: string): Promise<void> {
		await goto(ownFieldPath(id), {
			replace: true,
			refreshAll: true,
			state: { valueMessage: message }
		});
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<BackLink fallbackHref={cardIndexPath} fallbackName={m.valuePage.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	{#if data.error}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			heading={m.valuePage.loadErrorTitle}
			message={data.error}
			notFound={false}
		/>
	{:else}
		<OwnFieldForm
			bind:this={form}
			cancelHref={cardIndexPath}
			fields={data.fields}
			oncancel={goBack}
			onsaved={showSaved}
		/>
	{/if}
</AtelierLayout>
