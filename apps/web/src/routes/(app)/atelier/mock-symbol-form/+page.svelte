<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { Button, FormActions, IconButton, Tag, TextButton, TextField } from '@study-atelier/ui';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';

	let { data } = $props();
	const v = $derived(page.url.searchParams.get('v') ?? 'a');
	const rows = [
		{ text: 'przemijanie, śmierć', contexts: [] as string[] },
		{ text: 'pokuta', contexts: ['Św. Hieronim', 'barok'] },
		{ text: 'zagrożenie', contexts: [] as string[] }
	];
</script>

<AtelierLayout email={data.session.user.email ?? ''} title="Edytuj symbol">
	{#snippet bar()}
		<a href="/atelier/glossary">← Czaszka</a>
	{/snippet}
	<div class="form">
		<TextField label="Nazwa" value="Czaszka" />

		{#if v === 'a'}
			<section class="block" aria-label="Znaczenia">
				<span class="overline">Znaczenia</span>
				<ol class="rows">
					{#each rows as row, i (row.text)}
						<li>
							<span class="num">{i + 1}</span>
							<div class="main">
								<TextField hideLabel label="Co oznacza?" value={row.text} />
								<div class="ctx">
									{#each row.contexts as c (c)}<Tag onremove={() => {}}>{c}</Tag>{/each}
									<TextButton inline>+ kontekst</TextButton>
								</div>
							</div>
							<div class="acts">
								<IconButton icon={ArrowUp} label="Wyżej" variant="plain" />
								<IconButton icon={ArrowDown} label="Niżej" variant="plain" />
								<IconButton icon={X} label="Usuń" variant="plain" />
							</div>
						</li>
					{/each}
				</ol>
				<TextButton inline><Plus size="14" /> Dodaj znaczenie</TextButton>
			</section>
		{:else if v === 'b'}
			<section class="block" aria-label="Znaczenia">
				<span class="overline">Znaczenia</span>
				<ol class="rows">
					{#each rows as row, i (row.text)}
						<li>
							<span class="num">{i + 1}</span>
							<div class="main">
								<TextField hideLabel label="Co oznacza?" value={row.text} />
								{#if row.contexts.length > 0}
									<div class="ctx">
										{#each row.contexts as c (c)}<Tag onremove={() => {}}>{c}</Tag>{/each}
									</div>
								{/if}
							</div>
							<div class="acts">
								<IconButton icon={Ellipsis} label="Więcej" variant="plain" />
							</div>
						</li>
					{/each}
				</ol>
				<TextButton inline><Plus size="14" /> Dodaj znaczenie</TextButton>
				<p class="hint">Menu „Więcej” przy znaczeniu: Dodaj kontekst, Przesuń wyżej, Przesuń niżej, Usuń.</p>
			</section>
		{:else}
			<section class="block" aria-label="Znaczenia">
				<span class="overline">Znaczenia</span>
				<ol class="rows plain">
					{#each rows as row, i (row.text)}
						<li class="two">
							<span class="num">{i + 1}</span>
							<TextField hideLabel label="Co oznacza?" value={row.text} />
							<TextField hideLabel label="W jakim kontekście?" placeholder="Kontekst (opcjonalnie)" value={row.contexts.join(', ')} />
							<IconButton icon={Ellipsis} label="Więcej" variant="plain" />
						</li>
					{/each}
				</ol>
				<TextButton inline><Plus size="14" /> Dodaj znaczenie</TextButton>
			</section>
		{/if}

		<FormActions>
			<Button>Anuluj</Button>
			<Button variant="primary">Zapisz</Button>
		</FormActions>
	</div>
</AtelierLayout>

<style>
	.form {
		display: grid;
		gap: var(--spacing-6);
		max-width: var(--size-content-default);
	}

	.block {
		display: grid;
		gap: var(--spacing-4);
		justify-items: start;
	}

	.overline {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.rows {
		display: grid;
		gap: var(--spacing-5);
		width: 100%;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: var(--spacing-6) 1fr auto;
		align-items: start;
		gap: var(--spacing-3);
	}

	.num {
		padding-top: var(--spacing-3);
		color: var(--color-fg-muted);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
	}

	.main {
		display: grid;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.ctx {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.acts {
		display: flex;
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	@media (min-width: 768px) {
		li.two {
			grid-template-columns: var(--spacing-6) 1fr 1fr auto;
		}
	}

	@media (max-width: 767.98px) {
		li.two {
			grid-template-columns: var(--spacing-6) 1fr auto;
		}

		li.two :global(.field:nth-of-type(2)) {
			grid-column: 2;
		}
	}
</style>
