import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import SectionHeader from '../pages/SectionHeader';
import { Typography } from '@mui/material';

const BudgetPage = () => {
    return (
        <PageLayout sidebar={<Sidebar />}>
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