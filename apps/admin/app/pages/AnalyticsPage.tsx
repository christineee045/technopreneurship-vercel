import { useEffect, useState } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { AdminSidebar } from "../components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { fetchCategoryStats, fetchBorrowVolume, type CategoryStat, type BorrowVolume } from "../services/admin-api";
import { toast } from "sonner";

const CHART_COLORS = ["#f97316", "#14b8a6", "#8b5cf6", "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

const monthlyRevenueData = [
  { month: "Jan", revenue: 45600, disputes: 8, returns: 210 },
  { month: "Feb", revenue: 52400, disputes: 6, returns: 225 },
  { month: "Mar", revenue: 48900, disputes: 12, returns: 218 },
  { month: "Apr", revenue: 61200, disputes: 5, returns: 245 },
  { month: "May", revenue: 55800, disputes: 9, returns: 230 },
  { month: "Jun", revenue: 68500, disputes: 4, returns: 260 },
];

const userGrowthData = [
  { month: "Week 1", users: 145, active: 120 },
  { month: "Week 2", users: 168, active: 142 },
  { month: "Week 3", users: 192, active: 165 },
  { month: "Week 4", users: 234, active: 201 },
  { month: "Week 5", users: 267, active: 235 },
  { month: "Week 6", users: 312, active: 278 },
];

let categoryStats: CategoryStat[] = [];
let borrowVolumeData: BorrowVolume[] = [];

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const [categories, volume] = await Promise.all([
          fetchCategoryStats(),
          fetchBorrowVolume(),
        ]);
        categoryStats = categories;
        borrowVolumeData = volume;
      } catch (error) {
        console.error("Failed to load analytics data:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalyticsData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AdminHeader />
      <AdminSidebar />

      <main className="pt-20 pb-8 pl-[var(--admin-sidebar-width)]">
        <div className="container mx-auto px-4 max-w-7xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-orange-400 to-orange-500 bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive platform analytics and insights
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Monthly Revenue", value: "₱348,400", change: "+12.4%", icon: "💰" },
              { label: "Avg Rating", value: "4.7⭐", change: "+0.3", icon: "⭐" },
              { label: "Return Rate", value: "98.2%", change: "+1.1%", icon: "📊" },
              { label: "User Satisfaction", value: "94.8%", change: "+2.1%", icon: "😊" },
            ].map((metric, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold mt-2">{metric.value}</p>
                      <p className="text-xs text-green-600 mt-2">{metric.change}</p>
                    </div>
                    <span className="text-4xl">{metric.icon}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue & Disputes */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle>Monthly Revenue vs Disputes</CardTitle>
                <CardDescription>Revenue trends and dispute volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="month" stroke="#78716c" />
                    <YAxis stroke="#78716c" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fafaf9",
                        border: "1px solid #e7e5e4",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#f97316" name="Revenue (₱)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="disputes" fill="#ef4444" name="Disputes" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Total users vs active users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="month" stroke="#78716c" />
                    <YAxis stroke="#78716c" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fafaf9",
                        border: "1px solid #e7e5e4",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      fill="#14b8a6"
                      stroke="#14b8a6"
                      name="Total Users"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      fill="#8b5cf6"
                      stroke="#8b5cf6"
                      name="Active Users"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle>Listings by Category</CardTitle>
                <CardDescription>Distribution breakdown</CardDescription>
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
                <CardTitle>Return Rate Analysis</CardTitle>
                <CardDescription>Weekly return statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={borrowVolumeData}>
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
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Items Borrowed"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="returned"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      name="Items Returned"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
