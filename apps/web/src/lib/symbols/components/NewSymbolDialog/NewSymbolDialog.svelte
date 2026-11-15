<script lang="ts">
	import { Alert, Button, Dialog, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		MEANING_TEXT_MAX_LENGTH,
		SYMBOL_NAME_MAX_LENGTH
	} from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import { createSymbolOption } from '#lib/symbols/symbols-data/symbols-data.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

	type Props = {
		open?: boolean;
		name: string;
		onadded: (symbol: SymbolOption) => void;
	};

	let { open = $bindable(false), name, onadded }: Props = $props();

	let symbolName = $state('');
	let meaning = $state('');
	let nameError = $state<string>();
	let failure = $state<string>();
	let busy = $state(false);

	$effect.pre(() => {
		if (!open) return;
		symbolName = name.trim();
		meaning = '';
		nameError = undefined;
		failure = undefined;
		busy = false;
	});

	async function add(): Promise<void> {
		if (busy) return;
		const trimmed = symbolName.trim();
		nameError = trimmed ? undefined : m.valueForm.nameRequired;
		if (nameError) return;
		busy = true;
		failure = undefined;
		const result = await createSymbolOption(trimmed, meaning);
		busy = false;
		if (!result.symbol) {
			failure = result.error ?? m.common.unexpectedError;
			return;
		}
		open = false;
		onadded(result.symbol);
	}
</script>

<Dialog size="small" title={m.symbols.quick.title} bind:open>
	<div class="fields">
		{#if failure}
			<Alert title={m.symbols.quick.errorTitle} tone="danger">{failure}</Alert>
		{/if}
		<TextField
			autocomplete="off"
			error={nameError}
			label={m.common.name}
			maxlength={SYMBOL_NAME_MAX_LENGTH}
			bind:value={symbolName}
		/>
		<TextField
			autocomplete="off"
			hint={m.symbols.quick.meaningHint}
			label={m.symbols.quick.meaning}
			maxlength={MEANING_TEXT_MAX_LENGTH}
			bind:value={meaning}
		/>
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>{m.common.cancel}</Button>
		<Button disabled={busy} onclick={add} variant="primary">
			{busy ? m.common.saving : m.symbols.quick.add}
		</Button>
	{/snippet}
</Dialog>

<style>
	.fields {
		display: grid;
		gap: var(--spacing-4);
	}
</style>
