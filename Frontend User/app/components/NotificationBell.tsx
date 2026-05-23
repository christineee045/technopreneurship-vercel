import { Bell, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { updateBorrowRequest } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const buildNotificationTarget = (notification: {
  type: string;
  referenceId?: string;
  referenceType?: string;
}) => {
  switch (notification.type) {
    case 'borrow_request_submitted':
      return '/dashboard?tab=my-requests';
    case 'borrow_request':
      return '/dashboard?tab=incoming';
    case 'request_approved':
    case 'request_rejected':
    case 'item_returned':
      return '/dashboard?tab=my-requests';
    case 'listing_submitted':
    case 'listing_rejected':
      return '/dashboard?tab=my-items';
    case 'listing_approved':
      return notification.referenceId ? `/item/${notification.referenceId}` : '/';
    case 'new_review':
      return '/account?tab=reviews';
    default:
      if (notification.referenceType === 'borrowRequest') {
        return '/dashboard?tab=my-requests';
      }
      if (notification.referenceType === 'item' && notification.referenceId) {
        return `/item/${notification.referenceId}`;
      }
      return '/dashboard';
  }
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  const handleNotificationClick = async (notification: { id: string; type: string; referenceId?: string; referenceType?: string }) => {
    const target = buildNotificationTarget(notification);
    await markAsRead(notification.id);
    navigate(target);
  };

  const handleApproveRequest = async (e: React.MouseEvent, requestId: string, notifId: string) => {
    e.stopPropagation();
    try {
      await updateBorrowRequest(requestId, { status: "Approved" });
      await markAsRead(notifId);
      toast.success("Request approved");
      await fetchNotifications();
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, requestId: string, notifId: string) => {
    e.stopPropagation();
    try {
      await updateBorrowRequest(requestId, { status: "Rejected" });
      await markAsRead(notifId);
      toast.info("Request rejected");
      await fetchNotifications();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2 pr-4">
                {notifications.map((notification, index) => (
                  <div key={notification.id} className="group">
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        !notification.read
                          ? 'bg-primary/10 hover:bg-primary/20'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Quick action buttons for pending borrow requests */}
                    {notification.type === 'borrow_request' && !notification.read && notification.referenceId && (
                      <div className="flex gap-2 mt-2 ml-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 px-3"
                          onClick={(e) => handleApproveRequest(e, notification.referenceId!, notification.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={(e) => handleRejectRequest(e, notification.referenceId!, notification.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
