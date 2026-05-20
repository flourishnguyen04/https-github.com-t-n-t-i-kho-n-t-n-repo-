import { ArrowDown, ArrowRight, BookOpen, Layers, PenLine, Repeat, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { featuredTopics, howToLearn } from "../data/staticContent";

const LandingPage = () => (
  <>
    <section className="glass-landing-hero relative overflow-hidden border-b border-border bg-paper">
      <div className="glass-gradient-layer" aria-hidden="true" />
      <div className="glass-bubble-layer" aria-hidden="true">
        <span className="glass-bubble glass-bubble-a" />
        <span className="glass-bubble glass-bubble-b" />
        <span className="glass-bubble glass-bubble-c" />
        <span className="glass-bubble glass-bubble-d" />
        <span className="glass-bubble glass-bubble-e" />
        <span className="glass-bubble glass-bubble-f" />
      </div>
      <div className="absolute inset-0" aria-hidden="true">
        <div className="glass-hero-panel absolute left-1/2 top-1/2 h-[min(620px,82vh)] w-[min(1080px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-paper border border-border shadow-paper" />
        <div className="glass-float-card absolute left-[8%] top-20 hidden h-40 w-28 rotate-[-5deg] rounded-paper border border-border shadow-tactile lg:block" />
        <div className="glass-float-card absolute right-[8%] top-28 hidden h-48 w-32 rotate-[6deg] rounded-paper border border-border shadow-tactile lg:block" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-pill mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted shadow-tactile">
            <PenLine aria-hidden="true" size={16} />
            Grammar-first writing practice
          </div>
          <h1 className="font-display text-5xl font-black text-primary sm:text-6xl lg:text-7xl">WriteWise</h1>
          <p className="mt-4 font-display text-2xl font-semibold text-primary">
            Write it right, unlock your insight.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
            Build better sentences before writing better paragraphs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button as={Link} to="/register" variant="secondary" size="lg">
              Get Started
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
            <Button as={Link} to="/login" variant="outline" size="lg">
              Log In
            </Button>
          </div>
          <a
            href="#ubt-theory"
            className="glass-scroll-cue mx-auto mt-9 inline-flex flex-col items-center gap-2 rounded-paper px-4 py-2 text-sm font-bold text-secondary transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40"
          >
            <span>See how WriteWise works</span>
            <ArrowDown aria-hidden="true" className="animate-bounce" size={22} />
          </a>
        </div>
      </div>
    </section>

    <section className="glass-landing-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="font-mono text-sm uppercase text-secondary">How to Learn</p>
        <h2 className="mt-2 font-display text-4xl font-black text-primary">Step-by-step grammar growth</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {howToLearn.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="glass-card p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-paper border border-secondary/30 bg-secondary/10 text-secondary">
                <Icon aria-hidden="true" size={22} />
              </div>
              <h3 className="font-display text-xl font-bold text-primary">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
            </Card>
          );
        })}
      </div>
    </section>

    <section className="glass-landing-band border-y border-border bg-paperSoft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-sm uppercase text-secondary">Featured Topics</p>
            <h2 className="mt-2 font-display text-4xl font-black text-primary">Launch learning paths</h2>
          </div>
          <Button as={Link} to="/register" variant="outline">
            Start with Health
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {featuredTopics.map((topic, index) => (
            <Card key={topic} className="featured-topic-card glass-card magic-bento-card p-5">
              <p className="font-mono text-xs text-muted">Topic {index + 1}</p>
              <h3 className="featured-topic-title mt-2 font-display font-bold text-primary">{topic}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {index === 0 ? "Unlocked first with full grammar activities." : "Unlocked through progress."}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section id="ubt-theory" className="glass-soft-section relative overflow-hidden scroll-mt-24">
      <div className="glass-soft-layer" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="font-mono text-sm uppercase text-secondary">UBT Theory</p>
        <h2 className="mt-2 font-display text-3xl font-black text-primary sm:text-4xl">
          Usage-Based Theory in WriteWise
        </h2>
        <p className="mt-4 text-lg leading-8 text-muted">
          Learners improve when they meet useful grammar many times in meaningful contexts, notice the pattern,
          practice it, and use it in their own writing.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          {
            title: "Input Flooding",
            text: "Learners see many examples of the target grammar so the brain can collect patterns naturally.",
            icon: BookOpen
          },
          {
            title: "Textual Enhancement",
            text: "Important grammar forms are highlighted so learners notice how the structure works.",
            icon: Search
          },
          {
            title: "Contextual Chunking",
            text: "Grammar is practiced in meaningful topic-based chunks, not isolated rules.",
            icon: Layers
          },
          {
            title: "Active Entrenchment",
            text: "Learners use the grammar repeatedly in tasks and writing until it becomes easier and more automatic.",
            icon: Repeat
          }
        ].map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="glass-card magic-bento-card relative p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-paper border border-secondary/30 bg-secondary/10 text-secondary">
                  <Icon aria-hidden="true" size={22} />
                </div>
                <span className="font-mono text-sm text-muted">{index + 1}</span>
              </div>
              <h3 className="font-display text-xl font-black text-primary">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-muted">{step.text}</p>
            </Card>
          );
        })}
      </div>
      <div className="glass-path-strip mt-5 rounded-paper border border-secondary/30 p-5">
        <p className="font-display text-lg font-black text-primary">
          Input Flooding → Textual Enhancement → Contextual Chunking → Active Entrenchment
        </p>
      </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="glass-cta-panel flex flex-col items-start justify-between gap-6 rounded-paper border p-8 shadow-paper md:flex-row md:items-center">
        <div>
          <p className="inline-flex rounded-paper border border-warning/50 bg-warning/10 px-6 py-3 font-display text-xl font-black uppercase text-warning shadow-tactile sm:text-2xl">
            Start your first grammar mission
          </p>
        </div>
        <Button as={Link} to="/register" variant="secondary" size="lg">
          Get Started
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </div>
    </section>
  </>
);

export default LandingPage;
