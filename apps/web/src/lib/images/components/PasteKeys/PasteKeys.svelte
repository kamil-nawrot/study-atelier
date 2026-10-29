<script lang="ts">
	import { pasteShortcut } from '#lib/images/clipboard/clipboard.ts';

	const shortcut = pasteShortcut();
</script>

{#each shortcut.keys as key, index (key)}{#if index > 0 && shortcut.keys[0] !== '⌘'}+{/if}<kbd
		>{key}</kbd
	>{/each}.

<style>
	kbd {
		padding: 0 var(--spacing-1);
		border: var(--border-width-base) solid var(--color-fg-muted);
		color: var(--color-fg);
		font: inherit;
	}
</style>
