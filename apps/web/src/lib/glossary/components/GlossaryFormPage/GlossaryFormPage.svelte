<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { GlossaryFormResult } from '#lib/glossary/types.ts';
	import GlossaryForm from '#lib/glossary/components/GlossaryForm/GlossaryForm.svelte';

	type Props = {
		data: GlossaryFormResult;
		backPath: ResolvedPathname;
	};

	let { data, backPath }: Props = $props();

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

	export function confirmLeave(): Promise<boolean> {
		return form?.confirmLeave() ?? Promise.resolve(true);
	}

	async function showSaved(path: ResolvedPathname, message: string): Promise<void> {
		await goto(path, { replace: true, refreshAll: true, state: { glossaryMessage: message } });
	}
</script>

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
