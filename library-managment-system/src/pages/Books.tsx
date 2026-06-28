import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, BookOpen, Trash2, Edit2, HandHeart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { Modal } from '../components/ui/Modal';
import { Book } from '../types/frontend';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().regex(/^(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}$|(?=(?:[0-9]{3}[-\s]){3})[0-9-\s]{17}$)(?:[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X])$/, 'Invalid ISBN format'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type BookFormValues = z.infer<typeof bookSchema>;

export default function Books() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const { data: books, isLoading } = useQuery({
    queryKey: ['books', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/api/books?search=${searchTerm}`);
      return res.data.data.books as Book[];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema) as any,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      if (editingBook) {
        return api.put(`/api/books/${editingBook.id}`, data);
      }
      return api.post('/api/books', data);
    },
    onSuccess: () => {
      toast.success(editingBook ? 'Book updated' : 'Book added');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save book');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/books/${id}`);
    },
    onSuccess: () => {
      toast.success('Book deleted');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });

  const borrowMutation = useMutation({
    mutationFn: async (bookId: string) => {
      return api.post(`/api/books/${bookId}/borrow`, { memberId: user?.id });
    },
    onSuccess: () => {
      toast.success('Book checked out successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['activeBorrows'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    }
  });

  const openAddModal = () => {
    setEditingBook(null);
    reset({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    reset({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
  };

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Browse and manage the library collection.</p>
        </div>
        {user?.role === 'LIBRARIAN' && (
          <Button onClick={openAddModal} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Book
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by title, author, or ISBN..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Title & Author</th>
                <th className="px-6 py-4 hidden md:table-cell">ISBN</th>
                <th className="px-6 py-4 hidden sm:table-cell">Category</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading catalog...
                  </td>
                </tr>
              ) : books?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No books found matching your criteria.
                  </td>
                </tr>
              ) : (
                books?.map((book) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={book.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-shrink-0 items-center justify-center border border-slate-200">
                          <BookOpen className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{book.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600 font-mono text-xs">
                      {book.isbn}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold w-fit ${
                          book.availableQuantity > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {book.availableQuantity > 0 ? 'Available' : 'Out of Stock'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 font-medium ml-1">
                          {book.availableQuantity} / {book.quantity} left
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role === 'LIBRARIAN' ? (
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(book)}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            if(confirm('Delete this book?')) deleteMutation.mutate(book.id);
                          }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={book.availableQuantity <= 0 || borrowMutation.isPending}
                          onClick={() => borrowMutation.mutate(book.id)}
                        >
                          <HandHeart className="w-4 h-4 mr-1.5" />
                          Checkout
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBook ? 'Edit Book Details' : 'Add New Book'}
        description={editingBook ? 'Update the information for this catalog entry.' : 'Register a new book into the library catalog.'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Book Title</label>
            <Input {...register('title')} error={!!errors.title} placeholder="e.g. The Great Gatsby" />
            {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Author Name</label>
            <Input {...register('author')} error={!!errors.author} placeholder="e.g. F. Scott Fitzgerald" />
            {errors.author && <p className="text-xs text-red-500 font-medium">{errors.author.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">ISBN</label>
              <Input {...register('isbn')} error={!!errors.isbn} placeholder="e.g. 978-3-16-148410-0" />
              {errors.isbn && <p className="text-xs text-red-500 font-medium">{errors.isbn.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <Input {...register('category')} error={!!errors.category} placeholder="e.g. Fiction" />
              {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Total Quantity</label>
            <Input type="number" {...register('quantity')} error={!!errors.quantity} min={1} />
            {errors.quantity && <p className="text-xs text-red-500 font-medium">{errors.quantity.message}</p>}
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              {editingBook ? 'Save Changes' : 'Add to Catalog'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
