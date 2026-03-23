'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, Calendar, DollarSign, Target, Lightbulb, Package, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string
  category: string
  price_per_share: number
  currency: string
  expected_listing_date: string | null
  profit_expectation: string | null
  minimum_investment: number
  script: string | null
  is_active: boolean
  image_url: string | null
}

type PreIPOProduct = {
  id: string
  company_name: string
  ticker_symbol: string
  description: string | null
  latest_share_price: number
  broker_sell_price: number
  logo_url: string | null
  is_active: boolean
  created_at: string
}

type Tranche = {
  id: string
  product_id: string
  tranche_name: string
  min_shares: number
  max_shares: number
  price_per_share: number
  available_shares: number
}

const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  CHF: 0.88
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [preIPOProducts, setPreIPOProducts] = useState<PreIPOProduct[]>([])
  const [tranches, setTranches] = useState<Record<string, Tranche[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPreIPO, setSelectedPreIPO] = useState<PreIPOProduct | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof CURRENCY_RATES>('USD')
  const [activeTab, setActiveTab] = useState<'structured' | 'pre-ipo'>('pre-ipo')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const supabase = createClient()

    // Load structured products (old system)
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (productsData) {
      setProducts(productsData)
      if (productsData.length > 0) {
        setSelectedProduct(productsData[0])
      }

      for (const product of productsData) {
        const { data: tranchesData } = await supabase
          .from('product_tranches')
          .select('*')
          .eq('product_id', product.id)
          .order('min_shares')

        if (tranchesData) {
          setTranches(prev => ({ ...prev, [product.id]: tranchesData }))
        }
      }
    }

    // Load Pre-IPO products (new system)
    const { data: preIPOData } = await supabase
      .from('pre_ipo_products')
      .select('*')
      .eq('is_active', true)
      .order('company_name')

    if (preIPOData) {
      setPreIPOProducts(preIPOData)
      if (preIPOData.length > 0) {
        setSelectedPreIPO(preIPOData[0])
      }
    }

    setLoading(false)
  }

  function convertCurrency(amount: number, from: string = 'USD') {
    if (from !== 'USD') return amount
    return amount * CURRENCY_RATES[selectedCurrency]
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Investment Products
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Exclusive access to Pre-IPO companies and structured products
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {Object.keys(CURRENCY_RATES).map((curr) => (
                <Button
                  key={curr}
                  variant={selectedCurrency === curr ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCurrency(curr as keyof typeof CURRENCY_RATES)}
                >
                  {curr}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'structured' | 'pre-ipo')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pre-ipo">Pre-IPO Products</TabsTrigger>
            <TabsTrigger value="structured">Structured Products</TabsTrigger>
          </TabsList>

          <TabsContent value="pre-ipo" className="space-y-6 mt-6">
            {renderPreIPOProducts()}
          </TabsContent>

          <TabsContent value="structured" className="space-y-6 mt-6">
            {renderStructuredProducts()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  function renderPreIPOProducts() {
    if (preIPOProducts.length === 0) {
      return (
        <Card className="border-2 shadow-lg bg-card">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No Pre-IPO products available</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for new investment opportunities</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {preIPOProducts.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer transition-all border-2 hover:shadow-xl hover:border-primary"
            onClick={() => setSelectedPreIPO(product)}
          >
            {product.logo_url && (
              <div className="h-32 overflow-hidden rounded-t-lg bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
                <img
                  src={product.logo_url}
                  alt={product.company_name}
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{product.company_name}</CardTitle>
                  <Badge variant="outline" className="mt-2">{product.ticker_symbol}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {product.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Latest Price:</span>
                  <span className="font-bold">{formatCurrency(convertCurrency(product.latest_share_price))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Broker Price:</span>
                  <Badge className="bg-green-600">{formatCurrency(convertCurrency(product.broker_sell_price))}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function renderStructuredProducts() {
    if (products.length === 0) {
      return (
        <Card className="border-2 shadow-lg bg-card">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No structured products available</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for new investment opportunities</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Available Opportunities</h3>
              {products.map((product) => (
                <Card
                  key={product.id}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedProduct?.id === product.id
                      ? "border-primary shadow-lg bg-primary/5"
                      : "border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
                  )}
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.image_url && (
                    <div className="h-32 overflow-hidden rounded-t-lg">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-600">{formatCurrency(convertCurrency(product.price_per_share))}/share</Badge>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {selectedProduct && (
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2 shadow-lg bg-card">
                  {selectedProduct.image_url && (
                    <div className="h-64 overflow-hidden rounded-t-xl">
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-3xl">{selectedProduct.name}</CardTitle>
                        <CardDescription className="mt-2 text-base">
                          {selectedProduct.category} Investment Opportunity
                        </CardDescription>
                      </div>
                      <Badge className="text-xl px-4 py-2 bg-green-600">
                        {formatCurrency(convertCurrency(selectedProduct.price_per_share))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tranches">Tranches</TabsTrigger>
                        <TabsTrigger value="script">Broker Script</TabsTrigger>
                        <TabsTrigger value="calculator">Calculator</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6 pt-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">About {selectedProduct.name}</h3>
                          <p className="text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="border-2 border-slate-200">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                  <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Profit Expectation</p>
                                  <p className="text-lg font-bold">
                                    {selectedProduct.profit_expectation || 'TBD'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-slate-200">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                  <Calendar className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Expected Listing</p>
                                  <p className="text-lg font-bold">
                                    {selectedProduct.expected_listing_date
                                      ? new Date(selectedProduct.expected_listing_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                      : 'TBD'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-slate-200">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                  <DollarSign className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                                  <p className="text-lg font-bold">
                                    {formatCurrency(convertCurrency(selectedProduct.minimum_investment))}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-slate-200">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                  <Target className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Price per Share</p>
                                  <p className="text-lg font-bold">
                                    {formatCurrency(convertCurrency(selectedProduct.price_per_share))}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="tranches" className="space-y-4 pt-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Investment Tranches</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Different pricing tiers based on investment volume. Larger investments receive better pricing.
                          </p>
                        </div>

                        {tranches[selectedProduct.id] && tranches[selectedProduct.id].length > 0 ? (
                          <div className="border-2 rounded-xl overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="font-bold">Tranche</TableHead>
                                  <TableHead className="font-bold">Min Shares</TableHead>
                                  <TableHead className="font-bold">Max Shares</TableHead>
                                  <TableHead className="font-bold">Price/Share</TableHead>
                                  <TableHead className="font-bold">Min Investment</TableHead>
                                  <TableHead className="font-bold">Max Investment</TableHead>
                                  <TableHead className="font-bold">Available</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tranches[selectedProduct.id].map((tranche) => (
                                  <TableRow key={tranche.id} className="hover:bg-accent/50">
                                    <TableCell className="font-semibold">{tranche.tranche_name}</TableCell>
                                    <TableCell>{tranche.min_shares.toLocaleString()}</TableCell>
                                    <TableCell>{tranche.max_shares.toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-green-600">
                                      {formatCurrency(convertCurrency(tranche.price_per_share))}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(convertCurrency(tranche.min_shares * tranche.price_per_share))}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(convertCurrency(tranche.max_shares * tranche.price_per_share))}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{tranche.available_shares.toLocaleString()} shares</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <p className="text-muted-foreground">No tranches available for this product</p>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="script" className="space-y-4 pt-6">
                        <Card className="border-2 shadow-lg bg-primary text-primary-foreground">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <Lightbulb className="h-6 w-6" />
                              </div>
                              <CardTitle className="text-2xl">Broker Script</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {selectedProduct.script ? (
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                <p className="opacity-90 leading-relaxed whitespace-pre-wrap">
                                  {selectedProduct.script}
                                </p>
                              </div>
                            ) : (
                              <p className="opacity-80">No script available for this product</p>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="calculator" className="space-y-4 pt-6">
                        <InvestmentCalculator
                          product={selectedProduct}
                          tranches={tranches[selectedProduct.id] || []}
                          currency={selectedCurrency}
                          convertCurrency={convertCurrency}
                          formatCurrency={formatCurrency}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
    )
  }
}

function InvestmentCalculator({
  product,
  tranches,
  currency,
  convertCurrency,
  formatCurrency
}: {
  product: Product
  tranches: Tranche[]
  currency: string
  convertCurrency: (amount: number) => number
  formatCurrency: (amount: number) => string
}) {
  const [shares, setShares] = useState(1000)

  const applicableTranche = tranches.find(
    t => shares >= t.min_shares && shares <= t.max_shares
  ) || tranches[tranches.length - 1]

  const pricePerShare = applicableTranche?.price_per_share || product.price_per_share
  const totalInvestment = shares * pricePerShare

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="bg-slate-50">
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Investment Calculator
        </CardTitle>
        <CardDescription>Calculate your investment amount and potential returns</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="text-sm font-semibold mb-2 block">Number of Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg font-semibold focus:border-blue-500 focus:outline-none"
            min="1"
          />
        </div>

        {applicableTranche && (
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900">Applicable Tranche:</p>
            <p className="text-lg font-bold text-blue-700">{applicableTranche.tranche_name}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Price per Share:</span>
            <span className="text-xl font-bold">{formatCurrency(convertCurrency(pricePerShare))}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <span className="text-lg font-semibold text-slate-700">Total Investment:</span>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(convertCurrency(totalInvestment))}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Conversions:</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CURRENCY_RATES).map(([curr, rate]) => (
              <div key={curr} className="p-3 bg-slate-50 rounded-lg text-sm">
                <span className="text-slate-500">{curr}:</span>
                <span className="ml-2 font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: curr as any,
                  }).format(totalInvestment * rate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
