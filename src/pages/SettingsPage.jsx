import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import SectionHeader from '../pages/SectionHeader';
import { Typography } from '@mui/material';

const SettingsPage = () => {
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        const fetchNav = async () => {
            try {
                const nav = await getNavItems();
                setNavItems(nav);
            } catch (err) {
                console.error('Failed to load nav', err);
            }
        };
        fetchNav();
    }, []);

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>
            <PageCard>
                <SectionHeader
                    title="Settings"
                    subtitle="Manage your preferences"
                />
                <Typography variant="body2" color="text.secondary">
                    More settings coming soon.
                </Typography>
            </PageCard>
        </PageLayout>
    );
};

export default SettingsPage;