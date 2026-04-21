import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-cupcake-pink/30 bg-card/50 backdrop-blur">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span>© 2025. Built with</span>
            <Heart className="w-4 h-4 text-cupcake-pink fill-cupcake-pink" />
            <span>using</span>
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cupcake-pink hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </div>
          <div className="text-sm text-white/80">
            Secure payments powered by UPI
          </div>
        </div>
      </div>
    </footer>
  );
}
