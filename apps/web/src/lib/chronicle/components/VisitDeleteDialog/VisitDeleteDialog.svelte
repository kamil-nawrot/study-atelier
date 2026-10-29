<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
	import { visitDateFrom } from '#lib/chronicle/visit-date/visit-date.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';

	type Props = {
		visit: Visit;
		open: boolean;
		ondeleted: (visit: Visit) => void | Promise<void>;
	};

	let { visit, open = $bindable(), ondeleted }: Props = $props();

	let deleting = $state(false);
	let error = $state<string>();

	$effect(() => {
		if (open) error = undefined;
	});

	async function remove(): Promise<void> {
		if (deleting) return;
		const removed = visit;
		deleting = true;
		error = undefined;
		const result = await deleteVisit(removed.id);
		deleting = false;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await ondeleted(removed);
	}
</script>

{#snippet errorAlert()}
	<Alert tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.chronicle.deleteConfirm.description}
	size="small"
	title={m.chronicle.deleteConfirm.title(visitDateFrom(visit.date))}
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
