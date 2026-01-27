
import React, { createContext, useContext, useState, useEffect } from 'react';

// --- MINIMAL ROUTER IMPLEMENTATION ---
// Replaces react-router-dom which is missing in the environment

const RouterContext = createContext<{ path: string; navigate: (path: string) => void; } | null>(null);

export const BrowserRouter: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  };

  return React.createElement(RouterContext.Provider, { value: { path, navigate } }, children);
};

export const useLocation = () => {
  const ctx = useContext(RouterContext);
  return { 
      pathname: ctx?.path || window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
  };
};

export const useNavigate = () => {
  const ctx = useContext(RouterContext);
  return ctx?.navigate || ((to: string) => {
      window.history.pushState({}, '', to);
      window.location.href = to; // Fallback if context missing
  });
};

export const Link: React.FC<any> = ({ to, children, className, onClick, ...props }) => {
  const navigate = useNavigate();
  return React.createElement('a', {
      href: to,
      className: className,
      onClick: (e: any) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to);
      },
      ...props
  }, children);
};

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to }) => {
    const navigate = useNavigate();
    useEffect(() => { navigate(to); }, []);
    return null;
};

export const Routes: React.FC<{ children: React.ReactNode; location?: any }> = ({ children, location }) => {
    const loc = useLocation();
    const pathname = location ? location.pathname : loc.pathname;
    
    let match = null;
    const routes = React.Children.toArray(children);
    
    for (const child of routes) {
        if (!React.isValidElement(child)) continue;
        const p = (child.props as any).path;
        
        if (p === '*') {
            if (!match) match = child;
        } else if (p === pathname) {
            match = child;
            break; 
        }
    }
    return React.createElement(React.Fragment, null, match);
};

export const Route: React.FC<{ path: string; element: React.ReactNode }> = ({ element }) => {
    return React.createElement(React.Fragment, null, element);
};
