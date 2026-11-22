<script lang="ts">
	import { TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { AUTHOR_COUNTRY_MAX_LENGTH } from '#lib/values/author-form/author-form.ts';
	import AuthorRelationsField from '#lib/author-relations/components/AuthorRelationsField/AuthorRelationsField.svelte';
	import AuthorLifeFields from '#lib/values/components/AuthorLifeFields/AuthorLifeFields.svelte';
	import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
	import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
	import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';

	type Props = {
		author: AuthorFormState;
		errors: AuthorFieldErrors;
		authorId?: string;
		authors: CardIndexRecord[];
	};

	let { author = $bindable(), errors, authorId, authors }: Props = $props();
</script>

<AuthorLifeFields {errors} bind:author />
<TextField
	autocomplete="off"
	hint={m.valueForm.authorCountryHint}
	label={m.valueForm.authorCountry}
	maxlength={AUTHOR_COUNTRY_MAX_LENGTH}
	bind:value={author.country}
/>
<AuthorRelationsField {authorId} {authors} error={errors.relations} bind:rows={author.relations} />
