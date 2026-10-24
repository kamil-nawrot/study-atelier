type ImageSource =
	| {
			kind: 'commons';
			wikidataId: string;
			file: string;
			licence: string | null;
			licenceUrl: string | null;
			attribution: string | null;
			width: number | null;
			height: number | null;
	  }
	| { kind: 'file'; file: File; previewUrl: string; width: number; height: number }
	| {
			kind: 'upload';
			path: string;
			previewUrl?: string;
			width: number | null;
			height: number | null;
	  }
	| { kind: 'url'; url: string; width: number | null; height: number | null };

export type ArtworkImageInput = ImageSource & { id?: string };
