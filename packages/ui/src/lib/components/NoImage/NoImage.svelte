<script lang="ts">
	import { uiMessages } from '../messages';

	type Props = {
		label?: string;
	};

	let { label = uiMessages().noImage }: Props = $props();
</script>

<div class="window" aria-label={label} role="img">
	<div class="frame">
		<svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
			<line vector-effect="non-scaling-stroke" x1="0" x2="100" y1="0" y2="100" />
			<line vector-effect="non-scaling-stroke" x1="100" x2="0" y1="0" y2="100" />
		</svg>
	</div>
</div>

<style>
	.window {
		box-sizing: border-box;
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
	}

	.frame {
		position: absolute;
		inset: var(--spacing-6);
		border: var(--border-width-hairline) solid currentColor;
		opacity: 0.6;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	line {
		stroke: currentColor;
		stroke-width: var(--border-width-hairline);
	}
</style>
