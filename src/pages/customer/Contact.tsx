import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle,
  AlertCircle,
  Facebook,
  Instagram,
  MessageSquare,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PenLine,
  Palette,
  Maximize2,
  Truck
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['Sitio Gabao, San Roque, Bacon', 'Sorsogon City, Sorsogon', 'Philippines 4700.'],
      accent: 'bg-rose-50 text-rose-700',
      iconBg: 'bg-rose-100'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+63 998 586 8888', 'Always Open'],
      accent: 'bg-amber-50 text-amber-700',
      iconBg: 'bg-amber-100'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['doctamasmarketing@gmail.com'],
      accent: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      icon: Clock,
      title: 'Store Hours',
      details: ['Mon – Sat: 9AM – 8PM', 'Sunday: 10AM – 6PM', 'Holidays: 10AM – 5PM'],
      accent: 'bg-indigo-50 text-indigo-700',
      iconBg: 'bg-indigo-100'
    }
  ];

  const customSteps = [
    { icon: MessageSquare, step: '01', title: 'Tell Us Your Vision', desc: 'Share your ideas — dimensions, style, materials, and any inspiration you have in mind.' },
    { icon: Palette, step: '02', title: 'Choose Your Finish', desc: 'Pick from our range of premium wood stains, fabrics, and hardware finishes.' },
    { icon: PenLine, step: '03', title: 'We Craft It for You', desc: 'Our Filipino artisans handcraft your piece with meticulous attention to every detail.' },
    { icon: Truck, step: '04', title: 'Delivered to Your Door', desc: 'Your bespoke furniture arrives white-glove delivered and ready to love.' },
  ];

  const faqs = [
    {
      question: 'How long does delivery take?',
      answer: 'Delivery within Sorsogon City takes 1 business day. Municipality deliveries may take 1–2 business days depending on your location.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer 30-day returns for unused items in original packaging. Custom and made-to-order pieces are non-returnable.'
    },
    {
      question: 'Do you offer installation services?',
      answer: 'Yes, we offer professional white-glove installation for selected furniture items using home credit. Additional fees may apply based on location. Just go to our store located in Gabao, Bacon, Sorsogon City to inquire about installation services and fees.'
    },
    {
      question: 'Can I track my order?',
      answer: 'Absolutely. We will send real-time SMS updates.'
    },
    {
      question: 'Do you accept custom furniture orders?',
      answer: 'Yes! Our craftsmen specialize in bespoke pieces. Reach out via this form or visit us to discuss your vision.'
    }
  ];

  return (
    <div className="bg-white selection:bg-rose-100 selection:text-rose-900">

      {/* ─── Hero ─── */}
      <section className="relative bg-rose-950 py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-rose-950/95 to-rose-900" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-rose-200 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            We'd Love to Hear from You
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6">
            Get in <span className="italic text-rose-200">Touch.</span>
          </h1>
          <p className="text-rose-100/70 text-lg max-w-xl mx-auto leading-relaxed">
            Whether it's a question about an order, a custom piece, or just a hello — our team is always happy to help.
          </p>
        </div>
      </section>

      {/* ─── Contact Info Cards ─── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="group bg-white border border-stone-100 rounded-2xl p-7 hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${info.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <info.icon className={`w-5 h-5 ${info.accent.split(' ')[1]}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-widest">{info.title}</h3>
                <div className="space-y-1">
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm text-slate-500 leading-relaxed">{detail}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Want a Customized Product Section ─── */}
      <section className="py-16 bg-[#FBFBFA] border-y border-stone-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Bespoke Service</span>
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mt-3 mb-4">
              Want a <span className="italic text-rose-700">Customized</span> Product?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Every home is unique — and so should your furniture. Tell us exactly what you want and we'll craft it for you.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left showcase */}
            <div className="lg:col-span-2 relative bg-rose-950 rounded-2xl md:rounded-[2rem] overflow-hidden min-h-[400px] flex flex-col justify-between p-8 group">
              <div className="absolute inset-0">
                <img
                  src="https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=900"
                  alt="Custom Furniture Workshop"
                  className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-950/80 to-rose-950/30" />
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-rose-200 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  Made to Order
                </span>
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-3xl md:text-4xl font-serif text-white leading-tight mb-3">
                    Your Vision, <br />
                    <span className="italic text-rose-200">Our Craft.</span>
                  </h3>
                  <p className="text-rose-100/70 text-sm leading-relaxed">
                    From custom dimensions to bespoke finishes — we bring your dream piece to life.
                  </p>
                </div>
                <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">500+</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Custom Pieces</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">4–6 wks</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Lead Time</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">100%</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right steps */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {customSteps.map((step, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-5 bg-white hover:bg-rose-950 rounded-xl md:rounded-2xl p-5 border border-stone-100 hover:border-transparent transition-all duration-300 cursor-default"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-stone-50 group-hover:bg-white/10 border border-stone-200 group-hover:border-white/20 flex items-center justify-center transition-all duration-300">
                    <step.icon className="w-5 h-5 text-rose-700 group-hover:text-rose-300 transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold tracking-widest text-stone-400 group-hover:text-rose-400 uppercase mb-1 transition-colors duration-300">
                      Step {step.step}
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-white text-sm mb-1 transition-colors duration-300">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-rose-100/60 leading-relaxed transition-colors duration-300">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material options */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Solid Teak Wood', sub: 'Sustainably sourced', color: 'bg-amber-50 border-amber-100', text: 'text-amber-800', sub_text: 'text-amber-600/70' },
              { label: 'Premium Fabrics', sub: 'Linen, velvet & more', color: 'bg-rose-50 border-rose-100', text: 'text-rose-800', sub_text: 'text-rose-600/70' },
              { label: 'Custom Dimensions', sub: 'Any size, any shape', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-800', sub_text: 'text-emerald-600/70' },
              { label: 'Hardware Finishes', sub: 'Brass, matte black & more', color: 'bg-slate-50 border-slate-100', text: 'text-slate-800', sub_text: 'text-slate-500' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded-xl md:rounded-2xl px-5 py-4 flex flex-col gap-1`}>
                <Maximize2 className={`w-4 h-4 mb-1 ${item.text}`} />
                <span className={`font-bold text-sm ${item.text}`}>{item.label}</span>
                <span className={`text-xs ${item.sub_text}`}>{item.sub}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <button
              onClick={() => {
                setFormData({ 
                  ...formData, 
                  subject: 'Custom Furniture Inquiry',
                  message: 'I would like to inquire about a custom furniture piece...'
                });
                document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-rose-950 text-white rounded-full font-bold text-sm hover:bg-rose-900 transition-all shadow-lg shadow-rose-200"
            >
              Start Your Custom Request <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Form + Map/FAQ ─── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Contact Form */}
            <div className="bg-[#FAFAF9] border border-stone-100 rounded-[2rem] p-10">
              <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Drop Us a Line</span>
              <h2 className="text-3xl font-serif text-slate-900 mt-2 mb-2">Send a Message</h2>
              <p className="text-slate-500 text-sm mb-8">We'll get back to you within 24 hours.</p>

              {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-800 font-semibold text-sm">Message sent!</p>
                    <p className="text-emerald-600 text-xs mt-0.5">We'll respond to you shortly.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-stone-200 rounded-xl text-slate-900 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
                      placeholder="Juan dela Cruz"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-stone-200 rounded-xl text-slate-900 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-stone-200 rounded-xl text-slate-900 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
                    placeholder="Custom order inquiry, delivery question…"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-5 py-3.5 bg-white border border-stone-200 rounded-xl text-slate-900 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition resize-none"
                    placeholder="Tell us more about what you need…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-rose-950 text-white rounded-xl font-bold text-sm hover:bg-rose-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Map + FAQ */}
            <div className="flex flex-col gap-6">

              {/* Map */}
              <div className="bg-[#FAFAF9] border border-stone-100 rounded-[2rem] overflow-hidden">
                <div className="px-8 pt-8 pb-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Find Our Showroom</h3>
                    <p className="text-xs text-slate-400">Sorsogon City, Philippines</p>
                  </div>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3880.123456!2d124.0236711!3d13.007442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a0ee344986b603%3A0xccf2019a343d0506!2sDOCTAMA%27S%20MARKETING!5e0!3m2!1sen!2sph!4v1234567890"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Doctama's Marketing Location"
                  />
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="bg-[#FAFAF9] border border-stone-100 rounded-[2rem] p-8 flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Frequently Asked Questions</h3>
                    <p className="text-xs text-slate-400">Quick answers to common questions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-stone-100 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-stone-50 transition"
                      >
                        <span className="text-sm font-semibold text-slate-800 pr-4">{faq.question}</span>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                            openFaq === index ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {openFaq === index && (
                        <div className="px-5 pb-4 bg-white">
                          <p className="text-sm text-slate-500 leading-relaxed border-t border-stone-100 pt-3">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Banner ─── */}
      <section className="py-20 bg-rose-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img
            src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <span className="text-rose-300 font-bold tracking-widest text-xs uppercase">Stay Connected</span>
              <h3 className="text-4xl font-serif text-white mt-3 mb-2">
                Follow Our <span className="italic text-rose-200">Journey.</span>
              </h3>
              <p className="text-rose-100/60 text-sm max-w-sm leading-relaxed">
                Get inspired with new arrivals, behind-the-scenes craft, and exclusive deals on our socials.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://www.facebook.com/doctamamarketing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-7 py-4 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white hover:text-rose-950 transition-all duration-300 group"
              >
                <Facebook className="w-5 h-5" />
                Facebook
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
              </a>
              <a
                href="https://www.instagram.com/doctamamarketing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-7 py-4 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white hover:text-rose-950 transition-all duration-300 group"
              >
                <Instagram className="w-5 h-5" />
                Instagram
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;