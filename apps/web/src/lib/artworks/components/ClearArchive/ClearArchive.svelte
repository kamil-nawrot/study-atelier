<script lang="ts">
	import BrushCleaning from '@lucide/svelte/icons/brush-cleaning';
	import { Alert, Button, Checkbox, Dialog } from '@study-atelier/ui';
	import { clearTrash } from '#lib/artworks/trash-data/trash-data.ts';
	import { deleteArchivedExhibitions } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';

	type Item = { id: string };
	type Part = 'artworks' | 'exhibitions';

	type Props = {
		artworks: readonly Item[];
		exhibitions: readonly Item[];
		removed: string[];
		ondone: () => void;
	};

	let { artworks, exhibitions, removed = $bindable(), ondone }: Props = $props();

	let left = $derived({
		artworks: artworks.filter((record) => !removed.includes(record.id)),
		exhibitions: exhibitions.filter((record) => !removed.includes(record.id))
	});

	let open = $state(false);
	let understood = $state(false);
	let clearing = $state(false);
	let error = $state<string>();

	function ask(): void {
		understood = false;
		error = undefined;
		open = true;
	}

	async function clearPart(part: Part): Promise<string | undefined> {
		if (left[part].length === 0) return undefined;
		const result = part === 'artworks' ? await clearTrash() : await deleteArchivedExhibitions();
		if (!result.error) removed.push(...left[part].map((record) => record.id));
		return result.error;
	}

	async function clear(): Promise<void> {
		if (clearing || !understood) return;
		clearing = true;
		error = undefined;
		error = (await clearPart('exhibitions')) ?? (await clearPart('artworks'));
		clearing = false;
		if (error) return;
		open = false;
		ondone();
	}
</script>

{#if left.artworks.length + left.exhibitions.length > 0}
	<MoreActions
		actions={[{ label: m.trash.clear, icon: BrushCleaning, onclick: ask, danger: true }]}
	>
		<Button aria-label={m.trash.clear} compact icon={BrushCleaning} onclick={ask} variant="danger">
			{m.trash.clear}
		</Button>
	</MoreActions>
{/if}

{#snippet body()}
	{#if error}
		<Alert title={m.trash.clearErrorTitle} tone="danger">
			{error}
		</Alert>
	{/if}
	<Checkbox label={m.trash.clearUnderstood} bind:checked={understood} />
{/snippet}

<Dialog
	children={body}
	description={m.trash.clearDescription(left.artworks.length, left.exhibitions.length)}
	size="small"
	title={m.trash.clearTitle}
	bind:open
>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={clearing || !understood} onclick={clear} variant="primary">
			{clearing ? m.trash.clearing : m.trash.clear}
		</Button>
	{/snippet}
</Dialog>
