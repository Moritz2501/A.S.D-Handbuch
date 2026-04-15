import type { Metadata } from 'next';
import ProtectedClient from '@/app/components/ProtectedClient';
import DashboardApp from '../DashboardApp';

export const metadata: Metadata = {
  title: 'ASD Dashboard',
};

export default function InternalDashboardPage() {
  return (
    <ProtectedClient>
      <DashboardApp />
    </ProtectedClient>
  );
}
