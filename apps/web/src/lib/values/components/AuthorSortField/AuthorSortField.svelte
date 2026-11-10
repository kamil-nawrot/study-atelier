<script lang="ts">
	import { Checkbox, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';

	type Props = {
		author: AuthorFormState;
	};

	let { author = $bindable() }: Props = $props();
</script>

<div class="sort">
	<Checkbox label={m.valueForm.sortByOther} bind:checked={author.sortByOther} />
	{#if author.sortByOther}
		<TextField
			autocomplete="off"
			hint={m.valueForm.sortNameHint}
			label={m.valueForm.sortName}
			placeholder={m.valueForm.sortNamePlaceholder}
			bind:value={author.sortName}
		/>
	{/if}
</div>

<style>
	.sort {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
