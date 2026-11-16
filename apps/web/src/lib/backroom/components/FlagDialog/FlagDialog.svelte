<script lang="ts">
	import { untrack } from 'svelte';
	import { Alert, Button, ChoiceTiles, Dialog, Form, TextArea } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
	import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
	import { FLAG_COMMENT_MAX, commentMissing } from '#lib/backroom/flag-payload/flag-payload.ts';
	import { groupLabel, groupTiles, pinTiles } from '#lib/backroom/flag-tiles/flag-tiles.ts';
	import type { FlagChoicePin } from '#lib/backroom/types/flag-choice-pin.ts';
	import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
	import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
	import type { FlagQuestion } from '#lib/backroom/types/flag-question.ts';
	import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';

	type Props = {
		open?: boolean;
		groups: readonly FlagGroup[];
		question?: FlagQuestion;
		pins?: readonly FlagChoicePin[];
		onflagged: (message: string) => void;
	};

	let { open = $bindable(false), groups, question, pins = [], onflagged }: Props = $props();

	const formId = $props.id();

	let chosen = $state<{ group: number; reason: FlagReason }>();
	let pinId = $state<string | null>(null);
	let comment = $state('');
	let commentError = $state<string>();
	let failure = $state<string>();
	let saving = $state(false);

	let chosenItem = $derived(chosen ? groups[chosen.group]?.item : undefined);
	let choosingPin = $derived(
		chosen?.reason === 'pin' && chosenItem?.kind === 'artwork' && !chosenItem.pin && pins.length > 0
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

	function choose(group: number, value: string | null): void {
		chosen = value ? { group, reason: value as FlagReason } : undefined;
		commentError = undefined;
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
			...(question ? { question } : {})
		});
		saving = false;
		if (result.error !== undefined) {
			failure = result.error;
			return;
		}
		open = false;
		if (result.created) void flagCount.refresh();
		onflagged(result.created ? m.backroom.flagged : m.backroom.changed);
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
				options={groupTiles(group)}
				value={chosen?.group === index ? chosen.reason : null}
			/>
		{/each}
		{#if choosingPin}
			<ChoiceTiles
				columns={1}
				label={m.backroom.pinChoice}
				narrowColumns={1}
				onchange={(value) => (pinId = value)}
				options={pinTiles(pins)}
				value={pinId}
			/>
		{/if}
		<TextArea
			counter
			error={commentError}
			hint={m.backroom.commentHint}
			label={m.backroom.commentLabel}
			maxlength={FLAG_COMMENT_MAX}
			bind:value={comment}
		/>
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={saving || !chosen} form={formId} type="submit" variant="primary">
			{saving ? m.backroom.confirming : m.backroom.confirm}
		</Button>
	{/snippet}
</Dialog>
