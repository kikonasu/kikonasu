import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Users, Image, Shirt, TrendingUp, ArrowUpDown, Trash2,
  Heart, History, Luggage, ShoppingBag, Sparkles, Zap, BarChart3,
  Settings, LogOut, MoreVertical, Shield, Activity, UserCheck, UserX,
  Crown, ChevronRight, RefreshCw, CreditCard, DollarSign, TrendingDown,
  Calendar, AlertCircle, CheckCircle2, Clock, ExternalLink, Copy
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import kikonasuLogo from "@/assets/kikonasu-logo-optimized.webp";
import { ThemeToggle } from "@/components/ThemeToggle";

interface UserData {
  userId: string;
  email: string;
  name: string;
  items: number;
  outfits: number;
  favorites: number;
  plans: number;
  wishlist: number;
  lastActive: string;
  totalSessions: number;
  status: "Power User" | "Active" | "Inactive" | "Drop-off";
  featuresUsed: number;
}

interface FeatureAdoption {
  feature: string;
  users: number;
  percentage: number;
  events7d: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  userId: string | null;
  userEmail: string | null;
}

interface AnalyticsData {
  totalUsers: number;
  totalItems: number;
  totalOutfits: number;
  dailyActiveUsers: number;
  returnRate: number;
  users: UserData[];
  featureAdoption: FeatureAdoption[];
  avgItemsPerUser: number;
  avgOutfitsPerActiveUser: number;
  powerUsers: UserData[];
  dropOffs: UserData[];
}

interface ItemData {
  id: string;
  category: string;
  color: string;
  userName: string;
  uploadedAt: string;
}

interface OutfitItem {
  name: string;
  color: string;
  category: string;
  imageUrl: string;
}

interface OutfitData {
  id: string;
  userName: string;
  items: OutfitItem[];
  createdAt: string;
  occasion: string;
}

// Helper function to get background color for badges
const getColorStyle = (colorName: string): { bg: string; text: string } => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    "Black": { bg: "#1a1a1a", text: "#ffffff" },
    "White": { bg: "#f5f5f5", text: "#1a1a1a" },
    "Navy": { bg: "#001f3f", text: "#ffffff" },
    "Gray": { bg: "#6b7280", text: "#ffffff" },
    "Beige": { bg: "#d4c4a8", text: "#1a1a1a" },
    "Red": { bg: "#dc2626", text: "#ffffff" },
    "Blue": { bg: "#2563eb", text: "#ffffff" },
    "Green": { bg: "#16a34a", text: "#ffffff" },
    "Pink": { bg: "#ec4899", text: "#ffffff" },
    "Brown": { bg: "#78350f", text: "#ffffff" },
  };
  return colorMap[colorName] || { bg: "#6b7280", text: "#ffffff" };
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalItems: 0,
    totalOutfits: 0,
    dailyActiveUsers: 0,
    returnRate: 0,
    users: [],
    featureAdoption: [],
    avgItemsPerUser: 0,
    avgOutfitsPerActiveUser: 0,
    powerUsers: [],
    dropOffs: [],
  });
  const [sortField, setSortField] = useState<keyof UserData>("items");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    userId: null,
    userEmail: null,
  });
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [outfitsModalOpen, setOutfitsModalOpen] = useState(false);
  const [activeUsersModalOpen, setActiveUsersModalOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitData | null>(null);
  const [outfitDetailOpen, setOutfitDetailOpen] = useState(false);
  const [demoItems, setDemoItems] = useState<ItemData[]>([]);
  const [demoOutfits, setDemoOutfits] = useState<OutfitData[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check for demo mode first
      const isDemoMode = localStorage.getItem('admin_demo_mode') === 'true';
      if (isDemoMode) {
        setIsAdmin(true);
        // Load demo data
        loadDemoData();
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("Access denied");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchAnalytics();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo data for presentation
    const demoUsers: UserData[] = [
      { userId: "1", email: "sarah@example.com", name: "Sarah Johnson", items: 47, outfits: 23, favorites: 12, plans: 3, wishlist: 8, lastActive: "Today", totalSessions: 45, status: "Power User", featuresUsed: 5 },
      { userId: "2", email: "mike@example.com", name: "Mike Chen", items: 32, outfits: 15, favorites: 7, plans: 2, wishlist: 5, lastActive: "Yesterday", totalSessions: 28, status: "Active", featuresUsed: 4 },
      { userId: "3", email: "emma@example.com", name: "Emma Wilson", items: 28, outfits: 12, favorites: 5, plans: 1, wishlist: 12, lastActive: "2 days ago", totalSessions: 22, status: "Active", featuresUsed: 4 },
      { userId: "4", email: "james@example.com", name: "James Brown", items: 19, outfits: 8, favorites: 3, plans: 0, wishlist: 4, lastActive: "3 days ago", totalSessions: 15, status: "Active", featuresUsed: 3 },
      { userId: "5", email: "olivia@example.com", name: "Olivia Davis", items: 52, outfits: 31, favorites: 18, plans: 4, wishlist: 15, lastActive: "Today", totalSessions: 67, status: "Power User", featuresUsed: 5 },
      { userId: "6", email: "alex@example.com", name: "Alex Martinez", items: 15, outfits: 5, favorites: 2, plans: 1, wishlist: 3, lastActive: "5 days ago", totalSessions: 12, status: "Inactive", featuresUsed: 3 },
      { userId: "7", email: "taylor@example.com", name: "Taylor Swift", items: 0, outfits: 0, favorites: 0, plans: 0, wishlist: 0, lastActive: "2 weeks ago", totalSessions: 2, status: "Drop-off", featuresUsed: 0 },
      { userId: "8", email: "jordan@example.com", name: "Jordan Lee", items: 38, outfits: 19, favorites: 9, plans: 2, wishlist: 7, lastActive: "Today", totalSessions: 34, status: "Power User", featuresUsed: 5 },
    ];

    const demoFeatureAdoption: FeatureAdoption[] = [
      { feature: "Wardrobe", users: 7, percentage: 87, events7d: 156, icon: Image, color: "from-blue-500/20 to-blue-500/5" },
      { feature: "Outfit Generation", users: 6, percentage: 75, events7d: 89, icon: Sparkles, color: "from-purple-500/20 to-purple-500/5" },
      { feature: "Favorites", users: 6, percentage: 75, events7d: 45, icon: Heart, color: "from-pink-500/20 to-pink-500/5" },
      { feature: "Trip Planning", users: 5, percentage: 62, events7d: 23, icon: Luggage, color: "from-green-500/20 to-green-500/5" },
      { feature: "Wish List", users: 7, percentage: 87, events7d: 67, icon: ShoppingBag, color: "from-amber-500/20 to-amber-500/5" },
      { feature: "History", users: 6, percentage: 75, events7d: 34, icon: History, color: "from-orange-500/20 to-orange-500/5" },
    ];

    // Demo items data
    const categories = ["Top", "Bottom", "Dress", "Shoes", "Outerwear", "Accessory"];
    const colors = ["Black", "White", "Navy", "Gray", "Beige", "Red", "Blue", "Green", "Pink", "Brown"];
    const userNames = ["Sarah Johnson", "Mike Chen", "Emma Wilson", "James Brown", "Olivia Davis", "Alex Martinez", "Jordan Lee"];

    const generatedItems: ItemData[] = [];
    for (let i = 1; i <= 231; i++) {
      generatedItems.push({
        id: `item-${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        uploadedAt: `${Math.floor(Math.random() * 30) + 1} days ago`,
      });
    }
    setDemoItems(generatedItems);

    // Demo outfits data with proper item objects
    const occasions = ["Casual", "Work", "Date Night", "Weekend", "Formal", "Travel", "Workout"];

    // Sample clothing images from Unsplash (using their source API for demo)
    const categoryImages: Record<string, string[]> = {
      "Top": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop",
      ],
      "Bottom": [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop",
      ],
      "Dress": [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop",
      ],
      "Shoes": [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop",
      ],
      "Outerwear": [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=300&h=300&fit=crop",
      ],
      "Accessory": [
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1611923134239-b9be5816e0b0?w=300&h=300&fit=crop",
      ],
    };

    const generatedOutfits: OutfitData[] = [];
    for (let i = 1; i <= 113; i++) {
      const numItems = Math.floor(Math.random() * 3) + 2;
      const outfitItems: OutfitItem[] = [];
      for (let j = 0; j < numItems; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const images = categoryImages[category] || categoryImages["Top"];
        outfitItems.push({
          name: `${color} ${category}`,
          color: color,
          category: category,
          imageUrl: images[Math.floor(Math.random() * images.length)],
        });
      }
      generatedOutfits.push({
        id: `outfit-${i}`,
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        items: outfitItems,
        createdAt: `${Math.floor(Math.random() * 14) + 1} days ago`,
        occasion: occasions[Math.floor(Math.random() * occasions.length)],
      });
    }
    setDemoOutfits(generatedOutfits);

    setAnalytics({
      totalUsers: 8,
      totalItems: 231,
      totalOutfits: 113,
      dailyActiveUsers: 5,
      returnRate: 72,
      users: demoUsers,
      featureAdoption: demoFeatureAdoption,
      avgItemsPerUser: 29,
      avgOutfitsPerActiveUser: 19,
      powerUsers: demoUsers.filter(u => u.status === "Power User"),
      dropOffs: demoUsers.filter(u => u.status === "Drop-off"),
    });
  };

  const fetchAnalytics = async () => {
    try {
      // Total users (count profiles)
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total items uploaded
      const { count: totalItems } = await supabase
        .from("wardrobe_items")
        .select("*", { count: "exact", head: true });

      // Total outfits generated
      const { count: totalOutfits } = await supabase
        .from("outfit_history")
        .select("*", { count: "exact", head: true });

      // Daily active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeEvents } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeEvents?.map(e => e.user_id) || []);

      // Return rate calculation
      const { data: signupEvents } = await supabase
        .from("analytics_events")
        .select("user_id, created_at")
        .eq("event_type", "user_signup");

      let returnCount = 0;
      if (signupEvents && signupEvents.length > 0) {
        for (const signup of signupEvents) {
          const signupDate = new Date(signup.created_at);
          const nextDay = new Date(signupDate);
          nextDay.setDate(nextDay.getDate() + 1);

          const { data: laterEvents } = await supabase
            .from("analytics_events")
            .select("id")
            .eq("user_id", signup.user_id)
            .gte("created_at", nextDay.toISOString())
            .limit(1);

          if (laterEvents && laterEvents.length > 0) {
            returnCount++;
          }
        }
      }

      const returnRate = signupEvents?.length
        ? Math.round((returnCount / signupEvents.length) * 100)
        : 0;

      // Get all users with detailed data
      const { data: usersData } = await supabase
        .from("profiles")
        .select("user_id, name, email");

      // Fetch all items at once
      const { data: allItems } = await supabase
        .from("wardrobe_items")
        .select("user_id");

      // Fetch all outfits at once
      const { data: allOutfits } = await supabase
        .from("outfit_history")
        .select("user_id");

      // Fetch all favorites at once
      const { data: allFavorites } = await supabase
        .from("favorite_outfits")
        .select("user_id");

      // Fetch all plans at once
      const { data: allPlans } = await supabase
        .from("suitcases")
        .select("user_id");

      // Fetch all wishlist items at once
      const { data: allWishlist } = await supabase
        .from("wish_list_items")
        .select("user_id");

      // Fetch all events at once
      const { data: allEvents } = await supabase
        .from("analytics_events")
        .select("user_id, created_at, event_type")
        .order("created_at", { ascending: false });

      // Aggregate by user
      const itemsByUser: Record<string, number> = {};
      (allItems || []).forEach((item) => {
        if (item.user_id) {
          itemsByUser[item.user_id] = (itemsByUser[item.user_id] || 0) + 1;
        }
      });

      const outfitsByUser: Record<string, number> = {};
      (allOutfits || []).forEach((outfit) => {
        if (outfit.user_id) {
          outfitsByUser[outfit.user_id] = (outfitsByUser[outfit.user_id] || 0) + 1;
        }
      });

      const favoritesByUser: Record<string, number> = {};
      (allFavorites || []).forEach((favorite) => {
        if (favorite.user_id) {
          favoritesByUser[favorite.user_id] = (favoritesByUser[favorite.user_id] || 0) + 1;
        }
      });

      const plansByUser: Record<string, number> = {};
      (allPlans || []).forEach((plan) => {
        if (plan.user_id) {
          plansByUser[plan.user_id] = (plansByUser[plan.user_id] || 0) + 1;
        }
      });

      const wishlistByUser: Record<string, number> = {};
      (allWishlist || []).forEach((item) => {
        if (item.user_id) {
          wishlistByUser[item.user_id] = (wishlistByUser[item.user_id] || 0) + 1;
        }
      });

      const eventsByUser = (allEvents || []).reduce((acc, event) => {
        if (!acc[event.user_id]) {
          acc[event.user_id] = [];
        }
        acc[event.user_id].push({ created_at: event.created_at, event_type: event.event_type });
        return acc;
      }, {} as Record<string, Array<{ created_at: string; event_type: string }>>);

      const usersWithDetails = (usersData || []).map((profile) => {
        const items = itemsByUser[profile.user_id] || 0;
        const outfits = outfitsByUser[profile.user_id] || 0;
        const favorites = favoritesByUser[profile.user_id] || 0;
        const plans = plansByUser[profile.user_id] || 0;
        const wishlist = wishlistByUser[profile.user_id] || 0;
        const userEvents = eventsByUser[profile.user_id] || [];

        const lastActive = userEvents.length > 0
          ? new Date(userEvents[0].created_at).toLocaleDateString()
          : "Never";

        const uniqueDays = new Set(
          userEvents.map(e => new Date(e.created_at).toDateString())
        );

        // Calculate features used
        let featuresUsed = 0;
        if (items > 0) featuresUsed++; // Wardrobe
        if (outfits > 0) featuresUsed++; // Outfit Generation
        if (favorites > 0) featuresUsed++; // Favorites
        if (plans > 0) featuresUsed++; // Plans
        if (wishlist > 0) featuresUsed++; // Wish List

        // Determine status
        let status: "Power User" | "Active" | "Inactive" | "Drop-off" = "Drop-off";
        const daysSinceActive = userEvents.length > 0
          ? Math.floor((Date.now() - new Date(userEvents[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (featuresUsed >= 4) {
          status = "Power User";
        } else if (daysSinceActive <= 7 && items > 0) {
          status = "Active";
        } else if (daysSinceActive <= 30 && items > 0) {
          status = "Inactive";
        } else {
          status = "Drop-off";
        }

        return {
          userId: profile.user_id,
          email: profile.email || "No email",
          name: profile.name || "No name",
          items,
          outfits,
          favorites,
          plans,
          wishlist,
          lastActive,
          totalSessions: uniqueDays.size,
          featuresUsed,
          status,
        };
      });

      // Sort by most active (items + outfits) descending
      usersWithDetails.sort((a, b) => {
        const aActivity = a.items + a.outfits;
        const bActivity = b.items + b.outfits;
        return bActivity - aActivity;
      });

      // Calculate feature adoption
      const sevenDaysAgoTimestamp = sevenDaysAgo.toISOString();
      const featureAdoption: FeatureAdoption[] = [
        {
          feature: "Wardrobe",
          users: usersWithDetails.filter(u => u.items > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.items > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "item_uploaded" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: Image,
          color: "from-blue-500/20 to-blue-500/5",
        },
        {
          feature: "Outfit Generation",
          users: usersWithDetails.filter(u => u.outfits > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.outfits > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "outfit_generated" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: Sparkles,
          color: "from-purple-500/20 to-purple-500/5",
        },
        {
          feature: "Favorites",
          users: usersWithDetails.filter(u => u.favorites > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.favorites > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "outfit_favorited" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: Heart,
          color: "from-pink-500/20 to-pink-500/5",
        },
        {
          feature: "History",
          users: usersWithDetails.filter(u => u.outfits > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.outfits > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "outfit_history_viewed" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: History,
          color: "from-orange-500/20 to-orange-500/5",
        },
        {
          feature: "Trip Planning",
          users: usersWithDetails.filter(u => u.plans > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.plans > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "plan_created" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: Luggage,
          color: "from-green-500/20 to-green-500/5",
        },
        {
          feature: "Wish List",
          users: usersWithDetails.filter(u => u.wishlist > 0).length,
          percentage: Math.round((usersWithDetails.filter(u => u.wishlist > 0).length / (totalUsers || 1)) * 100),
          events7d: (allEvents || []).filter(e => e.event_type === "wishlist_item_added" && e.created_at >= sevenDaysAgoTimestamp).length,
          icon: ShoppingBag,
          color: "from-amber-500/20 to-amber-500/5",
        },
      ].sort((a, b) => b.percentage - a.percentage);

      // Segmentation
      const powerUsers = usersWithDetails.filter(u => u.status === "Power User");
      const dropOffs = usersWithDetails.filter(u => u.status === "Drop-off");

      // Calculate averages
      const avgItemsPerUser = totalUsers ? Math.round((totalItems || 0) / totalUsers) : 0;
      const activeUsersCount = usersWithDetails.filter(u => u.status === "Active" || u.status === "Power User").length;
      const avgOutfitsPerActiveUser = activeUsersCount ? Math.round((totalOutfits || 0) / activeUsersCount) : 0;

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalItems: totalItems || 0,
        totalOutfits: totalOutfits || 0,
        dailyActiveUsers: uniqueActiveUsers.size,
        returnRate,
        users: usersWithDetails,
        featureAdoption,
        avgItemsPerUser,
        avgOutfitsPerActiveUser,
        powerUsers,
        dropOffs,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const isDemoMode = localStorage.getItem('admin_demo_mode') === 'true';
    if (isDemoMode) {
      // Simulate refresh in demo mode
      await new Promise(resolve => setTimeout(resolve, 500));
      loadDemoData();
    } else {
      await fetchAnalytics();
    }
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleSort = (field: keyof UserData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortedUsers = () => {
    return [...analytics.users].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    const isDemoMode = localStorage.getItem('admin_demo_mode') === 'true';

    if (isDemoMode) {
      // Demo mode - just remove from local state
      setAnalytics(prev => ({
        ...prev,
        users: prev.users.filter(u => u.userId !== deleteDialog.userId),
        totalUsers: prev.totalUsers - 1,
        powerUsers: prev.powerUsers.filter(u => u.userId !== deleteDialog.userId),
        dropOffs: prev.dropOffs.filter(u => u.userId !== deleteDialog.userId),
      }));
      toast.success(`User ${deleteDialog.userEmail} deleted successfully`);
      setDeleteDialog({ isOpen: false, userId: null, userEmail: null });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteDialog.userId }
      });

      if (error) throw error;

      toast.success(`User ${deleteDialog.userEmail} deleted successfully`);

      // Close dialog first
      setDeleteDialog({ isOpen: false, userId: null, userEmail: null });

      // Refresh analytics data - await to ensure UI updates after data loads
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      setDeleteDialog({ isOpen: false, userId: null, userEmail: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Power User":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "Active":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "Inactive":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      case "Drop-off":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Same style as user dashboard */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kikonasuLogo} alt="Kikonasu" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-foreground">Kikonasu</span>
            <Badge variant="secondary" className="ml-2">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/")} className="cursor-pointer">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Back to App
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wardrobe")} className="cursor-pointer">
                  <Shirt className="h-4 w-4 mr-2" />
                  Wardrobe
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/auth");
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-base md:text-lg">Monitor and manage your platform</p>
        </section>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              Users
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Activity className="h-4 w-4 hidden sm:inline" />
              Features
            </TabsTrigger>
            <TabsTrigger value="utilities" className="gap-2">
              <Settings className="h-4 w-4 hidden sm:inline" />
              Utilities
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:inline" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Platform Metrics</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Total Users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">{analytics.totalUsers}</div>
                    <p className="text-sm text-muted-foreground mt-1">registered accounts</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary/50"
                  onClick={() => setItemsModalOpen(true)}
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Items Uploaded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">{analytics.totalItems}</div>
                    <p className="text-sm text-muted-foreground mt-1">wardrobe items</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary/50"
                  onClick={() => setOutfitsModalOpen(true)}
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      Outfits Created
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">{analytics.totalOutfits}</div>
                    <p className="text-sm text-muted-foreground mt-1">total outfits</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary/50"
                  onClick={() => setActiveUsersModalOpen(true)}
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Active (7d)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">{analytics.dailyActiveUsers}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analytics.totalUsers ? Math.round((analytics.dailyActiveUsers / analytics.totalUsers) * 100) : 0}% of users
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* User Segmentation */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">User Segments</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-amber-200/50 dark:border-amber-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Power Users</CardTitle>
                        <CardDescription>Using 4+ features</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{analytics.powerUsers.length}</div>
                    <Progress
                      value={analytics.totalUsers ? (analytics.powerUsers.length / analytics.totalUsers) * 100 : 0}
                      className="h-2 mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {analytics.totalUsers ? Math.round((analytics.powerUsers.length / analytics.totalUsers) * 100) : 0}% of total users
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200/50 dark:border-green-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Active Users</CardTitle>
                        <CardDescription>Active in last 7 days</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {analytics.users.filter(u => u.status === "Active").length}
                    </div>
                    <Progress
                      value={analytics.totalUsers ? (analytics.users.filter(u => u.status === "Active").length / analytics.totalUsers) * 100 : 0}
                      className="h-2 mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {analytics.totalUsers ? Math.round((analytics.users.filter(u => u.status === "Active").length / analytics.totalUsers) * 100) : 0}% of total users
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-red-200/50 dark:border-red-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                        <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Drop-offs</CardTitle>
                        <CardDescription>Inactive or 0 items</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{analytics.dropOffs.length}</div>
                    <Progress
                      value={analytics.totalUsers ? (analytics.dropOffs.length / analytics.totalUsers) * 100 : 0}
                      className="h-2 mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {analytics.totalUsers ? Math.round((analytics.dropOffs.length / analytics.totalUsers) * 100) : 0}% of total users
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Key Insights */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Key Insights</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Avg items per user</p>
                    <p className="text-2xl font-bold">{analytics.avgItemsPerUser}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Avg outfits per active user</p>
                    <p className="text-2xl font-bold">{analytics.avgOutfitsPerActiveUser}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Most used feature</p>
                    <p className="text-lg font-semibold">
                      {analytics.featureAdoption[0]?.feature || "N/A"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Drop-off rate</p>
                    <p className="text-2xl font-bold">
                      {analytics.totalUsers ? Math.round((analytics.dropOffs.length / analytics.totalUsers) * 100) : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">All Users</h2>
                  <p className="text-sm text-muted-foreground mt-1">Complete user activity and engagement metrics</p>
                </div>
                <Badge variant="outline">{analytics.users.length} users</Badge>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Name
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("email")}
                          >
                            <div className="flex items-center gap-2">
                              Email
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50 text-right"
                            onClick={() => handleSort("items")}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Items
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50 text-right"
                            onClick={() => handleSort("outfits")}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Outfits
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50 text-right hidden md:table-cell"
                            onClick={() => handleSort("plans")}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Plans
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50 text-right hidden md:table-cell"
                            onClick={() => handleSort("wishlist")}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Wishlist
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50 hidden lg:table-cell"
                            onClick={() => handleSort("lastActive")}
                          >
                            <div className="flex items-center gap-2">
                              Last Active
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedUsers().map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-right">{user.items}</TableCell>
                            <TableCell className="text-right">{user.outfits}</TableCell>
                            <TableCell className="text-right hidden md:table-cell">{user.plans}</TableCell>
                            <TableCell className="text-right hidden md:table-cell">{user.wishlist}</TableCell>
                            <TableCell className="hidden lg:table-cell">{user.lastActive}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteDialog({
                                  isOpen: true,
                                  userId: user.userId,
                                  userEmail: user.email,
                                })}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {analytics.users.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No user data yet</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Feature Adoption</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.featureAdoption.map((feature) => {
                  const Icon = feature.icon;
                  const adoptionLevel = feature.percentage >= 50 ? "high" : feature.percentage >= 20 ? "medium" : "low";
                  const adoptionColor = adoptionLevel === "high" ? "text-green-600 dark:text-green-400" : adoptionLevel === "medium" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

                  return (
                    <Card key={feature.feature} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{feature.feature}</CardTitle>
                            <CardDescription>{feature.users} users</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Adoption rate</span>
                          <span className={`text-lg font-bold ${adoptionColor}`}>
                            {feature.percentage}%
                          </span>
                        </div>
                        <Progress value={feature.percentage} className="h-2 mb-3" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Events (7d)</span>
                          <Badge variant="secondary">{feature.events7d}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Feature Comparison Table */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Detailed Comparison</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                        <TableHead className="text-right">Events (7d)</TableHead>
                        <TableHead className="text-right">Avg/User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.featureAdoption.map((feature) => {
                        const Icon = feature.icon;
                        const avgPerUser = feature.users > 0 ? (feature.events7d / feature.users).toFixed(1) : "0";
                        return (
                          <TableRow key={feature.feature}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {feature.feature}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{feature.users}</TableCell>
                            <TableCell className="text-right">
                              <span className={
                                feature.percentage >= 50 ? "text-green-600 dark:text-green-400 font-semibold" :
                                feature.percentage >= 20 ? "text-amber-600 dark:text-amber-400" :
                                "text-red-600 dark:text-red-400"
                              }>
                                {feature.percentage}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{feature.events7d}</TableCell>
                            <TableCell className="text-right">{avgPerUser}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="space-y-6">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Admin Utilities</h2>
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                        <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Fetch Template Images from Unsplash</CardTitle>
                        <CardDescription>
                          Fetch high-quality product images for all capsule template items
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will take approximately 60 minutes due to API rate limits (1.5s delay between requests).
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg mb-4">
                      <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        Requires VITE_UNSPLASH_ACCESS_KEY environment variable
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!import.meta.env.VITE_UNSPLASH_ACCESS_KEY) {
                          toast.error('VITE_UNSPLASH_ACCESS_KEY not found. Please add it to your environment variables.');
                          return;
                        }

                        toast.info('Starting image fetch... Check console for progress');

                        try {
                          const { fetchAllTemplateImages } = await import('@/scripts/fetchTemplateImages');
                          const images = await fetchAllTemplateImages();

                          toast.success('Image fetch complete! Check console for the JSON.');
                          console.log('\n=== COPY THIS JSON AND UPDATE capsuleTemplates.ts ===\n');
                          console.log(JSON.stringify(images, null, 2));
                        } catch (error) {
                          console.error('Error fetching images:', error);
                          toast.error('Failed to fetch images. Check console for details.');
                        }
                      }}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Fetch Images
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Refresh Analytics Data</CardTitle>
                        <CardDescription>
                          Manually refresh all dashboard statistics
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Force a refresh of all analytics data from the database.
                    </p>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Stripe Connection Status */}
            <section>
              <Card className="border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Stripe Not Connected</CardTitle>
                        <CardDescription>Set up Stripe to start accepting payments</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                      Setup Required
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to enable subscription payments, view revenue analytics, and manage billing.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button className="gap-2" onClick={() => window.open('https://dashboard.stripe.com/register', '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                      Create Stripe Account
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => {
                      toast.info('See setup instructions below');
                    }}>
                      View Setup Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Revenue Overview (Placeholder) */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Revenue Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="opacity-60">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monthly Revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">$0.00</div>
                    <p className="text-sm text-muted-foreground mt-1">this month</p>
                  </CardContent>
                </Card>

                <Card className="opacity-60">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total Revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">$0.00</div>
                    <p className="text-sm text-muted-foreground mt-1">all time</p>
                  </CardContent>
                </Card>

                <Card className="opacity-60">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Subscribers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">0</div>
                    <p className="text-sm text-muted-foreground mt-1">active subscriptions</p>
                  </CardContent>
                </Card>

                <Card className="opacity-60">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Churn Rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">0%</div>
                    <p className="text-sm text-muted-foreground mt-1">this month</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Subscription Plans (Placeholder) */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Subscription Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed border-muted-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Free</CardTitle>
                    <CardDescription>Basic features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Up to 20 wardrobe items</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Basic outfit generation</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 5 favorites</li>
                    </ul>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">0 subscribers</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/50 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">Pro</CardTitle>
                    <CardDescription>For style enthusiasts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Unlimited wardrobe items</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> AI-powered suggestions</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Trip planning</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Unlimited favorites</li>
                    </ul>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">0 subscribers</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-muted-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Premium</CardTitle>
                    <CardDescription>For fashion pros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$19.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Everything in Pro</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Priority AI processing</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Style analytics</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Early access to features</li>
                    </ul>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">0 subscribers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Recent Transactions (Placeholder) */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Recent Transactions</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p className="font-medium">No transactions yet</p>
                          <p className="text-sm">Connect Stripe to start tracking payments</p>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>

            {/* Stripe Setup Instructions */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Stripe Setup Guide</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Create a Stripe Account</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Go to <a href="https://dashboard.stripe.com/register" target="_blank" className="text-primary hover:underline">stripe.com</a> and create an account. Complete the onboarding to activate your account.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Get Your API Keys</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          In your Stripe Dashboard, go to <strong>Developers → API keys</strong>. Copy your publishable and secret keys.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Publishable Key (Frontend)</p>
                            <code className="text-xs bg-background px-2 py-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</code>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Secret Key (Backend/Edge Functions)</p>
                            <code className="text-xs bg-background px-2 py-1 rounded">STRIPE_SECRET_KEY=sk_test_...</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Create Products & Prices in Stripe</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Go to <strong>Products</strong> in your Stripe Dashboard and create your subscription plans:
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <ul className="text-sm space-y-2">
                            <li>• <strong>Kikonasu Pro</strong> - $9.99/month (recurring)</li>
                            <li>• <strong>Kikonasu Premium</strong> - $19.99/month (recurring)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Add Environment Variables</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add these to your <code className="bg-muted px-1 rounded">.env</code> file and Supabase secrets:
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="text-xs overflow-x-auto">{`# .env (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Supabase Edge Function Secrets
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">5</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Set Up Webhook</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          In Stripe Dashboard → Webhooks, create an endpoint pointing to your Supabase edge function:
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <p className="text-xs text-muted-foreground">Endpoint URL:</p>
                          <code className="text-xs bg-background px-2 py-1 rounded block">
                            https://[your-project].supabase.co/functions/v1/stripe-webhook
                          </code>
                          <p className="text-xs text-muted-foreground mt-3">Events to listen for:</p>
                          <ul className="text-xs space-y-1">
                            <li>• checkout.session.completed</li>
                            <li>• customer.subscription.created</li>
                            <li>• customer.subscription.updated</li>
                            <li>• customer.subscription.deleted</li>
                            <li>• invoice.paid</li>
                            <li>• invoice.payment_failed</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">6</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Create Database Table</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Run this SQL in your Supabase SQL Editor to create the subscriptions table:
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="text-xs overflow-x-auto">{`-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');`}</pre>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={() => {
                            navigator.clipboard.writeText(`CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');`);
                            toast.success('SQL copied to clipboard');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copy SQL
                        </Button>
                      </div>
                    </div>

                    {/* Final Note */}
                    <div className="flex gap-4 pt-4 border-t">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Ready to Go!</h3>
                        <p className="text-sm text-muted-foreground">
                          Once you've completed these steps, create the Edge Functions for checkout and webhook handling.
                          Need the Edge Function code? Let me know and I'll generate it for you.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) =>
        setDeleteDialog({ isOpen, userId: null, userEmail: null })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the account for <strong>{deleteDialog.userEmail}</strong>?
              This will permanently delete all their data including wardrobe items, outfits,
              and favorites. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Items Modal */}
      <Dialog open={itemsModalOpen} onOpenChange={setItemsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              All Items Uploaded ({analytics.totalItems})
            </DialogTitle>
            <DialogDescription>
              Complete list of wardrobe items uploaded by users
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor:
                              item.color.toLowerCase() === "navy" ? "#001f3f" :
                              item.color.toLowerCase() === "beige" ? "#f5f5dc" :
                              item.color.toLowerCase()
                          }}
                        />
                        {item.color}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.uploadedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Outfits Modal */}
      <Dialog open={outfitsModalOpen} onOpenChange={setOutfitsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              All Outfits Created ({analytics.totalOutfits})
            </DialogTitle>
            <DialogDescription>
              Click on any outfit to view the items
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Occasion</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoOutfits.map((outfit) => (
                  <TableRow
                    key={outfit.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedOutfit(outfit);
                      setOutfitDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Badge variant="secondary">{outfit.occasion}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {outfit.items.map((item, idx) => {
                          const colorStyle = getColorStyle(item.color);
                          return (
                            <Badge
                              key={idx}
                              className="text-xs border-0"
                              style={{
                                backgroundColor: colorStyle.bg,
                                color: colorStyle.text,
                              }}
                            >
                              {item.category}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{outfit.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{outfit.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Outfit Detail Modal */}
      <Dialog open={outfitDetailOpen} onOpenChange={setOutfitDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Outfit Details
            </DialogTitle>
            <DialogDescription>
              {selectedOutfit && (
                <span>
                  Created by <strong>{selectedOutfit.userName}</strong> for <strong>{selectedOutfit.occasion}</strong> • {selectedOutfit.createdAt}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedOutfit && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {selectedOutfit.items.map((item, idx) => {
                const colorStyle = getColorStyle(item.color);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border overflow-hidden bg-card hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <Badge
                        className="mb-2 border-0"
                        style={{
                          backgroundColor: colorStyle.bg,
                          color: colorStyle.text,
                        }}
                      >
                        {item.color}
                      </Badge>
                      <p className="text-sm font-medium">{item.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setOutfitDetailOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Users Modal */}
      <Dialog open={activeUsersModalOpen} onOpenChange={setActiveUsersModalOpen}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Users (Last 7 Days)
            </DialogTitle>
            <DialogDescription>
              Users who have been active in the past week
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {analytics.users
                .filter(u => u.status === "Power User" || u.status === "Active")
                .map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-sm font-semibold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Last active: {user.lastActive}</p>
                    </div>
                  </div>
                ))}
              {analytics.users.filter(u => u.status === "Power User" || u.status === "Active").length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active users in the last 7 days</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
