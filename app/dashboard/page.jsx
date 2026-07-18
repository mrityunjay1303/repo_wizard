'use client';
import DashboardClientWrapper from 'app/components/Dashboard/DashboardClientWrapper';
import { Suspense } from 'react';



export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardClientWrapper />
    </Suspense>
  );
}