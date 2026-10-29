<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import Plus from '@lucide/svelte/icons/plus';
	import { tick } from 'svelte';
	import {
		Alert,
		Button,
		Dialog,
		Disclosure,
		EmptyState,
		Icon,
		PopupButton,
		TextButton
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteOwnField, moveOwnField } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import CardIndexList from '#lib/card-index/components/CardIndexList/CardIndexList.svelte';
	import {
		rememberSort,
		rememberedSort,
		sortsOf
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import OwnFieldDialog from '#lib/card-index/components/OwnFieldDialog/OwnFieldDialog.svelte';
	import OwnValueDialog from '#lib/card-index/components/OwnValueDialog/OwnValueDialog.svelte';
	import NewOwnValueDialog from '#lib/card-index/components/NewOwnValueDialog/NewOwnValueDialog.svelte';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';
	import type { OwnValue } from '#lib/card-index/types/own-value.ts';

	type Props = {
		fields: OwnField[];
		error?: string;
		onchanged: (message?: string) => Promise<void>;
	};

	let { fields, error, onchanged }: Props = $props();

	let menus = $state<Record<string, PopupButton>>({});
	let queries = $state<Record<string, string>>({});
	let sort = $state(rememberedSort('own'));
	let fieldOpen = $state(false);
	let edited = $state<OwnField>();
	let deleted = $state<OwnField>();
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let valueOpen = $state(false);
	let newValueOpen = $state(false);
	let valueField = $state<OwnField>();
	let chosenValue = $state<OwnValue>();
	let failure = $state<string>();

	const addButtonId = 'own-fields-add';

	async function keepFocus(fallbackId: string): Promise<void> {
		await tick();
		const active = document.activeElement;
		if (active && active !== document.body && active.isConnected) return;
		document.getElementById(fallbackId)?.focus();
	}

	async function valueSaved(message: string): Promise<void> {
		const field = valueField;
		await onchanged(message);
		if (field) await keepFocus(`field-${field.id}`);
	}

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
		await keepFocus(addButtonId);
	}

	function chooseValue(field: OwnField, id: string): void {
		failure = undefined;
		valueField = field;
		chosenValue = field.values.find((value) => value.id === id);
		valueOpen = chosenValue !== undefined;
	}
</script>

<div class="own-fields">
	{#if error}
		<Alert title={m.ownFields.loadErrorTitle} tone="danger">
			{error}
		</Alert>
	{:else}
		<div class="intro">
			<p>{m.ownFields.intro}</p>
			<div class="add">
				<Button id={addButtonId} onclick={add}>
					<Icon icon={Plus} />
					{m.ownFields.add}
				</Button>
			</div>
		</div>

		{#if failure}
			<Alert title={m.ownFields.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}

		{#if fields.length === 0}
			<EmptyState icon={ListTree} text={m.ownFields.empty} />
		{/if}

		{#each fields as field, index (field.id)}
			<section aria-labelledby="field-{field.id}">
				<header>
					<div class="heading">
						<h2 id="field-{field.id}" tabindex="-1">{field.name}</h2>
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
							<TextButton onclick={() => fromMenu(field, () => edit(field))}>
								{m.common.edit}
							</TextButton>
							<TextButton
								disabled={index === 0}
								onclick={() => fromMenu(field, () => void move(field, -1))}
							>
								{m.ownFields.moveUp}
							</TextButton>
							<TextButton
								disabled={index === fields.length - 1}
								onclick={() => fromMenu(field, () => void move(field, 1))}
							>
								{m.ownFields.moveDown}
							</TextButton>
							<TextButton danger onclick={() => fromMenu(field, () => askDelete(field))}>
								{m.common.delete}
							</TextButton>
						</div>
					</PopupButton>
				</header>
				{#if field.kind === 'list'}
					<div class="add-value">
						<Button
							onclick={() => {
								valueField = field;
								newValueOpen = true;
							}}
						>
							<Icon icon={Plus} />
							{m.ownFields.addValue}
						</Button>
					</div>
					{#if field.values.length === 0}
						<p class="lead">{m.ownFields.noValues}</p>
					{:else}
						<Disclosure
							count={field.values.length}
							level={3}
							open={false}
							title={m.ownFields.values}
						>
							<CardIndexList
								empty={m.ownFields.noValues}
								onchoose={(id) => chooseValue(field, id)}
								records={field.values}
								searchLabel={m.ownFields.search(field.name)}
								sorts={sortsOf('own')}
								bind:sort={() => sort, (value) => rememberSort('own', (sort = value))}
								bind:query={() => queries[field.id] ?? '', (query) => (queries[field.id] = query)}
							/>
						</Disclosure>
					{/if}
				{/if}
			</section>
		{/each}
	{/if}
</div>

<OwnFieldDialog {edited} {fields} onsaved={onchanged} bind:open={fieldOpen} />

<OwnValueDialog field={valueField} onsaved={valueSaved} value={chosenValue} bind:open={valueOpen} />
<NewOwnValueDialog field={valueField} onsaved={valueSaved} bind:open={newValueOpen} />

<Dialog
	description={deleted ? m.ownFields.deleteConfirm.description(deleted.count) : undefined}
	size="small"
	title={deleted ? m.ownFields.deleteConfirm.title(deleted.name) : ''}
	bind:open={deleteOpen}
>
	{#snippet footer()}
		<Button onclick={() => (deleteOpen = false)}>
			{m.common.back}
		</Button>
		<Button disabled={deleting} onclick={confirmDelete} variant="primary">
			{deleting ? m.common.deleting : m.ownFields.deleteConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<style>
	.add-value {
		display: flex;
		justify-content: flex-end;
	}

	.own-fields {
		display: grid;
		gap: var(--spacing-8);
	}

	.intro {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	.add {
		margin-inline-start: auto;
	}

	.intro p {
		flex: 1 1 var(--size-content-narrow);
		max-width: var(--size-content-default);
		margin: 0;
		color: var(--color-fg-muted);
	}

	section {
		display: grid;
		gap: var(--spacing-4);
	}

	section + section {
		padding-block-start: var(--spacing-8);
		border-block-start: var(--border-width-hairline) solid var(--color-line);
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
		justify-items: start;
		gap: var(--spacing-1);
		min-width: max-content;
	}
</style>
