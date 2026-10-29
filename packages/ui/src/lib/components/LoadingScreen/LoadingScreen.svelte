<script lang="ts">
	import { uiMessages } from '../../messages/messages';
	import LogoMark from '../LogoMark/LogoMark.svelte';

	type Props = {
		label?: string;
	};

	let { label = uiMessages().loading }: Props = $props();

	const id = $props.id();
	const horizontal = `${id}-horizontal`;
	const vertical = `${id}-vertical`;
	const bristles = [
		{ offset: 0, length: 1, opacity: 0.09 },
		{ offset: 1, length: 1, opacity: 0.13 },
		{ offset: 2, length: 2, opacity: 0.09 },
		{ offset: 4, length: 1, opacity: 0.05 },
		{ offset: 5, length: 2, opacity: 0.13 },
		{ offset: 7, length: 2, opacity: 0.09 }
	].map((bristle) => ({ ...bristle, offset: bristle.offset / 3, length: bristle.length / 3 }));
</script>

<div class="loading-screen" role="status">
	<div class="mark">
		<LogoMark {label} size="xl">
			<defs>
				<pattern id={horizontal} height="3" patternUnits="userSpaceOnUse" width="24">
					{#each bristles as bristle (bristle.offset)}
						<rect
							fill-opacity={bristle.opacity}
							height={bristle.length}
							width="24"
							y={bristle.offset}
						/>
					{/each}
				</pattern>
				<pattern id={vertical} height="20" patternUnits="userSpaceOnUse" width="3">
					{#each bristles as bristle (bristle.offset)}
						<rect
							fill-opacity={bristle.opacity}
							height="20"
							width={bristle.length}
							x={bristle.offset}
						/>
					{/each}
				</pattern>
			</defs>
			<g class="coats">
				<rect class="stroke horizontal" fill="url(#{horizontal})" height="20" width="24" />
				<rect class="stroke vertical" fill="url(#{vertical})" height="20" width="24" />
			</g>
		</LogoMark>
	</div>
</div>

<style>
	.loading-screen {
		position: fixed;
		z-index: 3;
		inset: 0;
		display: grid;
		place-items: center;
		background: var(--color-stage-bg);
		color: var(--color-stage-fg);
	}

	.mark {
		animation: appear 0s var(--duration-loading-delay) both;
	}

	.stroke {
		transform-box: fill-box;
	}

	.horizontal {
		transform-origin: left;
	}

	.vertical {
		transform-origin: top;
	}

	@keyframes appear {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.coats {
			animation: fade 2.6s linear infinite;
		}

		.horizontal {
			animation: horizontal-stroke 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		}

		.vertical {
			animation: vertical-stroke 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		}
	}

	@keyframes fade {
		0%,
		80% {
			opacity: 1;
		}

		90%,
		100% {
			opacity: 0;
		}
	}

	@keyframes horizontal-stroke {
		0%,
		4% {
			transform: scaleX(0);
		}

		30%,
		100% {
			transform: scaleX(1);
		}
	}

	@keyframes vertical-stroke {
		0%,
		40% {
			transform: scaleY(0);
		}

		66%,
		100% {
			transform: scaleY(1);
		}
	}
</style>
