"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

import { profile } from "@/data/profile";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

type SectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

function Section({ id, eyebrow, title, description, className, children }: SectionProps) {
  return (
    <motion.section
      id={id}
      className={clsx("space-y-8 rounded-[2rem] border border-white/10 bg-white/4 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.28)] backdrop-blur-sm md:p-10", className)}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
        {description ? <p className="text-base leading-7 text-slate-300 md:text-lg">{description}</p> : null}
      </div>
      {children}
    </motion.section>
  );
}

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_30%),linear-gradient(180deg,#030711_0%,#071321_40%,#030711_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 md:px-8 lg:px-10">
        <header className="sticky top-0 z-30 mb-10 rounded-full border border-white/10 bg-slate-950/55 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/90">Lee Sanderson</p>
              <p className="mt-1 text-sm text-slate-300">Principal Software Craftsperson | Architect | Technology Leader</p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm text-slate-200">
              {[
                ["About", "#about"],
                ["Journey", "#journey"],
                ["Expertise", "#expertise"],
                ["Portfolio", "#portfolio"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="rounded-full border border-white/10 px-4 py-2 transition hover:border-cyan-300/40 hover:bg-white/6"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="space-y-8">
          <motion.section
            className="relative overflow-hidden rounded-[2.25rem] border border-white/12 bg-slate-950/70 p-8 shadow-[0_40px_120px_rgba(3,7,18,0.55)] backdrop-blur md:p-12"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.14),transparent_25%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                  Available for leadership, architecture, and high-impact delivery conversations
                </div>

                <div className="space-y-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200/90">
                    Enterprise Meets Edge
                  </p>
                  <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
                    {profile.headline}
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                    {profile.heroIntro}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Start a conversation
                  </a>
                  <a
                    href={profile.contact.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                  >
                    View LinkedIn
                  </a>
                  <a
                    href={profile.contact.github}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                  >
                    Explore GitHub
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                {profile.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    <p className="text-4xl font-semibold tracking-tight text-white">{metric.value}</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Section
              id="about"
              eyebrow="About Me"
              title="A software career built on depth, range, and staying hands-on"
              description={profile.summary}
            >
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5 text-slate-300">
                  <p className="text-lg leading-8">{profile.journey}</p>
                  <p className="text-base leading-7 text-slate-400">
                    Over the years I have operated as developer, team lead, architect, Scrum Master, development
                    manager, head of development, principal engineer, and CTO. The through line has always been the same:
                    solve hard problems with thoughtful engineering and keep quality high as systems scale.
                  </p>
                </div>
                <div className="space-y-3">
                  {profile.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                      <p className="text-sm leading-6 text-slate-200">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              id="expertise"
              eyebrow="Expertise"
              title="Technical breadth with a principal engineer's judgement"
              description="From architecture to delivery leadership, I bring the strategic lens of a senior technology leader and the practical instincts of someone who still builds."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.specialisms.map((specialism) => (
                  <div
                    key={specialism}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/[0.03] p-5"
                  >
                    <p className="text-base font-medium text-slate-100">{specialism}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200">Current Focus Areas</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <Section
            id="journey"
            eyebrow="Career Journey"
            title="A timeline from engineer to CTO to principal craftsperson"
            description="The roles changed over time, but the pattern remained consistent: lead with technical credibility, raise the bar for engineering, and keep delivery grounded in real outcomes."
          >
            <div className="grid gap-4">
              {profile.experience.map((item, index) => (
                <div
                  key={`${item.company}-${item.role}`}
                  className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 md:grid-cols-[80px_1fr]"
                >
                  <div className="flex items-start">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                      0{index + 1}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.role}</h3>
                        <p className="text-sm uppercase tracking-[0.22em] text-slate-400">{item.company}</p>
                      </div>
                      <p className="text-sm font-medium text-cyan-100">{item.period}</p>
                    </div>
                    <p className="max-w-3xl text-base leading-7 text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Section
              id="credentials"
              eyebrow="Education & Credentials"
              title="Strong technical foundations, continuously sharpened"
              description="Academic grounding in physics and computer science, combined with a long-standing habit of staying current with platforms, practices, and tools."
            >
              <div className="grid gap-4">
                {profile.education.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
                    <p className="text-base text-slate-100">{item}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {profile.certifications.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </Section>

            <Section
              id="portfolio"
              eyebrow="Portfolio"
              title="A premium home for future case studies and selected work"
              description="This site is intentionally ready for expansion, so portfolio content can be added without redesigning the experience."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {profile.portfolioTeasers.map((item) => (
                  <div
                    key={item.title}
                    className="flex min-h-56 flex-col justify-between rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.02] p-6"
                  >
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200">Coming Soon</p>
                      <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-4 text-base leading-7 text-slate-300">{item.description}</p>
                    </div>
                    <p className="mt-8 text-sm text-slate-500">Reserved for future portfolio expansion</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section
            id="contact"
            eyebrow="Connect"
            title="Open to conversations around architecture, leadership, and delivery"
            description="Whether the need is strategic technical direction, delivery leadership, or hands-on engineering depth, I bring both executive perspective and practical implementation experience."
            className="mb-6"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href={`mailto:${profile.contact.email}`}
                className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 transition hover:border-cyan-300/40 hover:bg-slate-950/75"
              >
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">Email</p>
                <p className="mt-3 text-lg font-semibold text-white">{profile.contact.email}</p>
              </a>
              <a
                href={profile.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 transition hover:border-cyan-300/40 hover:bg-slate-950/75"
              >
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">LinkedIn</p>
                <p className="mt-3 text-lg font-semibold text-white">Professional profile</p>
              </a>
              <a
                href={profile.contact.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 transition hover:border-cyan-300/40 hover:bg-slate-950/75"
              >
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">GitHub</p>
                <p className="mt-3 text-lg font-semibold text-white">Code and experiments</p>
              </a>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
