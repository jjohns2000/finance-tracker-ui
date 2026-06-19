import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import {
    Box,
    IconButton,
    Typography,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    useTheme as useMuiTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MenuIcon from '@mui/icons-material/Menu';

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 68;

const iconMap = {
    Dashboard: DashboardIcon,
    TrendingUp: TrendingUpIcon,
    TrendingDown: TrendingDownIcon,
    AccountBalanceWallet: AccountBalanceWalletIcon,
    AccountBalance: AccountBalanceIcon,
    Settings: SettingsIcon
};

const Sidebar = ({ navItems = [] }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const { showSnackbar } = useSnackbar();
    const { mode, toggleTheme } = useTheme();
    const { collapsed, toggleCollapsed } = useSidebar();
    const muiTheme = useMuiTheme();
    const isDark = muiTheme.palette.mode === 'dark';
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogoutClick = () => setLogoutDialogOpen(true);
    const handleLogoutCancel = () => setLogoutDialogOpen(false);
    const handleLogoutConfirm = () => {
        setLogoutDialogOpen(false);
        showSnackbar('You have been signed out.', 'info');
        logout();
    };

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

    const sidebarBg   = isDark ? '#1a1a1a' : '#ffffff';
    const activeBg    = '#115293';
    const hoverBg     = isDark ? '#2b2b2b' : '#f5f5f5';
    const pageBg      = isDark ? '#0a0a0a' : '#f0f2f5';

    const NavItem = ({ item, forceExpanded = false }) => {
        const IconComponent = iconMap[item.icon] || DashboardIcon;
        const isActive = location.pathname === item.route;
        const isCollapsed = forceExpanded ? false : collapsed;

        return (
            <Tooltip title={isCollapsed ? item.label : ''} placement="right">
                <Box
                    onClick={() => {
                        navigate(item.route);
                        setMobileOpen(false);
                    }}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: isCollapsed ? 0 : 2,
                        py: 1.2,
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        bgcolor: isActive ? activeBg : 'transparent',
                        transition: 'background 0.15s ease',
                        '&:hover': {
                            bgcolor: isActive ? activeBg : hoverBg
                        }
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: isActive ? '#fff' : 'text.secondary'
                        }}
                    >
                        <IconComponent sx={{ fontSize: 20 }} />
                    </Box>
                    {!isCollapsed && (
                        <Typography
                            variant="body2"
                            fontWeight={isActive ? 600 : 400}
                            noWrap
                            sx={{ color: isActive ? '#fff' : 'text.primary' }}
                        >
                            {item.label}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    };

    const BottomItem = ({ icon, label, onClick, color, forceExpanded = false }) => {
        const isCollapsed = forceExpanded ? false : collapsed;
        return (
            <Tooltip title={isCollapsed ? label : ''} placement="right">
                <Box
                    onClick={onClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: isCollapsed ? 0 : 2,
                        py: 1.2,
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        transition: 'background 0.15s ease',
                        '&:hover': {
                            bgcolor: color
                                ? isDark ? 'rgba(244,67,54,0.1)' : 'rgba(244,67,54,0.07)'
                                : hoverBg
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: color || 'text.secondary' }}>
                        {icon}
                    </Box>
                    {!isCollapsed && (
                        <Typography variant="body2" fontWeight={400} noWrap sx={{ color: color || 'text.secondary' }}>
                            {label}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    };

    const SidebarContent = ({ forceExpanded = false }) => (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Top — app name + collapse */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (!forceExpanded && collapsed) ? 'center' : 'space-between',
                    px: (!forceExpanded && collapsed) ? 1 : 2,
                    py: 2,
                    minHeight: 60,
                    flexShrink: 0
                }}
            >
                {(forceExpanded || !collapsed) && (
                    <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1, textAlign: 'center' }}>
                        FinanceTracker
                    </Typography>
                )}
                {!forceExpanded && (
                    <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
                        <IconButton onClick={toggleCollapsed} size="small">
                            {collapsed
                                ? <ChevronRightIcon fontSize="small" />
                                : <ChevronLeftIcon fontSize="small" />
                            }
                        </IconButton>
                    </Tooltip>
                )}
                {forceExpanded && (
                    <IconButton onClick={() => setMobileOpen(false)} size="small">
                        <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Nav items */}
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
                {navItems.map((item) => (
                    <NavItem key={item.id} item={item} forceExpanded={forceExpanded} />
                ))}
            </Box>

            {/* Bottom — theme + logout */}
            <Box sx={{ pb: 2, flexShrink: 0 }}>
                <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2, mb: 1.5 }} />
                <BottomItem
                    icon={mode === 'light'
                        ? <DarkModeIcon sx={{ fontSize: 20 }} />
                        : <LightModeIcon sx={{ fontSize: 20 }} />
                    }
                    label={mode === 'light' ? 'Dark mode' : 'Light mode'}
                    onClick={toggleTheme}
                    forceExpanded={forceExpanded}
                />
                <BottomItem
                    icon={<LogoutIcon sx={{ fontSize: 20 }} />}
                    label="Sign out"
                    onClick={handleLogoutClick}
                    color="error.main"
                    forceExpanded={forceExpanded}
                />
            </Box>
        </Box>
    );

    return (
        <>
            {/* ─── Mobile hamburger button ──────────────────── */}
            <Box
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    top: 12,
                    left: 12,
                    zIndex: 1300
                }}
            >
                <IconButton
                    onClick={() => setMobileOpen(true)}
                    sx={{
                        bgcolor: activeBg,
                        color: '#fff',
                        borderRadius: 2.5,
                        width: 44,
                        height: 44,
                        boxShadow: 3,
                        '&:hover': { bgcolor: '#0d47a1' }
                    }}
                >
                    <MenuIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* ─── Mobile overlay ───────────────────────────── */}
            {mobileOpen && (
                <Box
                    onClick={() => setMobileOpen(false)}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        position: 'fixed',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        zIndex: 1200
                    }}
                />
            )}

            {/* ─── Mobile drawer ────────────────────────────── */}
            <Box
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 12,
                    bottom: 12,
                    left: mobileOpen ? 12 : '-110vw',
                    zIndex: 1300,
                    transition: 'left 0.25s ease',
                    width: 'calc(100vw - 24px)',
                    bgcolor: sidebarBg,
                    borderRadius: 4,
                    boxShadow: 6,
                    overflow: 'hidden'
                }}
            >
                <SidebarContent forceExpanded={true} />
            </Box>

            {/* ─── Desktop sidebar ──────────────────────────── */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    width: sidebarWidth + 24,
                    flexShrink: 0,
                    transition: 'width 0.2s ease',
                    alignSelf: 'flex-start',
                    p: 1.5
                }}
            >
                <Box
                    sx={{
                        height: '100%',
                        bgcolor: sidebarBg,
                        borderRadius: 4,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <SidebarContent />
                </Box>
            </Box>

            {/* Logout dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={handleLogoutCancel}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Sign out</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to sign out of FinanceTracker?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button
                        onClick={handleLogoutCancel}
                        variant="outlined"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLogoutConfirm}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Sign out
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Sidebar;