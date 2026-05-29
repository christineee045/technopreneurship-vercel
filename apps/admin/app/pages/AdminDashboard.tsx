import { useState, useEffect } from "react";
import { Users, Package, Clock, Flag, TrendingUp, Activity } from "lucide-react";
import { AdminHeader } from "../components/AdminHeader";
import { AdminSidebar } from "../components/AdminSidebar";
import { StatCard } from "../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { fetchDashboardData, type DashboardData } from "../services/admin-api";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const CHART_COLORS = ["#f97316", "#14b8a6", "#8b5cf6", "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [adminStats, setAdminStats] = useState<DashboardData["stats"] | null>(null);
  const [categoryStats, setCategoryStats] = useState<DashboardData["categoryStats"]>([]);
  const [borrowVolumeData, setBorrowVolumeData] = useState<DashboardData["borrowVolume"]>([]);
  const [topLenders, setTopLenders] = useState<DashboardData["topLenders"]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
const loadData = async () => {
       try {
         setIsLoading(true);
         const data = await fetchDashboardData();
         setAdminStats(data.stats);
         setCategoryStats(data.categoryStats);
         setBorrowVolumeData(data.borrowVolume);
         setTopLenders(data.topLenders);
      } catch (error) {
        console.error("Failed to load admin data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AdminHeader />
      <AdminSidebar />

      {/* Main Content */}
      <main className="pt-20 pb-8 pl-[var(--admin-sidebar-width)]">
        <div className="container mx-auto px-4 max-w-7xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Header Section */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-muted-foreground mt-2">
                  Real-time platform metrics and insights
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                <Activity className="h-4 w-4 text-green-600 animate-pulse" />
                <span className="text-sm font-semibold text-green-700">System Online</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Users"
              value={adminStats?.totalUsers || 0}
              description={`+${adminStats?.newUsersThisWeek || 0} this week`}
              icon={Users}
              variant="default"
              trend={5}
            />
            <StatCard
              title="Active Listings"
              value={adminStats?.activeListings || 0}
              description={`${adminStats?.featuredListings || 0} featured`}
              icon={Package}
              variant="success"
              trend={8}
            />
            <StatCard
              title="Pending Requests"
              value={adminStats?.pendingRequests || 0}
              description="Awaiting approval"
              icon={Clock}
              variant="warning"
              trend={-2}
            />
            <StatCard
              title="Active Disputes"
              value={adminStats?.disputes || 0}
              description="Requires attention"
              icon={Flag}
              variant="danger"
              trend={0}
            />
          </div>

          {/* Charts Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Listings by Category
                    </CardTitle>
                    <CardDescription>Distribution of active listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${value})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} listings`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Borrow Volume Trend */}
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Borrow Volume Trend
                    </CardTitle>
                    <CardDescription>Weekly borrowing and returns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={borrowVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis dataKey="week" stroke="#78716c" />
                        <YAxis stroke="#78716c" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fafaf9",
                            border: "1px solid #e7e5e4",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="volume" fill="#f97316" name="Borrowed" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="returned" fill="#14b8a6" name="Returned" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Lenders */}
              <Card className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Top Active Lenders
                  </CardTitle>
                  <CardDescription>Most active users on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topLenders.map((lender, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-orange-400/5 border border-primary/10 hover:border-primary/30 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lender.name}`} />
                              <AvatarFallback>{lender.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{lender.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {lender.listings} listings • Trust: {lender.trustScore}⭐
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{lender.earnings}</p>
                          <p className="text-xs text-muted-foreground">Total earnings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle>Platform Growth Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  {adminStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Borrow Volume", value: `₱${(adminStats.totalBorrowVolume * 1000).toLocaleString()}`, icon: "📊" },
                        { label: "This Week Returns", value: adminStats.returnedThisWeek, icon: "✅" },
                      { label: "Platform Fee Revenue", value: "₱45,600", icon: "💰" },
                      { label: "User Retention Rate", value: "94.3%", icon: "📈" },
                    ].map((metric, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-all">
                        <div className="text-2xl mb-2">{metric.icon}</div>
                        <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                        <p className="text-lg font-bold">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
