<script lang="ts">
	type Props = {
		src: string;
	};

	let { src }: Props = $props();
</script>

<span class="backdrop" aria-hidden="true" data-backdrop>
	<img alt="" {src} />
</span>

<style>
	.backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.backdrop::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
	}

	.backdrop img {
		display: block;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		object-fit: cover;
		filter: blur(16px);
		scale: 1.2;
	}
</style>
