export type ImageCheck = {
	id: string;
	column: 'source_image_file' | 'own_image_path';
	value: string;
	broken: boolean;
};
