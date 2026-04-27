import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import SectionHeader from '../pages/SectionHeader';
import { Typography } from '@mui/material';

const BudgetPage = () => {
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        const fetchNav = async () => {
            try {
                const items = await getNavItems();
                setNavItems(items);
            } catch (err) {
                console.error('Failed to load nav items', err);
            }
        };
        fetchNav();
    }, []);

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>
            <PageCard>
                <SectionHeader
                    title="Budget"
                    subtitle="Manage your budgets"
                />
                <Typography variant="body2" color="text.secondary">
                    Coming soon
                </Typography>
            </PageCard>
        </PageLayout>
    );
};

export default BudgetPage;