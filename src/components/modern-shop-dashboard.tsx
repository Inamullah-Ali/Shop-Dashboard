import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileBarChart2,
  Package,
  ReceiptText,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero.png";
import { NewSaleDialog } from "@/components/new-sale-dialog";
import { useAuth } from "@/components/login/authContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { designTokens } from "@/components/ui/design-tokens";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/store/product-store";
import { usePublicCommerceStore } from "@/store/public-commerce-store";
import { useShopOpsStore } from "@/store/shop-ops-store";
import type { SaleEntry } from "@/types/shop-ops";

type TrendPeriod = "thisWeek" | "lastWeek" | "thisMonth";
type SalesMonthPeriod = "thisMonth" | "lastMonth";

type TrendPoint = {
  label: string;
  total: number;
  fullLabel: string;
};

type TopSellingItem = {
  name: string;
  units: number;
  revenue: number;
  image?: string;
};

const quickActions = [
  { title: "Add Product", href: "/products", icon: <Package className="size-6" color="blue" /> },
  { title: "New Purchase", href: "/purchase", icon: <ReceiptText className="size-6" color="blue" /> },
  { title: "Add Customer", href: "/customers", icon: <Users className="size-6" color="blue" /> },
  { title: "View Reports", href: "/reports", icon: <FileBarChart2 className="size-6" color="blue" /> },
];

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getInvoiceNumber(id: number) {
  return `INV-${String(id).padStart(6, "0")}`;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReadableDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatRecentSaleDate(createdAt: string, now: Date) {
  const saleDate = new Date(createdAt);

  if (sameDay(saleDate, now)) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(saleDate, yesterday)) {
    return "Yesterday";
  }

  const daysAgo = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAgo >= 2 && daysAgo <= 7) {
    return saleDate.toLocaleDateString("en-US", { weekday: "short" });
  }

  return saleDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthBounds(date: Date, monthOffset = 0) {
  const start = new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
  const end = new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getWeekBounds(date: Date, weekOffset = 0) {
  const start = new Date(date);
  const end = new Date(date);
  const day = start.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + offsetToMonday + weekOffset * 7);
  start.setHours(0, 0, 0, 0);

  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildTrendSeries(sales: SaleEntry[], period: TrendPeriod, now: Date) {
  const start = new Date(now);
  const end = new Date(now);

  if (period === "thisWeek") {
    const bounds = getWeekBounds(now, 0);
    start.setTime(bounds.start.getTime());
    end.setTime(bounds.end.getTime());
  } else if (period === "lastWeek") {
    const bounds = getWeekBounds(now, -1);
    start.setTime(bounds.start.getTime());
    end.setTime(bounds.end.getTime());
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  const series: TrendPoint[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const total = sales
      .filter((sale) => sameDay(new Date(sale.createdAt), cursor))
      .reduce((sum, sale) => sum + sale.amount, 0);

    series.push({
      label:
        period === "thisWeek" || period === "lastWeek"
          ? cursor.toLocaleDateString("en-US", { weekday: "short" })
          : String(cursor.getDate()),
      total,
      fullLabel: cursor.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

function formatChange(current: number, previous: number, suffix: string) {
  if (!previous) {
    return current ? `New activity ${suffix}` : `No activity ${suffix}`;
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";

  return `${sign}${delta.toFixed(0)}% ${suffix}`;
}

export function ModernShopDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products } = useProductStore();
  const { sales, customers, credits } = useShopOpsStore();
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    usePublicCommerceStore();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("thisWeek");
  const [topSellingPeriod, setTopSellingPeriod] = useState<SalesMonthPeriod>("thisMonth");
  const [calendarValue, setCalendarValue] = useState(() => formatDateInputValue(new Date()));
  const [isRecentSalesExpanded, setIsRecentSalesExpanded] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  const ownerEmail = user?.email?.toLowerCase().trim() ?? "";
  const isGlobalView = user?.role === "admin";

  const scopedProducts = useMemo(
    () =>
      isGlobalView
        ? products
        : products.filter((product) => product.ownerEmail === ownerEmail),
    [isGlobalView, ownerEmail, products],
  );

  const scopedSales = useMemo(
    () =>
      isGlobalView
        ? sales
        : sales.filter((sale) => sale.ownerEmail === ownerEmail),
    [isGlobalView, ownerEmail, sales],
  );

  const scopedCustomers = useMemo(
    () =>
      isGlobalView
        ? customers
        : customers.filter((customer) => customer.ownerEmail === ownerEmail),
    [customers, isGlobalView, ownerEmail],
  );

  const scopedCredits = useMemo(
    () =>
      isGlobalView
        ? credits
        : credits.filter((credit) => credit.ownerEmail === ownerEmail),
    [credits, isGlobalView, ownerEmail],
  );

  const creditStatusByCustomer = useMemo(() => {
    return scopedCredits.reduce<Record<string, { hasOutstanding: boolean; hasPartial: boolean }>>(
      (accumulator, credit) => {
        const key = credit.customerName.trim().toLowerCase();
        const remaining = Math.max(0, credit.totalAmount - credit.paidAmount);
        const current = accumulator[key] ?? { hasOutstanding: false, hasPartial: false };

        if (remaining > 0) {
          current.hasOutstanding = true;
        }

        if (credit.paidAmount > 0 && remaining > 0) {
          current.hasPartial = true;
        }

        accumulator[key] = current;
        return accumulator;
      },
      {},
    );
  }, [scopedCredits]);

  const currentDate = useMemo(() => new Date(`${calendarValue}T00:00:00`), [calendarValue]);
  const calendarLabel = useMemo(() => formatReadableDate(calendarValue), [calendarValue]);
  const thisMonthLabel = useMemo(() => formatMonthLabel(currentDate), [currentDate]);
  const selectedDateEnd = useMemo(() => {
    const endOfDay = new Date(currentDate);

    endOfDay.setHours(23, 59, 59, 999);

    return endOfDay;
  }, [currentDate]);

  const selectedSales = useMemo(
    () => scopedSales.filter((sale) => new Date(sale.createdAt) <= selectedDateEnd),
    [scopedSales, selectedDateEnd],
  );

  const selectedCustomers = useMemo(
    () => scopedCustomers.filter((customer) => new Date(customer.createdAt) <= selectedDateEnd),
    [scopedCustomers, selectedDateEnd],
  );

  const todaySales = useMemo(
    () => selectedSales,
    [selectedSales],
  );

  const monthSales = useMemo(
    () =>
      selectedSales.filter((sale) => {
        const created = new Date(sale.createdAt);

        return (
          created.getFullYear() === currentDate.getFullYear() &&
          created.getMonth() === currentDate.getMonth()
        );
      }),
    [currentDate, selectedSales],
  );

  const lastMonthSales = useMemo(() => {
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    return scopedSales.filter((sale) => {
      const created = new Date(sale.createdAt);

      return created >= previousMonth && created < nextMonth;
    });
  }, [currentDate, scopedSales]);

  const todayAmount = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const monthAmount = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
  const lastMonthAmount = lastMonthSales.reduce((sum, sale) => sum + sale.amount, 0);

  const todayCardSales = useMemo(() => {
    const now = new Date();

    return scopedSales.filter((sale) => sameDay(new Date(sale.createdAt), now));
  }, [scopedSales]);

  const yesterdayCardSales = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return scopedSales.filter((sale) => sameDay(new Date(sale.createdAt), yesterday));
  }, [scopedSales]);

  const todayCardAmount = todayCardSales.reduce((sum, sale) => sum + sale.amount, 0);
  const yesterdayCardAmount = yesterdayCardSales.reduce((sum, sale) => sum + sale.amount, 0);

  const lowStockProducts = useMemo(
    () =>
      scopedProducts
        .filter((product) => product.quantity <= 5)
        .sort((left, right) => left.quantity - right.quantity),
    [scopedProducts],
  );

  const todayCustomers = useMemo(
    () => selectedCustomers,
    [selectedCustomers],
  );

  const trendData = useMemo(
    () => buildTrendSeries(selectedSales, selectedPeriod, currentDate),
    [currentDate, selectedPeriod, selectedSales],
  );

  const paymentBreakdown = useMemo(
    () =>
      selectedSales.reduce<Record<"Cash" | "Card" | "Credit", number>>(
        (accumulator, sale) => {
          if (sale.paymentMethod === "Cash") {
            accumulator.Cash += 1;
          } else if (sale.paymentMethod === "Card") {
            accumulator.Card += 1;
          } else {
            accumulator.Credit += 1;
          }

          return accumulator;
        },
        { Cash: 0, Card: 0, Credit: 0 },
      ),
    [selectedSales],
  );

  const productImageByName = useMemo(() => {
    return scopedProducts.reduce<Record<string, string>>((accumulator, product) => {
      accumulator[product.productName.trim().toLowerCase()] = product.productImage || heroImage;

      return accumulator;
    }, {});
  }, [scopedProducts]);

  const topSellingProducts = useMemo(() => {
    const { start, end } = getMonthBounds(currentDate, topSellingPeriod === "thisMonth" ? 0 : -1);

    const salesForPeriod = selectedSales.filter((sale) => {
      const createdAt = new Date(sale.createdAt);

      return createdAt >= start && createdAt <= end;
    });

    const totals = salesForPeriod.reduce<Record<string, TopSellingItem>>((accumulator, sale) => {
      const key = sale.productName.trim().toLowerCase();
      const current = accumulator[key] ?? {
        name: sale.productName,
        units: 0,
        revenue: 0,
        image: productImageByName[key] || heroImage,
      };

      current.units += sale.quantity;
      current.revenue += sale.amount;
      accumulator[key] = current;

      return accumulator;
    }, {});

    return Object.values(totals)
      .sort((left, right) => right.units - left.units)
      .slice(0, 6);
  }, [currentDate, productImageByName, selectedSales, topSellingPeriod]);

  const searchValue = (searchParams.get("q") ?? "").trim().toLowerCase();

  const recentSales = useMemo(() => {
    const sortedSales = [...scopedSales].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    const base = sortedSales.filter((sale) => {
      if (!searchValue) {
        return true;
      }

      const invoice = getInvoiceNumber(sale.id).toLowerCase();

      return [sale.customerName, sale.productName, sale.paymentMethod, invoice].some((entry) =>
        entry.toLowerCase().includes(searchValue),
      );
    });

    const visibleSales = isRecentSalesExpanded ? base : base.slice(0, 5);

    return visibleSales;
  }, [isRecentSalesExpanded, scopedSales, searchValue]);

  const filteredLowStock = useMemo(() => {
    if (!searchValue) {
      return lowStockProducts.slice(0, 5);
    }

    return lowStockProducts
      .filter((product) => product.productName.toLowerCase().includes(searchValue))
      .slice(0, 5);
  }, [lowStockProducts, searchValue]);

  const filteredTopProducts = useMemo(() => {
    if (!searchValue) {
      return topSellingProducts;
    }

    return topSellingProducts.filter((product) =>
      product.name.toLowerCase().includes(searchValue),
    );
  }, [searchValue, topSellingProducts]);

  const eligibleTopProducts = useMemo(
    () => filteredTopProducts.filter((product) => product.units > 8),
    [filteredTopProducts],
  );

  const ownerNotifications = useMemo(
    () =>
      isGlobalView
        ? notifications
        : notifications.filter(
            (notification) => notification.ownerEmail === ownerEmail,
          ),
    [isGlobalView, notifications, ownerEmail],
  );

  const orderStatusSummary = useMemo(() => {
    const lines = ownerNotifications.flatMap((notification) => notification.items);

    return {
      total: lines.length,
      processing: lines.filter((line) => line.status === "Processing").length,
      successful: lines.filter((line) => line.status === "Delivered").length,
      cancelled: lines.filter((line) => line.status === "Cancelled").length,
    };
  }, [ownerNotifications]);

  const unreadNotificationCount = useMemo(
    () => ownerNotifications.filter((notification) => !notification.isRead).length,
    [ownerNotifications],
  );

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(todayCardAmount),
      note: formatChange(todayCardAmount, yesterdayCardAmount, "from yesterday"),
      icon: <CircleDollarSign className="size-5" />,
      accent: "from-blue-500 to-cyan-500",
      tint: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Sales (Month)",
      value: formatCurrency(monthAmount),
      note: formatChange(monthAmount, lastMonthAmount, "from last month"),
      icon: <CreditCard className="size-5" />,
      accent: "from-emerald-500 to-teal-500",
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Products",
      value: String(scopedProducts.length),
      note: `${lowStockProducts.length} low stock`,
      icon: <Package className="size-5" />,
      accent: "from-violet-500 to-fuchsia-500",
      tint: "bg-violet-50 text-violet-600",
    },
    {
      title: "Customers",
      value: String(scopedCustomers.length),
      note: `${todayCustomers.length} new today`,
      icon: <Users className="size-5" />,
      accent: "from-orange-500 to-amber-500",
      tint: "bg-orange-50 text-orange-600",
    },
    {
      title: "Orders",
      value: String(orderStatusSummary.total),
      note: `Processing ${orderStatusSummary.processing} • Successful ${orderStatusSummary.successful} • Cancelled ${orderStatusSummary.cancelled}`,
      icon: <ReceiptText className="size-5" />,
      accent: "from-rose-500 to-red-500",
      tint: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className={`relative overflow-hidden ${designTokens.radius.base} ${designTokens.colors.border} border ${designTokens.effects.noShadow} p-4`}>
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[36px_36px]" />

      <div className="relative space-y-4">
        <header>
            <div className="flex flex-row justify-between items-center">
              <div>
                <h1 className={`mt-1 ${designTokens.text.title} ${designTokens.colors.textPrimary} sm:text-3xl`}>
                  Welcome back, {user?.name ?? "Owner"}
                </h1>
                <p className={`mt-1 ${designTokens.text.body} ${designTokens.colors.textMuted}`}>
                  Here's what's happening with your shop today.
                </p>
              </div>
              <div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Sheet
                      open={isNotificationSheetOpen}
                      onOpenChange={setIsNotificationSheetOpen}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="relative"
                        onClick={() => setIsNotificationSheetOpen(true)}
                      >
                        <Bell className="size-4" />
                        Notifications
                        {unreadNotificationCount ? (
                          <Badge
                            className="absolute -top-2 -right-2 min-w-5 justify-center px-1"
                            variant="destructive"
                          >
                            {unreadNotificationCount}
                          </Badge>
                        ) : null}
                      </Button>

                      <SheetContent className="sm:max-w-lg">
                        <SheetHeader>
                          <SheetTitle>Order notifications</SheetTitle>
                          <SheetDescription>
                            New customer orders routed to your shop appear here.
                          </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-3 overflow-y-auto p-4">
                          {ownerNotifications.length ? (
                            ownerNotifications.map((notification) => (
                              <Card
                                key={notification.id}
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  "cursor-pointer border-slate-200 bg-white transition hover:border-blue-300 hover:bg-blue-50/60",
                                  !notification.isRead &&
                                    "border-blue-200 bg-blue-50/40",
                                )}
                                onClick={() => {
                                  markNotificationRead(notification.id)
                                  setIsNotificationSheetOpen(false)
                                  navigate("/orders")
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    markNotificationRead(notification.id)
                                    setIsNotificationSheetOpen(false)
                                    navigate("/orders")
                                  }
                                }}
                              >
                                <CardContent className="space-y-3 p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        Order #{notification.orderId}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {new Date(notification.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    {!notification.isRead ? (
                                      <Badge variant="secondary">New</Badge>
                                    ) : null}
                                  </div>

                                  <div className="rounded-lg border border-slate-200 bg-white p-2 text-sm">
                                    <p className="font-medium text-slate-900">
                                      {notification.customer.customerName}
                                    </p>
                                    <p className="text-slate-600">
                                      {notification.customer.email || "-"}
                                    </p>
                                    <p className="text-slate-600">{notification.customer.phone}</p>
                                    <p className="text-slate-600">
                                      {notification.customer.address}
                                    </p>
                                    <p className="text-slate-600">
                                      {notification.customer.city || "-"}
                                    </p>
                                    {notification.customer.note ? (
                                      <p className="text-slate-600">
                                        Note: {notification.customer.note}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="space-y-1">
                                    {notification.items.map((item, index) => (
                                      <div
                                        key={`${notification.id}-${item.productId}-${index}`}
                                        className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                      >
                                        <span className="font-medium text-slate-700">
                                          {item.productName}
                                        </span>
                                        <span className="text-slate-600">
                                          Qty {item.quantity}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900">
                                      Total: {formatCurrency(notification.totalAmount)}
                                    </p>
                                    {!notification.isRead ? (
                                      <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          markNotificationRead(notification.id)
                                        }}
                                      >
                                        Mark read
                                      </Button>
                                    ) : null}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <Card className="border-dashed border-slate-300 bg-white/80">
                              <CardContent className="py-10 text-center text-slate-500">
                                No order notifications yet.
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {ownerNotifications.length ? (
                          <div className="border-t border-slate-200 p-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => markAllNotificationsRead(ownerEmail)}
                            >
                              Mark all as read
                            </Button>
                          </div>
                        ) : null}
                      </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <input
                        type="date"
                        value={calendarValue}
                        onChange={(event) => setCalendarValue(event.target.value)}
                        className="h-5 bg-transparent text-sm font-medium text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{calendarLabel}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map((card) => (
                <Card
                  key={card.title}
                  className="overflow-hidden border border-slate-200/90 bg-white/90 hover:shadow-md"
                >
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{card.title}</p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                          {card.value}
                        </p>
                      </div>
                      <div className={cn("rounded-lg p-3 shadow-sm", card.tint)}>
                        {card.icon}
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full bg-linear-to-r", card.accent)} />
                    </div>
                    <p className="text-sm text-slate-500">{card.note}</p>
                  </CardContent>
                </Card>
              ))}
          </section>

          <section className="grid items-start gap-3 xl:grid-cols-[53%_24%_21%]">
            <Card className="flex h-75 overflow-hidden border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] xl:h-75 xl:flex-col">
              <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Weekly and monthly revenue trends.</CardDescription>
                </div>
                <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as TrendPeriod)}>
                  <SelectTrigger className="w-40 rounded-2xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder="This Week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="lastWeek">Last Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 p-0">
                <div className="h-full w-full px-3 pb-4 pt-3 sm:px-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="shopRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        padding={{ left: 10, right: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="url(#shopRevenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="flex h-75 border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] xl:h-75 xl:flex-col">
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Products that need attention soon.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-3">
                {filteredLowStock.length ? (
                  <div className="h-full space-y-3 overflow-y-auto pr-1">
                    {filteredLowStock.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={product.productImage || heroImage}
                          alt={product.productName}
                          className="size-12 rounded-2xl border border-white object-cover shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {product.productName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Stock left</p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-600">
                          {product.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No low stock alerts right now.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex h-auto flex-col space-y-3">
              <NewSaleDialog
                ownerEmail={ownerEmail}
                scopedProducts={scopedProducts}
                triggerLabel="+ New Sale (POS)"
                triggerClassName="h-12 w-full rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(15,23,42,0.22)] hover:bg-slate-800"
              />

              <Card className="flex min-h-0 flex-1 flex-col border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="font-bold text-xl">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-lg flex flex-row justify-between items-center">
                      <p className="text-[15px] font-medium tracking-wide text-slate-500 flex flex-row items-center gap-1">
                        Transactions
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-slate-950">
                        {todaySales.length}
                      </p>
                    </div>
                    <div className="rounded-lg flex flex-row justify-between items-center">
                      <p className="text-[15px] font-medium tracking-wide text-slate-500 flex flex-row items-center gap-1">
                        Total Amount
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-slate-950">
                        {formatCurrency(todayAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg flex flex-row justify-between items-center">
                      <p className="text-[15px] font-medium tracking-wide text-slate-500 flex flex-row items-center gap-1">
                        Average Sale
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-slate-950">
                        {formatCurrency(todaySales.length ? todayAmount / todaySales.length : 0)}
                      </p>
                    </div>
                    <div className="rounded-l flex flex-row justify-between items-center">
                      <p className="text-[15px] font-medium tracking-wide text-slate-500 flex flex-row items-center gap-1">
                        Customers
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-slate-950">
                        {todayCustomers.length}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      <p className="text-[15px] font-medium tracking-wide text-slate-500">Payments</p>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-2 text-center text-sm font-medium text-emerald-700">
                          Cash {paymentBreakdown.Cash}
                        </div>
                        <div className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-2 text-center text-sm font-medium text-blue-700">
                          Card {paymentBreakdown.Card}
                        </div>
                        <div className="rounded-sm border border-slate-300 bg-slate-100 px-2 py-2 text-center text-sm font-medium text-slate-600">
                          Credit {paymentBreakdown.Credit}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid items-start gap-3 xl:grid-cols-[53%_24%_21%]">
            <Card className="border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] -mt-19 h-92">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-bold">Recent Selling</CardTitle>
                  <CardDescription>Latest sales with quantity and date details.</CardDescription>
                </div>
                <div className="flex items-center gap-2">

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 text-sm font-semibold text-blue-600 cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => setIsRecentSalesExpanded((current) => !current)}
                  >
                    <span className="flex items-center gap-1">
                      {isRecentSalesExpanded ? "Show Less" : "View All"}
                      <ChevronDown className="size-4" />
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto px-0 pb-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-200 backdrop-blur">
                    <TableRow>
                      <TableHead>Product / ID</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Date</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.length ? (
                      recentSales.map((sale) => {
                        const customerKey = sale.customerName.trim().toLowerCase();
                        const customerCredit = creditStatusByCustomer[customerKey];

                        const status =
                          sale.paymentMethod !== "Credit"
                            ? "Paid"
                            : customerCredit?.hasOutstanding
                            ? customerCredit.hasPartial
                              ? "Partial"
                              : "Unpaid"
                            : "Paid";

                        const statusClass =
                          status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "Partial"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200";

                        return (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium text-slate-950">
                              <div className="flex items-center gap-3">
                                <img
                                  src={productImageByName[sale.productName.trim().toLowerCase()] || heroImage}
                                  alt={sale.productName || "Product"}
                                  className="size-8 rounded-lg border border-slate-200 object-cover"
                                />
                                <span className="truncate">{sale.productName || getInvoiceNumber(sale.id)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-slate-950">
                              {sale.quantity}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">
                              {formatRecentSaleDate(sale.createdAt, new Date())}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-slate-950">
                              {formatCurrency(sale.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusClass)}>
                                {status}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                          No sales recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] -mt-19 h-92 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-bold">Top Selling Products</CardTitle>
                </div>
                <Select
                  value={topSellingPeriod}
                  onValueChange={(value) => setTopSellingPeriod(value as SalesMonthPeriod)}
                >
                  <SelectTrigger className="w-22 rounded-2xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder={thisMonthLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="min-h-0 space-y-3 overflow-y-auto pr-1">
                {eligibleTopProducts.length ? (
                  eligibleTopProducts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={item.image || heroImage}
                          alt={item.name}
                          className="size-10 object-cover shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-slate-950">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.units} Sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No product has sold more than 8 units in this period yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] h-73">
              <CardHeader>
                <CardTitle className="font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      variant="ghost"
                      className="h-24 flex-col justify-between p-4 cursor-pointer hover:bg-slate-100"
                      onClick={() => navigate(action.href)}
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-blue-200 text-white align-middle">
                        {action.icon}
                      </span>
                      <span className="flex w-full items-center justify-between text-xs font-semibold text-slate-800">
                        {action.title}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
      </div>
    </div>
  );
}
