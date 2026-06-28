import React from 'react';
import { Bell, Lock, Globe, Moon, Shield } from 'lucide-react';
import { Button } from '../components/ui';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Settings() {
  const handleSave = () => {
    toast.success('Settings updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your application preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm transition-colors">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
            <Globe className="w-4 h-4" />
            <span>Language & Region</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
            <Moon className="w-4 h-4" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Settings Content */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-3 space-y-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Email Notifications</h3>
              <p className="text-sm text-slate-500 mt-1">Choose what updates you want to receive via email.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Due Date Reminders</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Receive an email 2 days before a book is due.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">New Arrivals</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Weekly digest of newly added books.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">System Updates</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Important maintenance and system announcements.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button onClick={handleSave}>Save Preferences</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
