<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteSymbol } from '#lib/symbols/symbols-data/symbols-data.ts';
	import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

	type Props = {
		symbol: SymbolEntry;
		open?: boolean;
	};

	let { symbol, open = $bindable(false) }: Props = $props();

	let deleting = $state(false);
	let error = $state<string>();

	$effect.pre(() => {
		if (open) error = undefined;
	});

	async function remove(): Promise<void> {
		if (deleting) return;
		deleting = true;
		error = undefined;
		const result = await deleteSymbol(symbol.id);
		deleting = false;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await goto(resolve('/(app)/atelier/glossary'), {
			refreshAll: true,
			state: { glossaryMessage: m.symbols.view.deleted(symbol.name) }
		});
	}
</script>

{#snippet errorAlert()}
	<Alert tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.symbols.deleteConfirm.description}
	size="small"
	title={m.symbols.deleteConfirm.title(symbol.name)}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.back}
		</Button>
		<Button disabled={deleting} onclick={remove} variant="primary">
			{deleting ? m.common.deleting : m.common.delete}
		</Button>
	{/snippet}
</Dialog>
