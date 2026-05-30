import "../../styles/index.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell, LogOut, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { toast } from "sonner";

interface AdminHeaderProps {
  onLogout?: () => void;
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifyNewRequests, setNotifyNewRequests] = useState(true);
  const [notifyFlaggedListings, setNotifyFlaggedListings] = useState(true);
  const [autoArchiveResolved, setAutoArchiveResolved] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<any>>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const _RAW_VITE_API = (import.meta as any).env.VITE_API_URL || "";
  const VITE_API = (_RAW_VITE_API.startsWith("http://") || _RAW_VITE_API.startsWith("https://"))
    ? _RAW_VITE_API.replace(/\/$/, "")
    : `https://${_RAW_VITE_API.replace(/\/$/, "")}`;
  const API_BASE = VITE_API + "/api"; // public API base
  const ADMIN_TOKEN_KEY = "adminToken";

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const load = async () => {
      setLoadingNotifs(true);
      try {
        const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // normalize timestamps
        setNotifications(
          data.map((n: any) => ({
            id: n._id || n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            referenceId: n.referenceId,
            referenceType: n.referenceType,
            read: n.read,
            createdAt: n.createdAt,
          }))
        );
        setLoadingNotifs(false);
      } catch (err) {
        console.error('Failed to load admin notifications:', err);
        // don't use demo/dummy notifications; leave empty list so UI reflects real DB state
        setNotifications([]);
        setLoadingNotifs(false);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("lendly_user");

    if (onLogout) {
      onLogout();
      return;
    }

    navigate("/");
  };

  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (res.ok) setNotifications(prev => prev.map(p => p.id === id ? { ...p, read: true } : p));
    } catch (err) {
      console.warn('mark read failed', err);
    }
  };

  const deleteNotificationById = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
      if (res.ok) setNotifications(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.warn('delete notif failed', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background to-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Lendly</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 transition-all hover:scale-110"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Notifications</div>
                {notifications.map((notification) => {
                const buildAdminTarget = (n: any) => {
                  switch (n.type) {
                    case 'borrow_request':
                      return n.referenceId ? `/admin/requests?requestId=${n.referenceId}` : '/admin/requests';
                    case 'listing_flagged':
                      return n.referenceId ? `/admin/listings?listingId=${n.referenceId}` : '/admin/listings';
                    case 'listing_submitted':
                      return n.referenceId ? `/admin/listings?listingId=${n.referenceId}` : '/admin/listings';
                    case 'user_verification':
                      return n.referenceId ? `/admin/users?userId=${n.referenceId}` : '/admin/users';
                    case 'reviews':
                      return '/admin/reviews';
                    case 'item_returned':
                      return '/admin/overdue';
                    case 'dispute':
                      return '/admin/disputes';
                    default:
                      return '/admin';
                  }
                };

                const handleClick = (async () => {
                  // Optimistically mark as read locally so UI updates immediately
                  setNotifications(prev => prev.map(p => p.id === notification.id ? { ...p, read: true } : p));

                  // Fire-and-forget PATCH to mark read on server (don't await to avoid blocking navigation)
                  fetch(`${API_BASE}/notifications/${notification.id}/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  }).catch((err) => console.warn('mark read failed', err));

                  // Navigate immediately so it's always clickable
                  navigate(buildAdminTarget(notification));
                });

                return (
                  <div key={notification.id} className={`relative ${!notification.read ? 'bg-orange-50 rounded-md border-l-4 border-orange-400' : ''}`}>
                    <div onClick={handleClick} className="w-full p-3 cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{notification.title}</div>
                          <div className="text-xs text-muted-foreground">{notification.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">{new Date(notification.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-2 top-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e: any) => e.stopPropagation()} aria-label="Notification actions">
                            <span className="text-lg">⋯</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async (e: any) => { e.stopPropagation(); await markNotificationRead(notification.id); }}>Mark as read</DropdownMenuItem>
                          <DropdownMenuItem onClick={async (e: any) => { e.stopPropagation(); await deleteNotificationById(notification.id); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setManageOpen(true)}>Manage notifications</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Manage Notifications Dialog */}
          <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Notifications</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex items-start justify-between gap-3 rounded-md border p-3 relative">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-xs text-muted-foreground">{n.message}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="absolute right-3 top-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => {}} aria-label="Notification actions">
                              <span className="text-lg">⋯</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => await markNotificationRead(n.id)}>Mark as read</DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => await deleteNotificationById(n.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() } });
                    if (res.ok) setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  } catch (err) {
                    console.warn('mark all failed', err);
                  }
                }}>Mark all as read</Button>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex hover:bg-primary/10 transition-all hover:scale-110"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Admin Settings</DialogTitle>
                <DialogDescription>Configure how the admin console behaves.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <Label htmlFor="setting-new-requests" className="text-sm font-semibold">New borrow requests</Label>
                    <p className="text-xs text-muted-foreground">Send alerts for incoming requests.</p>
                  </div>
                  <Switch
                    id="setting-new-requests"
                    checked={notifyNewRequests}
                    onCheckedChange={setNotifyNewRequests}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <Label htmlFor="setting-flagged-listings" className="text-sm font-semibold">Flagged listing alerts</Label>
                    <p className="text-xs text-muted-foreground">Notify when listings need review.</p>
                  </div>
                  <Switch
                    id="setting-flagged-listings"
                    checked={notifyFlaggedListings}
                    onCheckedChange={setNotifyFlaggedListings}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => toast.message("Settings reset to defaults")}
                >
                  Reset
                </Button>
                <DialogClose asChild>
                  <Button
                    onClick={() => toast.success("Settings saved")}
                  >
                    Save changes
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 hover:bg-primary/10 transition-all"
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@platform.com</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
