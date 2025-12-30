import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CalendarIcon, Trash2 } from "lucide-react";
import { format, differenceInDays, isFuture, addDays, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { PlanTypeSelector } from "@/components/PlanTypeSelector";

interface Suitcase {
  id: string;
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string[];
  weather_data: any;
  created_at: string;
  plan_type: 'trip' | 'week' | 'custom';
  is_local: boolean;
  outfit_count?: Array<{ count: number }>;
}

const Suitcases = () => {
  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [planTypeSelectorOpen, setPlanTypeSelectorOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [planType, setPlanType] = useState<'trip' | 'week' | 'custom'>('trip');
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [tripTypes, setTripTypes] = useState<string[]>(["work"]);

  useEffect(() => {
    checkAuthAndFetchSuitcases();
  }, []);

  const checkAuthAndFetchSuitcases = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchSuitcases();
  };

  const fetchSuitcases = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("suitcases")
        .select(`
          *,
          outfit_count:suitcase_outfits(count)
        `)
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setSuitcases((data || []) as Suitcase[]);
    } catch (error) {
      console.error("Error fetching suitcases:", error);
      toast({
        title: "Error loading plans",
        description: "Failed to load your plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanTypeSelect = (type: 'trip' | 'week' | 'custom') => {
    setPlanType(type);
    setPlanTypeSelectorOpen(false);
    
    // Auto-fill for "This Week" type
    if (type === 'week') {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
      setStartDate(weekStart);
      setEndDate(weekEnd);
      setTripName(`Week of ${format(weekStart, 'MMM d')}`);
      setDestination('Local');
    } else {
      // Reset for other types
      setTripName("");
      setDestination("");
      setStartDate(undefined);
      setEndDate(undefined);
    }
    
    setCreateDialogOpen(true);
  };

  const handleCreateSuitcase = async () => {
    const requiresDestination = planType === 'trip';
    
    if (!tripName || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (tripTypes.length === 0) {
      toast({
        title: "Missing trip type",
        description: "Please select at least one trip type",
        variant: "destructive",
      });
      return;
    }
    
    if (requiresDestination && !destination) {
      toast({
        title: "Missing destination",
        description: "Please enter a destination for your trip",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch weather forecast
      let weatherData = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const numDays = Math.min(differenceInDays(endDate, startDate) + 1, 5);

        const { data: weather, error: weatherError } = await supabase.functions.invoke('get-weather', {
          body: { lat: latitude, lon: longitude, days: numDays },
        });

        if (!weatherError && weather) {
          weatherData = weather;
        }
      } catch (weatherError) {
        console.log("Weather fetch failed, continuing without weather data:", weatherError);
      }

      // Create plan
      const { data: suitcase, error } = await supabase
        .from("suitcases")
        .insert({
          user_id: user.id,
          trip_name: tripName,
          destination: destination || 'Local',
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          trip_type: tripTypes,
          weather_data: weatherData,
          plan_type: planType,
          is_local: planType === 'week' || (planType === 'custom' && !destination),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan created!",
        description: `${tripName} is ready for outfit planning`,
      });

      // Reset form
      setPlanType('trip');
      setTripName("");
      setDestination("");
      setStartDate(undefined);
      setEndDate(undefined);
      setTripTypes(["work"]);
      setCreateDialogOpen(false);

      // Refresh list
      fetchSuitcases();

      // Navigate to detail view (we'll build this in Phase 3)
      // navigate(`/suitcases/${suitcase.id}`);
    } catch (error) {
      console.error("Error creating suitcase:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSuitcase = async (id: string, tripName: string) => {
    if (!confirm(`Delete "${tripName}"? This will remove all planned outfits.`)) return;

    try {
      const { error } = await supabase
        .from("suitcases")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Plan deleted",
        description: `${tripName} has been removed`,
      });

      fetchSuitcases();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Organize plans by type
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeekPlans = suitcases.filter(s => 
    s.plan_type === 'week' && 
    new Date(s.start_date) <= today && 
    new Date(s.end_date) >= today
  );
  
  const upcomingTrips = suitcases.filter(s => 
    s.plan_type === 'trip' && 
    new Date(s.start_date) >= today
  );
  
  const customPlans = suitcases.filter(s => 
    s.plan_type === 'custom' && 
    new Date(s.end_date) >= today
  );
  
  const pastPlans = suitcases.filter(s => new Date(s.end_date) < today);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate("/")} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Kikonasu" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground hidden xs:block truncate">Kikonasu</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs sm:text-sm px-2 sm:px-4">
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")} className="text-xs sm:text-sm px-2 sm:px-4">
              Wardrobe
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/favorites")} className="text-xs sm:text-sm px-2 sm:px-4">
              Favourites
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wishlist")} className="text-xs sm:text-sm px-2 sm:px-4">
              🛍️ Wish List
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">📅 My Plans</h2>
            <p className="text-muted-foreground">Plan outfits for your trips and weekly life</p>
          </div>
          
          <Button 
            onClick={() => setPlanTypeSelectorOpen(true)} 
            className="shadow-[var(--shadow-soft)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>

        {/* Plan Type Selector Modal */}
        <PlanTypeSelector
          open={planTypeSelectorOpen}
          onClose={() => setPlanTypeSelectorOpen(false)}
          onSelect={handlePlanTypeSelect}
        />

        {/* Create Plan Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {planType === 'trip' && 'Plan Your Trip'}
                {planType === 'week' && 'Plan This Week'}
                {planType === 'custom' && 'Create Custom Plan'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Plan Name */}
              <div className="space-y-2">
                <Label htmlFor="trip-name">
                  {planType === 'trip' ? 'Trip Name' : 'Plan Name'} *
                </Label>
                <Input
                  id="trip-name"
                  placeholder={
                    planType === 'trip' ? 'Melbourne Work Trip' : 
                    planType === 'week' ? 'Week of Nov 12' : 
                    'My Plan'
                  }
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>

              {/* Destination - Only for trips or custom plans */}
              {planType !== 'week' && (
                <div className="space-y-2">
                  <Label htmlFor="destination">
                    Destination {planType === 'trip' ? '*' : '(Optional)'}
                  </Label>
                  <Input
                    id="destination"
                    placeholder="City name or leave empty for local"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              )}

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="center"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="center"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => !startDate || date < startDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Trip Duration Display */}
                {startDate && endDate && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {differenceInDays(endDate, startDate) + 1} days
                  </p>
                )}

                {/* Trip Types - Multiple Selection with Checkboxes */}
                <div className="space-y-3">
                  <Label>
                    {planType === 'week' ? 'Style Preferences' : 'Trip Types'} *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select all that apply
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-work"
                        checked={tripTypes.includes("work")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripTypes([...tripTypes, "work"]);
                          } else {
                            setTripTypes(tripTypes.filter(t => t !== "work"));
                          }
                        }}
                      />
                      <label
                        htmlFor="type-work"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {planType === 'week' ? 'Professional' : 'Work/Business'}
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-casual"
                        checked={tripTypes.includes("casual")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripTypes([...tripTypes, "casual"]);
                          } else {
                            setTripTypes(tripTypes.filter(t => t !== "casual"));
                          }
                        }}
                      />
                      <label
                        htmlFor="type-casual"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Casual/Leisure
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-formal"
                        checked={tripTypes.includes("formal")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripTypes([...tripTypes, "formal"]);
                          } else {
                            setTripTypes(tripTypes.filter(t => t !== "formal"));
                          }
                        }}
                      />
                      <label
                        htmlFor="type-formal"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Formal Event
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-beach"
                        checked={tripTypes.includes("beach")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripTypes([...tripTypes, "beach"]);
                          } else {
                            setTripTypes(tripTypes.filter(t => t !== "beach"));
                          }
                        }}
                      />
                      <label
                        htmlFor="type-beach"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Beach/Resort
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-active"
                        checked={tripTypes.includes("active")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripTypes([...tripTypes, "active"]);
                          } else {
                            setTripTypes(tripTypes.filter(t => t !== "active"));
                          }
                        }}
                      />
                      <label
                        htmlFor="type-active"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Active/Outdoor
                      </label>
                    </div>
                  </div>
                  {tripTypes.length === 0 && (
                    <p className="text-sm text-destructive">Please select at least one type</p>
                  )}
                </div>
              </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateSuitcase} disabled={creating} className="flex-1">
                {creating ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {suitcases.length === 0 && (
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
            {/* Header Section */}
            <div className="text-center mb-12 sm:mb-16 animate-fade-in">
              <div className="text-6xl sm:text-7xl mb-6">📅</div>
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
                Plan Your Week. Never Wonder What to Wear.
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                From business trips to busy weeks - plan outfits in advance, pack efficiently, and eliminate morning stress.
              </p>
              
              {/* Two Primary Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
                <div className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all">
                  <div className="text-5xl mb-4">🧳</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">Trip Planning</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">Pack smart. Get weather. Generate outfits for each day.</p>
                  <Button 
                    size="lg" 
                    onClick={() => setPlanTypeSelectorOpen(true)}
                    className="w-full bg-[#F5F5F3] hover:bg-[#EBEBEB] text-[#2E2E2E] border border-[#E0E0E0] font-medium rounded-xl py-3 px-6 transition-all duration-200 shadow-sm"
                  >
                    Plan a Trip →
                  </Button>
                </div>
                <div className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all">
                  <div className="text-5xl mb-4">📅</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">Weekly Planning</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">Plan outfits for work, gym, dinner. Wake up ready.</p>
                  <Button 
                    size="lg" 
                    onClick={() => handlePlanTypeSelect('week')}
                    className="w-full bg-[#F5F5F3] hover:bg-[#EBEBEB] text-[#2E2E2E] border border-[#E0E0E0] font-medium rounded-xl py-3 px-6 transition-all duration-200 shadow-sm"
                  >
                    Plan This Week →
                  </Button>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12 sm:mb-16">
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-3xl mb-3">📍</div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Set Dates</h4>
                <p className="text-sm text-muted-foreground">Choose your trip or week</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-3xl mb-3">☀️</div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Get Weather</h4>
                <p className="text-sm text-muted-foreground">See forecasts automatically</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-3xl mb-3">👔</div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Multiple Occasions</h4>
                <p className="text-sm text-muted-foreground">Gym, work, dinner - all planned</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-3xl mb-3">✅</div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Packing List</h4>
                <p className="text-sm text-muted-foreground">Check off as you pack</p>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">⏰</div>
                <h4 className="font-semibold text-foreground mb-2">Save 2 Hours Per Week</h4>
                <p className="text-sm text-muted-foreground">No more morning outfit panic</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">🧳</div>
                <h4 className="font-semibold text-foreground mb-2">Never Overpack</h4>
                <p className="text-sm text-muted-foreground">Pack exactly what you need</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">🌤️</div>
                <h4 className="font-semibold text-foreground mb-2">Always Weather-Ready</h4>
                <p className="text-sm text-muted-foreground">Automatic weather-appropriate suggestions</p>
              </div>
            </div>

            {/* Example Preview */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 sm:p-8 mb-8">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-foreground mb-2">Melbourne Trip - Nov 12-17</h4>
                <div className="flex justify-center gap-4 text-2xl mb-3">
                  <span>☀️ 22°C</span>
                  <span>🌧️ 17°C</span>
                  <span>⛅ 19°C</span>
                </div>
                <p className="text-sm text-muted-foreground">6 outfits planned</p>
              </div>
            </div>

            {/* Bottom Text */}
            <p className="text-center text-sm text-muted-foreground">
              Plans work for trips and everyday life - eliminating "what should I wear?" stress forever.
            </p>
          </div>
        )}

        {/* This Week */}
        {thisWeekPlans.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">This Week</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {thisWeekPlans.map((suitcase) => (
                <SuitcaseCard
                  key={suitcase.id}
                  suitcase={suitcase}
                  onDelete={handleDeleteSuitcase}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">Upcoming Trips</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingTrips.map((suitcase) => (
                <SuitcaseCard
                  key={suitcase.id}
                  suitcase={suitcase}
                  onDelete={handleDeleteSuitcase}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Plans */}
        {customPlans.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">Custom Plans</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {customPlans.map((suitcase) => (
                <SuitcaseCard
                  key={suitcase.id}
                  suitcase={suitcase}
                  onDelete={handleDeleteSuitcase}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Plans */}
        {pastPlans.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-4">Past Plans</h3>
            <div className="grid md:grid-cols-2 gap-6 opacity-60">
              {pastPlans.map((suitcase) => (
                <SuitcaseCard
                  key={suitcase.id}
                  suitcase={suitcase}
                  onDelete={handleDeleteSuitcase}
                  isPast
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Suitcase Card Component
const SuitcaseCard = ({ 
  suitcase, 
  onDelete,
  isPast = false 
}: { 
  suitcase: Suitcase; 
  onDelete: (id: string, name: string) => void;
  isPast?: boolean;
}) => {
  const navigate = useNavigate();
  const numDays = differenceInDays(new Date(suitcase.end_date), new Date(suitcase.start_date)) + 1;

  const getWeatherEmoji = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '⛅';
      case 'rain':
      case 'drizzle':
        return '🌧️';
      case 'snow':
        return '❄️';
      case 'thunderstorm':
        return '⛈️';
      default:
        return '☁️';
    }
  };

  return (
    <div
      onClick={() => navigate(`/suitcases/${suitcase.id}`)}
      className="bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] border-2 border-border hover:border-[hsl(var(--coral))]/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-xl font-bold text-foreground mb-1 truncate">{suitcase.trip_name}</h4>
          {suitcase.plan_type !== 'week' && suitcase.destination !== 'Local' && (
            <p className="text-sm text-muted-foreground truncate">{suitcase.destination}</p>
          )}
        </div>
        <Badge 
          variant={isPast ? "secondary" : "default"}
          className="flex-shrink-0"
          style={!isPast ? { 
            backgroundColor: '#FF6B35',
            color: '#FFFFFF',
          } : undefined}
        >
          {isPast ? "Past" : suitcase.plan_type === 'week' ? "This Week" : "Upcoming"}
        </Badge>
      </div>

      {/* Dates */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground">
          {format(new Date(suitcase.start_date), "MMM d")} - {format(new Date(suitcase.end_date), "MMM d, yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">{numDays} days</p>
      </div>

      {/* Trip Types */}
      <div className="mb-4 flex flex-wrap gap-2">
        {suitcase.trip_type.map((type) => (
          <Badge 
            key={type} 
            variant={type === 'work' ? "default" : "secondary"}
            className="text-xs"
          >
            {type === 'work' && '💼 Business'}
            {type === 'casual' && '🌴 Leisure'}
            {type === 'formal' && '🎩 Formal'}
            {type === 'beach' && '🏖️ Beach'}
            {type === 'active' && '🏃 Active'}
          </Badge>
        ))}
      </div>

      {/* Weather Preview */}
      {suitcase.weather_data?.forecasts && (
        <div className="mb-4 p-3 bg-secondary/10 rounded-xl overflow-hidden">
          <p className="text-xs text-muted-foreground mb-2">Weather Forecast</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {suitcase.weather_data.forecasts.slice(0, 5).map((day: any, idx: number) => (
              <div key={idx} className="text-center flex-shrink-0 min-w-[50px]">
                <p className="text-xl mb-1">{getWeatherEmoji(day.condition)}</p>
                <p className="text-xs font-medium whitespace-nowrap">{day.temperature}°C</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outfits Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {suitcase.outfit_count?.[0]?.count || 0} outfit{(suitcase.outfit_count?.[0]?.count || 0) !== 1 ? 's' : ''} planned
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(suitcase.id, suitcase.trip_name);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Suitcases;
