<script lang="ts">
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import PasteKeys from '#lib/images/components/PasteKeys/PasteKeys.svelte';
	import type { ImageHint } from '#lib/images/types/image-hint.ts';

	type Props = {
		hints: ImageHint[];
	};

	let { hints }: Props = $props();
</script>

<ul class="hints">
	{#each hints as hint (hint.text)}
		<li class="caption">
			<Icon icon={hint.icon} size="xs" />
			<span>{hint.text}</span>
		</li>
	{/each}
	<li class="caption paste-hint">
		<Icon icon={Clipboard} size="xs" />
		<span>
			{m.artworkForm.pasteHintForm}
			<PasteKeys />
		</span>
	</li>
</ul>

<style>
	.hints {
		display: grid;
		gap: var(--spacing-2);
		margin: 0;
		list-style: none;
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.hints li {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.hints li > :global(svg) {
		flex: none;
	}

	.hints li.paste-hint {
		display: none;
	}

	@media (pointer: fine) {
		.hints li.paste-hint {
			display: flex;
		}
	}
</style>
