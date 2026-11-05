<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { FieldTypeCheck } from '#lib/artworks/field-type-check/field-type-check.svelte.ts';
	import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';

	type Props = {
		check: FieldTypeCheck;
		typeCode: ArtworkTypeCode | null;
	};

	let { check, typeCode }: Props = $props();

	let description = $derived(
		m.fieldTypeDialog.description(
			check.fields.map((field) => field.name),
			typeCode ? m.artworkTypes[typeCode] : null
		)
	);
</script>

<Dialog
	{description}
	onclose={() => check.answer(false)}
	size="small"
	title={m.fieldTypeDialog.title(check.fields.length)}
	bind:open={check.open}
>
	{#snippet footer()}
		<Button onclick={() => check.answer(false)}>
			{m.fieldTypeDialog.back}
		</Button>
		<Button onclick={() => check.answer(true)} variant="primary">
			{m.fieldTypeDialog.confirm}
		</Button>
	{/snippet}
</Dialog>
