import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'ec.mycoins.app',
	appName: 'MyCoins',
	webDir: 'dist',
	// Durante el desarrollo con recarga en caliente sobre un dispositivo/emulador real,
	// se apunta el WebView directamente al servidor de Vite en la máquina de desarrollo
	// en vez de servir los archivos empaquetados en `dist/`. Se activa solo pasando
	// `--live-reload` a `ionic cap run`; en build de producción esta sección no aplica.
	server: {
		androidScheme: 'https',
	},
};

export default config;
