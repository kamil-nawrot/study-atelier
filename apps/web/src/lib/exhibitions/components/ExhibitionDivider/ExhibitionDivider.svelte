<script lang="ts">
	type Props = {
		line: boolean;
	};

	let { line }: Props = $props();
</script>

{#if line}
	<div class="divider">
		<hr />
	</div>
{:else}
	<div class="divider" aria-hidden="true"></div>
{/if}

<style>
	.divider {
		display: grid;
		align-items: center;
		width: 100%;
		min-height: var(--spacing-16);
	}

	hr {
		width: 100%;
		margin: 0;
		border: none;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}
</style>
