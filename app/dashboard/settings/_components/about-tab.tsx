import {
  Card,
  CardHeader,
  CardContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
} from "@kwyw/kayv-glass-ui";
import { FieldLabel } from "@/components/ui/label";

const FAQ = [
  {
    q: "Where is my data stored?",
    a: "Your tasks, projects, journal, and expenses live in your own Supabase project. Preferences like your display name and theme are stored locally on this device.",
  },
  {
    q: "Can I export my journal entries?",
    a: "Supabase provides a built-in export tool in the dashboard. You can also query via the API.",
  },
  {
    q: "How do I connect to Supabase?",
    a: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
  },
  {
    q: "Is this project open source?",
    a: "This is your personal dashboard — you control the code and data entirely.",
  },
];

export function AboutTab() {
  return (
    <Card variant="elevated">
      <CardHeader title="About Kayv" description="Your personal life management dashboard" />
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">✦ Kayv</span>
            <Badge variant="primary" size="sm">
              Personal
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Built with Next.js, Tailwind CSS, @kwyw/kayv-glass-ui, and Supabase. Your data
            stays in your own Supabase project.
          </p>
        </div>

        <div>
          <FieldLabel mb="3">FAQ</FieldLabel>
          <Accordion>
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-slate-400 text-sm">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
