<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, IconButton, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ContextField from '#lib/symbols/components/ContextField/ContextField.svelte';
	import { MEANING_TEXT_MAX_LENGTH } from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import type { MeaningDraft } from '#lib/symbols/types/meaning-draft.ts';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

	type Props = {
		meaning: MeaningDraft;
		number: number;
		count: number;
		candidates: readonly SymbolContext[];
		error?: string;
		onremove: () => void;
		onmove: (step: -1 | 1) => void;
	};

	let {
		meaning = $bindable(),
		number,
		count,
		candidates,
		error,
		onremove,
		onmove
	}: Props = $props();

	let contextsOpen = $state(false);
</script>

<fieldset class="meaning">
	<div class="head">
		<legend>{m.symbols.form.meaningHeading(number)}</legend>
		<div class="actions">
			{#if count > 1}
				<IconButton
					disabled={number === 1}
					icon={ArrowUp}
					label={m.symbols.form.moveUp(number)}
					onclick={() => onmove(-1)}
				/>
				<IconButton
					disabled={number === count}
					icon={ArrowDown}
					label={m.symbols.form.moveDown(number)}
					onclick={() => onmove(1)}
				/>
			{/if}
			<IconButton icon={Trash} label={m.symbols.form.removeMeaning(number)} onclick={onremove} />
		</div>
	</div>
	<TextField
		autocomplete="off"
		{error}
		label={m.symbols.form.meaning}
		maxlength={MEANING_TEXT_MAX_LENGTH}
		bind:value={meaning.text}
	/>
	{#if contextsOpen || meaning.contexts.length > 0}
		<ContextField {candidates} bind:contexts={meaning.contexts} />
	{:else}
		<div class="add-context">
			<Button onclick={() => (contextsOpen = true)}>{m.symbols.form.addContext}</Button>
		</div>
	{/if}
</fieldset>

<style>
	.meaning {
		display: grid;
		gap: var(--spacing-4);
		min-width: 0;
		padding: var(--spacing-6) 0 0;
		border: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
	}

	legend {
		float: left;
		padding: 0;
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
		line-height: var(--line-height-lg);
	}

	.add-context {
		justify-self: start;
	}

	.actions {
		display: flex;
		gap: var(--spacing-1);
	}
</style>
