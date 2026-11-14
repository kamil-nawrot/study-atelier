<script lang="ts">
	import { ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { RelatedAuthor } from '#lib/author-relations/types/related-author.ts';

	type Props = {
		id?: string;
		author: RelatedAuthor | null;
		authors: readonly RelatedAuthor[];
		excluded: ReadonlySet<string>;
		invalid?: boolean;
	};

	const SHOWN = 8;

	let { id, author = $bindable(), authors, excluded, invalid = false }: Props = $props();

	let query = $state('');

	let phrase = $derived(normalizeForSearch(query));
	let matches = $derived(
		phrase === ''
			? []
			: authors
					.filter(
						(candidate) =>
							!excluded.has(candidate.id) && normalizeForSearch(candidate.name).includes(phrase)
					)
					.slice(0, SHOWN)
	);
	let options = $derived<ValueOption[]>(
		matches.map((match) => ({ kind: 'found', id: match.id, name: match.name }))
	);
	let hint = $derived(
		phrase !== '' && matches.length === 0 ? m.authorRelations.noMatch : undefined
	);

	function pick(option: ValueOption): void {
		if (option.id) author = { id: option.id, name: option.name };
	}

	function values(): string[] {
		return author ? [author.name] : [];
	}

	function setValues(next: string[]): void {
		if (next.length === 0) author = null;
	}
</script>

<ValueField
	{id}
	{hint}
	{invalid}
	label={m.authorRelations.search}
	labelHidden
	onpick={pick}
	{options}
	placeholder={m.authorRelations.search}
	single
	bind:query
	bind:values={values, setValues}
/>
