<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';
	import { deleteSymbol } from '#lib/symbols/symbols-data/symbols-data.ts';
	import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

	type Props = {
		symbol: SymbolEntry;
		open?: boolean;
	};

	let { symbol, open = $bindable(false) }: Props = $props();
</script>

<DeleteDialog
	description={m.symbols.deleteConfirm.description}
	ondone={() =>
		goto(resolve('/(app)/atelier/glossary'), {
			refreshAll: true,
			state: { glossaryMessage: m.symbols.view.deleted(symbol.name) }
		})}
	run={() => deleteSymbol(symbol.id)}
	title={m.symbols.deleteConfirm.title(symbol.name)}
	bind:open
/>
