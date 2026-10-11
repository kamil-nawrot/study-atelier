<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { text } from '../../stories/snippets';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Components/Button',
		component: Button,
		tags: ['autodocs'],
		args: { variant: 'secondary', disabled: false, fullWidth: false, children: text('Edit') },
		argTypes: {
			variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
			children: { control: false }
		}
	});
</script>

<Story name="Primary" args={{ variant: 'primary', children: text('Save') }} />

<Story name="Secondary" />

<Story name="Disabled" args={{ disabled: true }} />

<Story
	name="Full width"
	args={{ variant: 'primary', fullWidth: true, children: text('Sign in') }}
/>

<Story name="Primary with secondary actions">
	{#snippet template()}
		<div style="display: flex; gap: var(--spacing-3)">
			<Button variant="primary">Save</Button>
			<Button>Flashcard</Button>
			<Button>Edit</Button>
		</div>
	{/snippet}
</Story>
