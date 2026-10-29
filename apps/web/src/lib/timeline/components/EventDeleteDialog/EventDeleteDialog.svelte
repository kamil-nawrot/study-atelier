<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type Props = {
		event: TimelineEvent;
		open: boolean;
		ondeleted: (event: TimelineEvent) => void | Promise<void>;
	};

	let { event, open = $bindable(), ondeleted }: Props = $props();

	let deleting = $state(false);
	let error = $state<string>();

	$effect(() => {
		if (open) error = undefined;
	});

	async function remove(): Promise<void> {
		if (deleting) return;
		const removed = event;
		deleting = true;
		error = undefined;
		const result = await deleteTimelineEvent(removed.id);
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
	description={m.timeline.deleteConfirm.description}
	size="small"
	title={m.timeline.deleteConfirm.title(event.name)}
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
