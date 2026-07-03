import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
