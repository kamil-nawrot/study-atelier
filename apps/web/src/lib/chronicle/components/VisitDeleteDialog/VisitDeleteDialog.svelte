<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
	import { tripDateFrom } from '#lib/chronicle/trip-date/trip-date.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';

	type Props = {
		visit: Visit;
		open: boolean;
		ondeleted: (visit: Visit) => void | Promise<void>;
	};

	let { visit, open = $bindable(), ondeleted }: Props = $props();

	let texts = $derived(
		visit.kind === 'trip' ? m.chronicle.trip.deleteConfirm : m.chronicle.deleteConfirm
	);
	let removed: Visit;

	function run(): ReturnType<typeof deleteVisit> {
		removed = visit;
		return deleteVisit(removed.id);
	}
</script>

<DeleteDialog
	description={texts.description}
	ondone={() => ondeleted(removed)}
	{run}
	title={texts.title(tripDateFrom(visit))}
	bind:open
/>
