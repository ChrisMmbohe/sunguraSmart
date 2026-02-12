'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { 
  FileText, 
  Printer, 
  Plus, 
  Search, 
  AlertCircle, 
  Loader2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// ============================================
// TYPES
// ============================================
interface RabbitData {
  _id: string;
  ear_tag_id: string;
  name?: string;
  gender: string;
  date_of_birth: string;
  status: string;
  is_pregnant: boolean;
  breed_name: string;
  cage_id: string;
  photo_url?: string;
}

interface CageCardData {
  id: string;
  rabbitId: string;
  rabbitTag: string;
  rabbitName: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  cageId: string;
  includePedigree: boolean;
  includeHealth: boolean;
  customNotes: string;
  qrCodeUrl: string;
  photoUrl?: string;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function CageCardsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(true);
  const [rabbits, setRabbits] = useState<RabbitData[]>([]);
  const [filteredRabbits, setFilteredRabbits] = useState<RabbitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRabbits, setSelectedRabbits] = useState<string[]>([]);
  const [generatedCards, setGeneratedCards] = useState<CageCardData[]>([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedCardsToPrint, setSelectedCardsToPrint] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [customNotes, setCustomNotes] = useState('');
  const [includePedigree, setIncludePedigree] = useState(true);
  const [includeHealth, setIncludeHealth] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // ============================================
  // FETCH RABBITS
  // ============================================
  useEffect(() => {
    const fetchRabbits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/rabbits?limit=1000', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rabbits');
        }

        const data = await response.json();
        setRabbits(data.data || []);
        setFilteredRabbits(data.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rabbits';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRabbits();
  }, [user]);

  // ============================================
  // SEARCH & FILTER
  // ============================================
  useEffect(() => {
    const filtered = rabbits.filter(rabbit => {
      const matchesSearch =
        rabbit.ear_tag_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rabbit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rabbit.breed_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || rabbit.status === filterStatus;
      const matchesGender = filterGender === 'all' || rabbit.gender === filterGender;

      return matchesSearch && matchesStatus && matchesGender;
    });

    setFilteredRabbits(filtered);
  }, [searchTerm, rabbits, filterStatus, filterGender]);

  // ============================================
  // GENERATE QR CODE URL
  // ============================================
  const generateQRCodeUrl = (rabbitId: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const rabbitUrl = `${baseUrl}/rabbits/${rabbitId}`;
    // Using QR Server API for free QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rabbitUrl)}`;
  };

  // ============================================
  // GENERATE CAGE CARDS
  // ============================================
  const handleGenerateCards = () => {
    if (selectedRabbits.length === 0) {
      toast.error('Please select at least one rabbit');
      return;
    }

    try {
      const newCards: CageCardData[] = selectedRabbits.map(rabbitId => {
        const rabbit = rabbits.find(r => r._id === rabbitId);
        if (!rabbit) return null;

        return {
          id: `${rabbitId}-${Date.now()}`,
          rabbitId,
          rabbitTag: rabbit.ear_tag_id,
          rabbitName: rabbit.name || 'N/A',
          breed: rabbit.breed_name,
          gender: rabbit.gender,
          dateOfBirth: new Date(rabbit.date_of_birth).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          status: rabbit.status,
          cageId: rabbit.cage_id,
          includePedigree,
          includeHealth,
          customNotes,
          qrCodeUrl: generateQRCodeUrl(rabbitId),
          photoUrl: rabbit.photo_url,
        };
      }).filter(Boolean) as CageCardData[];

      setGeneratedCards(prev => [...prev, ...newCards]);
      setSelectedRabbits([]);
      setCustomNotes('');
      toast.success(`Generated ${newCards.length} cage card(s)`);
      setActiveTab('generate');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate cards';
      toast.error(errorMessage);
    }
  };

  // ============================================
  // PRINT CARDS
  // ============================================
  const handlePrint = () => {
    if (selectedCardsToPrint.length === 0) {
      toast.error('Please select at least one card to print');
      return;
    }

    setTimeout(() => {
      window.print();
      setPrintDialogOpen(false);
      toast.success('Opening print dialog...');
    }, 200);
  };

  // ============================================
  // DELETE CARD
  // ============================================
  const handleDeleteCard = (cardId: string) => {
    setGeneratedCards(prev => prev.filter(card => card.id !== cardId));
    setSelectedCardsToPrint(prev => prev.filter(id => id !== cardId));
    toast.success('Card removed');
  };

  // ============================================
  // COPY CARD
  // ============================================
  const handleDuplicateCard = (cardId: string) => {
    const card = generatedCards.find(c => c.id === cardId);
    if (!card) return;

    const newCard = {
      ...card,
      id: `${card.rabbitId}-${Date.now()}`,
    };

    setGeneratedCards(prev => [...prev, newCard]);
    toast.success('Card duplicated');
  };

  // ============================================
  // RENDER: ERROR STATE
  // ============================================
  if (!user) {
    return (
      <SidebarProvider
        style={{
          '--sidebar-width': 'calc(var(--spacing) * 60)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 p-10 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
              <AlertCircle className="mr-3 h-5 w-5" />
              Please sign in to access cage cards
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // ============================================
  // RENDER: MAIN PAGE
  // ============================================
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 60)',
        '--header-height': 'calc(var(--spacing) * 12)',
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cage Cards</h1>
              <p className="text-muted-foreground mt-1">
                Generate and print customizable cage cards for your rabbits
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Rabbits</p>
              <p className="text-2xl font-bold">{rabbits.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Generated Cards</p>
              <p className="text-2xl font-bold">{generatedCards.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Active Rabbits</p>
              <p className="text-2xl font-bold">{rabbits.filter(r => r.status === 'Active').length}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="mr-3 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm">Please check your database connection and try again.</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="view">View & Select Rabbits</TabsTrigger>
              <TabsTrigger value="generate">Generated Cards ({generatedCards.length})</TabsTrigger>
            </TabsList>

            {/* ========== TAB 1: VIEW RABBITS ========== */}
            <TabsContent value="view" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rabbit Selection</CardTitle>
                  <CardDescription>
                    Select rabbits to generate cage cards. Search and filter to find specific rabbits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search & Filter Controls */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search by tag ID, name, or breed..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Kit">Kit</SelectItem>
                          <SelectItem value="Weaner">Weaner</SelectItem>
                          <SelectItem value="Grower">Grower</SelectItem>
                          <SelectItem value="Sick">Sick</SelectItem>
                          <SelectItem value="Quarantined">Quarantined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger id="gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading rabbits...</span>
                    </div>
                  ) : filteredRabbits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        {rabbits.length === 0 ? 'No rabbits found. Add rabbits first.' : 'No rabbits match your filters.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Rabbit List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredRabbits.map(rabbit => (
                          <div
                            key={rabbit._id}
                            className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={`rabbit-${rabbit._id}`}
                              checked={selectedRabbits.includes(rabbit._id)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setSelectedRabbits(prev => [...prev, rabbit._id]);
                                } else {
                                  setSelectedRabbits(prev => prev.filter(id => id !== rabbit._id));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {rabbit.ear_tag_id}
                                {rabbit.name && ` - ${rabbit.name}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {rabbit.breed_name} • {rabbit.gender} • {rabbit.status}
                                {rabbit.is_pregnant && ' (Pregnant)'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                DOB: {new Date(rabbit.date_of_birth).toLocaleDateString()} • Cage: {rabbit.cage_id}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Selection Info */}
                      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Selected: {selectedRabbits.length} of {filteredRabbits.length} rabbits
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card Customization */}
              {!loading && filteredRabbits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Card Customization</CardTitle>
                    <CardDescription>
                      Configure what information to include on the generated cage cards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Include Options */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="include-pedigree"
                          checked={includePedigree}
                          onCheckedChange={(checked) => {
                            if (checked !== 'indeterminate') setIncludePedigree(checked);
                          }}
                        />
                        <Label htmlFor="include-pedigree" className="cursor-pointer">
                          <span className="font-medium">Include Pedigree Info</span>
                          <p className="text-xs text-muted-foreground mt-1">Show parent information</p>
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="include-health"
                          checked={includeHealth}
                          onCheckedChange={(checked) => {
                            if (checked !== 'indeterminate') setIncludeHealth(checked);
                          }}
                        />
                        <Label htmlFor="include-health" className="cursor-pointer">
                          <span className="font-medium">Include Health Status</span>
                          <p className="text-xs text-muted-foreground mt-1">Display current health info</p>
                        </Label>
                      </div>
                    </div>

                    {/* Custom Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Custom Notes (Optional)</Label>
                      <textarea
                        id="notes"
                        placeholder="Add any custom notes to appear on all cards (e.g., feeding instructions, breeding info)..."
                        value={customNotes}
                        onChange={e => setCustomNotes(e.target.value)}
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-xs text-muted-foreground">Max 150 characters</p>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateCards}
                      disabled={selectedRabbits.length === 0 || loading}
                      className="w-full"
                      size="lg"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Generate {selectedRabbits.length} Card{selectedRabbits.length !== 1 ? 's' : ''}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ========== TAB 2: GENERATED CARDS ========== */}
            <TabsContent value="generate" className="space-y-4">
              {generatedCards.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Cards Generated Yet</CardTitle>
                    <CardDescription>
                      Go to the &quot;View &amp; Select Rabbits&quot; tab to generate cage cards.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <>
                  {/* Print Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Print Options</CardTitle>
                      <CardDescription>
                        Select cards and print them. Layout: 2 cards per row, optimized for 8.5&quot;x11&quot; paper.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="select-all"
                            checked={selectedCardsToPrint.length === generatedCards.length}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedCardsToPrint(generatedCards.map(c => c.id));
                              } else {
                                setSelectedCardsToPrint([]);
                              }
                            }}
                          />
                          <Label htmlFor="select-all" className="cursor-pointer">
                            Select All Cards ({generatedCards.length})
                          </Label>
                        </div>
                      </div>

                      <Button
                        onClick={() => setPrintDialogOpen(true)}
                        disabled={selectedCardsToPrint.length === 0}
                        className="w-full sm:w-auto"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print {selectedCardsToPrint.length} Card{selectedCardsToPrint.length !== 1 ? 's' : ''}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Cards Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {generatedCards.map(card => (
                      <Card key={card.id} className="flex flex-col overflow-hidden">
                        {/* Card Preview - Printable Content */}
                        <div
                          id={`card-${card.id}`}
                          className="flex-1 p-4 border-b print:border-0 print:p-6 space-y-3"
                        >
                          {/* Header */}
                          <div className="border-b pb-3">
                            <p className="text-lg font-bold text-primary">{card.rabbitTag}</p>
                            {card.rabbitName && card.rabbitName !== 'N/A' && (
                              <p className="text-sm text-muted-foreground">{card.rabbitName}</p>
                            )}
                          </div>

                          {/* Main Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Breed:</span>
                              <span className="font-medium">{card.breed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gender:</span>
                              <span className="font-medium">{card.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">DOB:</span>
                              <span className="font-medium">{card.dateOfBirth}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">{card.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cage:</span>
                              <span className="font-medium">{card.cageId}</span>
                            </div>
                          </div>

                          {card.includeHealth && (
                            <div className="border-t pt-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">HEALTH STATUS</p>
                              <p className="text-xs">{card.status}</p>
                            </div>
                          )}

                          {card.customNotes && (
                            <div className="border-t pt-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">NOTES</p>
                              <p className="text-xs wrap-break-word">{card.customNotes}</p>
                            </div>
                          )}

                          {/* QR Code */}
                          <div className="flex justify-center border-t pt-3">
                            <div className="relative w-24 h-24 bg-white rounded border">
                              <Image
                                src={card.qrCodeUrl}
                                alt="QR Code"
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 space-y-3 print:hidden">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`card-select-${card.id}`}
                              checked={selectedCardsToPrint.includes(card.id)}
                              onCheckedChange={(checked) => {
                                if (checked && checked !== 'indeterminate') {
                                  setSelectedCardsToPrint(prev => [...prev, card.id]);
                                } else if (!checked) {
                                  setSelectedCardsToPrint(prev => prev.filter(id => id !== card.id));
                                }
                              }}
                            />
                            <Label htmlFor={`card-select-${card.id}`} className="text-xs cursor-pointer flex-1">
                              Select for printing
                            </Label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateCard(card.id)}
                              className="flex-1"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCard(card.id)}
                              className="flex-1"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Hidden Print Layout */}
        <div ref={printRef} className="hidden print:block print:p-0 print:m-0">
          <div className="print:h-screen print:flex print:flex-col">
            {generatedCards
              .filter(card => selectedCardsToPrint.includes(card.id))
              .map(card => (
                <div
                  key={card.id}
                  className="print:w-1/2 print:h-1/2 print:float-left print:overflow-hidden print:p-4"
                  style={{
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <div className="w-full h-full border-2 border-black p-4 flex flex-col justify-between bg-white">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-2">
                      <p className="text-xl font-bold">{card.rabbitTag}</p>
                      {card.rabbitName && card.rabbitName !== 'N/A' && (
                        <p className="text-sm">{card.rabbitName}</p>
                      )}
                    </div>

                    {/* Main Info */}
                    <div className="space-y-1 text-sm py-2">
                      <div className="flex justify-between">
                        <span>Breed:</span>
                        <span className="font-bold">{card.breed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gender:</span>
                        <span className="font-bold">{card.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DOB:</span>
                        <span className="font-bold">{card.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-bold">{card.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cage:</span>
                        <span className="font-bold">{card.cageId}</span>
                      </div>
                    </div>

                    {card.customNotes && (
                      <div className="border-t border-black pt-2">
                        <p className="text-xs font-bold mb-1">NOTES</p>
                        <p className="text-xs">{card.customNotes}</p>
                      </div>
                    )}

                    {/* QR Code */}
                    <div className="flex justify-center py-2">
                      <div className="relative w-20 h-20 bg-white border">
                        <Image
                          src={card.qrCodeUrl}
                          alt="QR Code"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t-2 border-black pt-1 text-center">
                      <p className="text-xs font-bold">SunguraSmart Farm</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </SidebarInset>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Cage Cards</DialogTitle>
            <DialogDescription>
              You&apos;re about to print {selectedCardsToPrint.length} card{selectedCardsToPrint.length !== 1 ? 's' : ''}. 
              Ensure you have paper loaded and your printer is ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                <strong>Print Tips:</strong>
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-4 list-disc">
                <li>Use 8.5&quot; × 11&quot; paper (standard letter size)</li>
                <li>Layout: 2 cards per page (4.25&quot; × 5.5&quot; each)</li>
                <li>Set margins to 0.25&quot; for optimal fitting</li>
                <li>Disable headers and footers in print settings</li>
                <li>Use color printer for best appearance</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Open Print Dialog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
          }

          body,
          html {
            width: 100%;
            height: 100%;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: letter;
            margin: 0.25in;
          }

          #print-area {
            display: block;
            page-break-after: always;
          }
        }
      `}</style>
    </SidebarProvider>
  );
}
