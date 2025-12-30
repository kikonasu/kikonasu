import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, Home } from "lucide-react";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";

// Test admin credentials - update these to match your admin user
const TEST_ADMIN_EMAIL = "admin@kikonasu.com";
const TEST_ADMIN_PASSWORD = "admin123456";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate login inputs
      loginSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // If in admin mode, check for admin role and redirect to admin dashboard
      if (isAdminMode && data.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .single();

        if (roles) {
          toast.success("Welcome, Admin!");
          navigate("/admin");
          return;
        } else {
          toast.error("Access denied - not an admin account");
          await supabase.auth.signOut();
          return;
        }
      }

      toast.success("Welcome back!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail(TEST_ADMIN_EMAIL);
    setPassword(TEST_ADMIN_PASSWORD);
    toast.success("Test credentials filled!");
  };

  const createAdminAccount = async () => {
    // Demo mode - bypass authentication for demo purposes
    localStorage.setItem('admin_demo_mode', 'true');
    toast.success("Welcome, Admin!");
    navigate("/admin");
  };

  // Admin mode UI with mesh gradient
  if (isAdminMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Clean White Background with subtle color hints */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100">
          {/* Soft colored orbs for subtle hints */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-20 -right-20 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Tiny dots overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Back button */}
        <button
          onClick={() => setIsAdminMode(false)}
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm transition-colors"
        >
          <span>&larr;</span> Back to regular login
        </button>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-200/50">
            {/* Admin Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-500">
                Secure access to system administration
              </p>
            </div>

            {/* Admin Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-gray-700">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-gray-700">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Create Admin Account Button */}
              <Button
                type="button"
                variant="outline"
                onClick={createAdminAccount}
                disabled={loading}
                className="w-full bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {loading ? "Creating..." : "Create & Sign In with Test Account"}
              </Button>
            </form>

            {/* Security notice */}
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-xs">
                Test account: admin@kikonasu.com / admin123456
              </p>
              <p className="text-gray-400 text-xs">
                This area is restricted to authorized administrators only
              </p>
            </div>
          </div>
        </div>

        {/* Bottom left icons */}
        <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
          {/* Spinning Coin to go back */}
          <button
            onClick={() => setIsAdminMode(false)}
            className="w-6 h-6 animate-spin-slow cursor-pointer hover:scale-110 transition-transform"
            title="Back to sign in"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-lg border-2 border-gray-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
          </button>

          {/* Home icon - go to landing page */}
          <button
            onClick={() => navigate("/")}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            title="Go to landing page"
          >
            <Home className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Base white/light background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-slate-100" />


      {/* Aurora mesh gradients - vibrant moving colors */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left aurora - violet/purple */}
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.4] animate-aurora-1"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #e879f9)' }}
        />
        {/* Top right aurora - cyan/teal */}
        <div
          className="absolute -top-20 -right-40 w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.35] animate-aurora-2"
          style={{ background: 'linear-gradient(225deg, #2dd4bf, #22d3ee, #38bdf8)' }}
        />
        {/* Bottom left aurora - orange/pink */}
        <div
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.35] animate-aurora-3"
          style={{ background: 'linear-gradient(45deg, #f87171, #fb923c, #facc15)' }}
        />
        {/* Bottom right aurora - green/lime */}
        <div
          className="absolute -bottom-20 -right-40 w-[480px] h-[480px] rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.3] animate-aurora-4"
          style={{ background: 'linear-gradient(315deg, #4ade80, #a3e635, #fde047)' }}
        />
        {/* Center glow - pink/lavender */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.25] animate-aurora-5"
          style={{ background: 'linear-gradient(180deg, #c7d2fe, #e879f9, #fda4af)' }}
        />
      </div>

      {/* Floating particles/lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[3px] h-[3px] bg-gradient-to-r from-violet-500/60 to-fuchsia-500/60 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <div
            key={`light-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400/50 to-blue-400/50 rounded-full animate-float-particle-reverse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div
            key={`glow-${i}`}
            className="absolute w-[5px] h-[5px] bg-gradient-to-r from-amber-400/40 to-rose-400/40 rounded-full animate-float-glow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${25 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Bottom left icons */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
        {/* Spinning Coin - clickable to access admin */}
        <button
          onClick={() => setIsAdminMode(true)}
          className="w-6 h-6 animate-spin-slow cursor-pointer hover:scale-110 transition-transform"
          title="Admin access"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-lg border-2 border-gray-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
        </button>

        {/* Home icon - go to landing page */}
        <button
          onClick={() => navigate("/")}
          className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Go to landing page"
        >
          <Home className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 p-8 space-y-6 border border-white/50">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Kikonasu" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Transform your wardrobe into endless possibilities
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Link to sign up */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary hover:underline text-sm"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
