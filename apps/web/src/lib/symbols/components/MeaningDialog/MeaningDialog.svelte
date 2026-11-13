<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import MeaningInputs from '#lib/symbols/components/MeaningInputs/MeaningInputs.svelte';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';

	type Props = {
		open?: boolean;
		meaning?: SymbolMeaning;
		candidates: readonly SymbolContext[];
		error?: string;
		busy?: boolean;
		onsave: (meaning: { text: string; contexts: SymbolContext[] }) => void;
		onremove?: () => void;
	};

	let {
		open = $bindable(false),
		meaning,
		candidates,
		error,
		busy = false,
		onsave,
		onremove
	}: Props = $props();

	let text = $state('');
	let contexts = $state<SymbolContext[]>([]);
	let missing = $state(false);

	$effect.pre(() => {
		if (!open) return;
		text = meaning?.text ?? '';
		contexts = meaning ? [...meaning.contexts] : [];
		missing = false;
	});

	function save(): void {
		if (text.trim() === '') {
			missing = true;
			return;
		}
		onsave({ text: text.trim(), contexts: $state.snapshot(contexts) as SymbolContext[] });
	}
</script>

<Dialog
	size="small"
	title={meaning ? m.symbols.meaningDialog.editTitle : m.symbols.meaningDialog.newTitle}
	bind:open
>
	<div class="fields">
		{#if error}
			<Alert tone="danger">{error}</Alert>
		{/if}
		{#if open}
			<MeaningInputs
				{candidates}
				error={missing ? m.symbols.form.meaningRequired : undefined}
				bind:contexts
				bind:text
			/>
		{/if}
	</div>
	{#snippet footer()}
		{#if onremove}
			<Button onclick={onremove} variant="danger">{m.symbols.meaningDialog.remove}</Button>
		{/if}
		<Button onclick={() => (open = false)}>{m.common.cancel}</Button>
		<Button disabled={busy} onclick={save} variant="primary">
			{busy ? m.common.saving : m.common.save}
		</Button>
	{/snippet}
</Dialog>

<style>
	.fields {
		display: grid;
		gap: var(--spacing-4);
	}
</style>
