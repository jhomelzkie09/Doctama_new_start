import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Truck, 
  Shield, 
  Clock, 
  Heart, 
  Star, 
  Users, 
  MapPin, 
  ChevronRight,
  Sparkles,
  Leaf,
  Wrench,
  ArrowRight,
  MoveRight,
  CheckCircle2
} from 'lucide-react';

const About = () => {
  const stats = [
    { label: 'Years of Excellence', value: '26', icon: Award },
    { label: 'Happy Customers', value: '5,000+', icon: Users },
    { label: 'Products Sold', value: '25,000+', icon: Star },
    { label: 'Showrooms', value: '1', icon: MapPin }
  ];

  const values = [
    {
      title: 'Quality First',
      description: 'Every piece undergoes rigorous quality checks using only premium, hand-selected materials.',
      icon: Award,
      accent: 'bg-rose-50',
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100'
    },
    {
      title: 'Sustainable Practices',
      description: 'We source responsibly and use eco-friendly processes to protect what matters most.',
      icon: Leaf,
      accent: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      title: 'Customer Centric',
      description: 'Your satisfaction drives everything. Free delivery, 30-day returns, and always-on support.',
      icon: Heart,
      accent: 'bg-pink-50',
      iconColor: 'text-pink-700',
      iconBg: 'bg-pink-100'
    },
    {
      title: 'Expert Craftsmanship',
      description: 'Our artisans blend traditional Filipino joinery with contemporary Scandinavian design.',
      icon: Wrench,
      accent: 'bg-amber-50',
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-100'
    }
  ];

  const timeline = [
    {
      year: '2000',
      title: 'The Beginning',
      description: 'Doctama started as a small family workshop, hand-crafting custom furniture for local homes in Sorsogon.'
    },
    {
      year: '2015',
      title: 'First Showroom',
      description: 'Opened our first physical showroom, bringing our pieces directly into the hands — and hearts — of our customers.'
    },
    {
      year: '2026',
      title: 'Online Store Launch',
      description: 'Expanded nationwide with our e-commerce platform, making Doctama accessible to every Filipino home.'
    },
    {
      year: '2026',
      title: '26th Anniversary',
      description: 'Celebrating 26 years of creating beautiful, lasting spaces — and thousands of memories — for Filipino families.'
    }
  ];

  const promises = [
    'Premium materials, always',
    'Delivered with white-glove care',
    '2-year full warranty included',
    '30-day hassle-free returns',
    'Filipino artisan craftsmanship',
    'Sustainably sourced teak & hardwood',
  ];

  return (
    <div className="bg-white selection:bg-rose-100 selection:text-rose-900">

      {/* ─── Hero ─── */}
      <section className="relative bg-rose-950 py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-rose-950/95 to-rose-900" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-rose-200 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-7">
              <Sparkles className="w-3.5 h-3.5" />
              Est. 2000 · Sorsogon, Philippines
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6">
              Our <span className="italic text-rose-200">Story.</span>
            </h1>
            <p className="text-rose-100/70 text-lg leading-relaxed max-w-2xl mx-auto">
              For over 26 years, Doctama has been transforming Filipino homes with furniture that marries timeless design and exceptional Filipino craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-20 bg-white border-b border-stone-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-950 transition-colors duration-300">
                  <stat.icon className="w-6 h-6 text-rose-700 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-1 font-serif">{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Story ─── */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Text */}
            <div>
              <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Who We Are</span>
              <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mt-3 mb-8 leading-tight">
                Crafting Dreams <br />
                <span className="italic text-rose-700">into Reality.</span>
              </h2>
              <div className="space-y-5 text-slate-500 leading-relaxed text-sm">
                <p>
                  Doctama was born from a simple idea: every Filipino home deserves furniture that is both beautiful and functional. What started as a small family workshop has grown into a trusted name in Philippine furniture — but our commitment to quality remains unchanged.
                </p>
                <p>
                  We believe that furniture is more than utility. It's an expression of your personality, a backdrop for your memories, and an investment in your home's comfort. That's why we pour our hearts into every piece we create.
                </p>
                <p>
                  From our workshop to your living room, every Doctama piece carries the promise of durability, style, and the warmth of Filipino craftsmanship — built to last generations.
                </p>
              </div>

              {/* Promises checklist */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promises.map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="text-sm text-slate-600 font-medium">{p}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-rose-950 text-white rounded-full font-bold text-sm hover:bg-rose-900 transition-all hover:-translate-y-0.5"
              >
                Shop the Collection <MoveRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5]">
                <img
                  src="https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Our workshop"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-white border border-stone-100 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">15+ Years</div>
                  <div className="text-xs text-slate-400">of Excellence</div>
                </div>
              </div>
              {/* Second floating badge */}
              <div className="absolute -top-5 -right-5 bg-rose-950 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">5,000+</div>
                  <div className="text-xs text-rose-300/70">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-24 bg-[#F9F8F6]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Our Philosophy</span>
            <h2 className="text-4xl font-serif text-slate-900 mt-3 mb-4">What We Stand For</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Our values guide everything we do — from how we source materials to how we treat every customer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, i) => (
              <div
                key={i}
                className="group bg-white border border-stone-100 rounded-2xl p-7 hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${value.iconBg} rounded-xl flex items-center justify-center mb-5 group-hover:bg-rose-950 transition-colors duration-300`}>
                  <value.icon className={`w-5 h-5 ${value.iconColor} group-hover:text-white transition-colors duration-300`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{value.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Milestones</span>
            <h2 className="text-4xl font-serif text-slate-900 mt-3">Our Journey</h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Center line */}
            <div className="absolute left-1/2 -translate-x-1/2 w-px h-full bg-stone-100 hidden md:block" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col md:flex-row items-center gap-6 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-950 rounded-full border-4 border-rose-100 hidden md:block z-10" />

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Card */}
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:pl-10' : 'md:pr-10'}`}>
                    <div className="bg-white border border-stone-100 rounded-2xl p-7 hover:shadow-lg hover:border-transparent transition-all duration-300 group">
                      <span className="inline-flex items-center text-xs font-bold tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-full mb-4">
                        {item.year}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="py-14 bg-[#F9F8F6] border-y border-stone-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₱5,000' },
              { icon: Shield, title: '2-Year Warranty', desc: 'Full coverage, no questions' },
              { icon: Clock, title: 'Fast Delivery', desc: '3–5 business days' },
              { icon: Heart, title: '30-Day Returns', desc: 'Hassle-free guarantee' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white border border-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-24 bg-rose-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 to-rose-900" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <span className="text-rose-300 font-bold tracking-widest text-xs uppercase">Ready to Begin?</span>
          <h2 className="text-4xl md:text-5xl font-serif text-white mt-4 mb-4 leading-tight">
            Transform Your <span className="italic text-rose-200">Home Today.</span>
          </h2>
          <p className="text-rose-100/60 mb-10 max-w-xl mx-auto text-sm leading-relaxed">
            Explore our full collection of handcrafted furniture and find the perfect pieces for your space.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-950 rounded-full font-bold text-sm hover:bg-rose-50 transition-all hover:-translate-y-0.5"
            >
              Shop Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;