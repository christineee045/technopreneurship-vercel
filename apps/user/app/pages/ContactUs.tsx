import { Header } from "../components/Header";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          This is a placeholder contact page. Replace with your real channels.
        </p>

        <div className="rounded-lg border p-5 space-y-2 text-sm">
          <p><span className="font-semibold">Email:</span> support@lendly.example</p>
          <p><span className="font-semibold">Phone:</span> +63 900 000 0000</p>
          <p><span className="font-semibold">Hours:</span> Mon-Fri, 9:00 AM - 6:00 PM</p>
        </div>
      </main>
    </div>
  );
}
