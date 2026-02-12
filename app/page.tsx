import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart2,
  ClipboardCheck,
  Database,
  LineChart,
  Rabbit,
  Shield,
  Zap,
  QrCode,
  Camera,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle2,
  Smartphone,
  BookOpen,
  Users,
  Award,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Leaf,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  BarChart3,
  Inbox,
  Star,
  Quote,
} from "lucide-react";

export default function Page() {
  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Breeding Program Manager",
      farm: "Silver Lining Rabbitry",
      image: "/images/testimonial-1.jpg",
      quote:
        "Sungura Smart cut my breeding planning time in half. The pedigree tool alone is worth it—I can spot genetic opportunities instantly.",
      rating: 5,
    },
    {
      name: "James Chen",
      role: "Commercial Breeder",
      farm: "Chen Family Rabbits",
      image: "/images/testimonial-2.jpg",
      quote:
        "We increased our production by 30% just by using the health tracking and breeding analytics. Best investment for our farm.",
      rating: 5,
    },
    {
      name: "Maria Garcia",
      role: "Hobby Breeder & Exhibitor",
      farm: "Garcia Show Rabbits",
      image: "/images/testimonial-3.jpg",
      quote:
        "The mobile app is a game-changer. Recording weights and health checks from the barn means no more forgotten notes.",
      rating: 5,
    },
    {
      name: "David Thompson",
      role: "Multi-Breed Specialist",
      farm: "Thompson Breeds",
      image: "/images/testimonial-4.jpg",
      quote:
        "Offline mode is fantastic for barn work. No more lost entries—everything syncs perfectly when connected.",
      rating: 5,
    },
  ];

  // Statistics data with animated counters
  const statistics = [
    { label: "Time Saved Weekly", value: "12+ Hours", icon: Clock },
    { label: "Breeding Success Rate", value: "98%+", icon: TrendingUp },
    { label: "Pedigree Generations", value: "7+ Tracked", icon: BookOpen },
    { label: "Data Accuracy", value: "100%", icon: CheckCircle2 },
    { label: "Breeders Active", value: "5,000+", icon: Users },
    { label: "Records Managed", value: "1M+", icon: Database },
  ];

  // Device compatibility data
  const devices = [
    {
      name: "iPhone & iPad",
      icon: Smartphone,
      description: "Native iOS app with full offline support",
      features: ["Offline recording", "Real-time sync", "Face ID login"],
    },
    {
      name: "Android Devices",
      icon: Smartphone,
      description: "Optimized for barn use on any Android phone",
      features: ["Offline recording", "Real-time sync", "Biometric login"],
    },
    {
      name: "Tablets",
      icon: Tablet,
      description: "Perfect for herd management and review",
      features: ["Enhanced UI", "Split-screen pedigrees", "Report generation"],
    },
    {
      name: "Desktop & Laptop",
      icon: Monitor,
      description: "Full-featured web app for detailed analysis",
      features: ["Advanced analytics", "Printing reports", "Data import/export"],
    },
  ];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-12 p-4 pt-0">
          {/* ===== ENHANCED HERO SECTION ===== */}
          <section className="relative flex flex-col items-center justify-center text-center py-20 px-4 overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-blue-50 to-transparent dark:from-green-950/30 dark:via-blue-950/30 dark:to-transparent -z-10" />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Rabbit className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                The #1 Platform for Modern Rabbit Breeders
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight max-w-4xl">
              Document, Track & Optimize Your Rabbit Breeding
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-3xl font-medium">
              The all-in-one app that replaces paperwork, generates pedigrees in seconds, and syncs across all your devices.
            </p>

            {/* Supporting text */}
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-3xl font-light">
              Record from the barn with QR codes. Track genetics across generations. Make confident breeding decisions with real-time analytics. Works offline, syncs everywhere.
            </p>

            {/* Key Benefits Grid */}
            <div className="grid sm:grid-cols-3 gap-4 mb-12 w-full max-w-3xl">
              <div className="flex items-start gap-3 text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Mobile-First Entry</p>
                  <p className="text-xs text-muted-foreground">Scan QR codes, record from the barn</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Multi-Gen Pedigrees</p>
                  <p className="text-xs text-muted-foreground">7+ generations tracked automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Everywhere Access</p>
                  <p className="text-xs text-muted-foreground">Phone, tablet, desktop—all synced</p>
                </div>
              </div>
            </div>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button size="lg" asChild className="gap-2 group">
                <Link href="/sign-up">
                  Start Your 14-Day Free Trial{" "}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/book-demo">Watch a 5-Minute Demo</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="text-xs text-muted-foreground">
              ✓ No credit card required ✓ Full feature access ✓ 30-day money-back guarantee
            </p>
          </section>

          {/* ===== ENHANCED FEATURES SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Complete Farm Management in One App
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything modern rabbit breeders need—from QR code barn entry to multi-generational pedigrees and real-time analytics.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Database className="h-10 w-10" />,
                  title: "Pedigree & Pairings",
                  description:
                    "Multi-generation pedigree trees with genetic trait tracking, inbreeding coefficients, and smart pairing recommendations based on genetics.",
                  href: "/features/breeding",
                },
                {
                  icon: <QrCode className="h-10 w-10" />,
                  title: "QR Code Cage Cards",
                  description:
                    "Print smart cage cards with QR codes. Scan to record weights, health checks, and breeding info—no paperwork needed.",
                  href: "/features/qr-codes",
                },
                {
                  icon: <Smartphone className="h-10 w-10" />,
                  title: "Mobile App & Offline Mode",
                  description:
                    "Record directly from the barn. Works fully offline, syncs automatically when connected. Barn-friendly, fast, reliable.",
                  href: "/features/mobile",
                },
                {
                  icon: <Camera className="h-10 w-10" />,
                  title: "Health & Weight Tracking",
                  description:
                    "Track health records, photos, medical notes, and weight history across your entire herd. Spot health trends instantly.",
                  href: "/features/health",
                },
                {
                  icon: <BarChart3 className="h-10 w-10" />,
                  title: "Production Analytics",
                  description:
                    "Real-time insights into breeding success, litter performance, mortality rates, genetics, and all critical KPIs.",
                  href: "/features/analytics",
                },
                {
                  icon: <Bell className="h-10 w-10" />,
                  title: "Smart Task Scheduling",
                  description:
                    "Automatic reminders for breeding cycles, expected births, health checks, feed inventory, and critical farm tasks.",
                  href: "/features/scheduling",
                },
              ].map((feature, idx) => (
                <Card
                  key={idx}
                  className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col group"
                >
                  <CardHeader>
                    <div className="text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <CardDescription className="mb-4">
                      {feature.description}
                    </CardDescription>
                    <Button variant="ghost" size="sm" asChild className="w-fit">
                      <Link href={feature.href}>
                        Learn More{" "}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ===== PRODUCT SHOWCASE SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">What You'll Get</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful insights at your fingertips. See your rabbit farm in a completely new way.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <Rabbit className="h-5 w-5 text-primary" />
                    Rabbit Profiles & Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-muted/30 rounded-lg p-6 mb-4 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <Rabbit className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Photo, breed, color, age, weight history, and genetics at a glance
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Complete breeding history with pedigree</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Health and medical records timeline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Performance ratings and genetics data</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Photo gallery with timestamps</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Pedigree Trees & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-muted/30 rounded-lg p-6 mb-4 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Visual pedigree trees and breeding performance metrics
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Multi-generation pedigrees (7+ levels)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Inbreeding coefficient calculations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Genetic trait tracking and predictions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Export pedigrees as PDFs</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== TESTIMONIALS SECTION ===== */}
          <section className="py-12 bg-muted/30 rounded-xl px-6 md:px-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Loved by Breeders</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See what rabbit breeders say about how Sungura Smart transformed their operations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, idx) => (
                <Card
                  key={idx}
                  className="flex flex-col hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/50"
                >
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    {/* Star rating */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <Quote className="h-5 w-5 text-primary/50 mb-2" />
                    <p className="text-sm font-medium mb-4 flex-1">
                      "{testimonial.quote}"
                    </p>

                    {/* Author info */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.farm}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ===== DEVICE COMPATIBILITY SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Works on Every Device</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Record from the barn with mobile, analyze on desktop, access anywhere. Real-time sync across all devices.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {devices.map((device, idx) => {
                const Icon = device.icon;
                return (
                  <Card
                    key={idx}
                    className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col"
                  >
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription>{device.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2">
                        {device.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Sync and offline features highlight */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Card className="border-green-200/50 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-green-600" />
                    Real-Time Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Changes on any device instantly appear on all others. No manual uploads. No lost data. Everything stays perfectly in sync, whether you're online or offline.
                </CardContent>
              </Card>

              <Card className="border-blue-200/50 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WifiOff className="h-5 w-5 text-blue-600" />
                    Offline-First Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Record everything offline in the barn. No internet? No problem. Data syncs automatically when you reconnect. Perfect for busy farm days.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== STATISTICS SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Trusted by Thousands</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Breeders worldwide rely on Sungura Smart for accurate record-keeping and smarter breeding decisions.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {statistics.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={idx}
                    className="hover:shadow-lg transition-all duration-300 text-center"
                  >
                    <CardContent className="pt-8">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-3xl md:text-4xl font-bold mb-2">
                        {stat.value}
                      </p>
                      <p className="text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ===== PAPER VS DIGITAL SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Paper vs. Digital</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See why modern rabbit breeders are leaving paper behind.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-muted">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    Traditional Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {[
                      "Pens, notebooks, and filing cabinets",
                      "Data scattered across multiple places",
                      "Hours of manual record-keeping weekly",
                      "Hard to spot breeding patterns",
                      "No mobile access in the barn",
                      "Risk of lost or damaged records",
                      "Manual calculations for pedigrees",
                      "Slow decision-making",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/50 shadow-lg">
                <CardHeader className="bg-primary/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    Sungura Smart Platform
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {[
                      "All data in one secure, cloud-based place",
                      "Unified, always-synced database",
                      "10x faster entry with QR codes",
                      "AI-powered insights and pattern detection",
                      "Mobile app for barn access + offline mode",
                      "Cloud backup & military-grade security",
                      "Instant pedigree generation with genetics",
                      "Data-driven decisions in seconds",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== FAQ SECTION ===== */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about Sungura Smart.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  id: "offline",
                  icon: <Smartphone className="h-5 w-5" />,
                  question: "Does the mobile app work offline?",
                  answer:
                    "Absolutely! Our mobile app is designed for barn use. Record everything offline—weights, health checks, breeding notes—and data syncs automatically when you're back online. No missed recordings, ever.",
                },
                {
                  id: "sync",
                  icon: <Wifi className="h-5 w-5" />,
                  question: "How does real-time sync work across devices?",
                  answer:
                    "When you record data on any device, it's encrypted and sent to our servers. Within seconds, all your other devices update automatically. Even if offline, changes sync seamlessly when reconnected.",
                },
                {
                  id: "import",
                  icon: <Database className="h-5 w-5" />,
                  question: "Can I import my existing records?",
                  answer:
                    "Yes! We support imports from Excel files, CSV, and other farm management software. Our support team can help with bulk imports or manual migration. We'll guide you through the process at no extra cost.",
                },
                {
                  id: "compatibility",
                  icon: <Users className="h-5 w-5" />,
                  question: "What devices are supported?",
                  answer:
                    "Sungura Smart works on iOS (iPhone/iPad), Android phones and tablets, Windows, Mac, and Linux. The interface adapts to any screen size—from a barn phone to a desktop monitor.",
                },
                {
                  id: "support",
                  icon: <HelpCircle className="h-5 w-5" />,
                  question: "What support do you offer?",
                  answer:
                    "We offer email, chat, and phone support to all users. Our team includes breeder specialists who understand farm workflows. Plus, we host monthly webinars and have comprehensive documentation and video tutorials.",
                },
                {
                  id: "data-security",
                  icon: <Shield className="h-5 w-5" />,
                  question: "How is my data protected?",
                  answer:
                    "All data is encrypted in transit and at rest using enterprise-grade security (256-bit AES). We perform daily automated backups, GDPR and CCPA compliant, and you can export your data anytime.",
                },
                {
                  id: "qr-codes",
                  icon: <QrCode className="h-5 w-5" />,
                  question: "How do QR code cage cards work?",
                  answer:
                    "Print cage cards with QR codes that link each card to a rabbit in the system. In the barn, scan the code on your phone and instantly record weights, health notes, or breeding info. No paperwork needed.",
                },
                {
                  id: "pricing",
                  icon: <Lightbulb className="h-5 w-5" />,
                  question: "What happens after the free trial?",
                  answer:
                    "Your 14-day trial includes full access to all features. After that, upgrade to a plan (pricing based on farm size) or stay on the free basic tier. No credit card required to start, cancel anytime.",
                },
              ].map((faq) => (
                <Collapsible
                  key={faq.id}
                  className="border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <CollapsibleTrigger className="w-full px-6 py-4 font-semibold text-base flex items-center gap-3 hover:bg-muted/50 transition-colors">
                    {faq.icon}
                    {faq.question}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 py-4 bg-muted/30 text-muted-foreground border-t">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </section>

          {/* ===== FINAL CALL TO ACTION SECTION ===== */}
          <section className="py-16">
            <Card className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-12 pb-12 px-6 md:px-12">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    Join Breeders Who Save 40% Time
                  </h2>

                  <p className="text-lg text-muted-foreground mb-4">
                    Sungura Smart is trusted by over 5,000 rabbit breeders worldwide. Get the same powerful tools they use for smarter breeding, better records, and healthier rabbits.
                  </p>

                  <p className="text-base text-muted-foreground mb-8 font-medium">
                    No credit card required. Full feature access. 30-day money-back guarantee.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button size="lg" asChild className="gap-2 group flex-1">
                      <Link href="/sign-up">
                        Start Your Free Trial{" "}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="flex-1">
                      <Link href="/book-demo">
                        Watch a Live Demo
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="flex-1">
                      <Link href="/pricing">
                        View Pricing
                      </Link>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-8 space-x-3">
                    <span>✓ No credit card required</span>
                    <span>✓ 14-day full access</span>
                    <span>✓ Cancel anytime</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}




