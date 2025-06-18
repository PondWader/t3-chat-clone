import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Chat } from './pages/chat/index.tsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';
import { DBProvider } from './db.js';
import { loadTheme } from './theme.ts';
import Login from './pages/auth/Login.tsx';
import KeySettings from './pages/settings/Keys.tsx';
import AccountSettings from './pages/settings/Account.tsx';
import Sync from './pages/auth/Sync.tsx';
import SyncConfirm from './pages/auth/SyncConfirm.tsx';

export function App() {
	return (
		<DBProvider>
			<LocationProvider>
				<main>
					<Router>
						<Route path="/" component={Chat} />
						<Route path="/chat/:id" component={Chat} />
						<Route path="/login" component={Login} />
						<Route path="/sync" component={Sync} />
						<Route path="/sync/:code" component={SyncConfirm} />
						<Route path="/settings" component={KeySettings} />
						<Route path="/settings/account" component={AccountSettings} />
						<Route default component={NotFound} />
					</Router>
				</main>
			</LocationProvider>
		</DBProvider>
	);
}

loadTheme();
render(<App />, document.getElementById('app')!);
