export type ExhibitArt = {
	credit: string;
	licence: string;
} & ({ commonsFile: string } | { page: string });
