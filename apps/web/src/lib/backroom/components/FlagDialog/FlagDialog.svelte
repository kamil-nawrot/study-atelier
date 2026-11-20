<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		FieldMessage,
		Form,
		TextArea
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
	import { deleteFlag } from '#lib/backroom/backroom-data/backroom-data.ts';
	import { flagOf } from '#lib/backroom/flag-match/flag-match.ts';
	import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
	import { FLAG_COMMENT_MAX, commentMissing } from '#lib/backroom/flag-payload/flag-payload.ts';
	import { groupLabel, groupTiles, pinTiles } from '#lib/backroom/flag-tiles/flag-tiles.ts';
	import type { FlagChoicePin } from '#lib/backroom/types/flag-choice-pin.ts';
	import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
	import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
	import type { FlagQuestion } from '#lib/backroom/types/flag-question.ts';
	import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
	import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';

	const BREAKING = new Set<FlagReason>([
		'image',
		'pin',
		'hidden',
		'definition',
		'meaning',
		'answers'
	]);

	type Props = {
		open?: boolean;
		groups: readonly FlagGroup[];
		question?: FlagQuestion;
		pins?: readonly FlagChoicePin[];
		flags?: readonly StoredFlag[];
		onflagged: (message: string) => void;
		onchange?: () => void;
		onsaved?: (holds: boolean) => void;
		place?: 'view' | 'question' | 'answered';
	};

	let {
		open = $bindable(false),
		groups,
		question,
		pins = [],
		flags = [],
		onflagged,
		onchange,
		onsaved,
		place = 'view'
	}: Props = $props();

	const formId = $props.id();

	let chosen = $state<{ group: number; reason: FlagReason }>();
	let pinId = $state<string | null>(null);
	let comment = $state('');
	let commentError = $state<string>();
	let failure = $state<string>();
	let saving = $state(false);
	let holds = $state(false);

	let chosenItem = $derived(chosen ? groups[chosen.group]?.item : undefined);
	let choosingPin = $derived(
		chosen?.reason === 'pin' && chosenItem?.kind === 'artwork' && !chosenItem.pin && pins.length > 0
	);
	let existing = $derived(
		chosen && chosenItem
			? flagOf(flags, chosenItem, chosen.reason, choosingPin ? (pinId ?? undefined) : undefined)
			: undefined
	);

	$effect(() => {
		if (open) untrack(reset);
	});

	function reset(): void {
		chosen = undefined;
		pinId = pins[0]?.id ?? null;
		comment = '';
		commentError = undefined;
		failure = undefined;
	}

	function prefill(change: () => void): void {
		const filled = existing !== undefined;
		change();
		commentError = undefined;
		holds = existing?.holds ?? (place !== 'view' && !!chosen && BREAKING.has(chosen.reason));
		if (existing) comment = existing.comment ?? '';
		else if (filled) comment = '';
	}

	function choose(group: number, value: string | null): void {
		prefill(() => (chosen = value ? { group, reason: value as FlagReason } : undefined));
	}

	function marked(group: FlagGroup): (reason: FlagReason) => boolean {
		return (reason) => flagOf(flags, group.item, reason) !== undefined;
	}

	function settled(message: string): void {
		open = false;
		void flagCount.refresh();
		onchange?.();
		onflagged(message);
	}

	async function withdraw(): Promise<void> {
		if (saving || !existing) return;
		saving = true;
		const result = await deleteFlag(existing.id);
		saving = false;
		if (result.error) {
			failure = result.error;
			return;
		}
		settled(m.backroom.withdrawn);
	}

	function itemOf(item: FlagItem): FlagItem {
		const pin = pins.find((candidate) => candidate.id === pinId);
		if (!choosingPin || !pin || item.kind !== 'artwork') return item;
		return { ...item, pin: { id: pin.id, imageId: pin.imageId, x: 0, y: 0 } };
	}

	async function submit(): Promise<void> {
		if (saving || !chosen || !chosenItem) return;
		failure = undefined;
		if (commentMissing({ reason: chosen.reason, comment })) {
			commentError = m.backroom.commentRequired;
			return;
		}
		saving = true;
		const result = await saveFlag({
			item: itemOf(chosenItem),
			reason: chosen.reason,
			comment,
			...(question ? { question } : {}),
			holds
		});
		saving = false;
		if (result.error !== undefined) {
			failure = result.error;
			return;
		}
		onsaved?.(holds);
		settled(result.created ? m.backroom.flagged : m.backroom.changed);
	}
</script>

<Dialog description={m.backroom.dialogDescription} title={m.backroom.dialogTitle} bind:open>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert title={m.backroom.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		{#each groups as group, index (index)}
			<ChoiceTiles
				columns={1}
				label={groupLabel(group.item)}
				narrowColumns={1}
				onchange={(value) => choose(index, value)}
				options={groupTiles(group, marked(group))}
				value={chosen?.group === index ? chosen.reason : null}
			/>
		{/each}
		{#if choosingPin}
			<ChoiceTiles
				columns={1}
				label={m.backroom.pinChoice}
				narrowColumns={1}
				onchange={(value) => prefill(() => (pinId = value))}
				options={pinTiles(pins)}
				value={pinId}
			/>
		{/if}
		{#if chosen}
			<div class="hold">
				<Checkbox
					aria-describedby="{formId}-hold"
					label={place === 'question' ? m.backroom.skipQuestion : m.backroom.holdQuestion}
					bind:checked={holds}
				/>
				<FieldMessage id="{formId}-hold" hint={m.backroom.holdHint} />
			</div>
		{/if}
		<TextArea
			required={chosen?.reason === 'other'}
			counter
			error={commentError}
			hint={m.backroom.commentHint}
			label={m.backroom.commentLabel}
			maxlength={FLAG_COMMENT_MAX}
			bind:value={comment}
		/>
	</Form>
	{#snippet footer()}
		{#if existing}
			<Button disabled={saving} onclick={withdraw}>
				{m.backroom.withdraw}
			</Button>
		{/if}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={saving || !chosen} form={formId} type="submit" variant="primary">
			{saving ? m.backroom.confirming : existing ? m.backroom.saveChanges : m.backroom.confirm}
		</Button>
	{/snippet}
</Dialog>

<style>
	.hold {
		display: grid;
		gap: var(--spacing-1);
	}
</style>
