<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { moveToTrash } from '#lib/artworks/trash-data/trash-data.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork?: { id: string; number: number };
		label: string;
		open: boolean;
	};

	let { artwork, label, open = $bindable() }: Props = $props();

	let moving = $state(false);
	let error = $state<string>();

	$effect(() => {
		if (open) error = undefined;
	});

	async function trash(): Promise<void> {
		if (!artwork || moving) return;
		moving = true;
		error = undefined;
		const result = await moveToTrash(artwork.id);
		moving = false;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await goto(resolve('/(app)/atelier'), { refreshAll: true, state: { trashed: artwork.number } });
	}
</script>

{#snippet errorAlert()}
	<Alert tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.trash.moveDescription}
	size="small"
	title={m.trash.moveTitle(label)}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={moving} onclick={trash} variant="primary">
			{moving ? m.trash.moving : m.trash.move}
		</Button>
	{/snippet}
</Dialog>
