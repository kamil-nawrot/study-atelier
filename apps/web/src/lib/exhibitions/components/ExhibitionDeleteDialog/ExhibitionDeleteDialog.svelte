<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { archiveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';

	type Props = {
		id: string;
		title: string;
		open: boolean;
		onarchived: () => void | Promise<void>;
	};

	let { id, title, open = $bindable(), onarchived }: Props = $props();

	let moving = $state(false);
	let error = $state<string>();

	$effect(() => {
		if (open) error = undefined;
	});

	async function archive(): Promise<void> {
		if (moving) return;
		moving = true;
		error = undefined;
		const result = await archiveExhibition(id);
		moving = false;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await onarchived();
	}
</script>

{#snippet errorAlert()}
	<Alert title={m.exhibitions.deleteConfirm.errorTitle} tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.exhibitions.deleteConfirm.description}
	size="small"
	title={m.exhibitions.deleteConfirm.title(title)}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={moving} onclick={archive} variant="primary">
			{moving ? m.exhibitions.deleteConfirm.moving : m.exhibitions.deleteConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>
