import { Button } from "./components/ui/button";

export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">thmh example</h1>
      <section className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </section>
      <section className="flex flex-wrap items-center justify-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="default">Default size</Button>
        <Button size="lg">Large</Button>
      </section>
      <section className="w-full max-w-sm">
        <Button fullWidth variant="secondary">
          Full width
        </Button>
      </section>
      <section className="flex flex-wrap items-center justify-center gap-3">
        <Button disabled>Disabled</Button>
      </section>
    </main>
  );
}
