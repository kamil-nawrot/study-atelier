<script lang="ts">
	import FlagDialog from '#lib/backroom/components/FlagDialog/FlagDialog.svelte';
	import { artworkFlagGroup, stagePins } from '#lib/artworks/artwork-flag/artwork-flag.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

	type Props = {
		open?: boolean;
		artwork: ArtworkRecord;
		imageId?: string;
		pins?: readonly Pin[];
		glossary?: readonly GlossaryTerm[];
		symbols?: readonly SymbolOption[];
		onflagged: (message: string) => void;
	};

	let {
		open = $bindable(false),
		artwork,
		imageId,
		pins = [],
		glossary,
		symbols,
		onflagged
	}: Props = $props();

	let choices = $derived(stagePins(pins, imageId, { glossary, symbols }));
	let groups = $derived([artworkFlagGroup(artwork, imageId, choices.length)]);
</script>

<FlagDialog {groups} {onflagged} pins={choices} bind:open />
