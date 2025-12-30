import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Camera, Heart, Luggage, ShoppingBag, Palette,
  ArrowRight, Check, Star, Zap, Shield, ChevronRight
} from "lucide-react";
import kikonasuLogo from "@/assets/kikonasu-logo-optimized.webp";
import vid1 from "@/assets/vid1.mp4";
import vid2 from "@/assets/vid2.mp4";
import vid3 from "@/assets/vid3.mp4";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Upload Your Wardrobe",
      description: "Photograph your clothes and let AI categorize them automatically. Build your digital closet in minutes.",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Outfits",
      description: "Get personalized outfit suggestions based on your style, the weather, and the occasion.",
      color: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: Heart,
      title: "Save Favorites",
      description: "Build your personal lookbook by saving outfits you love. Never forget a great combination.",
      color: "from-rose-500/20 to-red-500/20",
    },
    {
      icon: Luggage,
      title: "Trip Planning",
      description: "Plan outfits for every day of your trip. Pack smarter, travel lighter.",
      color: "from-green-500/20 to-emerald-500/20",
    },
    {
      icon: ShoppingBag,
      title: "Smart Wish List",
      description: "See how new pieces would work with your existing wardrobe before you buy.",
      color: "from-amber-500/20 to-orange-500/20",
    },
    {
      icon: Palette,
      title: "Capsule Wardrobes",
      description: "Explore curated capsule collections and see what you need to complete the look.",
      color: "from-indigo-500/20 to-violet-500/20",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Up to 20 wardrobe items",
        "Basic outfit generation",
        "5 saved favorites",
        "Community support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9.99",
      description: "For style enthusiasts",
      features: [
        "Unlimited wardrobe items",
        "AI-powered suggestions",
        "Unlimited favorites",
        "Trip planning",
        "Style analytics",
        "Priority support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Premium",
      price: "$19.99",
      description: "For fashion professionals",
      features: [
        "Everything in Pro",
        "Priority AI processing",
        "Advanced analytics",
        "Early access to features",
        "Personal style consultation",
        "API access",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Fashion Blogger",
      content: "Kikonasu has completely changed how I plan my outfits. I save hours every week!",
      rating: 5,
    },
    {
      name: "James L.",
      role: "Business Professional",
      content: "Finally, an app that understands my style. The AI suggestions are spot-on.",
      rating: 5,
    },
    {
      name: "Emma K.",
      role: "Frequent Traveler",
      content: "The trip planning feature is a game-changer. No more overpacking!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kikonasuLogo} alt="Kikonasu" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-foreground">Kikonasu</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden min-h-screen flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src={vid3} type="video/mp4" />
          </video>
          {/* Light overlay */}
          <div className="absolute inset-0 bg-background/10" />
        </div>

        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Your Wardrobe,{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
              Transform your closet into a smart wardrobe. Get AI-powered outfit suggestions,
              plan trips effortlessly, and never wonder "what should I wear?" again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/signup")}>
                Start For Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 bg-card/50 backdrop-blur-sm" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Master Your Style
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify your daily outfit decisions and elevate your personal style.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-border/50 hover:border-primary/30 transition-colors hover:shadow-lg">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src={vid3} type="video/mp4" />
          </video>
          {/* Light overlay */}
          <div className="absolute inset-0 bg-background/10" />
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
        </div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Your Clothes",
                description: "Take photos of your wardrobe items. Our AI automatically categorizes them by type, color, and style.",
              },
              {
                step: "2",
                title: "Generate Outfits",
                description: "Let our AI create perfect outfit combinations based on your preferences, weather, and occasion.",
              },
              {
                step: "3",
                title: "Save & Plan",
                description: "Save your favorite looks, plan outfits for trips, and build your personal style guide.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-extrabold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">{item.title}</h3>
                <p className="text-white/90 font-medium drop-shadow-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border/50"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/signup")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by Style Enthusiasts
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src={vid3} type="video/mp4" />
          </video>
          {/* Light overlay */}
          <div className="absolute inset-0 bg-background/10" />
        </div>
        <div className="container mx-auto max-w-4xl relative">
          <div className="bg-card/50 backdrop-blur-md rounded-3xl p-8 md:p-12 text-center border border-border/50 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Wardrobe?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of style-conscious individuals who've simplified their daily outfit decisions.
            </p>
            <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/signup")}>
              Get Started Free
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={kikonasuLogo} alt="Kikonasu" className="h-8 w-auto" />
              <span className="text-lg font-semibold">Kikonasu</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap justify-center md:justify-end">
              <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate("/signup")} className="hover:text-foreground transition-colors">
                Sign Up
              </button>
              <button onClick={() => navigate("/waitlist")} className="hover:text-foreground transition-colors">
                Join Waitlist
              </button>
              <button onClick={() => toast.info("Affiliate program coming soon!")} className="hover:text-foreground transition-colors">
                Affiliates
              </button>
              <span>© 2025 Kikonasu. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
