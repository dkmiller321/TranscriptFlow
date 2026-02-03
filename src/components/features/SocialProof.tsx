'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const stats = [
  { value: '10K+', label: 'Transcripts extracted' },
  { value: '<3s', label: 'Average extraction time' },
  { value: '50+', label: 'Languages supported' },
];

const useCases = [
  { icon: '🎬', label: 'Content Creators' },
  { icon: '📚', label: 'Students' },
  { icon: '🔬', label: 'Researchers' },
  { icon: '🎙️', label: 'Podcasters' },
];

export function SocialProof() {
  return (
    <section className="border-y border-border/50 py-16 px-4 md:px-8 lg:px-12 bg-card/30">
      <div className="max-w-5xl mx-auto">
        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-3 gap-4 md:gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Use Cases */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground mb-4">Built for</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {useCases.map((useCase, index) => (
              <motion.span
                key={useCase.label}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  "bg-white/5 border border-white/10",
                  "text-sm font-medium text-foreground/80",
                  "transition-all duration-300",
                  "hover:bg-white/10 hover:border-primary/30"
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <span aria-hidden="true">{useCase.icon}</span>
                {useCase.label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
