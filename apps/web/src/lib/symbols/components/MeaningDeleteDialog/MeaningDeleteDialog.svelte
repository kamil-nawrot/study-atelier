<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		open?: boolean;
		error?: string;
		busy?: boolean;
		onconfirm: () => void;
	};

	let { open = $bindable(false), error, busy = false, onconfirm }: Props = $props();
</script>

{#snippet errorAlert()}
	<Alert tone="danger">{error}</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.symbols.meaningDialog.removeDescription}
	size="small"
	title={m.symbols.meaningDialog.removeTitle}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>{m.common.back}</Button>
		<Button disabled={busy} onclick={onconfirm} variant="primary">
			{busy ? m.common.deleting : m.common.delete}
		</Button>
	{/snippet}
</Dialog>
