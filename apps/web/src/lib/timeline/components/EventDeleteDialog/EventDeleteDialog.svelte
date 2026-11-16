<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';
	import { deleteTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type Props = {
		event: TimelineEvent;
		open: boolean;
		ondeleted: (event: TimelineEvent) => void | Promise<void>;
	};

	let { event, open = $bindable(), ondeleted }: Props = $props();

	let removed: TimelineEvent;

	function run(): ReturnType<typeof deleteTimelineEvent> {
		removed = event;
		return deleteTimelineEvent(removed.id);
	}
</script>

<DeleteDialog
	description={m.timeline.deleteConfirm.description}
	ondone={() => ondeleted(removed)}
	{run}
	title={m.timeline.deleteConfirm.title(event.name)}
	bind:open
/>
