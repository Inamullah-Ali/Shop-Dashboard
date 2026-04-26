import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GripVerticalIcon,
  CircleCheckIcon,
  LoaderIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { AddDialogue } from "./Dialogue/adddialogue";
import { DeleteDialogue } from "./Dialogue/deletedialogue";
import { useShopStore } from "@/store/shop-store";
import { EditDialogue } from "./Dialogue/editdialogue";
import { getDerivedShopStatus, isShopActiveStatus } from "@/lib/package-utils";
import { toast } from "sonner";
import { deleteShopInAppwrite } from "@/service/appwriteShop";
import { purgeShopRelatedLocalData } from "@/service/shop-cascade";
import type { IShop } from "@/types/tabledata";

export const schema = z.object({
  id: z.number(),
  createdAt: z.string().optional(),
  selectedPlanId: z.number().optional(),
  selectedPlanName: z.string().optional(),
  selectedPlanPrice: z.number().optional(),
  shopName: z.string(),
  ownerName: z.string(),
  phoneNumber: z.string(),
  shopAddress: z.string(),
  city: z.string(),
  shopType: z.string(),
  email: z.string(),
  role: z.enum(["admin", "shopAdmin", "customer"]).optional(),
  status: z.string(),
  packageDuration: z.string().optional(),
  image: z.string().optional(),
});

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export function DataTable() {
  const { shops, setShops } = useShopStore();
  const [activeTab, setActiveTab] = React.useState("outline");
  const [testDate, setTestDate] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<IShop | null>(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => shops?.map(({ id }) => id) || [],
    [shops],
  );

  const searchValue = globalFilter.trim().toLowerCase();

  const referenceDate = React.useMemo(() => {
    if (!testDate) {
      return new Date();
    }

    const parsed = new Date(`${testDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }, [testDate]);

  const selectedShopIds = React.useMemo(
    () =>
      Object.entries(rowSelection as Record<string, boolean>)
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [rowSelection],
  );

  const deleteSelectedShops = React.useCallback(async () => {
    if (!selectedShopIds.length) {
      return;
    }

    const selectedSet = new Set(selectedShopIds);
    const selectedShops = shops.filter((shop) => selectedSet.has(shop.id));

    const results = await Promise.allSettled(
      selectedShops.map(async (shop) => {
        await deleteShopInAppwrite({
          appwriteDocumentId: shop.appwriteDocumentId,
          appwriteUserId: shop.appwriteUserId,
          email: shop.email,
        });
        await purgeShopRelatedLocalData(shop);
      }),
    );

    const remainingShops = shops.filter((shop) => !selectedSet.has(shop.id));
    setShops(remainingShops);
    setRowSelection({});
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) {
      toast.error(`${failed} shop(s) failed to delete fully.`);
    } else {
      toast.success("Selected shops deleted.");
    }
    toast.dismiss("selected-shops-toast");
  }, [selectedShopIds, setShops, shops]);

  const handleCancelDelete = React.useCallback(() => {
    setRowSelection({});
    toast.dismiss("selected-shops-toast");
  }, []);

  React.useEffect(() => {
    if (!selectedShopIds.length) {
      toast.dismiss("selected-shops-toast");
      return;
    }

    const count = selectedShopIds.length;
    const countLabel = count === 1 ? "1 shop selected" : `${count} shops selected`;

    toast.custom(
      () => (
        <div className="w-full rounded-lg border border-red-300 bg-red-200 px-4 py-3 text-red-500 shadow-sm">
          <p className="text-sm font-semibold">Are you sure you want to delete the shop(s)?</p>
          <p className="mt-1 text-xs">{countLabel}</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-red-300 bg-white text-red-500 hover:bg-red-100"
              onClick={handleCancelDelete}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-red-500 text-white hover:bg-red-600"
              onClick={deleteSelectedShops}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        id: "selected-shops-toast",
        duration: Number.POSITIVE_INFINITY,
        classNames: {
          toast: "bg-transparent p-0 shadow-none border-0",
        },
      },
    );

    return () => {
      toast.dismiss("selected-shops-toast");
    };
  }, [handleCancelDelete, deleteSelectedShops, selectedShopIds]);

  const matchesSearch = React.useCallback(
    (shop: IShop) => {
      if (!searchValue) {
        return true;
      }

      return (
        shop.shopName.toLowerCase().includes(searchValue) ||
        shop.ownerName.toLowerCase().includes(searchValue)
      );
    },
    [searchValue],
  );

  const activeShops = React.useMemo(
    () =>
      shops
        .filter((shop) => isShopActiveStatus(shop, referenceDate))
        .filter(matchesSearch),
    [shops, matchesSearch, referenceDate],
  );

  const inactiveShops = React.useMemo(
    () =>
      shops
        .filter((shop) => !isShopActiveStatus(shop, referenceDate))
        .filter(matchesSearch),
    [shops, matchesSearch, referenceDate],
  );

  const shopOwnerSearchFilter: FilterFn<IShop> = (
    row,
    _columnId,
    filterValue,
  ) => {
    const query = String(filterValue ?? "").trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      row.original.shopName.toLowerCase().includes(query) ||
      row.original.ownerName.toLowerCase().includes(query)
    );
  };

  const handleOpen = React.useCallback((item: IShop) => {
    setSelectedItem(item);
    setOpen(true);
  }, []);

  const formatAddedDate = React.useCallback((shop: IShop) => {
    const rawDate = shop.createdAt ?? new Date(shop.id).toISOString();
    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const columns = React.useMemo<ColumnDef<IShop>[]>(
    () => [
      {
        id: "drag",
        size: 40,
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        size: 40,
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
          </div>
        ),
      },
      {
        accessorKey: "shopName",
        header: "Shop Name",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="px-0 text-left text-foreground cursor-pointer max-w-50 truncate"
            onClick={() => handleOpen(row.original)}
          >
            {row.original.shopName}
          </Button>
        ),
      },
      {
        accessorKey: "ownerName",
        header: "Owner Name",
        cell: ({ row }) => (
          <div className="max-w-40 truncate">{row.original.ownerName}</div>
        ),
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone Number",
        cell: ({ row }) => (
          <div className="max-w-30 truncate">{row.original.phoneNumber}</div>
        ),
      },
      {
        id: "addedDate",
        header: "Date",
        cell: ({ row }) => (
          <div className="max-w-30 truncate">{formatAddedDate(row.original)}</div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div className="max-w-50 truncate">{row.original.email}</div>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
      },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ row }) => {
          const status = getDerivedShopStatus(row.original, referenceDate)
          return (
          <Badge variant="outline">
            {status === "Active" || status === "Active (Free)" ? (
              <CircleCheckIcon className="text-green-500" />
            ) : (
              <LoaderIcon />
            )}
            {status}
          </Badge>
          )
        },
      },
      {
        id: "actions",
        size: 60,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <EditDialogue rowData={row.original} />
            <DeleteDialogue rowData={row.original} />
          </div>
        ),
      },
    ],
    [formatAddedDate, handleOpen, referenceDate],
  );

  const table = useReactTable({
    data: shops,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: shopOwnerSearchFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      const reorderedShops = arrayMove(shops, oldIndex, newIndex);
      setShops(reorderedShops);
    }
  }

  const renderFilteredTable = (filteredShops: IShop[]) => {
    const filteredIds = filteredShops.map((shop) => shop.id.toString());
    const filteredDndIds = filteredShops.map((shop) => shop.id);
    const allFilteredSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => Boolean((rowSelection as Record<string, boolean>)[id]));
    const someFilteredSelected =
      !allFilteredSelected &&
      filteredIds.some((id) => Boolean((rowSelection as Record<string, boolean>)[id]));

    const toggleAllFilteredRows = (checked: boolean) => {
      setRowSelection((prev) => {
        const next = { ...(prev as Record<string, boolean>) };
        filteredIds.forEach((id) => {
          if (checked) {
            next[id] = true;
          } else {
            delete next[id];
          }
        });
        return next;
      });
    };

    const handleFilteredDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active || !over || active.id === over.id) {
        return;
      }

      const oldIndex = filteredDndIds.indexOf(active.id as number);
      const newIndex = filteredDndIds.indexOf(over.id as number);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const reorderedFilteredShops = arrayMove(filteredShops, oldIndex, newIndex);
      const filteredSet = new Set(filteredShops.map((shop) => shop.id));
      let pointer = 0;

      const merged = shops.map((shop) => {
        if (!filteredSet.has(shop.id)) {
          return shop;
        }
        const nextShop = reorderedFilteredShops[pointer];
        pointer += 1;
        return nextShop;
      });

      setShops(merged);
    };

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleFilteredDragEnd}
          sensors={sensors}
        >
          <Table className="w-full min-w-275 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={
                        allFilteredSelected ||
                        (someFilteredSelected && "indeterminate")
                      }
                      onCheckedChange={(value) =>
                        toggleAllFilteredRows(Boolean(value))
                      }
                    />
                  </div>
                </TableHead>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.length ? (
                <SortableContext
                  items={filteredDndIds}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredShops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <DragHandle id={shop.id} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={Boolean(
                              (rowSelection as Record<string, boolean>)[
                                shop.id.toString()
                              ],
                            )}
                            onCheckedChange={(value) => {
                              setRowSelection((prev) => {
                                const next = {
                                  ...(prev as Record<string, boolean>),
                                };
                                if (value) {
                                  next[shop.id.toString()] = true;
                                } else {
                                  delete next[shop.id.toString()];
                                }
                                return next;
                              });
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="w-fit px-0 text-left text-foreground cursor-pointer"
                          onClick={() => handleOpen(shop)}
                        >
                          {shop.shopName}
                        </Button>
                      </TableCell>
                      <TableCell>{shop.ownerName}</TableCell>
                      <TableCell>{shop.phoneNumber}</TableCell>
                      <TableCell>{formatAddedDate(shop)}</TableCell>
                      <TableCell>
                        <div className="max-w-50 truncate">{shop.email}</div>
                      </TableCell>
                      <TableCell>{shop.city}</TableCell>
                      <TableCell>
                        {(() => {
                          const status = getDerivedShopStatus(shop, referenceDate)
                          return (
                        <Badge variant="outline">
                          {status === "Active" || status === "Active (Free)" ? (
                            <CircleCheckIcon className="text-green-500" />
                          ) : (
                            <LoaderIcon />
                          )}
                          {status}
                        </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <EditDialogue rowData={shop} />
                          <DeleteDialogue rowData={shop} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    );
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="outline">All</SelectItem>
                <SelectItem value="past-performance">
                  Paid Shop
                </SelectItem>
                <SelectItem value="key-personnel">Unpaid Shop</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger className="cursor-pointer" value="outline">All</TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="past-performance">
              Paid Shop <Badge variant="secondary">{activeShops.length}</Badge>
            </TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="key-personnel">
              Unpaid Shop <Badge variant="secondary">{inactiveShops.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Test Date</span>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="flex items-center">
              <Button
                className="cursor-pointer"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (searchOpen) {
                    setGlobalFilter("");
                  }
                  setSearchOpen((prev) => !prev);
                }}
                aria-label="Search shops"
              >
                {searchOpen ? <XIcon className="size-4" /> : <SearchIcon className="size-4" />}
              </Button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  searchOpen ? "ml-2 w-52 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <Input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search shops..."
                   className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                />
              </div>
            </div>

            <AddDialogue />
          </div>
        </div>
        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table className="w-full min-w-275 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRightIcon />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="past-performance"
          className="flex flex-col px-4 lg:px-6"
        >
          {renderFilteredTable(activeShops)}
        </TabsContent>
        <TabsContent
          value="key-personnel"
          className="flex flex-col px-4 lg:px-6"
        >
          {renderFilteredTable(inactiveShops)}
        </TabsContent>
        <TabsContent
          value="focus-documents"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <ShopDrawer
          item={selectedItem}
          open={open}
          onOpenChange={setOpen}
          referenceDate={referenceDate}
        />
      )}
    </>
  );
}

function ShopDrawer({
  item,
  open,
  onOpenChange,
  referenceDate,
}: {
  item: IShop;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  referenceDate: Date;
}) {
  const isMobile = useIsMobile();
  const status = getDerivedShopStatus(item, referenceDate);
  const isActive = status === "Active" || status === "Active (Free)";

  return (
<Drawer
  open={open}
  onOpenChange={onOpenChange}
  direction={isMobile ? "bottom" : "right"}
>
  <DrawerContent className="rounded-t-2xl sm:rounded-none">
    <DrawerHeader className="gap-1 border-b pb-4">
      <DrawerTitle className="text-xl font-semibold">
        {item.shopName}
      </DrawerTitle>
      <DrawerDescription className="text-muted-foreground">
        Complete shop details
      </DrawerDescription>
    </DrawerHeader>
    <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-6 pt-4 text-sm">
      {item.image && (
        <div className="overflow-hidden rounded-xl border">
          <img
            src={item.image}
            alt={`${item.shopName} image`}
            className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {status}
        </span>
        {status === "Active (Free)" ? (
          <span className="ml-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Free
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            Plan
          </Label>
          <p className="font-medium">{item.selectedPlanName ?? item.packageDuration ?? "-"}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            Plan Price
          </Label>
          <p className="font-medium">Rs. {item.selectedPlanPrice ?? 0}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            Owner Name
          </Label>
          <p className="font-medium">{item.ownerName}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            Phone Number
          </Label>
          <p className="font-medium">{item.phoneNumber}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            City
          </Label>
          <p className="font-medium">{item.city}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">
            Shop Type
          </Label>
          <p className="font-medium">{item.shopType}</p>
        </div>
      </div>
      <div className="rounded-lg border p-3 space-y-1">
        <Label className="text-xs text-muted-foreground">
          Shop Address
        </Label>
        <p className="font-medium">{item.shopAddress}</p>
      </div>
      <div className="rounded-lg border p-3 space-y-1">
        <Label className="text-xs text-muted-foreground">
          Email
        </Label>
        <p className="break-all font-medium">{item.email}</p>
      </div>
    </div>
  </DrawerContent>
</Drawer>
  );
}
