import { useMemo, useState } from "react";

import { useAuth } from "@/components/login/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useShopOpsStore } from "@/store/shop-ops-store";

export default function ExpensePage() {
  const { user } = useAuth();
  const { expenses, addExpense } = useShopOpsStore();
  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");

  const scopedExpenses = useMemo(
    () => expenses.filter((expense) => expense.ownerEmail === ownerEmail),
    [expenses, ownerEmail]
  );

  const handleAddExpense = () => {
    if (!ownerEmail || !category.trim() || !amount) {
      return;
    }

    addExpense({
      ownerEmail,
      category: category.trim(),
      note: note.trim(),
      amount: Number(amount) || 0,
    });

    setCategory("");
    setNote("");
    setAmount("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input value={category} onChange={(event) => setCategory(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Note</Label>
                <Input value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <Button onClick={handleAddExpense}>Save Expense</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedExpenses.length ? (
                    scopedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.note || "-"}</TableCell>
                        <TableCell className="text-right">Rs. {expense.amount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No expenses added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
