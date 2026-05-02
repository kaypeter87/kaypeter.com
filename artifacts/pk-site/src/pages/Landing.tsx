import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center font-serif selection:bg-primary selection:text-primary-foreground">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <h1 className="text-[25vw] leading-none tracking-tighter text-foreground font-medium">
          PK
        </h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <div className="h-16 w-px bg-border/60" />
          <Link href="/about" className="text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors pb-1 border-b border-transparent hover:border-foreground">
            Enter
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
