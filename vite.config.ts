import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		// Permite que el emulador/dispositivo acceda al servidor de desarrollo cuando se usa
		// `ionic cap run android -l --external` (recarga en caliente sobre el dispositivo).
		host: true,
		port: 5173,
	},
});
