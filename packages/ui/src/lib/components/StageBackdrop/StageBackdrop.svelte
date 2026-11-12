<script lang="ts">
	type Props = {
		src: string;
	};

	let { src }: Props = $props();
</script>

<span class="stage-backdrop" aria-hidden="true">
	<img alt="" {src} />
</span>

<style>
	.stage-backdrop {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.stage-backdrop::after {
		content: '';
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--color-stage-bg) 70%, transparent);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(32px);
		scale: 1.2;
	}
</style>
