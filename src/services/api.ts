const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://10.0.2.2:3000';

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

type MobileLoginResponse = {
	data: {
		sessionToken: string;
		expiresAt: string;
	};
};

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	roles: { id: string; code: string; name: string }[];
	permissions: { id: string; code: string }[];
};

type SessionResponse = {
	data: SessionUser;
};

/**
 * Login nativo: la app manda usuario/contraseña directo a MyCoins, que a su vez
 * habla con Keycloak por nosotros (Resource Owner Password Credentials, cliente
 * público `mycoins-mobile`) y devuelve un token de sesión opaco en el body —
 * nunca en una cookie, porque el WebView empaquetado no comparte cookies con
 * el navegador del sistema.
 *
 * Ver: mycoins-listo/spec/features/012-autenticacion-movil-nativa/spec.md
 */
export const mobileLogin = async (username: string, password: string): Promise<string> => {
	const response = await fetch(`${API_BASE_URL}/api/auth/mobile/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password }),
	});

	const body = await response.json();

	if (!response.ok) {
		throw new ApiError(body?.error?.message ?? 'No se pudo iniciar sesión.', response.status);
	}

	const { data } = body as MobileLoginResponse;
	return data.sessionToken;
};

/**
 * Solicitud de ejemplo hacia un endpoint propio, autenticada con el token de
 * sesión. Esto es lo que el taller pide demostrar: "una solicitud exitosa
 * hacia un endpoint de su propio backend".
 */
export const fetchSession = async (sessionToken: string): Promise<SessionUser> => {
	const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
		headers: { Authorization: `Bearer ${sessionToken}` },
	});

	const body = await response.json();

	if (!response.ok) {
		throw new ApiError(body?.error?.message ?? 'No se pudo obtener la sesión.', response.status);
	}

	return (body as SessionResponse).data;
};

export const logout = async (sessionToken: string): Promise<void> => {
	await fetch(`${API_BASE_URL}/api/auth/logout`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${sessionToken}` },
	});
};

export { API_BASE_URL };
