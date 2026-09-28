const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

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

export type FinanceSummary = {
	income: number;
	expenses: number;
	balance: number;
	transactionCount: number;
};

export type FinanceAccount = {
	id: string;
	name: string;
	type: string;
	initialBalance: number;
	currency: string;
};

export type FinanceCategory = {
	id: string;
	name: string;
	type: 'INCOME' | 'EXPENSE';
	color: string;
};

export type FinanceTransaction = {
	id: string;
	description: string;
	type: 'INCOME' | 'EXPENSE';
	amount: number;
	currency: string;
	occurredAt: string;
	category: { name: string; color?: string };
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
 * Recupera la sesión autenticada antes de cargar la información financiera personal.
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

const authenticatedRequest = async <T>(path: string, sessionToken: string): Promise<T> => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: { Authorization: `Bearer ${sessionToken}` },
	});
	const body = await response.json();

	if (!response.ok) {
		throw new ApiError(body?.error?.message ?? 'No se pudieron cargar tus finanzas.', response.status);
	}

	return body.data as T;
};

const authenticatedMutation = async <T>(path: string, sessionToken: string, payload: unknown): Promise<T> => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	const body = await response.json();

	if (!response.ok) {
		throw new ApiError(body?.error?.message ?? 'No se pudo guardar la información.', response.status);
	}

	return body.data as T;
};

export const fetchFinanceSummary = (sessionToken: string): Promise<FinanceSummary> =>
	authenticatedRequest<FinanceSummary>('/api/finanzas/dashboard', sessionToken);

export const fetchFinanceAccounts = (sessionToken: string): Promise<FinanceAccount[]> =>
	authenticatedRequest<FinanceAccount[]>('/api/finanzas/accounts', sessionToken);

export const fetchFinanceCategories = (sessionToken: string): Promise<FinanceCategory[]> =>
	authenticatedRequest<FinanceCategory[]>('/api/finanzas/categories', sessionToken);

export const createFinanceCategory = (sessionToken: string, payload: { name: string; type: 'INCOME' | 'EXPENSE'; color: string }): Promise<FinanceCategory> =>
	authenticatedMutation<FinanceCategory>('/api/finanzas/categories', sessionToken, payload);

export const createFinanceAccount = (sessionToken: string, payload: { name: string; type: string; currency: string; initialBalance: number }): Promise<FinanceAccount> =>
	authenticatedMutation<FinanceAccount>('/api/finanzas/accounts', sessionToken, payload);

export const createFinanceTransaction = (sessionToken: string, payload: { accountId: string; categoryId: string; type: 'INCOME' | 'EXPENSE'; amount: number; currency: string; description: string; occurredAt: string }): Promise<FinanceTransaction> =>
	authenticatedMutation<FinanceTransaction>('/api/finanzas/transactions', sessionToken, payload);

export const fetchFinanceTransactions = async (sessionToken: string): Promise<FinanceTransaction[]> => {
	return authenticatedRequest<FinanceTransaction[]>('/api/finanzas/transactions?page=1&pageSize=5', sessionToken);
};

export { API_BASE_URL };
