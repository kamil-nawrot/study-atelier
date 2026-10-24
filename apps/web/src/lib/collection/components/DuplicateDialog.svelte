<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import type { DuplicateCheck } from '#lib/collection/duplicate-check.svelte.ts';
	import { formatRecordNumbers } from '#lib/collection/duplicates.ts';

	type Props = {
		check: DuplicateCheck;
		action: 'save' | 'restore';
	};

	let { check, action }: Props = $props();

	let texts = $derived(m.duplicateDialog[action]);
</script>

<Dialog
	description={m.duplicateDialog.description(
		formatRecordNumbers(check.numbers),
		check.numbers.length,
		texts.advice
	)}
	onclose={() => check.answer(false)}
	size="small"
	title={m.duplicateDialog.title}
	bind:open={check.open}
>
	{#snippet footer()}
		<Button onclick={() => check.answer(false)}>
			{texts.back}
		</Button>
		<Button onclick={() => check.answer(true)} variant="primary">
			{texts.confirm}
		</Button>
	{/snippet}
</Dialog>
