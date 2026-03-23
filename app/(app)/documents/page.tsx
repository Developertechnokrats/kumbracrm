import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">
          Manage KYC documents and compliance files
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Documents feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
