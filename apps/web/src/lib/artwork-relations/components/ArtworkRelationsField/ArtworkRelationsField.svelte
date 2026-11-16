<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import {
		isArtworkRelationType,
		relationTypeOptions
	} from '#lib/artwork-relations/relation-types/relation-types.ts';
	import { emptyRelationRow } from '#lib/artwork-relations/relation-rows/relation-rows.ts';
	import RelatedArtworkSearch from '#lib/artwork-relations/components/RelatedArtworkSearch/RelatedArtworkSearch.svelte';
	import RelationsField from '#lib/shared/forms/RelationsField/RelationsField.svelte';
	import type { ArtworkRelationRow } from '#lib/artwork-relations/types/artwork-relation-row.ts';

	type Props = {
		artworkId?: string;
		rows: ArtworkRelationRow[];
		error?: string;
	};

	let { artworkId, rows = $bindable(), error }: Props = $props();

	const options = relationTypeOptions();
	const texts = {
		add: m.artworkRelations.add,
		title: m.artworkRelations.title,
		type: m.artworkRelations.type,
		choose: m.artworkRelations.choose,
		removeEmpty: m.artworkRelations.removeEmpty
	};

	let excluded = $derived(
		new Set([
			...(artworkId ? [artworkId] : []),
			...rows.flatMap((row) => (row.artwork ? [row.artwork.id] : []))
		])
	);

	function choose(row: ArtworkRelationRow, value: string): void {
		row.type = isArtworkRelationType(value) ? value : '';
	}
</script>

{#snippet search(row: ArtworkRelationRow, invalid: boolean)}
	<RelatedArtworkSearch {excluded} {invalid} bind:artwork={row.artwork} />
{/snippet}

<RelationsField
	emptyRow={emptyRelationRow}
	{error}
	hasTarget={(row) => row.artwork !== null}
	onchoose={choose}
	{options}
	removeLabel={(row) => m.artworkRelations.remove(row.artwork?.title ?? '')}
	{search}
	{texts}
	bind:rows
/>
