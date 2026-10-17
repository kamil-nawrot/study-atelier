<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { glossaryCategoryName } from '../categories.ts';
	import type { GlossaryCategory, WikipediaArticle } from '../types.ts';

	type Status = 'searching' | 'found' | 'none' | 'failed';

	type Props = {
		open: boolean;
		status: Status;
		articles: WikipediaArticle[];
		currentTitle?: string;
		name: string;
		category: GlossaryCategory;
		onuse: (article: WikipediaArticle) => void;
	};

	let {
		open = $bindable(false),
		status,
		articles,
		currentTitle,
		name,
		category,
		onuse
	}: Props = $props();

	const groupName = $props.id();

	let picked = $state<string>();

	let chosen = $derived(
		articles.find((article) => article.title === (picked ?? currentTitle)) ?? articles[0]
	);

	$effect(() => {
		if (open) picked = undefined;
	});
</script>

<Dialog
	description={m.glossary.articles.description(
		name.trim(),
		glossaryCategoryName(category).toLocaleLowerCase('pl')
	)}
	title={m.glossary.articles.title}
	bind:open
>
	{#if open}
		{#if status === 'searching'}
			<p class="status">{m.glossary.articles.searching}</p>
		{:else if status === 'found'}
			<div class="list" aria-label={m.glossary.articles.listLabel} role="radiogroup">
				{#each articles as article (article.title)}
					<label class="option">
						<input
							name={groupName}
							checked={chosen?.title === article.title}
							onchange={() => (picked = article.title)}
							type="radio"
							value={article.title}
						/>
						<span class="text">
							<span class="title">{article.title}</span>
							<span class="extract">{article.extract}</span>
						</span>
					</label>
				{/each}
			</div>
		{:else}
			<Alert tone={status === 'failed' ? 'danger' : 'warning'}>
				{status === 'failed' ? m.glossary.form.definitionFailed : m.glossary.form.definitionNone}
			</Alert>
		{/if}
	{/if}
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.glossary.articles.cancel}
		</Button>
		<Button
			disabled={status !== 'found' || !chosen}
			onclick={() => chosen && onuse(chosen)}
			variant="primary"
		>
			{m.glossary.articles.use}
		</Button>
	{/snippet}
</Dialog>

<style>
	.status {
		color: var(--color-fg-muted);
	}

	.list {
		display: grid;
		border: var(--border-width-base) solid var(--color-line);
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-3);
		padding: var(--spacing-3) var(--spacing-4);
		cursor: pointer;
	}

	.option + .option {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.option:has(input:checked) {
		background: var(--color-surface);
	}

	input {
		flex: none;
		margin: var(--spacing-1) 0 0;
		accent-color: var(--color-fg);
	}

	.text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.title {
		font-weight: var(--font-weight-medium);
	}

	.extract {
		display: -webkit-box;
		overflow: hidden;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
</style>
