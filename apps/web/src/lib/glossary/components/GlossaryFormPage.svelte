<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/collection/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import BackLink from '#lib/navigation/components/BackLink.svelte';
	import type { GlossaryFormResult } from '../types.ts';
	import GlossaryForm from './GlossaryForm.svelte';

	type Props = {
		email: string;
		data: GlossaryFormResult;
		title: string;
		backPath: ResolvedPathname;
	};

	let { email, data, title, backPath }: Props = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let form = $state<GlossaryForm>();
	let cameFromApp = false;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(path: ResolvedPathname, message: string): Promise<void> {
		await goto(path, { replace: true, refreshAll: true, state: { glossaryMessage: message } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	{email}
	title={data.notFound ? m.glossary.view.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={backPath} fallbackName={data.entry?.name ?? m.glossary.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	{#if failed}
		<LoadFailure
			backHref={glossaryPath}
			backLabel={m.glossary.back}
			errorTitle={m.glossary.view.loadErrorTitle}
			message={data.notFound ? m.glossary.view.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{:else}
		{#key backPath}
			<GlossaryForm
				bind:this={form}
				cancelHref={backPath}
				entries={data.entries}
				entry={data.entry}
				index={data.index}
				oncancel={goBack}
				onsaved={showSaved}
			/>
		{/key}
	{/if}
</AtelierLayout>
