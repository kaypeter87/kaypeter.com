import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-2xl pt-12"
    >
      <h1 className="text-4xl tracking-tight mb-12 text-foreground">Contact</h1>
      
      <p className="text-lg leading-relaxed text-foreground/80 mb-12">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Please reach out if you would like to converse.
      </p>
      
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm tracking-widest uppercase text-muted-foreground">Email</label>
          <Input 
            id="email" 
            type="email" 
            placeholder="your@email.com" 
            className="rounded-none border-t-0 border-x-0 border-b border-border/50 bg-transparent px-0 py-4 text-lg focus-visible:ring-0 focus-visible:border-foreground transition-colors placeholder:text-muted-foreground/30 h-auto shadow-none"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm tracking-widest uppercase text-muted-foreground">Message</label>
          <Textarea 
            id="message" 
            placeholder="Your message..." 
            className="rounded-none border-t-0 border-x-0 border-b border-border/50 bg-transparent px-0 py-4 text-lg focus-visible:ring-0 focus-visible:border-foreground transition-colors placeholder:text-muted-foreground/30 min-h-[150px] resize-none shadow-none"
          />
        </div>
        
        <div className="pt-4">
          <Button 
            type="submit" 
            variant="outline" 
            className="rounded-none border-border hover:bg-foreground hover:text-background transition-all uppercase tracking-widest text-xs px-8 py-6"
          >
            Send Message
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
