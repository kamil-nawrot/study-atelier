<script lang="ts">
	import { resolve } from '$app/paths';

	type Props = {
		text: { before: string; link: string; after: string };
	};

	let { text }: Props = $props();
</script>

<p class="hint">
	{text.before}<a href={resolve('/(app)/atelier/albums')}>{text.link}</a>{text.after}
</p>

<style>
	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.hint a {
		color: var(--color-fg);
	}
</style>
