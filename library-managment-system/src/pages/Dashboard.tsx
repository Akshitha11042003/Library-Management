import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, BookMarked, History } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();

  // Queries for Librarian
  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await api.get('/api/books');
      return res.data.data.books;
    },
    enabled: user?.role === 'LIBRARIAN',
  });

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/api/members');
      return res.data.data.members;
    },
    enabled: user?.role === 'LIBRARIAN',
  });

  // Queries for Member
  const { data: activeBorrows } = useQuery({
    queryKey: ['activeBorrows'],
    queryFn: async () => {
      const res = await api.get('/api/members/me/books');
      return res.data.data.borrows;
    },
    enabled: user?.role === 'MEMBER',
  });

  const { data: borrowHistory } = useQuery({
    queryKey: ['borrowHistory'],
    queryFn: async () => {
      const res = await api.get('/api/borrows/my-history');
      return res.data.data.history;
    },
    enabled: user?.role === 'MEMBER',
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name} 👋</h1>
          <p className="text-slate-500 mt-1">Here is what's happening with your account today.</p>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-sm font-semibold text-slate-700 mr-2">Current Role:</span>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {user?.role === 'LIBRARIAN' ? (
          <>
            <StatCard
              title="Total Catalog"
              value={booksData?.length || 0}
              icon={BookOpen}
              description="Books available in library"
            />
            <StatCard
              title="Total Members"
              value={membersData?.length || 0}
              icon={Users}
              description="Registered users"
            />
            <StatCard
              title="Active Loans"
              value="---" // This would require a new API endpoint to get all active loans system-wide
              icon={BookMarked}
              description="Books currently checked out"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Active Checkouts"
              value={`${activeBorrows?.length || 0} / 5`}
              icon={BookMarked}
              description="Currently borrowed books"
            />
            <StatCard
              title="Borrowing History"
              value={borrowHistory?.length || 0}
              icon={History}
              description="Total books borrowed"
            />
          </>
        )}
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-sm font-medium text-slate-900">No recent activity</h4>
          <p className="text-sm text-slate-500 mt-1">Activities will appear here once actions are taken.</p>
        </div>
      </motion.div>
    </div>
  );
}
