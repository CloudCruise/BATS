export const staticImports = `<!-- 1) Tailwind config BEFORE the CDN -->
<script>
  window.tailwind = {
    config: {
      darkMode: 'class',
      theme: {
        extend: {
          colors: { accent: 'var(--accent, #6366f1)' },
          boxShadow: { soft: '0 6px 24px rgba(0,0,0,.08)' },
          borderRadius: { card: 'var(--radius, 0.75rem)' }
        }
      }
    }
  };
</script>

<!-- 2) Tailwind Play CDN (+ forms plugin improves inputs) -->
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>

<!-- 3) Your shadcn-style component classes using @apply -->
<style type="text/tailwindcss">
  @layer components {
    .card { @apply bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-card shadow-soft; }
    .btn { @apply inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2; }
    .btn-primary { @apply btn text-white bg-[color:accent] hover:brightness-95 focus-visible:ring-[color:accent]; }
    .btn-outline { @apply btn border border-slate-300 bg-white text-slate-800 hover:bg-slate-50; }
    .input { @apply block w-full rounded-md border-slate-300 bg-white text-slate-900 placeholder-slate-400 shadow-sm focus:border-[color:accent] focus:ring-[color:accent]; }
    .select { @apply input; }
    .badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[color:accent]/15 text-[color:accent]; }
    .dialog-backdrop { @apply fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center; }
    .toast { @apply fixed bottom-6 left-6 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800 shadow; }
    /* Utility hooks for live editor (optional) */
    .accent-bg { @apply bg-[color:accent]; } .accent-text { @apply text-[color:accent]; }
  }
</style>
`;
