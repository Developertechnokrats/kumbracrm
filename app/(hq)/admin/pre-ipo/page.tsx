'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Building2, DollarSign, TrendingUp, Edit, Save, X, Sparkles, TrendingDown, Eye } from 'lucide-react'
import { toast } from 'sonner'

type PreIPOProduct = {
  id: string
  company_name: string
  ticker_symbol: string
  description: string | null
  latest_share_price: number | null
  broker_sell_price: number
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PreIPOManagementPage() {
  const [products, setProducts] = useState<PreIPOProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<PreIPOProduct | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const supabase = createClient()

    const { data } = await supabase
      .from('pre_ipo_products')
      .select('*')
      .order('company_name')

    if (data) {
      setProducts(data)
    }

    setLoading(false)
  }

  async function updateProduct(product: PreIPOProduct) {
    const supabase = createClient()

    const { error } = await supabase
      .from('pre_ipo_products')
      .update({
        broker_sell_price: product.broker_sell_price,
        latest_share_price: product.latest_share_price,
        description: product.description,
        is_active: product.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)

    if (error) {
      toast.error('Failed to update product')
    } else {
      toast.success('Product updated successfully')
      setEditDialogOpen(false)
      setEditingProduct(null)
      loadProducts()
    }
  }

  const activeProducts = products.filter(p => p.is_active)
  const totalValue = products.reduce((sum, p) => sum + (p.broker_sell_price * 1000), 0)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Pre-IPO products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Pre-IPO Marketplace
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Manage exclusive investment opportunities
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Offerings</p>
                  <p className="text-3xl font-bold">{activeProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-3xl font-bold">${(totalValue / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const priceChange = product.latest_share_price
              ? ((product.broker_sell_price - product.latest_share_price) / product.latest_share_price * 100)
              : 0

            return (
              <Card
                key={product.id}
                className="group border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
                  <div className="flex items-start justify-between relative">
                    <div className="flex items-center gap-4 flex-1">
                      {product.logo_url ? (
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-md border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                            <img
                              src={product.logo_url}
                              alt={product.company_name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-2xl font-bold text-primary">${product.company_name.charAt(0)}</span></div>`
                              }}
                            />
                          </div>
                          {product.is_active && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                          <span className="text-2xl font-bold text-white">{product.company_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1 truncate">{product.company_name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{product.ticker_symbol}</Badge>
                          {product.is_active ? (
                            <Badge className="bg-green-600 text-xs">Live</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={async (checked) => {
                        await updateProduct({ ...product, is_active: checked })
                      }}
                      className="ml-2"
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Market Price</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        ${product.latest_share_price?.toFixed(2) || 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-900 dark:text-green-300">Sell Price</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ${product.broker_sell_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {product.latest_share_price && (
                    <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                      priceChange >= 0
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    }`}>
                      {priceChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className={`text-sm font-bold ${
                        priceChange >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% markup
                      </span>
                    </div>
                  )}

                  {product.description && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setEditingProduct(product)
                      setEditDialogOpen(true)
                    }}
                    className="w-full mt-2"
                    variant="outline"
                    size="lg"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {editingProduct?.logo_url && (
                <img
                  src={editingProduct.logo_url}
                  alt={editingProduct.company_name}
                  className="w-10 h-10 object-contain"
                />
              )}
              Edit {editingProduct?.company_name}
            </DialogTitle>
            <DialogDescription>
              Update pricing and product information for this Pre-IPO offering
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latest_price" className="text-sm font-semibold">
                    Latest Market Price (USD)
                  </Label>
                  <Input
                    id="latest_price"
                    type="number"
                    step="0.01"
                    value={editingProduct.latest_share_price || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        latest_share_price: parseFloat(e.target.value) || null
                      })
                    }
                    placeholder="110.00"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">Current market valuation per share</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker_price" className="text-sm font-semibold">
                    Broker Sell Price (USD)
                  </Label>
                  <Input
                    id="broker_price"
                    type="number"
                    step="0.01"
                    value={editingProduct.broker_sell_price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        broker_sell_price: parseFloat(e.target.value) || 0
                      })
                    }
                    placeholder="115.00"
                    required
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">Price offered to clients</p>
                </div>
              </div>

              {editingProduct.latest_share_price && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Markup Percentage:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {((editingProduct.broker_sell_price - editingProduct.latest_share_price) / editingProduct.latest_share_price * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Company Description
                </Label>
                <Textarea
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value
                    })
                  }
                  placeholder="Brief overview of the company and its market position..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg border-2">
                <div>
                  <Label htmlFor="is_active" className="text-base font-semibold">Product Availability</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable or disable this product for broker sales
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) =>
                    setEditingProduct({
                      ...editingProduct,
                      is_active: checked
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingProduct(null)
              }}
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingProduct) {
                  updateProduct(editingProduct)
                }
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
