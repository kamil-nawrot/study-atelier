<script lang="ts">
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Alert, Button, Dialog, Tooltip } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteValue } from '#lib/card-index/card-index-data/card-index-data.ts';
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import { deleteState } from '#lib/values/value-page-view/value-page-view.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { CardIndexPlace } from '#lib/card-index/types/card-index-place.ts';
	import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

	type Props = {
		record: CardIndexRecord;
		places: CardIndexPlace[];
	};

	let { record, places }: Props = $props();

	let open = $state(false);
	let deleting = $state(false);
	let error = $state<string>();
	let removal = $derived(deleteState(record, places));
	let kind = $derived(m.cardIndex.kinds[record.category]);

	function ask(): void {
		error = undefined;
		open = true;
	}

	async function remove(): Promise<void> {
		if (deleting) return;
		deleting = true;
		error = undefined;
		const result = await deleteValue(record);
		deleting = false;
		if (result.error) {
			error = result.error;
			return;
		}
		open = false;
		await goto(resolve('/(app)/atelier/values'), {
			refreshAll: true,
			state: { valueMessage: m.cardIndex.deleted(record.name) }
		});
	}
</script>

<MoreActions
	actions={[
		removal.deletable
			? { label: m.common.delete, icon: Trash, onclick: ask, danger: true }
			: { label: m.common.delete, icon: Trash, reason: removal.blocked }
	]}
>
	{#if removal.deletable}
		<Button aria-label={m.common.delete} compact icon={Trash} onclick={ask} variant="danger">
			{m.common.delete}
		</Button>
	{:else}
		<Tooltip align="end" placement="bottom" text={removal.blocked}>
			{#snippet children(describedby)}
				<Button
					aria-describedby={describedby}
					aria-disabled="true"
					aria-label={m.common.delete}
					compact
					icon={Trash}
					variant="danger"
				>
					{m.common.delete}
				</Button>
			{/snippet}
		</Tooltip>
	{/if}
</MoreActions>

{#snippet errorAlert()}
	<Alert tone="danger">
		{error}
	</Alert>
{/snippet}

<Dialog
	children={error ? errorAlert : undefined}
	description={m.cardIndex.deleteConfirm.description}
	size="small"
	title={m.cardIndex.deleteConfirm.title(kind.accusative, record.name)}
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
