import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
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

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

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
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const handleLogoutClick = () => setLogoutDialogOpen(true);
    const handleLogoutCancel = () => setLogoutDialogOpen(false);

    const handleLogoutConfirm = () => {
        setLogoutDialogOpen(false);
        showSnackbar('You have been signed out.', 'info');
        logout();
    };

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

    return (
        <Box
            sx={{
                width: sidebarWidth,
                height: '100vh',
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.2s ease',
                overflow: 'hidden',
                flexShrink: 0
            }}
        >
            {/* Top — logo + collapse button */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    px: collapsed ? 0 : 2,
                    py: 1.5,
                    minHeight: 56,
                    flexShrink: 0
                }}
            >
                {!collapsed && (
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                        FinanceTracker
                    </Typography>
                )}
                <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
                    <IconButton onClick={toggleCollapsed} size="small">
                        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider />

            {/* Nav items — scrollable */}
            <List sx={{ flex: 1, pt: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {navItems.map((item) => {
                    const IconComponent = iconMap[item.icon] || DashboardIcon;
                    const isActive = location.pathname === item.route;

                    return (
                        <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                            <Tooltip title={collapsed ? item.label : ''} placement="right">
                                <ListItemButton
                                    onClick={() => navigate(item.route)}
                                    sx={{
                                        minHeight: 48,
                                        px: 2.5,
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        bgcolor: isActive ? 'primary.main' : 'transparent',
                                        color: isActive ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        mx: 1,
                                        mb: 0.5,
                                        '&:hover': {
                                            bgcolor: isActive ? 'primary.dark' : 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: collapsed ? 0 : 2,
                                            justifyContent: 'center',
                                            color: isActive ? 'white' : 'text.secondary'
                                        }}
                                    >
                                        <IconComponent fontSize="small" />
                                    </ListItemIcon>
                                    {!collapsed && (
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontSize: 14,
                                                fontWeight: isActive ? 600 : 400
                                            }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}
            </List>

            <Divider />

            {/* Bottom — theme toggle + logout */}
            <Box sx={{ p: 1, flexShrink: 0 }}>
                <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'} placement="right">
                    <ListItemButton
                        onClick={toggleTheme}
                        sx={{
                            borderRadius: 2,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            mb: 0.5,
                            px: 2.5,
                            minHeight: 48
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: collapsed ? 0 : 2,
                                justifyContent: 'center',
                                color: 'text.secondary'
                            }}
                        >
                            {mode === 'light'
                                ? <DarkModeIcon fontSize="small" />
                                : <LightModeIcon fontSize="small" />}
                        </ListItemIcon>
                        {!collapsed && (
                            <ListItemText
                                primary={mode === 'light' ? 'Dark mode' : 'Light mode'}
                                primaryTypographyProps={{ fontSize: 14 }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>

                <Tooltip title={collapsed ? 'Sign out' : ''} placement="right">
                    <ListItemButton
                        onClick={handleLogoutClick}
                        sx={{
                            borderRadius: 2,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            px: 2.5,
                            minHeight: 48,
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: collapsed ? 0 : 2,
                                justifyContent: 'center',
                                color: 'error.main'
                            }}
                        >
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        {!collapsed && (
                            <ListItemText
                                primary="Sign out"
                                primaryTypographyProps={{ fontSize: 14 }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
            </Box>

            {/* Logout confirmation dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={handleLogoutCancel}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Sign out
                </DialogTitle>
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

        </Box>
    );
};

export default Sidebar;