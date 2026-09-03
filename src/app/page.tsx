'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TaskForm from '@/components/TaskForm';
import TaskBoard from '@/components/TaskBoard';
import { TaskItem, TaskStatus } from '@/components/TaskCard';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Check auth user status
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
    } catch (err) {
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const handleStatusUpdated = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar userEmail={user.email} onLogoutSuccess={() => router.push('/login')} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Task Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your daily tasks and update their status seamlessly.
          </p>
        </div>

        <TaskForm onTaskCreated={fetchTasks} />

        <TaskBoard
          tasks={tasks}
          loading={tasksLoading}
          onStatusUpdated={handleStatusUpdated}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Task Board Application • Built with Next.js, Prisma & Tailwind CSS
      </footer>
    </div>
  );
}
