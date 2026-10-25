<script lang="ts">
	type Props = {
		x: number;
		y: number;
		label: string;
	};

	let { x, y, label }: Props = $props();
</script>

<span style:left="{x * 100}%" style:top="{y * 100}%" class="mark" aria-hidden="true">{label}</span>

<style>
	.mark {
		position: absolute;
		display: grid;
		place-items: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		border: var(--border-width-button) solid var(--color-mat-badge-bg);
		border-radius: var(--border-radius-none);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		line-height: 1;
		pointer-events: none;
		translate: -50% -50%;
	}
</style>
