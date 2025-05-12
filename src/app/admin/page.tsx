
'use client';

import React from 'react';
import AdminDashboardTab from '@/components/admin/AdminDashboardTab';
// The overall admin layout (sidebar, header) is now handled by src/app/admin/layout.tsx
// This page component will render *inside* that layout.
// For the base /admin route, we display the dashboard.

export default function AdminDashboardPage() {
  return <AdminDashboardTab />;
}
