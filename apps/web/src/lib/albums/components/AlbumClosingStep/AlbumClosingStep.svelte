<script lang="ts">
	import { Alert, Button, Checkbox, FormActions, TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { ITEM_PARTS, itemsOfPart, selectableItem } from '#lib/albums/album-items/album-items.ts';
	import type { AlbumItem } from '#lib/albums/types/album-item.ts';

	type Props = {
		items: AlbumItem[];
		selected: ReadonlySet<string>;
		error?: string;
		ontoggle: (item: AlbumItem) => void;
		onskipall: () => void;
		onadd: () => void;
	};

	let { items, selected, error, ontoggle, onskipall, onadd }: Props = $props();

	let selectable = $derived(items.filter(selectableItem));
	let chosen = $derived(items.filter((item) => selected.has(item.key)));
</script>

<div class="step">
	<h2>{m.albums.closing.title}</h2>
	<p class="lead">{m.albums.closing.intro}</p>

	{#if error}
		<Alert title={m.albums.closing.loadError} tone="danger">{error}</Alert>
	{/if}

	{#each ITEM_PARTS as part (part)}
		{@const partItems = itemsOfPart(items, part)}
		{#if partItems.length > 0}
			<section class="part">
				<h3>{m.albums.closing.parts[part]}</h3>
				<ul>
					{#each partItems as item (item.key)}
						<li class="item" class:present={!selectableItem(item)}>
							<Checkbox
								checked={selected.has(item.key)}
								disabled={!selectableItem(item)}
								onchange={() => ontoggle(item)}
							>
								<span class="label">
									<span class="title">{item.title}</span>
									<span class="state">{m.albums.closing.states[item.state]}</span>
								</span>
							</Checkbox>
							{#if item.excerpt}
								<p class="excerpt">{item.excerpt}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}

	<FormActions>
		<span class="caption count">
			{m.albums.selected.before}<strong>{chosen.length}</strong>{m.albums.selected.after(
				selectable.length
			)}
		</span>
		<TextButton onclick={onskipall}>{m.albums.closing.skipAll}</TextButton>
		<Button disabled={chosen.length === 0} onclick={onadd} variant="primary">
			{m.albums.closing.add(chosen.length)}
		</Button>
	</FormActions>
</div>

<style>
	.step {
		display: grid;
		gap: var(--spacing-5);
	}

	.part {
		display: grid;
		gap: var(--spacing-2);
	}

	ul {
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}

	.item {
		display: grid;
		gap: var(--spacing-1);
	}

	.item.present {
		opacity: 0.6;
	}

	.label {
		display: inline-flex;
		gap: var(--spacing-2);
		align-items: baseline;
	}

	.title {
		font-weight: var(--font-weight-medium);
	}

	.state,
	.excerpt,
	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.excerpt {
		padding-inline-start: var(--spacing-6);
	}

	.count {
		align-self: center;
	}

	.count strong {
		color: var(--color-fg);
		font-weight: var(--font-weight-bold);
	}
</style>
