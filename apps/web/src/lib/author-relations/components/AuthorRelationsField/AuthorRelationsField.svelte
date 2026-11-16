<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import {
		authorRelationTypeOptions,
		emptyAuthorRelationRow,
		isAuthorRelationType
	} from '#lib/author-relations/author-relation-types/author-relation-types.ts';
	import RelatedAuthorSearch from '#lib/author-relations/components/RelatedAuthorSearch/RelatedAuthorSearch.svelte';
	import RelationsField from '#lib/shared/forms/RelationsField/RelationsField.svelte';
	import type { AuthorRelationRow } from '#lib/author-relations/types/author-relation-row.ts';
	import type { RelatedAuthor } from '#lib/author-relations/types/related-author.ts';

	type Props = {
		authorId?: string;
		authors: readonly RelatedAuthor[];
		rows: AuthorRelationRow[];
		error?: string;
	};

	let { authorId, authors, rows = $bindable(), error }: Props = $props();

	const options = authorRelationTypeOptions();
	const texts = {
		add: m.authorRelations.add,
		title: m.authorRelations.title,
		type: m.authorRelations.type,
		choose: m.authorRelations.choose,
		removeEmpty: m.authorRelations.removeEmpty
	};

	let excluded = $derived(
		new Set([
			...(authorId ? [authorId] : []),
			...rows.flatMap((row) => (row.author ? [row.author.id] : []))
		])
	);

	function choose(row: AuthorRelationRow, value: string): void {
		row.type = isAuthorRelationType(value) ? value : '';
	}
</script>

{#snippet search(row: AuthorRelationRow, invalid: boolean)}
	<RelatedAuthorSearch {authors} {excluded} {invalid} bind:author={row.author} />
{/snippet}

<RelationsField
	emptyRow={emptyAuthorRelationRow}
	{error}
	hasTarget={(row) => row.author !== null}
	onchoose={choose}
	{options}
	removeLabel={(row) => m.authorRelations.remove(row.author?.name ?? '')}
	{search}
	{texts}
	bind:rows
/>
