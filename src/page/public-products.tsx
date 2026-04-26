import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/login/authContext"
import type { AuthUser } from "@/components/login/authContext"
import { LoginDialog } from "@/components/login/login-dialog"
import { ThemeSwitch } from "@/components/themeswitcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProductStore } from "@/store/product-store"
import { useCustomerStore } from "@/store/customer-store"
import { usePublicCommerceStore } from "@/store/public-commerce-store"
import { useShopStore } from "@/store/shop-store"
import { isShopActiveStatus } from "@/lib/package-utils"
import {
  ClipboardList,
  Home,
  Heart,
  LogOut,
  Minus,
  User,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react"

type PublicView = "catalog" | "cart" | "favorites" | "orders"
type PriceMode = "default" | "lowToHigh" | "highToLow" | "custom"

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`
}

function formatCustomerStatus(status: string) {
  return status === "Delivered" ? "Done / Successful" : status
}

export default function PublicProductsPage() {
  const { user, logout } = useAuth()
  const { products } = useProductStore()
  const { findCustomerByEmail } = useCustomerStore()
  const { shops } = useShopStore()
  const {
    setActiveCustomer,
    cartItems,
    favoriteProductIds,
    orders,
    addToCart,
    increaseCartItem,
    decreaseCartItem,
    removeFromCart,
    toggleFavorite,
    placeOrder,
    updateOrderStatus,
  } = usePublicCommerceStore()

  const [activeView, setActiveView] = useState<PublicView>("catalog")
  const [search, setSearch] = useState("")
  const [selectedShopType, setSelectedShopType] = useState("all")
  const [priceMode, setPriceMode] = useState<PriceMode>("default")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [note, setNote] = useState("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [pendingAddToCartProductId, setPendingAddToCartProductId] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role === "customer" && user.email) {
      setActiveCustomer(user.email)
      return
    }

    setActiveCustomer(null)
  }, [setActiveCustomer, user?.email, user?.role])

  const loggedInCustomer = useMemo(
    () =>
      user?.role === "customer" && user.email
        ? findCustomerByEmail(user.email) ?? null
        : null,
    [findCustomerByEmail, user?.email, user?.role],
  )

  const shopByEmail = useMemo(
    () =>
      new Map(
        shops
          .filter((shop) => isShopActiveStatus(shop))
          .map((shop) => [shop.email.toLowerCase().trim(), shop]),
      ),
    [shops],
  )

  const productsWithShopType = useMemo(
    () =>
      products
        .map((product) => {
        const shop = shopByEmail.get(product.ownerEmail.toLowerCase().trim())

        if (!shop) {
          return null
        }

        return {
          ...product,
          shopType: shop?.shopType || "Unknown",
          shopName: shop?.shopName || product.ownerName,
        }
      })
      .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    [products, shopByEmail],
  )

  const availableShopTypes = useMemo(
    () =>
      Array.from(
        new Set(
          shops
            .filter((shop) => isShopActiveStatus(shop))
            .map((shop) => shop.shopType)
            .filter((shopType) => Boolean(shopType && shopType.trim())),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [shops],
  )

  const favoriteProducts = useMemo(
    () =>
      productsWithShopType.filter((product) =>
        favoriteProductIds.includes(product.id),
      ),
    [favoriteProductIds, productsWithShopType],
  )

  const query = search.trim().toLowerCase()
  const parsedMinPrice = Number(minPrice)
  const parsedMaxPrice = Number(maxPrice)
  const hasCustomRange = priceMode === "custom"

  const matchesPriceRange = (price: number) => {
    if (!hasCustomRange) {
      return true
    }

    const minMatches = !Number.isFinite(parsedMinPrice) || minPrice.trim() === "" || price >= parsedMinPrice
    const maxMatches = !Number.isFinite(parsedMaxPrice) || maxPrice.trim() === "" || price <= parsedMaxPrice

    return minMatches && maxMatches
  }

  const applyPriceMode = (items: typeof productsWithShopType) => {
    if (priceMode === "lowToHigh") {
      return [...items].sort((left, right) => left.price - right.price)
    }

    if (priceMode === "highToLow") {
      return [...items].sort((left, right) => right.price - left.price)
    }

    return items
  }

  const filterProducts = (items: typeof productsWithShopType) =>
    applyPriceMode(
      items.filter((product) => {
        const matchesType =
          selectedShopType === "all" || product.shopType === selectedShopType

        if (!matchesType || !matchesPriceRange(product.price)) {
          return false
        }

        if (!query) {
          return true
        }

        return (
          product.productName.toLowerCase().includes(query) ||
          product.shopName.toLowerCase().includes(query)
        )
      }),
    )

  const filteredProducts = useMemo(
    () => filterProducts(productsWithShopType),
    [priceMode, productsWithShopType, query, selectedShopType, minPrice, maxPrice],
  )

  const filteredFavorites = useMemo(
    () => filterProducts(favoriteProducts),
    [favoriteProducts, priceMode, query, selectedShopType, minPrice, maxPrice],
  )

  const cartLines = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = productsWithShopType.find(
            (existing) => existing.id === item.productId,
          )

          if (!product) {
            return null
          }

          const quantity = Math.min(item.quantity, product.quantity)

          return {
            ...item,
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
          }
        })
        .filter((line): line is NonNullable<typeof line> => Boolean(line && line.quantity > 0)),
    [cartItems, productsWithShopType],
  )

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.totalPrice, 0),
    [cartLines],
  )

  const visibleProducts =
    activeView === "favorites" ? filteredFavorites : filteredProducts

  const performAddToCart = (productId: number) => {
    const targetProduct = productsWithShopType.find((product) => product.id === productId)
    const cartQuantity = cartItems.find((item) => item.productId === productId)?.quantity ?? 0

    if (!targetProduct || targetProduct.quantity <= 0) {
      toast.error("This product is out of stock")
      return
    }

    if (cartQuantity >= targetProduct.quantity) {
      toast.error(`You can order up to ${targetProduct.quantity} item(s) only`)
      return
    }

    addToCart(productId)
    toast.success("Added to cart")
  }

  const handleAddToCart = (productId: number) => {
    if (user?.role === "customer") {
      performAddToCart(productId)
      return
    }

    setPendingAddToCartProductId(productId)
    setLoginDialogOpen(true)
    toast.info("Please login or register first to add this product to your cart")
  }

  const handleAuthSuccess = (authUser: AuthUser) => {
    if (authUser.role !== "customer") {
      setPendingAddToCartProductId(null)
      return
    }

    setActiveCustomer(authUser.email)

    if (pendingAddToCartProductId !== null) {
      performAddToCart(pendingAddToCartProductId)
      setPendingAddToCartProductId(null)
    }
  }

  const handlePlaceOrder = () => {
    if (!cartLines.length) {
      toast.error("Your cart is empty")
      return
    }

    const customerPayload = loggedInCustomer
      ? {
          firstName: loggedInCustomer.firstName,
          lastName: loggedInCustomer.lastName,
          email: loggedInCustomer.email,
          customerName: `${loggedInCustomer.firstName} ${loggedInCustomer.lastName}`.trim(),
          phone: loggedInCustomer.phone,
          address: loggedInCustomer.address,
          city: loggedInCustomer.city,
        }
      : null

    if (!customerPayload && (!customerName.trim() || !phone.trim() || !address.trim())) {
      toast.error("Customer name, phone, and address are required")
      return
    }

    const exceedsStock = cartLines.find((line) => line.quantity > line.product.quantity)

    if (exceedsStock) {
      toast.error(`${exceedsStock.product.productName} only has ${exceedsStock.product.quantity} item(s) left`)
      return
    }

    placeOrder({
      customer: customerPayload
        ? {
            ...customerPayload,
            note,
          }
        : {
            firstName: "",
            lastName: "",
            email: "",
            customerName,
            phone,
            address,
            city: "",
            note,
          },
      items: cartLines.map((line, index) => ({
        lineId: `${Date.now()}-${index + 1}-${line.product.id}`,
        productId: line.product.id,
        productName: line.product.productName,
        ownerEmail: line.product.ownerEmail,
        ownerName: line.product.ownerName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        status: "Processing",
      })),
    })

    toast.success("Order placed successfully")
    setCustomerName("")
    setPhone("")
    setAddress("")
    setNote("")
    setActiveView("orders")
  }

  const handleCustomerCancel = (lineId: string) => {
    updateOrderStatus(lineId, "Cancelled")
    toast.success("Order cancelled")
  }

  const handleLogout = () => {
    logout()
    toast.success("Logged out")
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-background/80 backdrop-blur-xl dark:border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-slate-500">
              Public catalog
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Shop Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <Button
              type="button"
              variant={activeView === "catalog" ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setActiveView("catalog")
                setSearch("")
                setSelectedShopType("all")
                setPriceMode("default")
                setMinPrice("")
                setMaxPrice("")
              }}
            >
              <Home className="size-4" />
              Home
            </Button>
            <Button
              type="button"
              variant={activeView === "cart" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveView("cart")}
            >
              <ShoppingCart className="size-4" />
              Cart
              <Badge variant="secondary">{cartLines.length}</Badge>
            </Button>
            <Button
              type="button"
              variant={activeView === "orders" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveView("orders")}
            >
              <ClipboardList className="size-4" />
              Orders
              <Badge variant="secondary">{orders.length}</Badge>
            </Button>
            <Button
              type="button"
              variant={activeView === "favorites" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveView("favorites")}
            >
              <Heart className="size-4" />
              Favorites
              <Badge variant="secondary">{favoriteProducts.length}</Badge>
            </Button>
            {loggedInCustomer ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="min-w-28">
                      <User className="size-4" />
                      {loggedInCustomer.firstName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                      <User className="size-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="size-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Customer Profile</DialogTitle>
                      <DialogDescription>
                        Your saved profile is used automatically for order checkout.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 rounded-lg border p-3 text-sm">
                      <p>
                        <span className="font-medium">Name:</span> {loggedInCustomer.firstName} {loggedInCustomer.lastName}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {loggedInCustomer.email}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {loggedInCustomer.phone}
                      </p>
                      <p>
                        <span className="font-medium">Address:</span> {loggedInCustomer.address}
                      </p>
                      <p>
                        <span className="font-medium">City:</span> {loggedInCustomer.city}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <LoginDialog
                open={loginDialogOpen}
                onOpenChange={(open) => {
                  setLoginDialogOpen(open)

                  if (!open && user?.role !== "customer") {
                    setPendingAddToCartProductId(null)
                  }
                }}
                onAuthSuccess={handleAuthSuccess}
              />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 lg:px-6">
        <section className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1fr_220px_220px_140px_140px_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name or shop name"
          />
          <Select value={selectedShopType} onValueChange={setSelectedShopType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by shop type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All shop types</SelectItem>
              {availableShopTypes.map((shopType) => (
                <SelectItem key={shopType} value={shopType}>
                  {shopType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priceMode} onValueChange={(value) => setPriceMode(value as PriceMode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Price filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lowToHigh">Low to high</SelectItem>
              <SelectItem value="highToLow">High to low</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {priceMode === "custom" ? (
            <>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min price"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max price"
              />
            </>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("")
              setSelectedShopType("all")
              setPriceMode("default")
              setMinPrice("")
              setMaxPrice("")
              setActiveView("catalog")
            }}
          >
            Reset filters
          </Button>
        </section>

        {/* <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
              All shops, one page
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Browse products from every shop without logging in.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              This public page shows the combined catalog from all shops. After login,
              SaaS Admins see the full admin dashboard and Shop Admins see their own shop workspace.
            </p>
          </div>

          <Card className="border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                  <Boxes className="size-4" />
                  Products
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {products.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                  <Store className="size-4" />
                  Shops
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {shopCount}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                  <ShoppingBag className="size-4" />
                  Stock
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {totalQuantity}
                </p>
              </div>
            </CardContent>
          </Card>
        </section> */}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {activeView === "catalog" ? "Available products" : null}
                {activeView === "favorites" ? "Favorite products" : null}
                {activeView === "cart" ? "Cart" : null}
                {activeView === "orders" ? "Orders" : null}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {activeView === "catalog"
                  ? "A clean, public view of every product from every shop."
                  : null}
                {activeView === "favorites"
                  ? "Products you have marked with the heart icon."
                  : null}
                {activeView === "cart"
                  ? "Review items, adjust quantity, and place your order."
                  : null}
                {activeView === "orders"
                  ? "Your completed orders are saved below."
                  : null}
              </p>
            </div>
          </div>

          {(activeView === "catalog" || activeView === "favorites") &&
          visibleProducts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const isFavorite = favoriteProductIds.includes(product.id)

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-white/5">
                        No image available
                      </div>
                    )}

                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-semibold text-slate-950 dark:text-slate-50">
                            {product.productName}
                          </h4>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-300">
                            {product.shopName}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          {product.quantity} left
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>Price</span>
                          <span className="font-semibold text-slate-950 dark:text-slate-50">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Shop type</span>
                          <Badge variant="outline">{product.shopType}</Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Discount</span>
                          <span className="font-medium text-slate-950 dark:text-slate-50">
                            {product.discount > 0
                              ? `${product.discount}% off`
                              : "No discount"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={isFavorite ? "secondary" : "outline"}
                          onClick={() => {
                            toggleFavorite(product.id)
                            toast.success(
                              isFavorite
                                ? "Removed from favorites"
                                : "Added to favorites",
                            )
                          }}
                        >
                          <Heart
                            className={`size-4 ${isFavorite ? "fill-current" : ""}`}
                          />
                          Favorite
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.quantity <= 0}
                        >
                          <ShoppingCart className="size-4" />
                          Add to cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}

          {activeView === "cart" ? (
            <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
              <div className="space-y-3">
                {cartLines.length ? (
                  cartLines.map((line) => (
                    <Card
                      key={line.product.id}
                      className="border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
                    >
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-slate-950 dark:text-slate-50">
                              {line.product.productName}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-300">
                              {line.product.shopName}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeFromCart(line.product.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Price
                            </p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
                              {formatCurrency(line.unitPrice)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Quantity
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() => decreaseCartItem(line.product.id)}
                              >
                                <Minus className="size-3" />
                              </Button>
                              <span className="min-w-8 text-center font-semibold text-slate-950 dark:text-slate-50">
                                {line.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() => {
                                  if (line.quantity >= line.product.quantity) {
                                    toast.error("No more stock available")
                                    return
                                  }
                                  increaseCartItem(line.product.id)
                                }}
                              >
                                <Plus className="size-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Total
                            </p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
                              {formatCurrency(line.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-slate-300 bg-white/70 dark:border-white/10 dark:bg-white/5">
                    <CardContent className="py-12 text-center text-slate-600 dark:text-slate-300">
                      Your cart is empty.
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="h-fit border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
                <CardContent className="space-y-4 p-4">
                  <h4 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                    Order summary
                  </h4>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm text-slate-500 dark:text-slate-300">Total amount</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
                      {formatCurrency(cartTotal)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {loggedInCustomer ? (
                      <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm dark:border-white/10">
                        <p className="font-medium text-slate-950 dark:text-slate-50">
                          {loggedInCustomer.firstName} {loggedInCustomer.lastName}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {loggedInCustomer.email}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {loggedInCustomer.phone}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {loggedInCustomer.address}, {loggedInCustomer.city}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Input
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          placeholder="Customer name"
                        />
                        <Input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="Phone number"
                        />
                        <Input
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          placeholder="Delivery address"
                        />
                      </>
                    )}
                    <Input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Order note (optional)"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handlePlaceOrder}
                    disabled={!cartLines.length}
                  >
                    Complete Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeView === "orders" ? (
            orders.length ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className="border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                            Order #{order.id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge>{formatCurrency(order.totalAmount)}</Badge>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {order.customer.customerName}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {order.customer.phone}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {order.customer.address}
                        </p>
                        {order.customer.note ? (
                          <p className="text-slate-600 dark:text-slate-300">
                            Note: {order.customer.note}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order.id}-${item.productId}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {item.productName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-300">
                                {item.ownerName}
                              </p>
                              <Badge
                                variant={item.status === "Cancelled" ? "destructive" : "outline"}
                                className="mt-2"
                              >
                                {formatCustomerStatus(item.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <p className="text-slate-600 dark:text-slate-300">
                                  {formatCurrency(item.unitPrice)} x {item.quantity}
                                </p>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={item.status === "Cancelled" || item.status === "Delivered"}
                                onClick={() => handleCustomerCancel(item.lineId)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-slate-300 bg-white/70 dark:border-white/10 dark:bg-white/5">
                <CardContent className="py-12 text-center text-slate-600 dark:text-slate-300">
                  No orders yet.
                </CardContent>
              </Card>
            )
          ) : null}

          {(activeView === "catalog" || activeView === "favorites") &&
          !visibleProducts.length ? (
            <Card className="border-dashed border-slate-300 bg-white/70 dark:border-white/10 dark:bg-white/5">
              <CardContent className="py-16 text-center text-slate-600 dark:text-slate-300">
                {activeView === "favorites"
                  ? "No favorite products match this search/filter."
                  : "No products are available yet."}
              </CardContent>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  )
}