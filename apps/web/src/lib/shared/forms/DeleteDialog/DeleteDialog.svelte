<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		open: boolean;
		title: string;
		description: string;
		run: () => Promise<{ error?: string } | undefined>;
		ondone: () => void | Promise<void>;
		cancelLabel?: string;
		confirmLabel?: string;
		busyLabel?: string;
		errorTitle?: string;
	};

	let {
		open = $bindable(),
		title,
		description,
		run,
		ondone,
		cancelLabel = m.common.back,
		confirmLabel = m.common.delete,
		busyLabel = m.common.deleting,
		errorTitle
	}: Props = $props();

	let busy = $state(false);
	let error = $state<string>();

	$effect.pre(() => {
		if (open) error = undefined;
	});

	async function confirm(): Promise<void> {
		if (busy) return;
		busy = true;
		error = undefined;
		const result = await run();
		busy = false;
		if (!result) return;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await ondone();
	}
</script>

{#snippet errorAlert()}
	<Alert title={errorTitle} tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog children={error ? errorAlert : undefined} {description} size="small" {title} bind:open>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{cancelLabel}
		</Button>
		<Button disabled={busy} onclick={confirm} variant="primary">
			{busy ? busyLabel : confirmLabel}
		</Button>
	{/snippet}
</Dialog>
