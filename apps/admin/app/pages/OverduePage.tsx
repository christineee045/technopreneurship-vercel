import { useState, useEffect } from "react";
import { AlertCircle, Mail, Phone, Clock } from "lucide-react";
import { AdminHeader } from "../components/AdminHeader";
import { AdminSidebar } from "../components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { fetchOverdueItems, type OverdueItem } from "../services/admin-api";
import { toast } from "sonner";

export default function OverduePage() {
  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("daysOverdue");

  useEffect(() => {
    const loadOverdueItems = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOverdueItems();
        setOverdueItems(data);
      } catch (error) {
        console.error("Failed to load overdue items:", error);
        toast.error("Failed to load overdue items");
      } finally {
        setIsLoading(false);
      }
    };
    loadOverdueItems();
  }, []);

  const sortedItems = [...overdueItems].sort((a, b) => {
    if (sortBy === "daysOverdue") {
      return b.daysOverdue - a.daysOverdue;
    }
    return b.deposit - a.deposit;
  });

  const handleSendReminder = (userId: string, borrowerName: string) => {
    toast.success(`Reminder sent to ${borrowerName}`);
  };

  const handleContactBorrower = (userId: string, borrowerName: string) => {
    toast.info(`Opening contact options for ${borrowerName}`);
  };

  const handleMarkReturned = (itemId: string, itemName: string) => {
    setOverdueItems(overdueItems.filter((item) => item.id !== itemId));
    toast.success(`"${itemName}" marked as returned`);
  };

  const getFlagColorBg = (flagColor: string) => {
    switch (flagColor) {
      case "red":
        return "bg-red-100 border-red-200";
      case "orange":
        return "bg-orange-100 border-orange-200";
      case "yellow":
        return "bg-yellow-100 border-yellow-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const getFlagColorText = (flagColor: string) => {
    switch (flagColor) {
      case "red":
        return "text-red-800";
      case "orange":
        return "text-orange-800";
      case "yellow":
        return "text-yellow-800";
      default:
        return "text-gray-800";
    }
  };

  const getFlagIcon = (daysOverdue: number) => {
    if (daysOverdue > 5) return "🚨";
    if (daysOverdue > 2) return "⚠️";
    return "⏰";
  };

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
                <p className="text-muted-foreground">Loading overdue items...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Overdue Items Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Track and manage items not returned by due date
            </p>
          </div>

          {/* Alert Banner */}
          <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900">Attention Required</h3>
                  <p className="text-sm text-red-800 mt-1">
                    {overdueItems.length} items are currently overdue. {overdueItems.filter((i) => i.daysOverdue > 5).length} items are severely overdue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Overdue", value: overdueItems.length, icon: "📦", color: "from-red-500 to-red-600" },
              { label: "Severely Overdue (5+ days)", value: overdueItems.filter((i) => i.daysOverdue > 5).length, icon: "🚨", color: "from-orange-500 to-orange-600" },
              { label: "Total Deposit at Risk", value: `₱${overdueItems.reduce((sum, item) => sum + item.deposit, 0).toLocaleString()}`, icon: "💰", color: "from-purple-500 to-purple-600" },
              { label: "Avg Days Overdue", value: `${(overdueItems.reduce((sum, item) => sum + item.daysOverdue, 0) / overdueItems.length).toFixed(1)}`, icon: "📅", color: "from-blue-500 to-blue-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-lg bg-gradient-to-r ${stat.color} text-white shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sort Options */}
          <Card className="border-2 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-muted-foreground">Sort by:</span>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "daysOverdue" ? "default" : "outline"}
                    onClick={() => setSortBy("daysOverdue")}
                    className={sortBy === "daysOverdue" ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    Days Overdue
                  </Button>
                  <Button
                    variant={sortBy === "deposit" ? "default" : "outline"}
                    onClick={() => setSortBy("deposit")}
                    className={sortBy === "deposit" ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    Deposit Amount
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Items List */}
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <Card
                key={item.id}
                className={`border-2 hover:shadow-lg transition-all group overflow-hidden border-l-4 ${getFlagColorBg(item.flagColor)}`}
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Flag & Icon */}
                    <div className="md:col-span-1 flex flex-col items-center justify-start pt-2">
                      <div className="text-4xl mb-2">{getFlagIcon(item.daysOverdue)}</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full text-center ${getFlagColorText(item.flagColor)}`}>
                        {item.daysOverdue > 0 ? `${item.daysOverdue}d overdue` : "Due Today"}
                      </div>
                    </div>

                    {/* Item & Borrower Info */}
                    <div className="md:col-span-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg">{item.itemName}</h3>
                        <p className="text-sm text-muted-foreground">Item ID: {item.id}</p>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.avatar} />
                          <AvatarFallback>{item.borrower.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item.borrower}</p>
                          <p className="text-xs text-muted-foreground">Borrower ID: {item.borrowerId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dates & Deposit */}
                    <div className="md:col-span-3 space-y-3">
                      <div className="p-3 rounded-lg bg-blue-100 border border-blue-200">
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-bold text-blue-900">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground">Deposit</p>
                        <p className="font-bold text-primary">₱{item.deposit.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-3 flex flex-col gap-2 justify-center">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        onClick={() => handleSendReminder(item.borrowerId, item.borrower)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleContactBorrower(item.borrowerId, item.borrower)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                        onClick={() => handleMarkReturned(item.id, item.itemName)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark Returned
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {overdueItems.length === 0 && (
            <Card className="border-2 border-dashed text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent>
                <div className="text-4xl mb-4">✅</div>
                <p className="text-lg font-semibold text-green-900 mb-2">All Clear!</p>
                <p className="text-muted-foreground">No overdue items at the moment</p>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
