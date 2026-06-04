// A template re-mounts on every navigation (unlike layout), so this CSS
// fade-in re-runs on each route change — giving the whole app a soft, X-style
// no-hard-refresh transition. Pair with route loading.tsx skeletons.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in-up">{children}</div>;
}
