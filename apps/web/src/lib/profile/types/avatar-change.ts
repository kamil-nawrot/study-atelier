export type AvatarChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; image: Blob };
