import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";

const signupSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      signupSchema.parse({ name, email, password });

      // Pass name in metadata - the database trigger will create the profile
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name.trim(), // This will be available in raw_user_meta_data
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Profile is automatically created by database trigger
      // Track signup event
      if (data.user) {
        await supabase.from("analytics_events").insert({
          user_id: data.user.id,
          event_type: "user_signup",
          event_data: { name: name.trim(), email: email.trim() },
        });
      }

      toast.success("Welcome to Kikonasu! Setting up your wardrobe...");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))] p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-[var(--shadow-medium)] p-8 space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Kikonasu" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Join Kikonasu
            </h1>
            <p className="text-muted-foreground">
              Start discovering your perfect style
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background"
              />
            </div>

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
              {loading ? "Creating your account..." : "Create Account"}
            </Button>
          </form>

          {/* Link to sign in */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
