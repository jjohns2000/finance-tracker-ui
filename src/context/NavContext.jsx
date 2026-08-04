import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getNavItems } from '../api/navApi';

const NavContext = createContext(null);

export const NavProvider = ({ children }) => {
    const { user } = useAuth();
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        getNavItems().then(items => { if (!cancelled) setNavItems(items); }).catch(() => {});
        return () => {
            cancelled = true;
            setNavItems([]);
        };
    }, [user]);

    return (
        <NavContext.Provider value={{ navItems }}>
            {children}
        </NavContext.Provider>
    );
};

export const useNav = () => useContext(NavContext);
