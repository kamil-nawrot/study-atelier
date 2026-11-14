<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { SymbolFormResult } from '#lib/symbols/types/symbol-form-result.ts';
	import SymbolForm from '#lib/symbols/components/SymbolForm/SymbolForm.svelte';

	type Props = {
		data: SymbolFormResult;
		backPath: ResolvedPathname;
	};

	let { data, backPath }: Props = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let form = $state<SymbolForm>();
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
		errorTitle={m.symbols.view.loadErrorTitle}
		message={data.notFound ? m.symbols.view.notFound : (data.error ?? '')}
		notFound={data.notFound === true}
	/>
{:else}
	{#key backPath}
		<SymbolForm
			bind:this={form}
			cancelHref={backPath}
			candidates={data.candidates}
			oncancel={goBack}
			onsaved={showSaved}
			symbol={data.symbol}
		/>
	{/key}
{/if}
