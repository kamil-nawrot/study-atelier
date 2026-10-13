<script lang="ts">
	import { untrack } from 'svelte';
	import { Alert, Button, Dialog, Select, Tag, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { deleteValue, saveValue } from '../card-index-data.ts';
	import {
		canDelete,
		erasOfPeriod,
		findRecord,
		lockedPeriodIds,
		periodsOfStyle,
		planEraMove,
		planNameChange,
		valuesOf
	} from '../card-index.ts';
	import { ERA_CODES, eraName } from '../eras.ts';
	import type { CardIndexData, CardIndexRecord, EraCode } from '../types.ts';

	type Props = {
		record: CardIndexRecord;
		index: CardIndexData;
		onclose: () => void;
		onchanged: (message: string) => void | Promise<void>;
	};

	let { record, index, onclose, onchanged }: Props = $props();

	const initialEras = untrack(() => erasOfPeriod(index, record.id));
	const initialPeriodIds = untrack(() =>
		periodsOfStyle(index, record.id).map((period) => period.id)
	);

	let open = $state(true);
	let name = $state(untrack(() => record.name));
	let eraCodes = $state<EraCode[]>(initialEras);
	let periodIds = $state<string[]>(initialPeriodIds);
	let moveTo = $state('');
	let moveOpen = $state(false);
	let moveError = $state<string>();
	let mergeOpen = $state(false);
	let deleteOpen = $state(false);
	let busy = $state(false);
	let error = $state<string>();

	let kind = $derived(m.cardIndex.kinds[record.category]);
	let change = $derived(planNameChange(record, name, index));
	let eraMove = $derived(planEraMove(index, record.id, eraCodes));
	let needsMove = $derived(record.category === 'period' && eraMove.count > 0);
	let locked = $derived(lockedPeriodIds(index, record.id));
	let linksChanged = $derived(
		record.category === 'period'
			? !sameItems(eraCodes, initialEras)
			: record.category === 'style' && !sameItems(periodIds, initialPeriodIds)
	);
	let dirty = $derived(linksChanged || change.kind === 'rename' || change.kind === 'merge');
	let eraOptions = $derived(
		ERA_CODES.filter((code) => !eraCodes.includes(code)).map((code) => ({
			value: code,
			label: eraName(code)
		}))
	);
	let periodOptions = $derived(
		valuesOf(index, 'period')
			.filter((period) => !periodIds.includes(period.id))
			.map((period) => ({ value: period.id, label: period.name }))
	);
	let selectedPeriods = $derived(
		periodIds.flatMap((id) => {
			const period = findRecord(index, id);
			return period ? [period] : [];
		})
	);
	let mergeTarget = $derived(change.kind === 'merge' ? change.target : undefined);
	let removedEraNames = $derived(eraMove.removed.map(eraName).join(', '));
	let moveDescription = $derived.by(() => {
		const { moveConfirm } = m.cardIndex;
		if (eraMove.remaining.length === 0) {
			return moveConfirm.toNone(record.name, removedEraNames, eraMove.count);
		}
		if (eraMove.remaining.length === 1) {
			return moveConfirm.toEra(
				record.name,
				removedEraNames,
				eraMove.count,
				eraName(eraMove.remaining[0])
			);
		}
		return moveConfirm.toPicked(record.name, removedEraNames, eraMove.count);
	});
	let mergeDescription = $derived(
		mergeTarget
			? [
					m.cardIndex.mergeConfirm.artworks(record.name, mergeTarget.name, record.count),
					record.category === 'period'
						? m.cardIndex.mergeConfirm.periodLinks(record.name, mergeTarget.name)
						: record.category === 'style'
							? m.cardIndex.mergeConfirm.styleLinks(record.name, mergeTarget.name)
							: '',
					m.cardIndex.mergeConfirm.irreversible
				]
					.filter(Boolean)
					.join(' ')
			: ''
	);

	function sameItems(a: readonly string[], b: readonly string[]): boolean {
		return a.length === b.length && a.every((item) => b.includes(item));
	}

	function addEra(code: string): void {
		if (!code) return;
		eraCodes = ERA_CODES.filter((era) => era === code || eraCodes.includes(era));
	}

	function removeEra(code: EraCode): void {
		eraCodes = eraCodes.filter((era) => era !== code);
	}

	function addPeriod(id: string): void {
		if (id) periodIds = [...periodIds, id];
	}

	function removePeriod(id: string): void {
		periodIds = periodIds.filter((period) => period !== id);
	}

	function submit(): void {
		if (busy || !dirty) return;
		error = undefined;
		if (needsMove) {
			moveError = undefined;
			moveOpen = true;
			return;
		}
		proceed();
	}

	function confirmMove(): void {
		if (eraMove.remaining.length > 1 && !moveTo) {
			moveError = m.cardIndex.moveConfirm.pickRequired;
			return;
		}
		moveOpen = false;
		proceed();
	}

	function proceed(): void {
		if (mergeTarget) mergeOpen = true;
		else void run();
	}

	async function run(): Promise<void> {
		busy = true;
		error = undefined;
		const result = await saveValue({
			record,
			name: change.kind === 'rename' ? change.name : record.name,
			eraCodes: record.category === 'period' && linksChanged ? eraCodes : undefined,
			moveTo: moveTo ? (moveTo as EraCode) : undefined,
			periodIds: record.category === 'style' && linksChanged ? periodIds : undefined,
			mergeInto: mergeTarget
		});
		busy = false;
		if (result.error) {
			error = result.error;
			mergeOpen = false;
			moveOpen = false;
			return;
		}
		const message = mergeTarget
			? m.cardIndex.merged(mergeTarget.name)
			: m.cardIndex.saved(change.kind === 'rename' ? change.name : record.name);
		mergeOpen = false;
		open = false;
		await onchanged(message);
	}

	async function remove(): Promise<void> {
		busy = true;
		error = undefined;
		const result = await deleteValue(record.id);
		busy = false;
		if (result.error) {
			error = result.error;
			deleteOpen = false;
			return;
		}
		deleteOpen = false;
		open = false;
		await onchanged(m.cardIndex.deleted(record.name));
	}
</script>

<Dialog
	description={m.cardIndex.dialog.description(kind.name, m.atelier.count(record.count))}
	{onclose}
	title={record.name}
	bind:open
>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			submit();
		}}
	>
		{#if error}
			<Alert title={m.cardIndex.actionErrorTitle} tone="danger">
				{error}
			</Alert>
		{/if}

		<TextField
			autocomplete="off"
			error={change.kind === 'empty' ? m.cardIndex.dialog.nameRequired : undefined}
			hint={mergeTarget
				? m.cardIndex.dialog.mergeHint(
						kind.accusative,
						mergeTarget.name,
						m.atelier.count(mergeTarget.count)
					)
				: undefined}
			label={m.cardIndex.dialog.name}
			bind:value={name}
		/>

		{#if record.category === 'period'}
			<fieldset>
				<legend>{m.cardIndex.dialog.eras}</legend>
				{#if eraCodes.length === 0}
					<p class="muted">{m.cardIndex.dialog.noEras}</p>
				{:else}
					<div class="tags">
						{#each eraCodes as code (code)}
							<Tag
								onremove={() => removeEra(code)}
								removeLabel={m.cardIndex.dialog.removeEra(eraName(code))}
							>
								{eraName(code)}
							</Tag>
						{/each}
					</div>
				{/if}
				{#if eraOptions.length > 0}
					<Select
						label={m.cardIndex.dialog.addEra}
						onchange={(event) => {
							addEra(event.currentTarget.value);
							event.currentTarget.value = '';
						}}
						options={eraOptions}
						placeholder={m.cardIndex.dialog.chooseEra}
					/>
				{/if}
			</fieldset>
		{/if}

		{#if record.category === 'style'}
			<fieldset>
				<legend>{m.cardIndex.dialog.periods}</legend>
				{#if selectedPeriods.length === 0}
					<p class="muted">{m.cardIndex.dialog.noPeriods}</p>
				{:else}
					<div class="tags">
						{#each selectedPeriods as period (period.id)}
							<Tag
								onremove={() => removePeriod(period.id)}
								removeDisabled={locked.has(period.id)}
								removeLabel={m.cardIndex.dialog.removePeriod(period.name)}
							>
								{period.name}
							</Tag>
						{/each}
					</div>
					{#each selectedPeriods.filter((period) => locked.has(period.id)) as period (period.id)}
						<p class="muted">
							{m.cardIndex.dialog.periodLocked(
								period.name,
								m.atelier.count(locked.get(period.id) ?? 0)
							)}
						</p>
					{/each}
				{/if}
				{#if periodOptions.length > 0}
					<Select
						label={m.cardIndex.dialog.addPeriod}
						onchange={(event) => {
							addPeriod(event.currentTarget.value);
							event.currentTarget.value = '';
						}}
						options={periodOptions}
						placeholder={m.cardIndex.dialog.choosePeriod}
					/>
				{/if}
			</fieldset>
		{/if}

		{#if !canDelete(record)}
			<p class="muted">
				{m.cardIndex.dialog.deleteBlocked(
					kind.demonstrative,
					m.atelier.count(record.count),
					kind.other
				)}
			</p>
		{/if}
	</form>

	{#snippet footer()}
		<span class="delete">
			<Button
				disabled={!canDelete(record) || busy}
				onclick={() => (deleteOpen = true)}
				variant="danger"
			>
				{m.cardIndex.dialog.delete}
			</Button>
		</span>
		<Button onclick={() => (open = false)}>
			{m.cardIndex.dialog.cancel}
		</Button>
		<Button disabled={!dirty || change.kind === 'empty' || busy} onclick={submit} variant="primary">
			{busy
				? m.cardIndex.dialog.saving
				: mergeTarget
					? m.cardIndex.dialog.merge
					: m.cardIndex.dialog.save}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={moveDescription}
	size="small"
	title={m.cardIndex.moveConfirm.title}
	bind:open={moveOpen}
>
	{#if eraMove.remaining.length > 1}
		<Select
			error={moveError}
			label={m.cardIndex.moveConfirm.pick}
			options={eraMove.remaining.map((code) => ({ value: code, label: eraName(code) }))}
			placeholder={m.cardIndex.dialog.chooseEra}
			bind:value={moveTo}
		/>
	{/if}
	{#snippet footer()}
		<Button onclick={() => (moveOpen = false)}>
			{m.cardIndex.moveConfirm.back}
		</Button>
		<Button disabled={busy} onclick={confirmMove} variant="primary">
			{m.cardIndex.moveConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={mergeDescription}
	size="small"
	title={mergeTarget ? m.cardIndex.mergeConfirm.title(mergeTarget.name) : ''}
	bind:open={mergeOpen}
>
	{#snippet footer()}
		<Button onclick={() => (mergeOpen = false)}>
			{m.cardIndex.mergeConfirm.back}
		</Button>
		<Button disabled={busy} onclick={run} variant="primary">
			{busy ? m.cardIndex.mergeConfirm.merging : m.cardIndex.mergeConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={m.cardIndex.deleteConfirm.description}
	size="small"
	title={m.cardIndex.deleteConfirm.title(kind.accusative, record.name)}
	bind:open={deleteOpen}
>
	{#snippet footer()}
		<Button onclick={() => (deleteOpen = false)}>
			{m.cardIndex.deleteConfirm.back}
		</Button>
		<Button disabled={busy} onclick={remove} variant="danger">
			{busy ? m.cardIndex.deleteConfirm.deleting : m.cardIndex.deleteConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<style>
	form {
		display: grid;
		gap: var(--spacing-6);
	}

	fieldset {
		display: grid;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		margin-bottom: var(--spacing-2);
		padding: 0;
		font-weight: var(--font-weight-medium);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.muted {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.delete {
		margin-right: auto;
	}
</style>
