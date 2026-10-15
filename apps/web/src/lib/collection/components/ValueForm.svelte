<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import {
		Alert,
		Button,
		Dialog,
		Form,
		NotesEditor,
		Select,
		Tag,
		TextArea,
		TextField
	} from '@study-atelier/ui';
	import { beforeNavigate, goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/index.ts';
	import { loadValuePageContent, saveValue } from '../card-index-data.ts';
	import {
		erasOfPeriod,
		findRecord,
		lockedPeriodIds,
		periodsOfStyle,
		planEraMove,
		planNameChange,
		valuesOf
	} from '../card-index.ts';
	import { ERA_CODES, eraName } from '../eras.ts';
	import { pendingAnswer } from '../pending-answer.ts';
	import { saveValueDetails, valueDetailsChanged } from '../value-details.ts';
	import { SUMMARY_MAX_LENGTH, subjectPath, valuePath } from '../value-pages.ts';
	import type { CardIndexData, EraCode, ValueDetails, ValueSubject } from '../types.ts';

	type Props = {
		subject: ValueSubject;
		index: CardIndexData;
		details: ValueDetails;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let { subject, index, details, cancelHref, oncancel, onsaved }: Props = $props();

	type FormState = {
		name: string;
		eraCodes: EraCode[];
		periodIds: string[];
		details: ValueDetails;
	};

	const formId = $props.id();
	const formErrorId = `${formId}-error`;
	const record = untrack(() => (subject.kind === 'era' ? undefined : subject.record));

	let form = $state<FormState>(initialForm());
	let saved = $state<FormState>(initialForm());
	let formError = $state('');
	let nameError = $state<string>();
	let moveTo = $state('');
	let moveOpen = $state(false);
	let moveError = $state<string>();
	let mergeOpen = $state(false);
	let mergedHasContent = $state(false);
	let discardOpen = $state(false);
	let busy = $state(false);
	let discarded: FormState | null = null;
	const discardQuestion = pendingAnswer();

	let kind = $derived(record ? m.cardIndex.kinds[record.category] : undefined);
	let change = $derived(record ? planNameChange(record, form.name, index) : undefined);
	let mergeTarget = $derived(change?.kind === 'merge' ? change.target : undefined);
	let eraMove = $derived(
		record?.category === 'period'
			? planEraMove(index, record.id, form.eraCodes)
			: { count: 0, removed: [], remaining: [] }
	);
	let needsMove = $derived(eraMove.count > 0);
	let locked = $derived(
		record?.category === 'style' ? lockedPeriodIds(index, record.id) : new Map<string, number>()
	);
	let linksChanged = $derived(
		!sameItems(form.eraCodes, saved.eraCodes) || !sameItems(form.periodIds, saved.periodIds)
	);
	let eraOptions = $derived(
		ERA_CODES.filter((code) => !form.eraCodes.includes(code)).map((code) => ({
			value: code,
			label: eraName(code)
		}))
	);
	let periodOptions = $derived(
		valuesOf(index, 'period')
			.filter((period) => !form.periodIds.includes(period.id))
			.map((period) => ({ value: period.id, label: period.name }))
	);
	let selectedPeriods = $derived(
		form.periodIds.flatMap((id) => {
			const period = findRecord(index, id);
			return period ? [period] : [];
		})
	);
	let moveDescription = $derived.by(() => {
		if (!record) return '';
		const { moveConfirm } = m.cardIndex;
		const removed = eraMove.removed.map(eraName).join(', ');
		if (eraMove.remaining.length === 0) {
			return moveConfirm.toNone(record.name, removed, eraMove.count);
		}
		if (eraMove.remaining.length === 1) {
			return moveConfirm.toEra(record.name, removed, eraMove.count, eraName(eraMove.remaining[0]));
		}
		return moveConfirm.toPicked(record.name, removed, eraMove.count);
	});
	let mergeDescription = $derived.by(() => {
		if (!record || !mergeTarget || !kind) return '';
		const { mergeConfirm } = m.cardIndex;
		const merged = record.name;
		const kept = mergeTarget.name;
		const ending = [
			...(mergedHasContent ? [mergeConfirm.pageContent(merged)] : []),
			mergeConfirm.irreversible
		];
		if (record.count === 0) return [mergeConfirm.unused(merged), ...ending].join(' ');
		if (record.category === 'period') {
			return [
				mergeConfirm.periodAssigned(merged, kept, record.count),
				mergeConfirm.periodLinks(merged, kept),
				...ending
			].join(' ');
		}
		return [mergeConfirm.assigned(merged, kept, record.count, kind.genitive), ...ending].join(' ');
	});

	function initialForm(): FormState {
		return {
			name: record?.name ?? '',
			eraCodes: record?.category === 'period' ? erasOfPeriod(index, record.id) : [],
			periodIds:
				record?.category === 'style'
					? periodsOfStyle(index, record.id).map((period) => period.id)
					: [],
			details: { ...details }
		};
	}

	function sameItems(a: readonly string[], b: readonly string[]): boolean {
		return a.length === b.length && a.every((item) => b.includes(item));
	}

	function hasChanges(current: FormState, reference: FormState): boolean {
		return (
			current.name.trim() !== reference.name.trim() ||
			!sameItems(current.eraCodes, reference.eraCodes) ||
			!sameItems(current.periodIds, reference.periodIds) ||
			valueDetailsChanged(current.details, reference.details)
		);
	}

	function leaveAllowed(): boolean {
		return discarded !== null && !hasChanges(form, discarded);
	}

	export function confirmLeave(): Promise<boolean> {
		if (leaveAllowed() || !hasChanges(form, saved)) return Promise.resolve(true);
		return discardQuestion
			.ask(() => (discardOpen = true))
			.then((discard) => {
				if (discard) discarded = $state.snapshot(form);
				return discard;
			});
	}

	function answer(discard: boolean): void {
		discardQuestion.answer(discard);
		discardOpen = false;
	}

	beforeNavigate((navigation) => {
		if (leaveAllowed()) {
			discarded = null;
			return;
		}
		if (!hasChanges(form, saved)) return;
		navigation.cancel();
		const url = navigation.to?.url;
		if (navigation.type === 'leave' || !url || discardQuestion.pending) return;
		const target = `${url.pathname}${url.search}${url.hash}` as ResolvedPathname;
		const popstate = navigation.type === 'popstate' ? navigation.delta : null;
		void confirmLeave().then((discard) => {
			if (!discard) return;
			if (popstate === null) void goto(target);
			else history.go(popstate);
		});
	});

	onDestroy(() => {
		discardQuestion.answer(false);
	});

	function addEra(code: string): void {
		if (!code) return;
		form.eraCodes = ERA_CODES.filter((era) => era === code || form.eraCodes.includes(era));
	}

	function removeEra(code: EraCode): void {
		form.eraCodes = form.eraCodes.filter((era) => era !== code);
	}

	function addPeriod(id: string): void {
		if (id) form.periodIds = [...form.periodIds, id];
	}

	function removePeriod(id: string): void {
		form.periodIds = form.periodIds.filter((period) => period !== id);
	}

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	function submit(): void {
		if (busy) return;
		formError = '';
		nameError = change?.kind === 'empty' ? m.valueForm.nameRequired : undefined;
		if (nameError) return;
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
		if (mergeTarget) void confirmMerge();
		else void run();
	}

	async function confirmMerge(): Promise<void> {
		if (!record) return;
		busy = true;
		const result = await loadValuePageContent(record.id);
		busy = false;
		if (result.error) {
			await showError(result.error);
			return;
		}
		mergedHasContent = result.content?.hasContent ?? false;
		mergeOpen = true;
	}

	async function run(): Promise<void> {
		busy = true;
		const snapshot = $state.snapshot(form);
		const target = mergeTarget;
		try {
			if (!target && valueDetailsChanged(snapshot.details, saved.details)) {
				const result = await saveValueDetails(subject, snapshot.details);
				if (result.error) {
					mergeOpen = false;
					await showError(result.error);
					return;
				}
			}
			if (record) {
				const result = await saveValue({
					record,
					name: change?.kind === 'rename' ? change.name : record.name,
					eraCodes: record.category === 'period' && linksChanged ? snapshot.eraCodes : undefined,
					moveTo: moveTo ? (moveTo as EraCode) : undefined,
					periodIds: record.category === 'style' && linksChanged ? snapshot.periodIds : undefined,
					mergeInto: target
				});
				if (result.error) {
					mergeOpen = false;
					await showError(result.error);
					return;
				}
			}
			saved = snapshot;
			mergeOpen = false;
			if (target && record) {
				await onsaved(valuePath(record.category, target.id), m.cardIndex.merged(target.name));
			} else {
				await onsaved(subjectPath(subject), m.valuePage.saved);
			}
		} finally {
			busy = false;
		}
	}
</script>

<div class="page">
	<Form onsubmit={submit}>
		{#if formError}
			<Alert id={formErrorId} title={m.valueForm.errorTitle} tone="danger">
				{formError}
			</Alert>
		{/if}

		<div class="fields">
			{#if record && kind}
				<TextField
					autocomplete="off"
					error={nameError}
					hint={mergeTarget
						? m.valueForm.mergeHint(
								kind.accusative,
								mergeTarget.name,
								m.atelier.count(mergeTarget.count)
							)
						: undefined}
					label={m.valueForm.name}
					bind:value={form.name}
				/>
			{/if}

			{#if record?.category === 'period'}
				<fieldset>
					<legend>{m.valueForm.eras}</legend>
					{#if form.eraCodes.length === 0}
						<p class="muted">{m.valueForm.noEras}</p>
					{:else}
						<div class="tags">
							{#each form.eraCodes as code (code)}
								<Tag
									onremove={() => removeEra(code)}
									removeLabel={m.valueForm.removeEra(eraName(code))}
								>
									{eraName(code)}
								</Tag>
							{/each}
						</div>
					{/if}
					{#if eraOptions.length > 0}
						<Select
							label={m.valueForm.addEra}
							onchange={(event) => {
								addEra(event.currentTarget.value);
								event.currentTarget.value = '';
							}}
							options={eraOptions}
							placeholder={m.valueForm.chooseEra}
						/>
					{/if}
				</fieldset>
			{/if}

			{#if record?.category === 'style'}
				<fieldset>
					<legend>{m.valueForm.periods}</legend>
					{#if selectedPeriods.length === 0}
						<p class="muted">{m.valueForm.noPeriods}</p>
					{:else}
						<div class="tags">
							{#each selectedPeriods as period (period.id)}
								<Tag
									onremove={() => removePeriod(period.id)}
									removeDisabled={locked.has(period.id)}
									removeLabel={m.valueForm.removePeriod(period.name)}
								>
									{period.name}
								</Tag>
							{/each}
						</div>
						{#each selectedPeriods.filter((period) => locked.has(period.id)) as period (period.id)}
							<p class="muted">
								{m.valueForm.periodLocked(period.name, locked.get(period.id) ?? 0)}
							</p>
						{/each}
					{/if}
					{#if periodOptions.length > 0}
						<Select
							label={m.valueForm.addPeriod}
							onchange={(event) => {
								addPeriod(event.currentTarget.value);
								event.currentTarget.value = '';
							}}
							options={periodOptions}
							placeholder={m.valueForm.choosePeriod}
						/>
					{/if}
				</fieldset>
			{/if}

			<TextArea
				counter
				label={m.valueForm.summary}
				maxlength={SUMMARY_MAX_LENGTH}
				placeholder={m.valueForm.summaryPlaceholder}
				rows={3}
				bind:value={form.details.summary}
			/>

			<NotesEditor
				label={m.valueForm.notes}
				placeholder={m.valueForm.notesPlaceholder}
				bind:value={form.details.notes}
			/>
		</div>

		<footer class="actions">
			<Button href={cancelHref} onclick={oncancel}>
				{m.valueForm.cancel}
			</Button>
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.valueForm.saving : m.valueForm.save}
			</Button>
		</footer>
	</Form>
</div>

<Dialog
	description={m.valueForm.discardDescription}
	onclose={() => discardQuestion.answer(false)}
	size="small"
	title={m.artworkForm.discardTitle}
	bind:open={discardOpen}
>
	{#snippet footer()}
		<Button onclick={() => answer(false)}>
			{m.artworkForm.keepEditing}
		</Button>
		<Button onclick={() => answer(true)} variant="primary">
			{m.artworkForm.discard}
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
			placeholder={m.valueForm.chooseEra}
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
	title={record && mergeTarget ? m.cardIndex.mergeConfirm.title(record.name, mergeTarget.name) : ''}
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

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
		margin-bottom: calc(-1 * var(--spacing-12));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
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

	.actions {
		position: sticky;
		bottom: 0;
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-3);
		padding: var(--spacing-3) 0;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.actions > :global(*) {
		flex: 1 1 auto;
	}

	.actions > :global(:first-child) {
		order: 3;
		flex-basis: 100%;
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}

		.fields {
			max-width: var(--size-content-default);
		}

		.actions {
			justify-content: flex-end;
			padding: var(--spacing-4) 0;
		}

		.actions > :global(*) {
			flex: none;
		}

		.actions > :global(:first-child) {
			order: 0;
			flex-basis: auto;
			margin-right: auto;
		}
	}
</style>
