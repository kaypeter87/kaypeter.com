import { Link, useParams } from "wouter";
import { motion } from "framer-motion";

export default function BlogPost() {
  const { slug } = useParams();
  
  // Format the slug into a readable title for placeholder purposes
  const title = slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Blog Post";

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-2xl pt-12"
    >
      <Link href="/blog" className="inline-block mb-12 text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-1">
        &larr; Back to Writing
      </Link>
      
      <header className="mb-12">
        <span className="block text-sm tracking-widest uppercase text-muted-foreground mb-4">October 14, 2023</span>
        <h1 className="text-4xl md:text-5xl leading-tight tracking-tight text-foreground">{title}</h1>
      </header>
      
      <div className="space-y-8 text-lg leading-relaxed text-foreground/80">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        
        <blockquote className="border-l-2 border-primary/50 pl-6 my-10 italic text-xl text-foreground">
          "Aliquam nec arcu ac felis luctus varius. Nam sed tellus id magna elementum tincidunt."
        </blockquote>
        
        <p>
          Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula.
        </p>

        <p>
          Phasellus feugiat mauris eget erat. Donec non mattis mauris, quis tristique dolor. Aliquam nec arcu ac felis luctus varius.
        </p>
      </div>
    </motion.article>
  );
}
