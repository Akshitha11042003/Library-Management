import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookMarked, Calendar, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { Button } from '../components/ui';
import { BorrowRecord } from '../types/frontend';

export default function Borrows() {
  const queryClient = useQueryClient();

  const { data: activeBorrows, isLoading } = useQuery({
    queryKey: ['activeBorrows'],
    queryFn: async () => {
      const res = await api.get('/api/members/me/books');
      return res.data.data.borrows as BorrowRecord[];
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (bookId: string) => {
      return api.post(`/api/books/${bookId}/return`);
    },
    onSuccess: () => {
      toast.success('Book returned successfully');
      queryClient.invalidateQueries({ queryKey: ['activeBorrows'] });
      queryClient.invalidateQueries({ queryKey: ['borrowHistory'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Borrowed Books</h1>
        <p className="text-sm text-slate-500 mt-1">Track your active library checkouts and returns.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-500">Loading your checkouts...</span>
          </div>
        ) : activeBorrows?.length === 0 ? (
          <div className="text-center py-12">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No active checkouts</h3>
            <p className="text-sm text-slate-500 mt-1">You haven't borrowed any books right now.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {activeBorrows?.map((record, idx) => {
              const borrowDate = new Date(record.borrowDate);
              const dueDate = new Date(record.dueDate);
              const isOverdue = new Date() > dueDate;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={record.id} 
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{record.book.title}</h3>
                          <p className="text-sm text-slate-500">{record.book.author}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex items-center">
                          <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <span>Borrowed: <span className="font-medium text-slate-900">{borrowDate.toLocaleDateString()}</span></span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <span>Due: <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>{dueDate.toLocaleDateString()}</span></span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          onClick={() => returnMutation.mutate(record.bookId)}
                          disabled={returnMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Return Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
