<script lang="ts">
	import { Button, Dialog, Select } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { eraName } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		busy: boolean;
		moveOpen: boolean;
		moveTo: string;
		moveError?: string;
		moveText: string;
		remaining: EraCode[];
		mergeOpen: boolean;
		mergeText: string;
		mergeTitle: string;
		onmove: () => void;
		onmerge: () => void;
	};

	let {
		busy,
		moveOpen = $bindable(),
		moveTo = $bindable(),
		moveError,
		moveText,
		remaining,
		mergeOpen = $bindable(),
		mergeText,
		mergeTitle,
		onmove,
		onmerge
	}: Props = $props();
</script>

<Dialog
	description={moveText}
	size="small"
	title={m.cardIndex.moveConfirm.title}
	bind:open={moveOpen}
>
	{#if remaining.length > 1}
		<Select
			error={moveError}
			label={m.cardIndex.moveConfirm.pick}
			options={remaining.map((code) => ({ value: code, label: eraName(code) }))}
			placeholder={m.valueForm.chooseEra}
			required
			bind:value={moveTo}
		/>
	{/if}
	{#snippet footer()}
		<Button onclick={() => (moveOpen = false)}>
			{m.common.back}
		</Button>
		<Button disabled={busy} onclick={onmove} variant="primary">
			{m.cardIndex.moveConfirm.confirm}
		</Button>
	{/snippet}
</Dialog>

<Dialog description={mergeText} size="small" title={mergeTitle} bind:open={mergeOpen}>
	{#snippet footer()}
		<Button onclick={() => (mergeOpen = false)}>
			{m.common.back}
		</Button>
		<Button disabled={busy} onclick={onmerge} variant="primary">
			{busy ? m.cardIndex.mergeConfirm.merging : m.common.merge}
		</Button>
	{/snippet}
</Dialog>
