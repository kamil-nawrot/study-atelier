<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';

	type Props = {
		open?: boolean;
		meaning?: SymbolMeaning;
		error?: string;
		busy?: boolean;
		onconfirm: () => void;
	};

	let { open = $bindable(false), meaning, error, busy = false, onconfirm }: Props = $props();
</script>

{#snippet errorAlert()}
	<Alert tone="danger">{error}</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.symbols.meaningDialog.removeDescription}
	size="small"
	title={m.symbols.meaningDialog.removeTitle(meaning?.text ?? '')}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>{m.common.back}</Button>
		<Button disabled={busy} onclick={onconfirm} variant="primary">
			{busy ? m.common.deleting : m.common.delete}
		</Button>
	{/snippet}
</Dialog>
