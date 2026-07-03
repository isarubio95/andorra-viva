import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRoute() {
  const { user, role, loading, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?next=/admin" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
