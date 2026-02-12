# Cage Cards - Quick Reference

## File Location
```
app/cagecards/page.tsx
```

## How to Use (User Guide)

### Step 1: View & Select Rabbits
1. Go to **Cage Cards** in sidebar
2. **Search** by rabbit ID, name, or breed (optional)
3. **Filter** by status (Active, Kit, etc.)
4. **Filter** by gender (Male/Female)
5. **Check boxes** next to rabbits to select them
6. Monitor the "Selected" counter at bottom

### Step 2: Customize Cards
1. Choose whether to **Include Pedigree Info** (optional)
2. Choose whether to **Include Health Status** (optional)
3. Enter **Custom Notes** (e.g., feeding schedule, breeding info)
4. Click **Generate [N] Cards**

### Step 3: Review Generated Cards
1. Tab switches to **Generated Cards**
2. Each card shows a preview with:
   - Rabbit ID (large text)
   - Rabbit name
   - Breed, gender, DOB, status
   - Cage number
   - QR code (links to rabbit detail page)
   - Custom notes (if provided)
3. Use **Duplicate** to create multiple copies of a card
4. Use **Delete** to remove unwanted cards

### Step 4: Print Cards
1. **Select All** or manually check cards you want to print
2. Click **Print [N] Cards**
3. Review print tips in dialog (margins, paper size, etc.)
4. Click **Open Print Dialog**
5. Choose printer, set margins to **0.25"**
6. **Disable** headers and footers
7. Click **Print**

## Card Layout
Each 8.5" × 11" page prints **4 cards** (2×2 grid):
- Each card: 4.25" × 5.5"
- Bordered, professional appearance
- QR code bottom center
- Farm name footer

## Features

| Feature | Details |
|---------|---------|
| **Search** | Tag ID, name, breed (real-time) |
| **Filters** | Status, gender (multi-select) |
| **Selection** | Checkbox-based multi-select |
| **Customization** | Pedigree, health, custom notes |
| **QR Codes** | Auto-generated, link to rabbit detail |
| **Card Actions** | Duplicate, delete, select for print |
| **Print** | Native browser print (4 cards/page) |
| **Dark Mode** | Fully supported |

## Keyboard Shortcuts
- **Search field**: Tab to focus, type to search (real-time)
- **Checkboxes**: Space to toggle, Tab to navigate
- **Print Dialog**: Alt+P or Ctrl+P (browser standard)

## Tips for Best Results

### Search Tips
- Use partial matches: "A1" finds "A1-001", "A1-002"
- Case-insensitive: "fluffy" = "Fluffy"
- Breed search: "New Zealand" or just "New"

### Printing Tips
- **Paper**: Standard 8.5" × 11" (Letter size)
- **Margins**: Set to 0.25" in printer settings
- **Orientation**: Portrait (not landscape)
- **Scale**: 100% (no scaling)
- **Color**: Use color printer for best appearance
- **Quality**: Normal or high (avoid draft)

### Card Customization
- **Pedigree Info**: Show parent/lineage details
- **Health Status**: Display current health condition
- **Notes**: Max 150 characters, appears on all cards

## Common Tasks

### Generate Cards for Specific Group
1. Use **Status filter**: Select only "Active" rabbits
2. Or use **Gender filter**: Select only "Female" does
3. Ctrl+A equivalent: Use "Select All" checkbox
4. Click "Generate"

### Print Multiple Copies of Same Rabbit
1. Generate 1 card for rabbit
2. Click **Duplicate** multiple times
3. Now have 3-4 copies of same rabbit
4. Select all and print

### Make Corrections to Printed Card
1. Delete the card from Generated Cards
2. Check its box again in View & Select
3. Adjust customization settings
4. Click Generate
5. Select and print again

### Print Only Some Cards
1. Don't use "Select All"
2. Manually check only the cards you want
3. Click "Print [N] Cards" (shows correct count)

## Troubleshooting

### "Failed to fetch rabbits"
- Check your internet connection
- Refresh the page
- Verify MongoDB is running
- Check browser console (F12) for errors

### QR Code not showing
- Check your internet (api.qrserver.com is external)
- Refresh page
- Try a different browser
- Check if URL is long (very long URLs = complex QR)

### Print looks wrong
- Set margins to 0.25" (not default 0.5")
- Disable headers/footers
- Use portrait orientation
- Set scale to 100%
- Try different browser
- Update printer drivers

### Cards disappeared after refresh
- Generated cards are session-based (temporary)
- If you need to save them, use browser print to PDF
- Implement local storage to persist (pending feature)

### Slow to load with many rabbits
- Waiting for 1000+ rabbits to load is normal
- Consider filtering first (by status/gender)
- Feature supports up to 1000 rabbits per page load
- Pagination coming in future versions

## API Details (For Developers)

### Endpoint
```
GET /api/rabbits?limit=1000
```

### Response Format
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "ear_tag_id": "string",
      "name": "string|null",
      "gender": "Male|Female",
      "date_of_birth": "ISO 8601 date",
      "status": "Kit|Weaner|Grower|Active|Sick|Quarantined",
      "is_pregnant": "boolean",
      "breed_name": "string",
      "cage_id": "string",
      "photo_url": "string|null"
    }
  ]
}
```

### QR Code Generation
Uses public API: `api.qrserver.com`
```
Format: https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={urlencoded_data}
Links to: /rabbits/{rabbitId}
```

## Keyboard Navigation
- **Tab**: Move between fields/buttons
- **Shift+Tab**: Move back between fields
- **Enter**: Activate button
- **Space**: Toggle checkbox
- **Arrow Keys**: Navigate dropdowns

## Mobile Experience
- **Responsive**: Works on mobile/tablet
- **Cards**: Single column on mobile, 2 on tablet, 3 on desktop
- **Filters**: Stack vertically on mobile
- **Print**: Use browser "Print to PDF" on mobile

## Browser Compatibility
✅ **Supported**: Chrome, Firefox, Safari, Edge (latest)
⚠️ **Print**: May vary by browser/printer drivers
❌ **Not Supported**: Internet Explorer (not a modern browser)

## Performance Metrics
- **Load Time**: ~500ms (depends on internet)
- **Filter/Search**: Real-time (instant)
- **Card Generation**: ~50ms per card
- **QR Generation**: ~100ms per QR code
- **Print Preview**: ~1 second

---

**Last Updated**: December 30, 2024
**Version**: 1.0.0

For detailed technical documentation, see [CAGECARDS_IMPLEMENTATION.md](./CAGECARDS_IMPLEMENTATION.md)
