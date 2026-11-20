<script lang="ts">
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, Tooltip } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { m } from '#lib/i18n/i18n.ts';
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import DeleteDialog from '#lib/shared/forms/DeleteDialog/DeleteDialog.svelte';
	import { deleteOwnValue } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import { ownFieldPath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { OwnValue } from '#lib/card-index/types/own-value.ts';

	type Props = {
		field: OwnField;
		value: OwnValue;
	};

	let { field, value }: Props = $props();

	let open = $state(false);

	let deletable = $derived(value.count === 0);
	let blocked = $derived(m.ownFields.value.deleteBlocked(m.atelier.count(value.count)));

	function ask(): void {
		open = true;
	}

	async function deleted(): Promise<void> {
		await goto(ownFieldPath(field.id), {
			refreshAll: true,
			state: { valueMessage: m.cardIndex.deleted(value.name) }
		});
	}
</script>

<MoreActions
	actions={[
		deletable
			? { label: m.common.delete, icon: Trash, onclick: ask, danger: true }
			: { label: m.common.delete, icon: Trash, reason: blocked }
	]}
>
	{#if deletable}
		<Button aria-label={m.common.delete} compact icon={Trash} onclick={ask} variant="danger">
			{m.common.delete}
		</Button>
	{:else}
		<Tooltip align="end" placement="bottom" text={blocked}>
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

<DeleteDialog
	description={m.ownFields.value.deleteDescription(field.name)}
	errorTitle={m.ownFields.value.errorTitle}
	ondone={deleted}
	run={() => deleteOwnValue(value)}
	title={m.ownFields.value.deleteTitle(value.name)}
	bind:open
/>
