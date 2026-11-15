<script lang="ts">
	import type { PinEntries } from '#lib/artworks/pin-entries/pin-entries.svelte.ts';
	import NewTermDialog from '#lib/glossary/components/NewTermDialog/NewTermDialog.svelte';
	import NewSymbolDialog from '#lib/symbols/components/NewSymbolDialog/NewSymbolDialog.svelte';

	type Props = {
		entries: PinEntries;
	};

	let { entries }: Props = $props();
</script>

<NewTermDialog
	name={entries.termName}
	entries={entries.terms}
	onadded={entries.termAdded}
	bind:open={entries.termOpen}
/>
<NewSymbolDialog
	name={entries.symbolName}
	onadded={entries.symbolAdded}
	bind:open={entries.symbolOpen}
/>
