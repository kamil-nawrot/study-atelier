<script lang="ts">
	type Props = {
		id: string;
		text: string;
		level?: 2 | 3;
	};

	let { id, text, level = 2 }: Props = $props();
</script>

<svelte:element this={`h${level}`} {id} class="choice-title">{text}</svelte:element>

<style>
	.choice-title {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}
</style>
