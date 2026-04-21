import { useMemo, useState } from "react";
import { Check, Edit2, Trash2 } from "lucide-react";

import { useAuth } from "@/components/login/authContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useShopOpsStore } from "@/store/shop-ops-store";
import type { CreditEntry } from "@/types/shop-ops";

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface CreditDetailsDrawerProps {
  credit: CreditEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

function CreditDetailsDrawer({
  credit,
  open,
  onOpenChange,
  isMobile,
}: CreditDetailsDrawerProps) {
  const remainingBalance = credit.totalAmount - credit.paidAmount;
  const paidPercentage =
    credit.totalAmount > 0 ? (credit.paidAmount / credit.totalAmount) * 100 : 0;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="rounded-t-2xl sm:rounded-none">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle className="text-xl font-semibold">
            {credit.customerName}
          </DrawerTitle>
          <DrawerDescription>
            Complete credit details and payment information
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-6 pt-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="mt-1 text-xs font-medium text-slate-500">Status</p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold",
                    credit.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : credit.status === "Partial"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700",
                  )}
                >
                  {credit.status}
                </span>
              </div>
              <div className="text-right">
                <p className="mt-1 text-xs font-medium text-slate-500">Created Date</p>
                <p className="font-medium">{formatDate(credit.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg border p-3">
              <Label className="text-xs text-slate-500">Customer Name</Label>
              <p className="font-medium">{credit.customerName}</p>
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <Label className="text-xs text-slate-500">Phone Number</Label>
              <p className="font-medium">{credit.phone || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Payment Details</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Bill</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(credit.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Amount Paid</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(credit.paidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium text-slate-600">Remaining Balance</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    remainingBalance > 0 ? "text-rose-600" : "text-emerald-600",
                  )}
                >
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Payment Progress</span>
                <span className="font-medium text-slate-700">
                  {paidPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-300">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Products Purchased</h3>
            <div className="space-y-2">
              {credit.products.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border bg-slate-50 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-950">{product.productName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Quantity: {product.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">
                      {formatCurrency(product.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function CreditPage() {
  const { user } = useAuth();
  const { credits, updateCredit, deleteCredit } = useShopOpsStore();
  const isMobile = useIsMobile();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCredit, setEditingCredit] = useState<CreditEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<CreditEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ownerEmail = user?.email?.toLowerCase().trim() ?? "";
  const isGlobalView = user?.role === "admin";

  const scopedCredits = useMemo(
    () =>
      isGlobalView
        ? credits
        : credits.filter((credit) => credit.ownerEmail === ownerEmail),
    [isGlobalView, ownerEmail, credits],
  );

  const handleEdit = (credit: CreditEntry) => {
    setEditingId(credit.id);
    setEditingCredit({ ...credit });
  };

  const handleSaveEdit = () => {
    if (!editingCredit) return;

    const totalAmount = Math.max(0, editingCredit.totalAmount);
    const paidAmount = Math.min(Math.max(0, editingCredit.paidAmount), totalAmount);
    const status =
      paidAmount <= 0 ? "Unpaid" : paidAmount >= totalAmount ? "Paid" : "Partial";

    updateCredit(editingCredit.id, {
      ...editingCredit,
      totalAmount,
      paidAmount,
      status,
    });
    setEditingId(null);
    setEditingCredit(null);
  };

  const handleDelete = (id: number) => {
    deleteCredit(id);
    setShowDeleteConfirm(null);
  };

  const handleMarkAsPaid = (credit: CreditEntry) => {
    updateCredit(credit.id, {
      status: "Paid",
      paidAmount: credit.totalAmount,
    });
  };

  const handleViewDetails = (credit: CreditEntry) => {
    setSelectedCredit(credit);
    setDrawerOpen(true);
  };

  const totalUnpaid = scopedCredits
    .filter((c) => c.status !== "Paid")
    .reduce((sum, c) => sum + (c.totalAmount - c.paidAmount), 0);

  const totalCredit = scopedCredits.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="relative space-y-4 overflow-hidden rounded-lg p-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Credit Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track and manage all credit sales and payments
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">
              {formatCurrency(totalCredit)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {scopedCredits.length} credit sale{scopedCredits.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Unpaid Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {scopedCredits.filter((c) => c.status !== "Paid").length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Credit Transactions</CardTitle>
          <CardDescription>
            View and manage all credit sales and payment status
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur">
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Total Bill</TableHead>
                <TableHead>Paid / Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedCredits.length ? (
                scopedCredits.map((credit) => {
                  const remainingAmount = Math.max(
                    0,
                    credit.totalAmount - credit.paidAmount,
                  );
                  const statusClass =
                    credit.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : credit.status === "Partial"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200";

                  return (
                    <TableRow key={credit.id}>
                      <TableCell className="font-semibold text-slate-950">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(credit)}
                          className="cursor-pointer font-semibold text-slate-950 hover:text-blue-600 hover:underline"
                        >
                          {credit.customerName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {formatCurrency(credit.totalAmount)}
                        </p>
                        {credit.paidAmount < credit.totalAmount && (
                          <p className="text-xs font-medium text-rose-700">
                            Remaining: {formatCurrency(remainingAmount)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-emerald-700">
                          {formatCurrency(credit.paidAmount)} / {formatCurrency(credit.totalAmount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            statusClass,
                          )}
                        >
                          {credit.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {credit.status !== "Paid" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleMarkAsPaid(credit)}
                              title="Mark as Paid"
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(credit)}
                            title="Edit"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50"
                            onClick={() => setShowDeleteConfirm(credit.id)}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No credit transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCredit && (
        <CreditDetailsDrawer
          credit={selectedCredit}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          isMobile={isMobile}
        />
      )}

      <Dialog
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setEditingCredit(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credit Entry</DialogTitle>
            <DialogDescription>
              Update customer details and payment information
            </DialogDescription>
          </DialogHeader>
          {editingCredit && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Customer Name</label>
                <Input
                  value={editingCredit.customerName}
                  onChange={(e) =>
                    setEditingCredit({
                      ...editingCredit,
                      customerName: e.target.value,
                    })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <Input
                  value={editingCredit.phone}
                  onChange={(e) =>
                    setEditingCredit({
                      ...editingCredit,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Optional"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Total Bill</label>
                <Input
                  type="text"
                  value={editingCredit.totalAmount}
                  onChange={(e) =>
                    setEditingCredit({
                      ...editingCredit,
                      totalAmount: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Paid Amount</label>
                <Input
                  type="text"
                  value={editingCredit.paidAmount}
                  onChange={(e) =>
                    setEditingCredit({
                      ...editingCredit,
                      paidAmount: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setEditingCredit(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setShowDeleteConfirm(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Credit Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this credit entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                if (showDeleteConfirm !== null) {
                  handleDelete(showDeleteConfirm);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(null)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
