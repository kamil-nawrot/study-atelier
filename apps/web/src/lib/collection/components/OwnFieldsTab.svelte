<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Plus from '@lucide/svelte/icons/plus';
	import { Alert, Button, Dialog, Icon, PopupButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { deleteOwnField, moveOwnField } from '../own-fields.ts';
	import CardIndexList from './CardIndexList.svelte';
	import OwnFieldDialog from './OwnFieldDialog.svelte';
	import OwnValueDialog from './OwnValueDialog.svelte';
	import type { OwnField, OwnValue } from '../types.ts';

	type Props = {
		fields: OwnField[];
		onchanged: (message?: string) => Promise<void>;
	};

	let { fields, onchanged }: Props = $props();

	let menus = $state<Record<string, PopupButton>>({});
	let queries = $state<Record<string, string>>({});
	let fieldOpen = $state(false);
	let edited = $state<OwnField>();
	let deleted = $state<OwnField>();
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let valueOpen = $state(false);
	let valueField = $state<OwnField>();
	let chosenValue = $state<OwnValue>();
	let failure = $state<string>();

	function summary(field: OwnField): string {
		const { ownFields } = m;
		return ownFields.summary([
			ownFields.kinds[field.kind],
			...(field.kind === 'list'
				? [field.multiple ? ownFields.manyValues : ownFields.oneValue]
				: []),
			m.atelier.count(field.count)
		]);
	}

	function fromMenu(field: OwnField, action: () => void): void {
		menus[field.id]?.close();
		failure = undefined;
		action();
	}

	function add(): void {
		failure = undefined;
		edited = undefined;
		fieldOpen = true;
	}

	function edit(field: OwnField): void {
		edited = field;
		fieldOpen = true;
	}

	function askDelete(field: OwnField): void {
		deleted = field;
		deleteOpen = true;
	}

	async function move(field: OwnField, direction: -1 | 1): Promise<void> {
		const { error } = await moveOwnField(field, direction);
		if (error) {
			failure = error;
			return;
		}
		await onchanged();
	}

	async function confirmDelete(): Promise<void> {
		if (!deleted || deleting) return;
		deleting = true;
		const { error } = await deleteOwnField(deleted);
		deleting = false;
		deleteOpen = false;
		if (error) {
			failure = error;
			return;
		}
		await onchanged(m.ownFields.deleted(deleted.name));
	}

	function chooseValue(field: OwnField, id: string): void {
		failure = undefined;
		valueField = field;
		chosenValue = field.values.find((value) => value.id === id);
		valueOpen = chosenValue !== undefined;
	}
</script>

<div class="own-fields">
	<div class="add">
		<Button onclick={add}>
			<Icon icon={Plus} />
			{m.ownFields.add}
		</Button>
	</div>

	{#if failure}
		<Alert title={m.ownFields.errorTitle} tone="danger">
			{failure}
		</Alert>
	{/if}

	{#if fields.length === 0}
		<p class="lead">{m.ownFields.empty}</p>
	{/if}

	{#each fields as field, index (field.id)}
		<section aria-labelledby="field-{field.id}">
			<header>
				<div class="heading">
					<h2 id="field-{field.id}">{field.name}</h2>
					<p class="caption">{summary(field)}</p>
					{#if field.description}
						<p class="caption">{field.description}</p>
					{/if}
				</div>
				<PopupButton
					bind:this={menus[field.id]}
					align="end"
					label={m.ownFields.menu(field.name)}
					tooltip
				>
					{#snippet trigger()}
						<Icon icon={Ellipsis} />
					{/snippet}
					<div class="menu">
						<Button onclick={() => fromMenu(field, () => edit(field))}>
							{m.ownFields.edit}
						</Button>
						<Button
							disabled={index === 0}
							onclick={() => fromMenu(field, () => void move(field, -1))}
						>
							{m.ownFields.moveUp}
						</Button>
						<Button
							disabled={index === fields.length - 1}
							onclick={() => fromMenu(field, () => void move(field, 1))}
						>
							{m.ownFields.moveDown}
						</Button>
						<Button onclick={() => fromMenu(field, () => askDelete(field))} variant="danger">
							{m.ownFields.remove}
						</Button>
					</div>
				</PopupButton>
			</header>
			{#if field.kind === 'list'}
				<CardIndexList
					empty={m.ownFields.noValues}
					onchoose={(id) => chooseValue(field, id)}
					records={field.values}
					searchLabel={m.ownFields.search(field.name)}
					bind:query={() => queries[field.id] ?? '', (query) => (queries[field.id] = query)}
				/>
			{/if}
		</section>
	{/each}
</div>

<OwnFieldDialog {edited} {fields} onsaved={onchanged} bind:open={fieldOpen} />

<OwnValueDialog field={valueField} onsaved={onchanged} value={chosenValue} bind:open={valueOpen} />

<Dialog
	description={deleted ? m.ownFields.deleteConfirm.description(deleted.count) : undefined}
	size="small"
	title={deleted ? m.ownFields.deleteConfirm.title(deleted.name) : ''}
	bind:open={deleteOpen}
>
	{#snippet footer()}
		<Button onclick={() => (deleteOpen = false)}>
			{m.ownFields.deleteConfirm.back}
		</Button>
		<Button disabled={deleting} onclick={confirmDelete} variant="primary">
			{deleting ? m.ownFields.deleteConfirm.deleting : m.ownFields.deleteConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<style>
	.own-fields {
		display: grid;
		gap: var(--spacing-8);
	}

	section {
		display: grid;
		gap: var(--spacing-4);
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-4);
		max-width: var(--size-content-default);
	}

	.heading {
		display: grid;
		gap: var(--spacing-1);
	}

	h2,
	.heading p {
		margin: 0;
	}

	.menu {
		display: grid;
		gap: var(--spacing-2);
		min-width: max-content;
	}
</style>
