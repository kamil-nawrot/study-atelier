<script lang="ts" module>
	import Pencil from '@lucide/svelte/icons/pencil';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { text } from '../../../stories/snippets';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Components/Button',
		component: Button,
		tags: ['autodocs'],
		args: { variant: 'secondary', disabled: false, fullWidth: false, children: text('Edit') },
		argTypes: {
			variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
			children: { control: false }
		}
	});
</script>

<Story name="Primary" args={{ variant: 'primary', children: text('Save') }} />

<Story name="Secondary" />

<Story name="Danger" args={{ variant: 'danger', children: text('Delete') }} />

<Story name="Disabled" args={{ disabled: true }} />

<Story
	name="Full width"
	args={{ variant: 'primary', fullWidth: true, children: text('Sign in') }}
/>

<Story name="Link" args={{ href: '#', children: text('Create account') }} />

<Story name="With icon" args={{ icon: Pencil, children: text('Edytuj') }} />

<Story
	name="Compact"
	args={{ 'aria-label': 'Edytuj', compact: true, icon: Pencil, children: text('Edytuj') }}
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
