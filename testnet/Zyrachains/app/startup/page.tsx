export default function StartupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-secondary/60 dark:from-background dark:via-background dark:to-secondary flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
          Coming Soon
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          We're working on something amazing. Stay tuned!
        </p>
      </div>
    </div>
  );
}

