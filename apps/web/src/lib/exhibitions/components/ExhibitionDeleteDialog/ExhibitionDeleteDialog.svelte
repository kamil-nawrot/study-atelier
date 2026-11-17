<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { archiveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';

	type Props = {
		id: string;
		title: string;
		open: boolean;
		onarchived: () => void | Promise<void>;
	};

	let { id, title, open = $bindable(), onarchived }: Props = $props();
</script>

<DeleteDialog
	busyLabel={m.exhibitions.deleteConfirm.moving}
	cancelLabel={m.common.cancel}
	confirmLabel={m.exhibitions.deleteConfirm.confirm}
	description={m.exhibitions.deleteConfirm.description}
	errorTitle={m.exhibitions.deleteConfirm.errorTitle}
	ondone={onarchived}
	run={() => archiveExhibition(id)}
	title={m.exhibitions.deleteConfirm.title(title)}
	bind:open
/>
