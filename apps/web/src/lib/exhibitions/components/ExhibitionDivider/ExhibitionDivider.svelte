<script lang="ts">
	type Props = {
		line: boolean;
		upright?: boolean;
	};

	let { line, upright = false }: Props = $props();
</script>

{#if line}
	<div class="divider" class:upright>
		<hr aria-orientation={upright ? 'vertical' : undefined} />
	</div>
{:else}
	<div class="divider" class:upright aria-hidden="true"></div>
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

	@media (min-width: 768px) {
		.upright {
			align-items: stretch;
			justify-items: center;
			height: 100%;
		}

		.upright hr {
			width: 0;
			height: 100%;
			border-top: none;
			border-left: var(--border-width-hairline) solid var(--color-line);
		}
	}
</style>
