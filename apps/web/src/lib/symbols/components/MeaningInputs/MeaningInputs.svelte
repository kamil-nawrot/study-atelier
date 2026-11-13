<script lang="ts">
	import { TextButton, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ContextField from '#lib/symbols/components/ContextField/ContextField.svelte';
	import { MEANING_TEXT_MAX_LENGTH } from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

	type Props = {
		text: string;
		contexts: SymbolContext[];
		candidates: readonly SymbolContext[];
		error?: string;
	};

	let { text = $bindable(), contexts = $bindable(), candidates, error }: Props = $props();

	let opened = $state(false);
	let contextsOpen = $derived(opened || contexts.length > 0);
</script>

<div class="inputs">
	<TextField
		autocomplete="off"
		{error}
		label={m.symbols.form.meaning}
		maxlength={MEANING_TEXT_MAX_LENGTH}
		bind:value={text}
	/>
	{#if contextsOpen}
		<ContextField {candidates} bind:contexts />
	{:else}
		<div class="add-context">
			<TextButton inline onclick={() => (opened = true)}>
				{m.symbols.form.addContext}
			</TextButton>
		</div>
	{/if}
</div>

<style>
	.inputs {
		display: grid;
		gap: var(--spacing-4);
	}

	.add-context {
		display: flex;
	}
</style>
