<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { moveToTrash } from '#lib/artworks/trash-data/trash-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';

	type Props = {
		artwork?: { id: string; number: number };
		label: string;
		open: boolean;
	};

	let { artwork, label, open = $bindable() }: Props = $props();

	function run(): ReturnType<typeof moveToTrash> | Promise<undefined> {
		return artwork ? moveToTrash(artwork.id) : Promise.resolve(undefined);
	}
</script>

<DeleteDialog
	busyLabel={m.trash.moving}
	cancelLabel={m.common.cancel}
	confirmLabel={m.trash.move}
	description={m.trash.moveDescription}
	ondone={() =>
		goto(resolve('/(app)/atelier'), { refreshAll: true, state: { trashed: artwork?.number } })}
	{run}
	title={m.trash.moveTitle(label)}
	bind:open
/>
