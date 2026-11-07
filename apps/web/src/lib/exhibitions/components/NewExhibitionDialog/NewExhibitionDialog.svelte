<script lang="ts">
	import { Alert, Button, Dialog, Form, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		open?: boolean;
		error?: string;
		busy?: boolean;
		oncreate: (title: string) => void | Promise<void>;
	};

	let { open = $bindable(false), error, busy = false, oncreate }: Props = $props();

	const formId = $props.id();

	let title = $state('');
	let titleError = $state<string>();

	$effect(() => {
		if (!open) return;
		title = '';
		titleError = undefined;
	});

	async function submit(): Promise<void> {
		if (busy) return;
		const trimmed = title.trim();
		titleError = trimmed === '' ? m.exhibitions.nameRequired : undefined;
		if (titleError) return;
		await oncreate(trimmed);
	}
</script>

<Dialog size="small" title={m.exhibitions.newTitle} bind:open>
	<Form id={formId} onsubmit={submit}>
		{#if error}
			<Alert title={m.exhibitions.addErrorTitle} tone="danger">
				{error}
			</Alert>
		{/if}
		<TextField
			error={titleError}
			label={m.exhibitions.nameLabel}
			maxlength={200}
			bind:value={title}
		/>
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={busy} form={formId} type="submit" variant="primary">
			{busy ? m.exhibitions.adding : m.exhibitions.add}
		</Button>
	{/snippet}
</Dialog>
