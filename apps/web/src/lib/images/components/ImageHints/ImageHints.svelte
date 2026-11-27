<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import PasteKeys from '#lib/images/components/PasteKeys/PasteKeys.svelte';

	type Props = {
		hints: string[];
	};

	let { hints }: Props = $props();
</script>

<p class="hints caption">
	{#each hints as hint (hint)}
		<span class="hint">{hint}</span>
	{/each}
	<span class="hint paste-hint"><PasteKeys period={false} /> {m.artworkForm.pasteHintForm}</span>
</p>

<style>
	.hints {
		margin: 0;
		text-align: center;
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.hint + .hint::before {
		content: ' · ';
	}

	.paste-hint {
		display: none;
	}

	@media (pointer: fine) {
		.paste-hint {
			display: inline;
		}
	}
</style>
