'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Clock, CircleAlert } from 'lucide-react';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

interface TaskCardProps {
  task: TaskItem;
  onStatusUpdated: (taskId: string, newStatus: TaskStatus) => void;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  TODO: {
    label: 'Todo',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: CircleAlert,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock,
  },
  DONE: {
    label: 'Done',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
};

export default function TaskCard({ task, onStatusUpdated }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    setUpdating(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setCurrentStatus(newStatus);
        onStatusUpdated(task.id, newStatus);
      } else {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error('Status update error', err);
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = statusConfig[currentStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1 pr-2">
        <div className="flex items-center space-x-2.5 mb-1.5 sm:mb-0">
          <StatusIcon className={`w-4 h-4 ${statusInfo.text} shrink-0`} />
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
            {task.title}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Created {new Date(task.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center space-x-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
        >
          {statusInfo.label}
        </span>

        <div className="relative inline-block text-left">
          {updating ? (
            <div className="px-3 py-1.5 flex items-center text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Updating...
            </div>
          ) : (
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              className="text-xs bg-slate-50 border border-slate-300 text-slate-700 font-medium py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="TODO">Mark Todo</option>
              <option value="IN_PROGRESS">Mark In Progress</option>
              <option value="DONE">Mark Done</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
