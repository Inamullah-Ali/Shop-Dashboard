"use client";

import { useMemo, useState } from "react";
import { useShopStore } from "@/store/shop-store";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import {
	getFreeTrialDaysRemaining,
	shouldShowPackageAlert,
} from "@/lib/package-utils";

export function ShopAlerts() {
	const { shops } = useShopStore();
	const [testDate, setTestDate] = useState("");

	const referenceDate = useMemo(() => {
		if (!testDate) {
			return new Date();
		}

		const parsed = new Date(`${testDate}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			return new Date();
		}

		return parsed;
	}, [testDate]);

	const activeShopsWithExpiry = useMemo(() => {
		return shops
			.filter((shop) => shouldShowPackageAlert(shop, referenceDate))
			.map((shop) => {
				const daysRemaining = getFreeTrialDaysRemaining(shop, referenceDate);
				const isExpired = daysRemaining <= 0;
				const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

				return {
					id: shop.id,
					shopName: shop.shopName,
					daysRemaining,
					isExpired,
					isExpiringSoon,
				};
			})
			.sort((a, b) => a.daysRemaining - b.daysRemaining);
	}, [referenceDate, shops]);

	if (activeShopsWithExpiry.length === 0) {
		return (
			<Card className="@container/card h-full">
				<CardHeader>
					<CardTitle>Free Trial Alerts</CardTitle>
					<CardDescription>Shops nearing free trial end</CardDescription>
					<div className="mt-2 flex items-center gap-2">
						<Input
							type="date"
							value={testDate}
							onChange={(e) => setTestDate(e.target.value)}
							className="h-8 w-44"
						/>
					</div>
				</CardHeader>
				<CardContent className="flex h-full min-h-50 flex-col items-center justify-center text-center">
					<CheckCircleIcon className="mb-2 size-8 text-green-500" />
					<p className="text-sm text-muted-foreground">
						No shops with free trial ending in 10 days
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="@container/card h-full">
			<CardHeader>
				<CardTitle>Free Trial Alerts</CardTitle>
				<CardDescription>Shops nearing free trial end</CardDescription>
				<div className="mt-2 flex items-center gap-2">
					<Input
						type="date"
						value={testDate}
						onChange={(e) => setTestDate(e.target.value)}
						className="h-8 w-44"
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{activeShopsWithExpiry.map((shop) => (
					<div
						key={shop.id}
						className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
							shop.isExpired
								? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
								: shop.isExpiringSoon
									? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
									: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
						}`}
					>
						<div className="shrink-0 pt-0.5">
							{shop.isExpired ? (
								<AlertCircleIcon className="size-5 text-red-600" />
							) : shop.isExpiringSoon ? (
								<AlertCircleIcon className="size-5 text-yellow-600" />
							) : (
								<ClockIcon className="size-5 text-green-600" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{shop.shopName}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{shop.isExpired ? (
									<span className="font-semibold text-red-600">Free trial expired</span>
								) : (
									<span>
										{shop.daysRemaining === 1
											? "1 day remaining"
											: `${shop.daysRemaining} days remaining`} before free trial ends
									</span>
								)}
							</p>
						</div>
						{shop.isExpired && (
							<Badge variant="destructive" className="shrink-0">
								Trial Ended
							</Badge>
						)}
						{shop.isExpiringSoon && (
							<Badge
								variant="outline"
								className="shrink-0 border-yellow-300 text-yellow-700 dark:text-yellow-400"
							>
								Soon
							</Badge>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
