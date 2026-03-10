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
  Phone, 
  Mail,
  ChevronRight,
  Sparkles,
  Leaf,
  Wrench,
  Ruler,
  PenTool
} from 'lucide-react';

const About = () => {
  const stats = [
    { label: 'Years of Excellence', value: '15+', icon: Award },
    { label: 'Happy Customers', value: '5,000+', icon: Users },
    { label: 'Products Sold', value: '25,000+', icon: Star },
    { label: 'Showrooms', value: '8', icon: MapPin }
  ];

  const values = [
    {
      title: 'Quality First',
      description: 'Every piece of furniture is crafted from premium materials and undergoes rigorous quality checks.',
      icon: Award,
      color: 'text-red-600'
    },
    {
      title: 'Sustainable Practices',
      description: 'We source materials responsibly and use eco-friendly manufacturing processes.',
      icon: Leaf,
      color: 'text-green-600'
    },
    {
      title: 'Customer Centric',
      description: 'Your satisfaction is our priority. We offer free delivery and 30-day returns.',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      title: 'Expert Craftsmanship',
      description: 'Our skilled artisans combine traditional techniques with modern design.',
      icon: Wrench,
      color: 'text-orange-600'
    }
  ];

  const timeline = [
    {
      year: '2009',
      title: 'The Beginning',
      description: 'Doctama started as a small family workshop in Makati, crafting custom furniture.'
    },
    {
      year: '2015',
      title: 'First Showroom',
      description: 'Opened our first physical showroom, bringing our designs closer to customers.'
    },
    {
      year: '2020',
      title: 'Online Store Launch',
      description: 'Expanded online to serve customers nationwide with our e-commerce platform.'
    },
    {
      year: '2024',
      title: '15th Anniversary',
      description: 'Celebrating 15 years of creating beautiful spaces for Filipino homes.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Story</h1>
            <p className="text-xl text-red-100 leading-relaxed">
              For over 15 years, Doctama has been transforming Filipino homes with quality furniture that combines timeless design with exceptional craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Crafting Dreams into Reality</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Doctama was born from a simple idea: every Filipino home deserves furniture that is both beautiful and functional. What started as a small workshop has grown into a trusted name in Philippine furniture, but our commitment to quality remains unchanged.
                </p>
                <p>
                  We believe that furniture is more than just utility—it's an expression of your personality, a backdrop for your memories, and an investment in your home's comfort. That's why we pour our hearts into every piece we create.
                </p>
                <p>
                  From our workshop to your living room, every Doctama piece carries the promise of durability, style, and the warmth of Filipino craftsmanship.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1618220179423-22790b4611e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Our workshop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-red-600" />
                  <span className="font-semibold">15+ Years of Excellence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Stand For</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our values guide everything we do, from how we craft our furniture to how we serve our customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 ${value.color.replace('text', 'bg')} bg-opacity-10 rounded-lg flex items-center justify-center mb-4`}>
                  <value.icon className={`w-6 h-6 ${value.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-red-200 hidden md:block"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full border-4 border-red-100 hidden md:block"></div>
                  
                  {/* Content */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                      <span className="text-sm font-semibold text-red-600 mb-2 block">{item.year}</span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Home?</h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Explore our collection and discover the perfect pieces for your space.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-4 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Shop Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;