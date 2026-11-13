<script lang="ts">
	import { Alert, Button, Checkbox, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';

	type Props = {
		open?: boolean;
		meaning?: SymbolMeaning;
		meanings: readonly SymbolMeaning[];
		details: readonly SymbolDetail[];
		error?: string;
		busy?: boolean;
		onsave: (added: string[], dropped: string[]) => void;
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
		if (!meaning) return;
		const id = meaning.id;
		const added = details
			.filter((detail) => ticked[detail.pinId] && detail.meaningId !== id)
			.map((detail) => detail.pinId);
		const dropped = details
			.filter((detail) => !ticked[detail.pinId] && detail.meaningId === id)
			.map((detail) => detail.pinId);
		onsave(added, dropped);
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
			<ul>
				{#each details as detail (detail.pinId)}
					<li>
						<Checkbox
							checked={ticked[detail.pinId] ?? false}
							onchange={(event) => (ticked[detail.pinId] = event.currentTarget.checked)}
						>
							<span class="detail">
								{#if detail.lens}
									<DetailLens lens={detail.lens} />
								{/if}
								<span class="text">
									<span class="title">{detail.title}</span>
									<span class="caption">{detail.byline}</span>
									{#if detail.meaningId !== meaning?.id}
										<span class="caption">{currentOf(detail)}</span>
									{/if}
								</span>
							</span>
						</Checkbox>
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

	ul {
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}

	.detail {
		--detail-lens: 48px;

		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.text {
		display: grid;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
	}

	.caption,
	.empty {
		color: var(--color-fg-muted);
	}

	.caption {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
