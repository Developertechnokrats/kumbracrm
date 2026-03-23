'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingUp, Calculator, FileText, X, Save } from 'lucide-react'
import { toast } from 'sonner'

type PreIPOProduct = {
  id: string
  company_name: string
  ticker_symbol: string
  description: string | null
  broker_sell_price: number
  is_active: boolean
}

type DealTicketDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  contactName: string
  companyId: string
  onSuccess: () => void
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'CHF', symbol: 'CHF', rate: 0.88 },
  { code: 'AED', symbol: 'AED', rate: 3.67 }
]

export function DealTicketDialog({ open, onOpenChange, contactId, contactName, companyId, onSuccess }: DealTicketDialogProps) {
  const [products, setProducts] = useState<PreIPOProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<PreIPOProduct | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [shareQuantity, setShareQuantity] = useState<number>(100)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  async function loadProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('pre_ipo_products')
      .select('*')
      .eq('is_active', true)
      .order('company_name')

    if (data) {
      setProducts(data)
      if (data.length > 0) {
        setSelectedProduct(data[0])
      }
    }
  }

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const pricePerShare = selectedProduct ? selectedProduct.broker_sell_price * selectedCurrency.rate : 0
  const totalAmount = pricePerShare * shareQuantity

  async function createDealTicket() {
    if (!selectedProduct || shareQuantity <= 0) {
      toast.error('Please select a product and enter valid quantity')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('deal_tickets')
      .insert({
        company_id: companyId,
        contact_id: contactId,
        broker_id: user.id,
        product_id: selectedProduct.id,
        currency: currency,
        share_quantity: shareQuantity,
        price_per_share: pricePerShare,
        total_amount: totalAmount,
        status: 'pending',
        notes: notes || null
      })

    if (error) {
      console.error('Error creating deal ticket:', error)
      toast.error('Failed to create deal ticket')
    } else {
      toast.success('Deal ticket created successfully')
      onOpenChange(false)
      onSuccess()
      setShareQuantity(100)
      setNotes('')
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            Write Deal Ticket
          </DialogTitle>
          <DialogDescription>
            Create a Pre-IPO investment deal for {contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {products.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active Pre-IPO products available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="product">Select Pre-IPO Product</Label>
                <Select
                  value={selectedProduct?.id}
                  onValueChange={(value) => {
                    const product = products.find(p => p.id === value)
                    setSelectedProduct(product || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{product.company_name}</span>
                          <Badge variant="outline" className="ml-4">
                            {product.ticker_symbol}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct?.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Shares</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={shareQuantity}
                    onChange={(e) => setShareQuantity(parseInt(e.target.value) || 0)}
                    placeholder="100"
                  />
                </div>
              </div>

              <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                    <Calculator className="h-5 w-5" />
                    Deal Summary
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Price per Share</span>
                      </div>
                      <span className="font-bold">
                        {selectedCurrency.symbol}{pricePerShare.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm text-muted-foreground">Shares</span>
                      <span className="font-bold">{shareQuantity.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-semibold">Total Investment</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {selectedCurrency.symbol}{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this deal..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={createDealTicket}
            disabled={loading || products.length === 0 || !selectedProduct || shareQuantity <= 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Deal Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
