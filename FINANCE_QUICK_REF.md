# Finance Dashboard - Quick Reference

## 🎯 What Was Built

A complete **Profit & Loss (P&L) Dashboard** for the rabbit farming application that provides financial insights through:
- Real-time KPI cards (Revenue, Expenses, Profit, Margin)
- Interactive charts showing revenue vs expenses trends
- Category breakdowns for revenue sources and expense types
- Transaction history with top 5 recent sales and expenses
- Time period filtering (7d, 30d, 90d, YTD, All Time)

## 📂 Files Created

### API Endpoint
- **`app/api/finance/route.ts`** - Aggregates financial data from MongoDB

### Components
- **`components/finance/KPICard.tsx`** - Key performance indicator cards
- **`components/finance/PeriodSelector.tsx`** - Time period buttons
- **`components/finance/RevenueExpenseChart.tsx`** - Daily trends chart
- **`components/finance/CategoryBreakdown.tsx`** - Revenue/expense visualization

### Pages
- **`app/finances/finances-page-client.tsx`** - Client component with data fetching
- **`app/finances/page.tsx`** - Updated main Finance page

### Documentation
- **`FINANCE_DASHBOARD_README.md`** - Complete implementation guide

## 🚀 Quick Start

1. **Access Dashboard**: Navigate to `/finances` from the sidebar
2. **Select Period**: Click a time period button (default: 30 days)
3. **View Metrics**: KPI cards update with your selected period
4. **Analyze Charts**: See revenue vs expense trends and breakdowns
5. **Review Transactions**: Check top sales and recent expenses

## 🎨 Design Features

✅ **Responsive Design**: Works on mobile, tablet, and desktop
✅ **Dark/Light Mode**: Automatically follows system theme
✅ **Loading States**: Skeleton placeholders while fetching
✅ **Error Handling**: User-friendly error messages
✅ **Accessibility**: ARIA labels and keyboard navigation
✅ **Professional Styling**: Tailwind CSS + shadcn/ui components

## 💾 Data Sources

The dashboard queries:
- **Sales Collection**: Revenue from rabbits and by-products (Manure, Urine, Pelts)
- **Expenses Collection**: Farm expenses by category (Feed, Medical, Cages, Labor, Utility, etc.)

## 🔄 How It Works

```
User visits /finances
    ↓
Page loads with default 30-day period
    ↓
Client fetches /api/finance?period=30d
    ↓
API aggregates data from MongoDB
    ↓
Components render with live data
    ↓
User selects different period
    ↓
Data automatically refreshes
```

## 📊 Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Profit & Loss                          │
│  Monitor farm's financial performance   │
│  [7d] [30d] [90d] [YTD] [All Time]    │
├─────────────────────────────────────────┤
│ Total Revenue  │ Total Expenses         │
│     $5,230     │      $2,100            │
├─────────────────────────────────────────┤
│ Net Profit/Loss │ Profit Margin         │
│     $3,130      │      59.8%             │
├─────────────────────────────────────────┤
│   Revenue vs Expenses Chart (Full Width)│
│   [Line/Bar chart showing daily trends] │
├─────────────────────────────────────────┤
│ Revenue Breakdown  │  Expense Breakdown │
│ [Horizontal bars]  │  [Horizontal bars] │
├─────────────────────────────────────────┤
│ Top 5 Sales        │  Top 5 Expenses    │
│ [Transaction list] │  [Transaction list]│
└─────────────────────────────────────────┘
```

## 🎯 KPI Cards Explained

| Card | Meaning | Color |
|------|---------|-------|
| **Total Revenue** | All income from sales | Green ✅ |
| **Total Expenses** | All farm expenses | Amber ⚠️ |
| **Net Profit/Loss** | Revenue - Expenses | Green ✅ / Red ❌ |
| **Profit Margin %** | Profit as % of revenue | Green/Amber/Red |

## 📈 Chart Types

### Revenue vs Expenses Chart
- **X-axis**: Dates (formatted as "Jan 1", "Jan 2", etc.)
- **Y-axis**: USD amounts
- **Green bars**: Revenue
- **Red bars**: Expenses
- **Hover**: Shows exact amounts

### Category Breakdowns
- **Horizontal bars**: Proportional to amount
- **Color-coded**: Each category has unique color
- **Percentage**: Shows what % of total
- **Count**: Number of transactions in category

## 💡 Use Cases

1. **Monitor Profitability**: Quick view of profit/loss by period
2. **Identify Trends**: See if revenue is growing and expenses controlled
3. **Category Analysis**: Which products earn most? Which categories cost most?
4. **Decision Making**: Data-driven insights for farm operations
5. **Performance Reports**: Share period-specific P&L snapshots

## ⚙️ Customization

### Change Default Period
In `finances-page-client.tsx`:
```typescript
const [period, setPeriod] = useState('30d'); // Change this value
```

### Add More Expense Categories
In `database/expense.model.ts`, update the enum:
```typescript
category: { 
  type: String, 
  enum: ['Feed', 'Medical', ..., 'YourNewCategory'],
}
```

### Customize Colors
In component files, update the COLORS array:
```typescript
const COLORS = ['#10b981', '#f59e0b', ...];
```

## 📱 Browser Support

✅ Chrome/Edge (v90+)
✅ Firefox (v88+)
✅ Safari (v14+)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Notes on Security

- Uses MongoDB aggregation for efficient, safe queries
- User ID filtering ensures data isolation
- Date ranges validated server-side
- No sensitive data in frontend components

## 🆘 Troubleshooting

**Problem**: No data shows up
- **Solution**: Ensure seed data exists in MongoDB. Check `api/seed/expenses` and `api/seed/sales` routes.

**Problem**: Chart looks blank
- **Solution**: Verify `dailyTrends` data in API response. Check browser console for errors.

**Problem**: Styling looks wrong
- **Solution**: Clear Next.js cache: `rm -rf .next && npm run build`

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify API endpoint returns data: `GET /api/finance?period=30d`
3. Ensure MongoDB is connected and populated with test data
4. Review FINANCE_DASHBOARD_README.md for detailed documentation

---

**Status**: ✅ Complete and ready to use
**Last Updated**: December 25, 2025
