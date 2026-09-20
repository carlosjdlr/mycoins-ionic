import { useEffect, useState } from 'react';
import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonButtons,
	IonSpinner,
	IonText,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonInput,
	IonSelect,
	IonSelectOption,
} from '@ionic/react';
import { createFinanceAccount, createFinanceCategory, createFinanceTransaction, fetchFinanceAccounts, fetchFinanceCategories, fetchFinanceSummary, fetchFinanceTransactions, logout as apiLogout, type FinanceAccount, type FinanceCategory, type FinanceSummary, type FinanceTransaction, ApiError } from '../services/api';
import { checkLocationPermission, checkNotificationPermission, getCurrentLocation, requestLocationPermission, requestNotificationPermission, scheduleReminder, type PermissionState } from '../services/native';
import { clearSessionToken, getSessionToken, saveLastKnownLocation, savePermissionStatus } from '../services/storage';

type HomePageProps = {
	onLoggedOut: () => void;
};

const HomePage = ({ onLoggedOut }: HomePageProps): JSX.Element => {
	const [summary, setSummary] = useState<FinanceSummary | null>(null);
	const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
	const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
	const [categories, setCategories] = useState<FinanceCategory[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [locationPermission, setLocationPermission] = useState<PermissionState>('unknown');
	const [notificationPermission, setNotificationPermission] = useState<PermissionState>('unknown');
	const [nativeMessage, setNativeMessage] = useState('');
	const [showAccountForm, setShowAccountForm] = useState(false);
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [accountName, setAccountName] = useState('');
	const [accountType, setAccountType] = useState('CASH');
	const [initialBalance, setInitialBalance] = useState('0');
	const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
	const [transactionAccountId, setTransactionAccountId] = useState('');
	const [transactionCategoryId, setTransactionCategoryId] = useState('');
	const [transactionAmount, setTransactionAmount] = useState('');
	const [transactionDescription, setTransactionDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

	useEffect(() => {
		const load = async (): Promise<void> => {
			const token = await getSessionToken();
			if (!token) {
				onLoggedOut();
				return;
			}

			try {
				const [locationStatus, notificationStatus] = await Promise.all([checkLocationPermission(), checkNotificationPermission()]);
				setLocationPermission(locationStatus);
				setNotificationPermission(notificationStatus);
				const [financeSummary, financeAccounts, financeCategories, financeTransactions] = await Promise.all([
					fetchFinanceSummary(token),
					fetchFinanceAccounts(token),
					fetchFinanceCategories(token),
					fetchFinanceTransactions(token),
				]);
				setSummary(financeSummary);
				setAccounts(financeAccounts);
				setCategories(financeCategories);
				setTransactions(financeTransactions);
				setTransactionAccountId(financeAccounts[0]?.id ?? '');
				setTransactionCategoryId(financeCategories.find((category) => category.type === 'EXPENSE')?.id ?? '');
			} catch (err) {
				setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu resumen financiero.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [onLoggedOut]);

	const handleLogout = async (): Promise<void> => {
		const token = await getSessionToken();
		if (token) {
			await apiLogout(token);
		}
		await clearSessionToken();
		onLoggedOut();
	};

	const handleCreateAccount = async (): Promise<void> => {
		if (!accountName.trim()) {
			setError('Escribe un nombre para la cuenta.');
			return;
		}
		const token = await getSessionToken();
		if (!token) return onLoggedOut();
		setSaving(true);
		try {
			const account = await createFinanceAccount(token, { name: accountName.trim(), type: accountType, currency: 'USD', initialBalance: Number(initialBalance) || 0 });
			setAccounts((current) => [...current, account]);
			setAccountName('');
			setInitialBalance('0');
			setShowAccountForm(false);
			setError(null);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.');
		} finally {
			setSaving(false);
		}
	};

	const handleCreateTransaction = async (): Promise<void> => {
		const amount = Number(transactionAmount);
		if (!transactionAccountId || !transactionCategoryId || !amount || !transactionDescription.trim()) {
			setError('Completa cuenta, categoría, monto y descripción.');
			return;
		}
		const token = await getSessionToken();
		if (!token) return onLoggedOut();
		setSaving(true);
		try {
			const transaction = await createFinanceTransaction(token, { accountId: transactionAccountId, categoryId: transactionCategoryId, type: transactionType, amount, currency: 'USD', description: transactionDescription.trim(), occurredAt: new Date().toISOString() });
			const category = categories.find((item) => item.id === transactionCategoryId);
			const visibleTransaction: FinanceTransaction = { ...transaction, category: category ?? { name: 'Sin categoría' } };
			setTransactions((current) => [visibleTransaction, ...current].slice(0, 5));
			setSummary((current) => current ? { ...current, income: current.income + (transactionType === 'INCOME' ? amount : 0), expenses: current.expenses + (transactionType === 'EXPENSE' ? amount : 0), balance: current.balance + (transactionType === 'INCOME' ? amount : -amount), transactionCount: current.transactionCount + 1 } : current);
			setTransactionAmount('');
			setTransactionDescription('');
			setShowTransactionForm(false);
			setError(null);
			if (notificationPermission === 'granted') {
				await scheduleReminder('MyCoins', `Revisa tu nuevo ${transactionType === 'INCOME' ? 'ingreso' : 'gasto'}: ${transactionDescription.trim()}.`, new Date(Date.now() + 30000));
				setNativeMessage('Movimiento guardado y recordatorio programado para dentro de 30 segundos.');
			}
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'No se pudo guardar el movimiento.');
		} finally {
			setSaving(false);
		}
	};

	const handleCreateDefaultCategories = async (): Promise<void> => {
		const token = await getSessionToken();
		if (!token) return onLoggedOut();
		setSaving(true);
		try {
			const defaults = await Promise.all([
				createFinanceCategory(token, { name: 'Alimentación', type: 'EXPENSE', color: '#c95f43' }),
				createFinanceCategory(token, { name: 'Transporte', type: 'EXPENSE', color: '#d97706' }),
				createFinanceCategory(token, { name: 'Salario', type: 'INCOME', color: '#0f766e' }),
			]);
			setCategories(defaults);
			setTransactionCategoryId(defaults.find((category) => category.type === 'EXPENSE')?.id ?? '');
			setError(null);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'No se pudieron crear las categorías iniciales.');
		} finally {
			setSaving(false);
		}
	};

	const handleLocation = async (): Promise<void> => {
		setNativeMessage('Solicitando ubicación...');
		const permission = await requestLocationPermission();
		await savePermissionStatus('location', permission);
		setLocationPermission(permission);
		if (permission !== 'granted') {
			setNativeMessage('La ubicación no fue autorizada.');
			return;
		}

		const current = await getCurrentLocation();
		if (!current) {
			setNativeMessage('No se pudo obtener la ubicación actual.');
			return;
		}

		await saveLastKnownLocation({
			latitude: current.coords.latitude,
			longitude: current.coords.longitude,
			accuracy: current.coords.accuracy,
			capturedAt: new Date().toISOString(),
		});
		setNativeMessage(`Ubicación capturada: ${current.coords.latitude.toFixed(4)}, ${current.coords.longitude.toFixed(4)}`);
	};

	const handleNotification = async (): Promise<void> => {
		setNativeMessage('Solicitando notificaciones...');
		const permission = await requestNotificationPermission();
		await savePermissionStatus('notifications', permission);
		setNotificationPermission(permission);
		if (permission !== 'granted') {
			setNativeMessage('Las notificaciones no fueron autorizadas.');
			return;
		}

		try {
			await scheduleReminder('MyCoins', 'Recuerda revisar tus gastos del día.', new Date(Date.now() + 10000));
			setNativeMessage('Recordatorio financiero programado para dentro de 10 segundos.');
		} catch (nativeError) {
			setNativeMessage(nativeError instanceof Error ? nativeError.message : 'No se pudo programar el recordatorio.');
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>MyCoins</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleLogout}>Cerrar sesión</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" style={{ '--background': '#f4f7f5' }}>
				<div style={{ margin: '0 auto', maxWidth: '500px', padding: '0 0.8rem 2rem' }}>
				<header style={{ margin: '0.5rem 0 1.25rem' }}>
					<p style={{ color: '#0f766e', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', margin: 0, textTransform: 'uppercase' }}>Resumen personal</p>
					<h1 style={{ fontSize: '2rem', margin: '0.35rem 0 0.25rem' }}>Tu dinero, más claro.</h1>
					<p style={{ color: '#65736e', margin: 0 }}>Una vista rápida de cómo se mueve tu dinero.</p>
				</header>

				{loading && <IonSpinner name="dots" />}

				{error && (
					<IonText color="danger">
						<p>{error}</p>
					</IonText>
				)}

				{summary && (
					<>
						<IonCard style={{ background: '#18332f', borderRadius: '16px', color: '#fff', margin: '0 0 1rem' }}>
							<IonCardContent>
								<p style={{ margin: 0, opacity: 0.75 }}>Balance disponible</p>
								<strong style={{ display: 'block', fontSize: '2.1rem', margin: '0.45rem 0 1rem' }}>{money.format(summary.balance)}</strong>
								<p style={{ margin: 0, opacity: 0.8 }}>{summary.transactionCount} movimientos registrados</p>
							</IonCardContent>
						</IonCard>

						<div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
							<IonCard style={{ margin: 0 }}><IonCardContent><small style={{ color: '#65736e' }}>Ingresos</small><strong style={{ color: '#0f766e', display: 'block', fontSize: '1.2rem', marginTop: '0.4rem' }}>{money.format(summary.income)}</strong></IonCardContent></IonCard>
							<IonCard style={{ margin: 0 }}><IonCardContent><small style={{ color: '#65736e' }}>Gastos</small><strong style={{ color: '#c95f43', display: 'block', fontSize: '1.2rem', marginTop: '0.4rem' }}>{money.format(summary.expenses)}</strong></IonCardContent></IonCard>
						</div>

						<div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: '1fr 1fr', margin: '1rem 0' }}>
							<IonButton onClick={() => setShowTransactionForm((current) => !current)}>+ Movimiento</IonButton>
							<IonButton fill="outline" onClick={() => setShowAccountForm((current) => !current)}>+ Cuenta</IonButton>
						</div>

						{showTransactionForm && (
							<IonCard style={{ margin: '1rem 0' }}>
								<IonCardHeader><IonCardTitle>Registrar movimiento</IonCardTitle></IonCardHeader>
								<IonCardContent>
									{categories.length === 0 && <div style={{ background: '#fff7ed', borderRadius: '10px', color: '#9a5b13', marginBottom: '1rem', padding: '0.8rem' }}>Aún no tienes categorías. Crea unas básicas para registrar gastos e ingresos.<IonButton fill="clear" onClick={handleCreateDefaultCategories} disabled={saving}>Crear categorías</IonButton></div>}
									<IonSelect label="Tipo" labelPlacement="stacked" value={transactionType} onIonChange={(event) => { const nextType = event.detail.value as 'INCOME' | 'EXPENSE'; setTransactionType(nextType); setTransactionCategoryId(categories.find((category) => category.type === nextType)?.id ?? ''); }}><IonSelectOption value="EXPENSE">Gasto</IonSelectOption><IonSelectOption value="INCOME">Ingreso</IonSelectOption></IonSelect>
									<IonSelect label="Cuenta" labelPlacement="stacked" value={transactionAccountId} onIonChange={(event) => setTransactionAccountId(event.detail.value)}><IonSelectOption value="">Selecciona una cuenta</IonSelectOption>{accounts.map((account) => <IonSelectOption key={account.id} value={account.id}>{account.name}</IonSelectOption>)}</IonSelect>
									<IonSelect label="Categoría" labelPlacement="stacked" value={transactionCategoryId} onIonChange={(event) => setTransactionCategoryId(event.detail.value)}><IonSelectOption value="">Selecciona una categoría</IonSelectOption>{categories.filter((category) => category.type === transactionType).map((category) => <IonSelectOption key={category.id} value={category.id}>{category.name}</IonSelectOption>)}</IonSelect>
									<IonInput label="Monto" labelPlacement="stacked" type="number" value={transactionAmount} onIonInput={(event) => setTransactionAmount(event.detail.value ?? '')} />
									<IonInput label="Descripción" labelPlacement="stacked" value={transactionDescription} onIonInput={(event) => setTransactionDescription(event.detail.value ?? '')} />
									<IonButton expand="block" onClick={handleCreateTransaction} disabled={saving}>{saving ? 'Guardando...' : 'Guardar movimiento'}</IonButton>
								</IonCardContent>
							</IonCard>
						)}

						{showAccountForm && (
							<IonCard style={{ margin: '1rem 0' }}>
								<IonCardHeader><IonCardTitle>Crear cuenta</IonCardTitle></IonCardHeader>
								<IonCardContent>
									<IonInput label="Nombre" labelPlacement="stacked" value={accountName} onIonInput={(event) => setAccountName(event.detail.value ?? '')} />
									<IonSelect label="Tipo" labelPlacement="stacked" value={accountType} onIonChange={(event) => setAccountType(event.detail.value)}><IonSelectOption value="CASH">Efectivo</IonSelectOption><IonSelectOption value="BANK">Banco</IonSelectOption><IonSelectOption value="CARD">Tarjeta</IonSelectOption><IonSelectOption value="SAVINGS">Ahorros</IonSelectOption><IonSelectOption value="OTHER">Otra</IonSelectOption></IonSelect>
									<IonInput label="Saldo inicial" labelPlacement="stacked" type="number" value={initialBalance} onIonInput={(event) => setInitialBalance(event.detail.value ?? '0')} />
									<IonButton expand="block" onClick={handleCreateAccount} disabled={saving}>{saving ? 'Guardando...' : 'Crear cuenta'}</IonButton>
								</IonCardContent>
							</IonCard>
						)}

						<IonCard style={{ margin: '1rem 0' }}>
							<IonCardHeader><IonCardTitle>Movimientos recientes</IonCardTitle></IonCardHeader>
							<IonCardContent>
								{transactions.length === 0 ? <p style={{ color: '#65736e' }}>Aún no hay movimientos registrados.</p> : transactions.map((transaction) => (
									<div key={transaction.id} style={{ alignItems: 'center', borderTop: '1px solid #e4ebe7', display: 'flex', gap: '0.75rem', justifyContent: 'space-between', padding: '0.85rem 0' }}>
										<div><strong>{transaction.description}</strong><small style={{ color: '#65736e', display: 'block', marginTop: '0.2rem' }}>{transaction.category.name} · {new Date(transaction.occurredAt).toLocaleDateString('es-CO')}</small></div>
										<strong style={{ color: transaction.type === 'INCOME' ? '#0f766e' : '#c95f43', whiteSpace: 'nowrap' }}>{transaction.type === 'INCOME' ? '+' : '-'} {money.format(transaction.amount)}</strong>
									</div>
								))}
							</IonCardContent>
						</IonCard>

						<IonCard style={{ margin: '1rem 0' }}>
							<IonCardHeader><IonCardTitle>Tus cuentas</IonCardTitle></IonCardHeader>
							<IonCardContent>
								{accounts.length === 0 ? <p style={{ color: '#65736e' }}>Añade tu primera cuenta para verla aquí.</p> : accounts.map((account) => <div key={account.id} style={{ borderTop: '1px solid #e4ebe7', padding: '0.85rem 0' }}><strong>{account.name}</strong><span style={{ float: 'right' }}>{money.format(account.initialBalance)}</span><small style={{ color: '#65736e', display: 'block', marginTop: '0.2rem' }}>{account.type} · {account.currency}</small></div>)}
							</IonCardContent>
						</IonCard>

						<IonCard style={{ margin: '1rem 0' }}>
							<IonCardHeader><IonCardTitle>Funciones del dispositivo</IonCardTitle></IonCardHeader>
							<IonCardContent>
								<p style={{ color: '#65736e', marginTop: 0 }}>Usa funciones nativas para complementar tu control financiero.</p>
								<div style={{ display: 'grid', gap: '0.7rem' }}>
									<IonButton fill="outline" onClick={handleLocation}>Usar ubicación · {locationPermission}</IonButton>
									<IonButton fill="outline" onClick={handleNotification}>Recordatorio financiero · {notificationPermission}</IonButton>
								</div>
								{nativeMessage && <p style={{ color: '#0f766e', fontSize: '0.9rem', marginBottom: 0 }}>{nativeMessage}</p>}
							</IonCardContent>
						</IonCard>
					</>
				)}
				</div>
			</IonContent>
		</IonPage>
	);
};

export default HomePage;
