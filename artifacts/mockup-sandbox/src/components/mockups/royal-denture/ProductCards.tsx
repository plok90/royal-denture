import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Clock } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  days: number;
  stage: 1 | 2 | 3 | 4;
  image: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'تاج خزفي',
    price: 45000,
    days: 3,
    stage: 2,
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60',
    description: 'تاج خزفي عالي الجودة لتعويض الأسنان المفقودة بمظهر طبيعي.',
  },
  {
    id: 'p2',
    name: 'تاج معدني',
    price: 35000,
    days: 2,
    stage: 1,
    image: 'https://images.unsplash.com/photo-1598256989800-fea5f4705001?w=500&auto=format&fit=crop&q=60',
    description: 'تاج معدني متين للأسنان الخلفية يتحمل قوة المضغ.',
  },
  {
    id: 'p3',
    name: 'طقم كامل',
    price: 150000,
    days: 7,
    stage: 4,
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60',
    description: 'طقم أسنان كامل علوي وسفلي بمواد أكريليكية ممتازة.',
  },
  {
    id: 'p4',
    name: 'جسر',
    price: 120000,
    days: 4,
    stage: 3,
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=500&auto=format&fit=crop&q=60',
    description: 'جسر أسنان ثابت لتعويض سن أو أكثر، مصمم بدقة فائقة.',
  },
  {
    id: 'p5',
    name: 'فينير',
    price: 85000,
    days: 5,
    stage: 2,
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60',
    description: 'قشور خزفية (فينير) لابتسامة هوليود بمظهر جذاب وطبيعي.',
  },
  {
    id: 'p6',
    name: 'تاج زيركون',
    price: 65000,
    days: 3,
    stage: 3,
    image: 'https://images.unsplash.com/photo-1598256989800-fea5f4705001?w=500&auto=format&fit=crop&q=60',
    description: 'تاج زيركون بدون معدن، يجمع بين الجمالية العالية والصلابة.',
  },
];

const STAGE_COLORS = {
  1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  4: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export function ProductCards() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="min-h-screen bg-[#1a0a05] text-[#f4f0ea] font-['Cairo']" dir="rtl">
      {/* Hero Banner */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2a1308] to-[#1a0a05] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=2000&auto=format&fit=crop&q=20')] opacity-5 mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            كتالوج المنتجات <span style={{ color: '#c9a84c' }}>المميزة</span>
          </h1>
          <p className="text-lg text-[#f4f0ea]/70 max-w-2xl mx-auto">
            اختر من بين تشكيلة واسعة من التعويضات السنية المصنعة بأعلى معايير الجودة العالمية في مختبراتنا.
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <div 
              key={product.id}
              className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,168,76,0.15)] hover:border-[#c9a84c]/50 hover:-translate-y-1"
            >
              {/* Product Image Area */}
              <div className="relative h-56 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a05] to-transparent z-10"></div>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                />
                
                {/* Stage Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${STAGE_COLORS[product.stage]}`}>
                    مرحلة {product.stage}
                  </span>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-6 relative z-20 -mt-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{product.name}</h3>
                  <span className="text-xl font-bold" style={{ color: '#c9a84c' }}>
                    {product.price.toLocaleString('ar-IQ')} <span className="text-sm text-[#f4f0ea]/50">د.ع</span>
                  </span>
                </div>
                
                <p className="text-sm text-[#f4f0ea]/60 mb-6 line-clamp-2 min-h-[40px]">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 mb-6 text-sm text-[#f4f0ea]/70">
                  <Clock className="w-4 h-4" style={{ color: '#c9a84c' }} />
                  <span>مدة التسليم: {product.days} أيام</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/5">
                    <button 
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors"
                      disabled={!quantities[product.id]}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-medium font-['Outfit']">
                      {quantities[product.id] || 0}
                    </span>
                    <button 
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button 
                    className="rounded-full px-6 font-bold tracking-wide transition-all duration-300 hover:shadow-[0_0_15px_rgba(201,168,76,0.4)]"
                    style={{ backgroundColor: '#c9a84c', color: '#1a0a05' }}
                  >
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    أضف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
