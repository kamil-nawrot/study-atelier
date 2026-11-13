<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import TickTile from '#lib/shared/forms/TickTile/TickTile.svelte';
	import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';

	type Props = {
		open?: boolean;
		meaning?: SymbolMeaning;
		meanings: readonly SymbolMeaning[];
		details: readonly SymbolDetail[];
		error?: string;
		busy?: boolean;
		onsave: (pinIds: string[]) => void;
	};

	let {
		open = $bindable(false),
		meaning,
		meanings,
		details,
		error,
		busy = false,
		onsave
	}: Props = $props();

	let ticked = $state<Record<string, boolean>>({});

	$effect.pre(() => {
		if (!open || !meaning) return;
		const id = meaning.id;
		ticked = Object.fromEntries(details.map((detail) => [detail.pinId, detail.meaningId === id]));
	});

	function currentOf(detail: SymbolDetail): string {
		const index = meanings.findIndex((own) => own.id === detail.meaningId);
		return index < 0 ? m.symbols.view.withoutMeaning : `${index + 1} ${meanings[index].text}`;
	}

	function save(): void {
		onsave(details.filter((detail) => ticked[detail.pinId]).map((detail) => detail.pinId));
	}
</script>

<Dialog
	description={details.length > 0 ? m.symbols.meaningDialog.assignHint : undefined}
	title={meaning ? m.symbols.meaningDialog.assignTitle(meaning.text) : ''}
	bind:open
>
	<div class="body">
		{#if error}
			<Alert tone="danger">{error}</Alert>
		{/if}
		{#if details.length === 0}
			<p class="empty">{m.symbols.meaningDialog.noPins}</p>
		{:else}
			<ul class="grid">
				{#each details as detail (detail.pinId)}
					<li>
						<TickTile
							checked={ticked[detail.pinId] ?? false}
							framed={false}
							ontoggle={() => (ticked[detail.pinId] = !ticked[detail.pinId])}
						>
							{#snippet picture()}
								{#if detail.lens}
									<DetailLens lens={detail.lens} />
								{/if}
							{/snippet}
							<cite class="title">{detail.title}</cite>
							<span class="caption">{detail.byline}</span>
							{#if detail.meaningId !== meaning?.id}
								<span class="caption">{currentOf(detail)}</span>
							{/if}
						</TickTile>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>{m.common.cancel}</Button>
		{#if details.length > 0}
			<Button disabled={busy} onclick={save} variant="primary">
				{busy ? m.common.saving : m.common.save}
			</Button>
		{/if}
	{/snippet}
</Dialog>

<style>
	.body {
		display: grid;
		gap: var(--spacing-4);
	}

	.grid {
		--detail-lens: 104px;

		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
		gap: var(--spacing-3);
		list-style: none;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-sm);
		font-style: italic;
		line-height: var(--line-height-sm);
	}

	.title,
	.caption {
		text-align: center;
	}

	.caption {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		opacity: 0.75;
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
