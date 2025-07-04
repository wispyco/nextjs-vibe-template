'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  Code,
  Github,
  Smartphone,
  Zap,
  MessageSquare,
  GitBranch,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate rotation based on scroll position
  const rotation = scrollY * 0.5;

  const LogoComponent = ({ size = 'w-8 h-8' }: { size?: string }) => (
    <div
      className={`${size} rounded-full overflow-hidden transition-transform duration-75 ease-out cursor-pointer bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={() => router.push('/')}
    >
      <span className="text-white font-bold text-xs">VW</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-100 to-orange-50 text-stone-900">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50/90 via-stone-100/90 to-orange-50/90 backdrop-blur-md border-b border-stone-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LogoComponent />
              <span 
                className="text-xl font-bold text-stone-800 cursor-pointer"
                onClick={() => router.push('/')}
              >
                VibeWeb.app
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-amber-700 transition-colors text-stone-700">
                Features
              </a>
              <a href="#demo" className="hover:text-amber-700 transition-colors text-stone-700">
                Demo
              </a>
              <a href="#guide" className="hover:text-amber-700 transition-colors text-stone-700">
                Guide
              </a>
              <a href="#pricing" className="hover:text-amber-700 transition-colors text-stone-700">
                Pricing
              </a>
              <a href="#about" className="hover:text-amber-700 transition-colors text-stone-700">
                About
              </a>
            </div>
            <Link href="/">
              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0">
                Start Building
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <Badge className="mb-6 bg-amber-100 text-amber-800 border-amber-300">
              The Future of Development is Here
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-stone-800 via-amber-800 to-orange-800 bg-clip-text text-transparent">
              Code with Your Voice.
              <br />
              Build with Your Mind.
            </h1>
            <p className="text-lg md:text-xl mb-8 text-stone-600 max-w-2xl lg:max-w-none">
              Transform ideas into production-ready Next.js applications through natural conversation.
              VibeWeb.app brings the prophetic vision of AI-powered development to your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-4 border-0"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Building Now
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-stone-300 text-stone-700 hover:bg-stone-100 text-lg px-8 py-4"
              >
                Read the Guide
              </Button>
            </div>
          </div>

          {/* Right side - Video preview */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-3xl opacity-20 scale-110"></div>
              <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://pub-35375825eb864c21936185d943da1ace.r2.dev/1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-stone-800">
            Revolutionary Development Experience
          </h2>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Experience the convergence of artificial intelligence and human creativity in software development
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">Voice-First Development</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Simply speak your ideas and watch as AI agents transform your voice into production-ready code.
                No keyboard required.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">AI Agent Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Work with specialized AI agents - Coder, Designer, Reviewer - each optimized for different aspects of development.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <Github className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">Seamless GitHub Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Automatic repository creation, pull request management, and version control. Your code lives where developers expect it.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">Mobile-First Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Build full-stack applications entirely from your phone. Preview, iterate, and deploy without leaving the mobile experience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">Instant Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Every change triggers automatic deployment with live preview URLs. See your ideas come to life in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-amber-50 border-stone-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-stone-800">Multimodal Input</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-stone-600">
                Communicate through voice, text, images, and soon video. The AI understands your intent across all modalities.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-stone-800">See the Magic in Action</h2>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Witness the seamless transformation from conversation to code
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-stone-100 to-amber-50 rounded-xl p-8 border border-stone-200 backdrop-blur-sm shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-stone-800">The New Development Paradigm</h3>
              <p className="text-stone-600 mb-6">
                Traditional coding requires years of learning syntax, frameworks, and deployment processes.
                VibeWeb.app represents the prophetic evolution of software development - where natural language
                becomes the primary interface between human creativity and machine execution.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div className="text-stone-700">
                    <span className="font-semibold">Speak:</span> "Create a portfolio website with a contact form"
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="text-stone-700">
                    <span className="font-semibold">AI Generates:</span> Complete Next.js application with routing, components, and API endpoints
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="text-stone-700">
                    <span className="font-semibold">Deploy:</span> Instant live preview with GitHub repository creation
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur-lg opacity-20"></div>
              <div className="relative bg-stone-50/80 rounded-xl p-6 border border-stone-200 backdrop-blur-sm shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600&h=400&fit=crop"
                  alt="Hands holding device - representing the tactile future of development"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prophetic Vision Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-orange-300/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-stone-100/80 to-amber-50/80 rounded-2xl p-12 border border-stone-200 backdrop-blur-sm shadow-xl">
              <h2 className="text-4xl font-bold mb-6 text-stone-800">The Prophetic Vision</h2>
              <p className="text-xl text-stone-600 mb-8 leading-relaxed">
                We stand at the precipice of a fundamental shift in how software is created. The convergence of
                large language models, natural language processing, and automated deployment represents
                not just an evolution, but a revolution in the democratization of technology creation.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-2">10x</div>
                  <div className="text-sm text-stone-500">Faster Development</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">Zero</div>
                  <div className="text-sm text-stone-500">Syntax Knowledge Required</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">∞</div>
                  <div className="text-sm text-stone-500">Creative Possibilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6 text-stone-800">Ready to Shape the Future?</h2>
          <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
            Join the revolution where ideas become reality through conversation. Be among the first to
            experience the future of software development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-4 border-0"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Early Access
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-stone-300 text-stone-700 hover:bg-stone-100 text-lg px-8 py-4"
              onClick={() => window.open('https://tally.so/r/meGOGO', '_blank')}
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-20 bg-stone-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <LogoComponent size="w-6 h-6" />
              <span className="font-semibold text-stone-800 cursor-pointer" onClick={() => router.push('/')}>
                VibeWeb.app
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-stone-500">
              <a href="#" className="hover:text-amber-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-amber-600 transition-colors">Terms</a>
              <a href="#guide" className="hover:text-amber-600 transition-colors">Guide</a>
              <a href="#" className="hover:text-amber-600 transition-colors">Contact</a>
            </div>
          </div>
          <div className="text-center mt-8 text-stone-400 text-sm">
            © 2025 VibeWeb.app. The future of development is here.
          </div>
        </div>
      </footer>
    </div>
  );
}