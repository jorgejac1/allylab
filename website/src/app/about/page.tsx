import { Section, SectionHeader } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

const team = [
  {
    name: "Jorge Jacome",
    role: "Founder & CEO",
    bio: "Former Disney engineer. Passionate about making the web accessible to everyone.",
    avatar: "JJ",
    links: {
      github: "https://github.com/jorgejac1",
      linkedin: "https://linkedin.com/in/jorgejac",
      twitter: "https://twitter.com/jorgejac",
    },
  }
];

export const metadata = {
  title: "About - AllyLab",
  description: "Learn about AllyLab's mission to make the web accessible for everyone.",
};

export default function AboutPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Making the Web
            <br />
            <span className="gradient-text">Accessible for Everyone</span>
          </h1>
          <p className="text-xl text-text-secondary">
            We believe the internet should be usable by everyone, regardless of ability.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">
              Our Mission
            </span>
            <h2 className="text-3xl font-bold mb-6">
              Accessibility Shouldn&apos;t Be an Afterthought
            </h2>
            <p className="text-text-secondary text-lg mb-6">
              Over 1 billion people worldwide live with some form of disability. Yet the vast
              majority of websites remain inaccessible, creating barriers to information, services,
              and opportunities.
            </p>
            <p className="text-text-secondary text-lg mb-6">
              Traditional accessibility tools tell you what&apos;s wrong but leave you stranded when it
              comes to actually fixing the problems. AllyLab changes that.
            </p>
            <p className="text-text-secondary text-lg">
              We use AI to generate production-ready fixes, create pull requests automatically, and
              verify that issues are actually resolved.
            </p>
          </div>
          <Card className="text-center p-12" hover={false}>
            <div className="text-6xl mb-4">🌍</div>
            <div className="text-5xl font-bold text-primary mb-2">1B+</div>
            <p className="text-text-muted">
              People with disabilities worldwide deserve equal access to the digital world
            </p>
          </Card>
        </div>
      </Section>

      <Section className="bg-surface-secondary">
        <SectionHeader label="Our Story" title="From Hackathon to Enterprise Platform" />
        <div className="max-w-3xl mx-auto text-text-secondary text-lg space-y-6">
          <p>
            AllyLab started as a hackathon project at Disney, born from a simple frustration: why do
            accessibility tools only tell you what&apos;s wrong without helping you fix it?
          </p>
          <p>
            Working across Disney&apos;s digital properties — ESPN, ABC, Discovery, and Disney Parks —
            our team saw firsthand how accessibility testing created mountains of reports that sat
            in backlogs.
          </p>
          <p>
            We asked: what if AI could bridge that gap? What if instead of just flagging &quot;missing
            alt text,&quot; a tool could analyze the image context and suggest appropriate alternative
            text?
          </p>
          <p>
            That hackathon project won, and we kept building. Today, AllyLab is a comprehensive
            accessibility platform used by teams worldwide.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeader label="Our Values" title="What We Believe" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "♿",
              title: "Accessibility First",
              description:
                "We practice what we preach. AllyLab itself is built to WCAG 2.2 AAA standards.",
            },
            {
              icon: "🔧",
              title: "Actionable Over Informational",
              description:
                "Reports are useless if they don't lead to action. Every feature helps you fix problems.",
            },
            {
              icon: "🤝",
              title: "Developer Experience",
              description:
                "Accessibility tools should fit into existing workflows, not create new ones.",
            },
            {
              icon: "📖",
              title: "Transparency & Education",
              description:
                "We explain why issues matter and link to relevant WCAG criteria.",
            },
          ].map((value) => (
            <Card key={value.title}>
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl mb-4">
                {value.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
              <p className="text-text-secondary text-sm">{value.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Team Section */}
      <Section className="bg-surface-secondary">
        <SectionHeader label="Founder" title="The Person Behind AllyLab" />
        <div className="max-w-md mx-auto">
          {team.map((member) => (
            <Card key={member.name} className="text-center" hover={false}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-3xl font-bold text-black">
                {member.avatar}
              </div>
              <h3 className="font-semibold text-xl">{member.name}</h3>
              <p className="text-primary mb-4">{member.role}</p>
              <p className="text-text-secondary mb-6">{member.bio}</p>
              <div className="flex justify-center gap-4">
                {member.links.github && (
                  <a
                    href={member.links.github}
                    className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s GitHub`}
                  >
                    <Github size={20} />
                  </a>
                )}
                {member.links.linkedin && (
                  <a
                    href={member.links.linkedin}
                    className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn`}
                  >
                    <Linkedin size={20} />
                  </a>
                )}
                {member.links.twitter && (
                  <a
                    href={member.links.twitter}
                    className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s Twitter`}
                  >
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Careers CTA */}
        <div className="mt-12 text-center">
          <Card className="inline-block max-w-xl mx-auto" hover={false}>
            <h3 className="text-xl font-bold mb-2">Join the Team</h3>
            <p className="text-text-secondary mb-4">
              We&apos;re looking for passionate people who care about accessibility
              to help build the future of AllyLab.
            </p>
            <Link href="/contact">
              <Button variant="secondary">Get in Touch</Button>
            </Link>
          </Card>
        </div>
      </Section>

      <section className="py-24 px-6 gradient-mesh text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Join Us in Making the Web Accessible
        </h2>
        <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
          Start using AllyLab today and help build a more inclusive internet.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/contact">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary" size="lg">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}