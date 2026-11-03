<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import type { EraCheck } from '#lib/artworks/era-check/era-check.svelte.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		check: EraCheck;
		eraCode: EraCode | null;
		yearFrom: number | null;
		yearTo: number | null;
		approximate: boolean;
	};

	let { check, eraCode, yearFrom, yearTo, approximate }: Props = $props();

	let description = $derived(
		eraCode === null
			? ''
			: m.eraDialog.description(
					formatDate(yearFrom, yearTo, approximate) ?? '',
					yearFrom !== null && yearFrom !== yearTo,
					m.eras[eraCode].name,
					m.eras[eraCode].years
				)
	);
</script>

<Dialog
	{description}
	onclose={() => check.answer(false)}
	size="small"
	title={m.eraDialog.title}
	bind:open={check.open}
>
	{#snippet footer()}
		<Button onclick={() => check.answer(false)}>
			{m.eraDialog.back}
		</Button>
		<Button onclick={() => check.answer(true)} variant="primary">
			{m.eraDialog.confirm}
		</Button>
	{/snippet}
</Dialog>
