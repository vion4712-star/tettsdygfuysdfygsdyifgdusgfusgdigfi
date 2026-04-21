import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from '@tanstack/react-router';
import { Store, Zap, ExternalLink } from 'lucide-react';
import { SiDiscord } from 'react-icons/si';
import ServerStatusCard from '../components/ServerStatusCard';

export default function HomePage() {
  const navigate = useNavigate();

  const voteLinks = [
    {
      name: 'Minecraft-mp.com',
      url: 'https://minecraft-mp.com',
      tooltip: 'Vote for us on Minecraft-mp.com and help us grow!',
    },
    {
      name: 'TopG.org',
      url: 'https://topg.org',
      tooltip: 'Support the server by voting on TopG.org!',
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section
        className="relative h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/generated/cupcake-hero-banner.dim_1200x400.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cupcake-pink/20 via-background/80 to-background" />
        <div className="container relative z-10 text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold pixel-font text-cupcake-pink drop-shadow-lg">
            Welcome to CupCakeMC
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Upgrade your Minecraft experience with exclusive ranks, crate keys, and perks!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="cupcake-gradient hover:cupcake-gradient-hover text-white text-lg px-8 shadow-cupcake"
              onClick={() => navigate({ to: '/shop' })}
            >
              <Store className="w-5 h-5 mr-2" />
              Browse Shop
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-cupcake-brown hover:bg-cupcake-cream/30 text-white hover:text-white"
            >
              <Zap className="w-5 h-5 mr-2" />
              View Perks
            </Button>
          </div>
        </div>
      </section>

      {/* Server Status Section */}
      <section className="container py-16">
        <div className="max-w-md mx-auto">
          <ServerStatusCard />
        </div>
      </section>

      {/* Vote Section */}
      <section id="vote-section" className="container py-16 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-cupcake-pink/50 bg-card/50 shadow-cupcake">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/assets/generated/vote-icon-transparent.dim_64x64.png"
                  alt="Vote"
                  className="w-16 h-16 pixelated"
                />
              </div>
              <CardTitle className="text-3xl pixel-font text-cupcake-pink">
                Vote for the Server
              </CardTitle>
              <CardDescription className="text-base text-white/80">
                Support CupCakeMC by voting on popular Minecraft server listing sites!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="grid gap-4">
                  {voteLinks.map((link) => (
                    <Tooltip key={link.name}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-cupcake-brown/50 hover:bg-cupcake-frosting/20 text-white hover:text-white"
                          asChild
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <span className="font-semibold">{link.name}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{link.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Discord Section */}
      <section id="discord-section" className="container py-16 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-cupcake-pink/50 bg-card/50 shadow-cupcake">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/assets/generated/discord-icon-transparent.dim_64x64.png"
                  alt="Discord"
                  className="w-16 h-16 pixelated"
                />
              </div>
              <CardTitle className="text-3xl pixel-font text-cupcake-pink">
                Join Our Discord
              </CardTitle>
              <CardDescription className="text-base text-white/80">
                Connect with our community, get support, and stay updated with server news!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                size="lg"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-lg px-8"
                asChild
              >
                <a href="https://discord.gg/bHrMWEYg7E" target="_blank" rel="noopener noreferrer">
                  <SiDiscord className="w-5 h-5 mr-2" />
                  Join CupCakeMC Discord
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 pixel-font text-cupcake-pink">
          Why Choose CupCakeMC?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 border border-cupcake-pink/50 shadow-cupcake hover:shadow-cupcake-lg transition-shadow">
            <img
              src="/assets/generated/crown-icon-transparent.dim_64x64.png"
              alt="Ranks"
              className="w-16 h-16 mx-auto pixelated"
            />
            <h3 className="text-xl font-bold text-cupcake-pink">Exclusive Ranks</h3>
            <p className="text-white/80">
              Unlock special permissions, commands, and cosmetics with our premium ranks.
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 border border-cupcake-pink/50 shadow-cupcake hover:shadow-cupcake-lg transition-shadow">
            <img
              src="/assets/generated/crate-key-icon-transparent.dim_64x64.png"
              alt="Crate Keys"
              className="w-16 h-16 mx-auto pixelated"
            />
            <h3 className="text-xl font-bold text-cupcake-pink">Crate Keys</h3>
            <p className="text-white/80">
              Open mystery crates to receive rare items, resources, and exclusive rewards.
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 border border-cupcake-pink/50 shadow-cupcake hover:shadow-cupcake-lg transition-shadow">
            <img
              src="/assets/generated/diamond-sword-icon-transparent.dim_64x64.png"
              alt="Perks"
              className="w-16 h-16 mx-auto pixelated"
            />
            <h3 className="text-xl font-bold text-cupcake-pink">Special Perks</h3>
            <p className="text-white/80">
              Get temporary abilities like flight, speed boosts, and more to enhance gameplay.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
