import React from 'react';

export type Status =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'ASSIGNED'
  | 'SENT'
  | 'FAILED'
  | 'RETRY';

export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig: Record<
    Status,
    { label: string; bgColor: string; textColor: string }
  > = {
    PENDING: {
      label: 'Pending',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    COMPLETED: {
      label: 'Completed',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    CANCELLED: {
      label: 'Cancelled',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    ON_HOLD: {
      label: 'On Hold',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
    },
    ASSIGNED: {
      label: 'Assigned',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    SENT: {
      label: 'Sent',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    FAILED: {
      label: 'Failed',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    RETRY: {
      label: 'Retrying',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
