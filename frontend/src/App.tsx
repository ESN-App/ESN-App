import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router';
import './app.scss';
import { authApi, useAuth } from './core/auth';
import type { RouteHandle } from './routes';
import { Host } from './shared/host';

const THEME_COLORS: Record<string, string> = {
  '/': '#e6f7fd',
  '/events': '#f2f9ec',
  '/partners': '#fde6f4',
  '/info': '#fef2e9',
  '/auth': '#f5f5fb',
};

function themeColorFor(path: string): string {
  return (
    Object.entries(THEME_COLORS).find(
      ([route]) => path === route || (route !== '/' && path.startsWith(`${route}/`)),
    )?.[1] ?? '#e6f7fd'
  );
}

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : undefined);

/** Application shell: desktop toolbar, routed content and the floating mobile navigation. */
export function App() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const deepest = matches.at(-1)?.handle as RouteHandle | undefined;
  const hideMobileNavigation = deepest?.hideMobileNavigation === true;

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColorFor(location.pathname));
  }, [location.pathname]);

  const logout = () => {
    authApi.logout();
    navigate('/events');
  };

  return (
    <>
      <Host tag="mat-toolbar" transparent className="toolbar">
        <Link className="brand" to="/">
          <img src="/images/esnstar.png" alt="" />
          <span>ESN Gdańsk</span>
        </Link>

        <nav className="desktop-menu" aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={navClass}>
            Events
          </NavLink>
          <NavLink to="/partners" className={navClass}>
            Partners
          </NavLink>
          <NavLink to="/info" className={navClass}>
            Info
          </NavLink>
        </nav>

        <div className="account">
          {auth.isLoggedIn ? (
            <>
              {auth.isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `mat-mdc-button${isActive ? ' active' : ''}`}
                >
                  Admin panel
                </NavLink>
              )}
              <span className="user-email">{auth.email}</span>
              <button type="button" className="mat-mdc-button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link className="mat-mdc-button" to="/auth">
              Log in
            </Link>
          )}
        </div>
      </Host>

      <main className={`content${hideMobileNavigation ? ' mobile-navigation-hidden' : ''}`}>
        <Outlet />
      </main>

      <nav className={`mobile-menu${hideMobileNavigation ? ' hidden' : ''}`} aria-label="Mobile navigation">
        <NavLink to="/" end className={navClass} aria-label="Home">
          <span className="nav-icon" aria-hidden="true"></span>
        </NavLink>
        <NavLink to="/events" className={navClass} aria-label="Events">
          <span className="nav-icon" aria-hidden="true"></span>
        </NavLink>
        <NavLink to="/partners" className={navClass} aria-label="Partners">
          <span className="nav-icon" aria-hidden="true"></span>
        </NavLink>
        <NavLink to="/info" className={navClass} aria-label="Info">
          <span className="nav-icon" aria-hidden="true"></span>
        </NavLink>
      </nav>
    </>
  );
}
