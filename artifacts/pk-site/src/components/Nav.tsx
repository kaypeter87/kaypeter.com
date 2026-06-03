import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Nav() {
  return (
    <nav className="w-full flex items-center justify-between py-12 px-6 md:px-12 max-w-4xl mx-auto">
      <Link href="/" className="text-2xl tracking-tighter text-foreground hover:text-primary transition-colors">
        계성우
      </Link>
      <div className="flex items-center gap-6 text-sm text-foreground/80">
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <span className="text-muted-foreground/30">&middot;</span>
        <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <span className="text-muted-foreground/30">&middot;</span>
        <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <span className="text-muted-foreground/30">&middot;</span>
        <ThemeToggle className="-mr-2" />
      </div>
    </nav>
  );
}
