"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, List, CalendarDays, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/app/finances/columns"
import { SaleFormDialog } from "@/components/finances/sale-form-dialog"
import { ExpenseFormDialog } from "@/components/finances/expense-form-dialog"
import { DeleteTransactionDialog } from "@/components/finances/delete-transaction-dialog"
import { FinancesSummaryStats } from "@/components/finances/finances-summary-stats"
import { FinancesCalendar } from "@/components/finances/finances-calendar"
import { CurrencyProvider } from "@/components/providers/currency-provider"
import { getSaleForEdit, getExpenseForEdit } from "@/app/finances/actions"
import { PaymentMethod } from "@/types/enums"
import type {
  FinanceTransactionData,
  FinanceFormOptions,
  FinanceAnalyticsSummary,
  SaleDetailData,
  ExpenseDetailData,
} from "@/app/finances/types"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FinancesClient({
  initialData,
  options,
  analytics,
  currency,
}: {
  initialData: FinanceTransactionData[]
  options: FinanceFormOptions
  analytics: FinanceAnalyticsSummary
  currency: string
}) {
  const router = useRouter()

  const [saleFormOpen, setSaleFormOpen] = React.useState(false)
  const [editingSaleId, setEditingSaleId] = React.useState<string | undefined>(undefined)
  const [saleDetail, setSaleDetail] = React.useState<SaleDetailData | null | undefined>(undefined)
  const [saleLoading, setSaleLoading] = React.useState(false)

  const [expenseFormOpen, setExpenseFormOpen] = React.useState(false)
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | undefined>(undefined)
  const [expenseDetail, setExpenseDetail] = React.useState<ExpenseDetailData | null | undefined>(undefined)
  const [expenseLoading, setExpenseLoading] = React.useState(false)

  const [defaultDate, setDefaultDate] = React.useState<Date | undefined>(undefined)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<FinanceTransactionData | null>(null)

  const [filteredRows, setFilteredRows] = React.useState<FinanceTransactionData[]>(initialData)

  function refresh() {
    router.refresh()
  }

  function openCreateSale(date?: Date) {
    setEditingSaleId(undefined)
    setSaleDetail(undefined)
    setDefaultDate(date)
    setSaleFormOpen(true)
  }

  function openCreateExpense(date?: Date) {
    setEditingExpenseId(undefined)
    setExpenseDetail(undefined)
    setDefaultDate(date)
    setExpenseFormOpen(true)
  }

  async function openEdit(item: FinanceTransactionData) {
    setDefaultDate(undefined)
    if (item.kind === "sale") {
      setEditingSaleId(item.id)
      setSaleDetail(undefined)
      setSaleLoading(true)
      setSaleFormOpen(true)
      const detail = await getSaleForEdit(item.id)
      setSaleDetail(detail)
      setSaleLoading(false)
    } else {
      setEditingExpenseId(item.id)
      setExpenseDetail(undefined)
      setExpenseLoading(true)
      setExpenseFormOpen(true)
      const detail = await getExpenseForEdit(item.id)
      setExpenseDetail(detail)
      setExpenseLoading(false)
    }
  }

  const typeFacetOptions = React.useMemo(() => {
    const labels = new Set<string>()
    for (const item of initialData) labels.add(item.typeLabel)
    return Array.from(labels)
      .sort()
      .map((label) => ({ label, value: label }))
  }, [initialData])

  const facets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "kind",
        title: "Kind",
        options: [
          { label: "Sale", value: "sale" },
          { label: "Expense", value: "expense" },
        ],
      },
      {
        columnId: "typeLabel",
        title: "Type",
        options: typeFacetOptions,
      },
      {
        columnId: "paymentMethod",
        title: "Payment",
        options: Object.values(PaymentMethod).map((p) => ({ label: toTitleCase(p), value: p })),
      },
    ],
    [typeFacetOptions]
  )

  return (
    <CurrencyProvider currency={currency}>
      <FinancesSummaryStats analytics={analytics} />

      <Tabs defaultValue="list" className="gap-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add transaction
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openCreateSale()}>
                <ArrowUpCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                Log a sale
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateExpense()}>
                <ArrowDownCircle className="mr-2 h-3.5 w-3.5 text-red-600" />
                Log an expense
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="list">
          <DataTable
            columns={columns}
            data={initialData}
            searchPlaceholder="Search buyer, vendor, type, notes…"
            searchableRowAsString={(r) =>
              [r.counterparty, r.typeLabel, r.notes, r.relatedRabbitLabel, r.relatedFeedTypeLabel, r.paymentMethod]
                .filter(Boolean)
                .join(" ")
            }
            facets={facets}
            emptyMessage="No transactions yet — log your first sale or expense to get started."
            onFilteredRowsChange={setFilteredRows}
            meta={{
              onEdit: openEdit,
              onDelete: (item) => {
                setDeleteTarget(item)
                setDeleteOpen(true)
              },
            }}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <FinancesCalendar
            items={filteredRows}
            onEventClick={openEdit}
            onAddSale={openCreateSale}
            onAddExpense={openCreateExpense}
          />
        </TabsContent>
      </Tabs>

      <SaleFormDialog
        open={saleFormOpen}
        onOpenChange={setSaleFormOpen}
        options={options}
        saleId={editingSaleId}
        detail={saleDetail}
        loading={saleLoading}
        defaultDate={defaultDate}
        onSaved={refresh}
      />

      <ExpenseFormDialog
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        options={options}
        expenseId={editingExpenseId}
        detail={expenseDetail}
        loading={expenseLoading}
        defaultDate={defaultDate}
        onSaved={refresh}
      />

      <DeleteTransactionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        transaction={deleteTarget}
        onDeleted={refresh}
      />
    </CurrencyProvider>
  )
}
