import { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, Calendar, CheckCircle, XCircle, Ban, Clock, Users, UserPlus,
  CheckCheck, Archive, ArchiveRestore, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDbNotifications } from '@/hooks/useDbNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'leave_application_submitted':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'leave_application_approved':
    case 'leave_final_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'leave_application_rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'leave_application_cancelled':
      return <Ban className="h-5 w-5 text-orange-500" />;
    case 'leave_pending_approval':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'officer_on_leave':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'substitute_assigned':
      return <UserPlus className="h-5 w-5 text-teal-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'leave_application_submitted': 'Leave Submitted',
    'leave_application_approved': 'Leave Approved',
    'leave_final_approved': 'Leave Final Approved',
    'leave_application_rejected': 'Leave Rejected',
    'leave_application_cancelled': 'Leave Cancelled',
    'leave_pending_approval': 'Pending Approval',
    'officer_on_leave': 'Officer On Leave',
    'substitute_assigned': 'Substitute Assigned',
    'assignment_submission': 'Assignment',
    'quiz_completion': 'Quiz',
    'project_update': 'Project',
    'certificate_issued': 'Certificate',
    'grade_received': 'Grade',
  };
  return labels[type] || 'Notification';
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch all notifications including archived
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification,
    archiveAllRead,
    unarchiveNotification 
  } = useDbNotifications(user?.id, { includeArchived: true, limit: 100 });

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read && !n.archived);
      case 'archived':
        return notifications.filter(n => n.archived);
      default: // 'all'
        return notifications.filter(n => !n.archived);
    }
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  const handleNotificationClick = (notificationId: string, link: string | null, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
    if (link) {
      navigate(link);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">View and manage your notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            {activeTab === 'all' && filteredNotifications.some(n => n.read) && (
              <Button variant="outline" size="sm" onClick={() => archiveAllRead()}>
                <Archive className="h-4 w-4 mr-2" />
                Archive all read
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="ml-1">{notifications.filter(n => !n.archived).length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {unreadCount > 0 && <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              Archived
              <Badge variant="secondary" className="ml-1">{archivedCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {activeTab === 'all' && 'All Notifications'}
                  {activeTab === 'unread' && 'Unread Notifications'}
                  {activeTab === 'archived' && 'Archived Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="px-6 py-12 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="px-6 py-12 text-center text-muted-foreground">
                    {activeTab === 'all' && 'No notifications'}
                    {activeTab === 'unread' && 'All caught up! No unread notifications.'}
                    {activeTab === 'archived' && 'No archived notifications'}
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="divide-y">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-6 py-4 hover:bg-accent/50 transition-colors cursor-pointer",
                            !notification.read && !notification.archived && "bg-accent/30"
                          )}
                          onClick={() => handleNotificationClick(notification.id, notification.link, notification.read)}
                        >
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                      "text-sm font-medium",
                                      !notification.read && !notification.archived && "font-semibold"
                                    )}>
                                      {notification.title}
                                    </span>
                                    {!notification.read && !notification.archived && (
                                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {getNotificationTypeLabel(notification.type)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                                    {notification.read_at && (
                                      <span>Read {format(new Date(notification.read_at), 'MMM d, h:mm a')}</span>
                                    )}
                                    {notification.archived_at && (
                                      <span>Archived {format(new Date(notification.archived_at), 'MMM d, h:mm a')}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {notification.link && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(notification.link!);
                                      }}
                                      title="Go to link"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {!notification.archived ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        archiveNotification(notification.id);
                                      }}
                                      title="Mark as complete"
                                    >
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        unarchiveNotification(notification.id);
                                      }}
                                      title="Restore notification"
                                    >
                                      <ArchiveRestore className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
