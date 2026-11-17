export type Holds = {
	artworks: ReadonlySet<string>;
	kinds: ReadonlyMap<string, ReadonlySet<string>>;
	terms: ReadonlySet<string>;
	symbols: ReadonlySet<string>;
	events: ReadonlySet<string>;
};
