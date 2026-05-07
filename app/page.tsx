import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="info" className="w-fit">🚀 Next-Generation Safety Platform</Badge>
                <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
                  Community Safety, 
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> Real-Time Connected</span>
                </h1>
              </div>
              
              <p className="text-xl text-neutral-600 leading-relaxed">
                SafeConnect is the premium community safety platform powered by real-time mapping, incident command, and trusted response coordination. Prevention, response, and recovery—all in one unified system.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/sos">
                  <Button variant="danger" size="lg" className="text-lg">
                    🚨 Activate SOS
                  </Button>
                </Link>
                <Link href="/live-map">
                  <Button variant="secondary" size="lg" className="text-lg">
                    📍 View Live Map
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-neutral-200">
                <div>
                  <p className="text-3xl font-bold text-blue-600">24/7</p>
                  <p className="text-sm text-neutral-600">Real-time Monitoring</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-cyan-600">Live</p>
                  <p className="text-sm text-neutral-600">Map Integration</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-500">100+</p>
                  <p className="text-sm text-neutral-600">Safe Zones</p>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-1 shadow-2xl">
                <div className="bg-white rounded-xl p-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-neutral-700">LIVE INCIDENT TRACKING</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-semibold text-red-900">Critical Alert</p>
                        <p className="text-xs text-red-700">Central Park • 2 min ago</p>
                      </div>
                      <Badge variant="danger">CRITICAL</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <p className="font-semibold text-amber-900">High Priority</p>
                        <p className="text-xs text-amber-700">Downtown • 5 min ago</p>
                      </div>
                      <Badge variant="warning">HIGH</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="font-semibold text-green-900">Active Safe Zone</p>
                        <p className="text-xs text-green-700">Campus • 15 responders</p>
                      </div>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" className="mb-4 mx-auto">FEATURES</Badge>
            <h2 className="text-4xl font-bold text-neutral-900">Premium Platform Features</h2>
            <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto">
              Best-in-class safety infrastructure with enterprise-grade reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🆘"
              title="SOS Emergency"
              description="Instant panic button with live location, auto-contact, and silent mode"
              href="/sos"
            />
            <FeatureCard
              icon="👥"
              title="Safety Circle"
              description="Trusted contacts receive real-time alerts and status updates"
              href="/safety-circle"
            />
            <FeatureCard
              icon="📍"
              title="Safe Zones"
              description="Real-time map of verified safe locations and partner network"
              href="/safe-zones"
            />
            <FeatureCard
              icon="🚶"
              title="Safe Walk"
              description="Monitored walk sessions with ETA alerts and route tracking"
              href="/safe-walk"
            />
            <FeatureCard
              icon="🗺️"
              title="Live Map"
              description="Real-time incident overlay with incident heatmap and patrol visibility"
              href="/live-map"
            />
            <FeatureCard
              icon="📋"
              title="Incident Command"
              description="Professional incident management and escalation workflows"
              href="/command-center"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="info" className="mb-4">VISUAL OPERATIONS</Badge>
              <h2 className="text-4xl font-bold text-white">Branded Safety Intelligence Experience</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Premium visuals designed for community trust, command clarity, and responder speed.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <Image
                src="/images/community-response.svg"
                alt="Community responders coordinating on a shared safety network"
                width={720}
                height={480}
                className="h-52 w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold text-white">Community Response Network</h3>
                <p className="text-sm text-slate-300">Residents, moderators, and field teams move in one synchronized response loop.</p>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <Image
                src="/images/command-center.svg"
                alt="Modern command center dashboard monitoring real-time incidents"
                width={720}
                height={480}
                className="h-52 w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold text-white">Command Center Intelligence</h3>
                <p className="text-sm text-slate-300">Live operations board for triage, escalation, routing, and stakeholder coordination.</p>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <Image
                src="/images/campus-safety.svg"
                alt="Campus safety deployment with verified safe-zones and patrol pathways"
                width={720}
                height={480}
                className="h-52 w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold text-white">Campus and District Safety</h3>
                <p className="text-sm text-slate-300">Institutional-grade visibility across safe zones, escort routes, and incident corridors.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Community Safety?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading institutions using SafeConnect for real-time safety and incident response.
          </p>
          <Link href="/access?next=/command-center">
            <Button variant="secondary" size="lg" className="text-lg">
              Get Started for Your Organization
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <Card variant="elevated" className="hover:shadow-elevated transition-all cursor-pointer h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-600 mb-4">{description}</p>
        <span className="text-blue-600 font-semibold hover:text-blue-700">Learn More →</span>
      </Card>
    </Link>
  );
}
