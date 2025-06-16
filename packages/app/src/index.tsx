import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Chat } from './pages/chat/index.tsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';
import { DBProvider } from './db.js';
import { loadTheme } from './theme.ts';
import Login from './pages/auth/Login.tsx';

export function App() {
	return (
		<DBProvider>
			<LocationProvider>
				<main>
					<Router>
						<Route path="/" component={Chat} />
						<Route path="/chat/:id" component={Chat} />
						<Route path="/login" component={Login} />
						<Route default component={NotFound} />
					</Router>
				</main>
			</LocationProvider>
		</DBProvider>
	);
}

loadTheme();
render(<App />, document.getElementById('app')!);
