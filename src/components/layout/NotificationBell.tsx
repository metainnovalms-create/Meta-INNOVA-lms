import { useState } from 'react';
import { Bell, CheckCheck, Calendar, CheckCircle, XCircle, Ban, Clock, Users, UserPlus, Archive, ExternalLink, ShoppingCart, Package, FileText, Target, Trophy, Award } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useDbNotifications } from '@/hooks/useDbNotifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  userId: string;
  userRole: string;
  notificationsPath?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'leave_application_submitted':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'leave_application_approved':
    case 'leave_final_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'leave_application_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'leave_application_cancelled':
      return <Ban className="h-4 w-4 text-orange-500" />;
    case 'leave_pending_approval':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'officer_on_leave':
      return <Users className="h-4 w-4 text-purple-500" />;
    case 'substitute_assigned':
      return <UserPlus className="h-4 w-4 text-teal-500" />;
    case 'purchase_request':
      return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    case 'inventory_issue':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'assignment_submission':
      return <FileText className="h-4 w-4 text-indigo-500" />;
    case 'project_update':
      return <Target className="h-4 w-4 text-purple-500" />;
    case 'event_published':
    case 'event_application_submitted':
    case 'event_application_reviewed':
    case 'event_reminder':
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 'certificate_issued':
    case 'grade_received':
      return <Award className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export function NotificationBell({ userId, notificationsPath }: NotificationBellProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, archiveNotification } = useDbNotifications(userId);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notificationId: string, link: string | null) => {
    markAsRead(notificationId);
    setOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const handleArchive = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    archiveNotification(notificationId);
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="h-auto py-1 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-3 py-3 cursor-pointer hover:bg-accent border-b border-border/50 last:border-b-0",
                  !notification.read && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
              >
                <div className="flex gap-3 w-full">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notification.read ? 'font-semibold' : 'font-normal'
                      )}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleArchive(e, notification.id)}
                          title="Mark as complete"
                        >
                          <Archive className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
        
        {notificationsPath && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link to={notificationsPath} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-center text-sm" size="sm">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
