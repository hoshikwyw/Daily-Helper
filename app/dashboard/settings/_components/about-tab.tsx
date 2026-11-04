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
import { Logo } from "@/components/ui/logo";

// Written for the person using the app, who is usually not the one running it.
const FAQ = [
  {
    q: "Where is my data stored?",
    a: "Your tasks, projects, journal, and money entries are saved to your account in the cloud, so they are the same on the web and on your phone. Preferences like your display name and theme stay on this device.",
  },
  {
    q: "Can other people see my data?",
    a: "No. Every record belongs to the account that created it, and the database only ever returns your own. The admin who created your account cannot read your entries either.",
  },
  {
    q: "How do I change my password?",
    a: "Settings → Profile → Account. If you have forgotten it, use \"Forgot password?\" on the sign-in screen and a reset link is emailed to you.",
  },
  {
    q: "Can I get a copy of my money data?",
    a: "On the Money page, \"Save image\" turns the day, month, or year you are looking at into a picture you can keep or send.",
  },
];

export function AboutTab() {
  return (
    <Card variant="elevated">
      <CardHeader title="About Kayv" description="Your personal life management dashboard" />
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <Badge variant="primary" size="sm">
              Personal
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Built with Next.js, Tailwind CSS, @kwyw/kayv-glass-ui, and Supabase. Your data
            stays in your own Supabase project.
          </p>
          <div>
            <FieldLabel>Supabase connection</FieldLabel>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <>
                  <Badge variant="success" dot size="sm">
                    Connected
                  </Badge>
                  <span className="text-slate-400 text-sm truncate">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL}
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="warning" dot size="sm">
                    Not configured
                  </Badge>
                  <span className="text-slate-400 text-sm">Add .env to connect</span>
                </>
              )}
            </div>
          </div>
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
