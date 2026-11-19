# 0327. Keep only what the repository cannot hold in project memory

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

The memory that the Claude project shares between its threads had grown to 129 files, about 300 KB. Most of them were notes of design threads, releases and spikes whose outcome is already in ADRs, the changelog and Linear; others repeated the guidelines, and a few rules for working with the owner lived only there. Every thread read an index of 16 KB, parts of it out of date (the next free ADR number, a merge rule that the working agreement had changed). What belongs in project memory, and where does the rest go?

## Decision drivers

- One source for each rule, versioned with the code it governs ([ADR-0250](0250-keep-the-rules-of-working-with-the-owner-in-the-working-agreement.md)).
- A thread reads only what it needs and what is still true.

## Considered options

- **Keep the memory as it is** and prune it now and then.
- **Memory only for what the repository cannot hold**, with every rule in the docs.

## Decision outcome

Chosen option: "Memory only for what the repository cannot hold", because a rule in the docs is reviewed in a pull request and read by every session, while a note in memory goes stale unseen.

- Project memory holds the cloud environment and its limits, how the coordinator briefs threads, the owner's words for kinds of requests and the state of the version in progress. Its index stays under 6 KB, with a few topic files.
- The rules for working with the owner that lived only in memory move to [working-agreement.md](../guidelines/working-agreement.md), [ui-patterns.md](../guidelines/ui-patterns.md), [voice-and-tone.md](../product/voice-and-tone.md), [code-conventions.md](../guidelines/code-conventions.md), [cloud-sessions.md](../guidelines/cloud-sessions.md) and [vision.md](../product/vision.md).
- A design thread keeps its questions and the owner's answers in its Linear issue and its ADR, never in a memory file of its own; the [`study-atelier-session-retro`](../../.claude/skills/study-atelier-session-retro/SKILL.md) skill says so.
- The owner confirmed the standing approval to merge Claude's own pull requests at green CI; Claude asks only when it sees a large risk in a merge.

### Consequences

- Good: a thread starts with a short, current memory, and the rules are in one place.
- Bad: what a design thread learned is found only through its issue and ADR, not in a list of notes.
