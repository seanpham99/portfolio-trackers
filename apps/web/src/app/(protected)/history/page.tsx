export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light tracking-tight text-foreground">
          Transaction History
        </h1>
        <p className="text-muted-foreground mt-2">View all your portfolio transactions</p>
      </div>

      <div className="glass-card p-6 rounded-xl">
        <p className="text-muted-foreground">Transaction history will be displayed here.</p>
      </div>
    </div>
  );
}
