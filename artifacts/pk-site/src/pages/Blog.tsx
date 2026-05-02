import { Link } from "wouter";
import { motion } from "framer-motion";

const posts = [
  {
    slug: "on-the-nature-of-things",
    title: "On the Nature of Things",
    date: "October 14, 2023",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip."
  },
  {
    slug: "architectural-patterns-in-prose",
    title: "Architectural Patterns in Prose",
    date: "September 28, 2023",
    excerpt: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat."
  },
  {
    slug: "the-quiet-spaces",
    title: "The Quiet Spaces",
    date: "August 02, 2023",
    excerpt: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit."
  }
];

export default function Blog() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-2xl pt-12"
    >
      <h1 className="text-4xl tracking-tight mb-16 text-foreground">Writing</h1>
      
      <div className="flex flex-col">
        {posts.map((post, i) => (
          <motion.article 
            key={post.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * i }}
            className="group py-10 border-t border-border/50 first:border-t-0 first:pt-0"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <span className="block text-sm tracking-widest uppercase text-muted-foreground mb-3">{post.date}</span>
              <h2 className="text-2xl mb-4 text-foreground group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="text-foreground/70 leading-relaxed">
                {post.excerpt}
              </p>
            </Link>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
