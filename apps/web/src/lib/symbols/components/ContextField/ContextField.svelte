<script lang="ts">
	import { ValueField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		CONTEXT_TEXT_MAX_LENGTH,
		contextLabel,
		contextsOf,
		suggestContexts
	} from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
	import { MAX_CONTEXTS } from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import { searchArtworkContexts } from '#lib/symbols/symbols-data/symbols-data.ts';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

	type Props = {
		candidates: readonly SymbolContext[];
		contexts?: SymbolContext[];
	};

	let { candidates, contexts = $bindable([]) }: Props = $props();

	const SEARCH_PAUSE = 250;

	let query = $state('');
	let artworks = $state.raw<SymbolContext[]>([]);
	let phrase = $derived(query.trim());
	let known = $derived([...candidates, ...artworks, ...contexts]);
	let options = $derived(suggestContexts([...candidates, ...artworks], contexts, query));

	$effect(() => {
		const text = phrase;
		if (text.length < 2) {
			artworks = [];
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			const found = await searchArtworkContexts(text, controller.signal);
			if (!controller.signal.aborted) artworks = found;
		}, SEARCH_PAUSE);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});
</script>

<ValueField
	hint={m.symbols.form.contextHint}
	label={m.symbols.form.context}
	max={MAX_CONTEXTS}
	maxlength={CONTEXT_TEXT_MAX_LENGTH}
	{options}
	bind:query
	bind:values={() => contexts.map(contextLabel), (labels) => (contexts = contextsOf(labels, known))}
/>
