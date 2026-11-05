<script lang="ts">
	import ListTree from '@lucide/svelte/icons/list-tree';
	import Plus from '@lucide/svelte/icons/plus';
	import { Alert, Button, EmptyState, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { moveOwnField } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import OwnFieldDialog from '#lib/card-index/components/OwnFieldDialog/OwnFieldDialog.svelte';
	import OwnFieldList from '#lib/card-index/components/OwnFieldList/OwnFieldList.svelte';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';

	type Props = {
		fields: OwnField[];
		error?: string;
		onchanged: (message?: string) => Promise<void>;
	};

	let { fields, error, onchanged }: Props = $props();

	let fieldOpen = $state(false);
	let reordering = $state(false);
	let moving = $state(false);
	let failure = $state<string>();

	function add(): void {
		failure = undefined;
		fieldOpen = true;
	}

	function toggleReorder(): void {
		failure = undefined;
		reordering = !reordering;
	}

	async function move(field: OwnField, direction: -1 | 1): Promise<void> {
		moving = true;
		const { error } = await moveOwnField(field, direction);
		if (error) failure = error;
		else await onchanged();
		moving = false;
	}
</script>

<div class="own-fields">
	{#if error}
		<Alert title={m.ownFields.loadErrorTitle} tone="danger">
			{error}
		</Alert>
	{:else}
		<div class="intro">
			<p>{reordering ? m.ownFields.reorderHint : m.ownFields.intro}</p>
			<div class="actions">
				{#if fields.length > 1}
					<Button onclick={toggleReorder} variant={reordering ? 'primary' : 'secondary'}>
						{reordering ? m.ownFields.reorderDone : m.ownFields.reorder}
					</Button>
				{/if}
				{#if !reordering}
					<Button onclick={add} variant="primary">
						<Icon icon={Plus} />
						{m.ownFields.add}
					</Button>
				{/if}
			</div>
		</div>

		{#if failure}
			<Alert title={m.ownFields.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}

		{#if fields.length === 0}
			<EmptyState icon={ListTree} text={m.ownFields.empty} />
		{:else}
			<OwnFieldList {fields} {moving} onmove={move} {reordering} />
		{/if}
	{/if}
</div>

<OwnFieldDialog {fields} onsaved={onchanged} bind:open={fieldOpen} />

<style>
	.own-fields {
		display: grid;
		gap: var(--spacing-6);
	}

	.intro {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	.intro p {
		flex: 1 1 var(--size-content-narrow);
		max-width: var(--size-content-default);
		margin: 0;
		color: var(--color-fg-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
		margin-inline-start: auto;
	}
</style>
