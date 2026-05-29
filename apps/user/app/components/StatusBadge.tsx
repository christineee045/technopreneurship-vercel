import { Badge } from "./ui/badge";
import { Clock, CheckCircle, XCircle, Package, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Returned' | 'Reported' | 'Overdue';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        };
      case 'Approved':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'Rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-3 w-3" />
        };
      case 'Active':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Package className="h-3 w-3" />
        };
      case 'Returned':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'Reported':
        return {
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'Overdue':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={config.color}>
      <div className="flex items-center gap-1">
        {config.icon}
        {status}
      </div>
    </Badge>
  );
}
