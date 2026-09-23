import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, ArrowRight, CheckCircle2, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Mock Data
const PRODUCTS = [
  { id: 1, name: "طقم أسنان كامل (أكريليك)", price: 75000, category: "أطقم الأسنان", image: "https://placehold.co/150x150/f4f0ea/1a0a05?text=Denture" },
  { id: 2, name: "طقم جزئي مرن (فلكسبل)", price: 55000, category: "أطقم الأسنان", image: "https://placehold.co/150x150/f4f0ea/1a0a05?text=Flexible" },
  { id: 3, name: "تاج زيركون (تصميم كمبيوتر)", price: 35000, category: "التيجان والجسور", image: "https://placehold.co/150x150/f4f0ea/1a0a05?text=Zirconia" },
  { id: 4, name: "تاج خزف على معدن", price: 20000, category: "التيجان والجسور", image: "https://placehold.co/150x150/f4f0ea/1a0a05?text=PFM" },
  { id: 5, name: "مثبت تقويم شفاف (ريتينر)", price: 15000, category: "تقويم الأسنان", image: "https://placehold.co/150x150/f4f0ea/1a0a05?text=Retainer" },
];

export function MobileOrderFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [formData, setFormData] = useState({ name: "", phone: "", notes: "" });

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === Number(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(price);
  };

  const renderStepIndicator = () => (
    <div className="bg-white px-4 py-3 border-b border-[#e5e5e5] sticky top-14 z-20 shadow-sm">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#f4f0ea] -z-10" />
        
        <div className="flex flex-col items-center gap-1 z-10 bg-white px-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#c9a84c] text-white' : 'bg-[#f4f0ea] text-[#1a0a05]'}`}>1</div>
          <span className={`text-[10px] font-bold ${step >= 1 ? 'text-[#c9a84c]' : 'text-gray-400'}`}>المنتجات</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 z-10 bg-white px-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#c9a84c] text-white' : 'bg-[#f4f0ea] text-[#1a0a05]'}`}>2</div>
          <span className={`text-[10px] font-bold ${step >= 2 ? 'text-[#c9a84c]' : 'text-gray-400'}`}>المراجعة</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 z-10 bg-white px-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-[#c9a84c] text-white' : 'bg-[#f4f0ea] text-[#1a0a05]'}`}>3</div>
          <span className={`text-[10px] font-bold ${step >= 3 ? 'text-[#c9a84c]' : 'text-gray-400'}`}>التأكيد</span>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="font-['Cairo'] bg-[#f4f0ea] min-h-screen flex justify-center py-0 sm:py-8">
      {/* Mobile Simulator Container */}
      <div className="w-full sm:max-w-[390px] h-[100dvh] sm:h-[844px] bg-[#faf9f6] sm:rounded-[3rem] sm:shadow-2xl overflow-hidden relative border-[8px] border-[#1a0a05] flex flex-col">
        
        {/* Sticky Header */}
        <header className="bg-[#1a0a05] text-white h-14 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1 as any)} className="p-1 -mr-2">
                <ChevronRight className="w-5 h-5 text-[#c9a84c]" />
              </button>
            )}
            <h1 className="font-bold text-lg text-[#c9a84c]">المختبر الملكي</h1>
          </div>
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-[#f4f0ea]" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#c9a84c] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </div>
        </header>

        {renderStepIndicator()}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          
          {/* Step 1: Products */}
          <div className={`p-4 space-y-4 transition-all duration-300 ${step === 1 ? 'block opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="font-bold text-[#1a0a05] text-lg mb-2">اختر المنتجات</h2>
            
            <div className="space-y-3">
              {PRODUCTS.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <div key={product.id} className="bg-white rounded-xl p-3 shadow-sm border border-[#e5e5e5] flex gap-3 items-center">
                    <img src={product.image} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-[#f4f0ea]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#c9a84c] font-bold mb-1">{product.category}</p>
                      <h3 className="font-bold text-[#1a0a05] text-sm leading-tight mb-1 truncate">{product.name}</h3>
                      <p className="text-[#1a0a05] font-bold">{formatPrice(product.price)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-[#f4f0ea] p-1 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(product.id, 1)}
                        className="w-7 h-7 rounded-md bg-white text-[#1a0a05] shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button 
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={qty === 0}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-transform ${qty === 0 ? 'bg-transparent text-gray-400' : 'bg-white text-[#1a0a05] shadow-sm active:scale-95'}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Review */}
          <div className={`p-4 space-y-4 transition-all duration-300 ${step === 2 ? 'block opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="font-bold text-[#1a0a05] text-lg mb-2">مراجعة الطلب</h2>
            
            {cartItemsCount === 0 ? (
              <div className="text-center py-12 flex flex-col items-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
                <p>السلة فارغة. عد للمنتجات لإضافة طلبات.</p>
                <Button onClick={() => setStep(1)} variant="outline" className="mt-4 border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-white">
                  تصفح المنتجات
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] overflow-hidden">
                <div className="p-4 space-y-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const product = PRODUCTS.find(p => p.id === Number(id))!;
                    return (
                      <div key={id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex gap-3 items-center">
                          <span className="bg-[#f4f0ea] text-[#1a0a05] font-bold w-6 h-6 rounded flex items-center justify-center text-sm">{qty}x</span>
                          <div>
                            <p className="font-bold text-sm text-[#1a0a05]">{product.name}</p>
                            <p className="text-xs text-gray-500">{formatPrice(product.price)} للقطعة</p>
                          </div>
                        </div>
                        <p className="font-bold text-[#c9a84c]">{formatPrice(product.price * qty)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-[#faf9f6] p-4 border-t border-[#e5e5e5] flex justify-between items-center">
                  <span className="font-bold text-[#1a0a05]">المجموع الكلي</span>
                  <span className="font-bold text-xl text-[#1a0a05]">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Confirm/Form */}
          <div className={`p-4 space-y-4 transition-all duration-300 ${step === 3 ? 'block opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="font-bold text-[#1a0a05] text-lg mb-2">بيانات التواصل</h2>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e5e5] space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1a0a05] font-bold">اسم العيادة / الطبيب <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-[#faf9f6] border-[#e5e5e5] focus-visible:ring-[#c9a84c]" 
                  placeholder="د. أحمد محمد"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#1a0a05] font-bold">رقم الهاتف (واتساب) <span className="text-red-500">*</span></Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="bg-[#faf9f6] border-[#e5e5e5] focus-visible:ring-[#c9a84c] text-left dir-ltr" 
                  placeholder="0770 000 0000"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[#1a0a05] font-bold">ملاحظات إضافية (اللون، التفاصيل، الخ)</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="bg-[#faf9f6] border-[#e5e5e5] focus-visible:ring-[#c9a84c] min-h-[100px]" 
                  placeholder="مثال: لون A2، يرجى الاستعجال..."
                />
              </div>
            </div>

            <div className="bg-[#e8f5e9] border border-[#a5d6a7] p-4 rounded-xl flex items-start gap-3">
              <MessageCircle className="w-6 h-6 text-[#2e7d32] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#2e7d32] text-sm">سيتم إرسال الطلب عبر واتساب</h4>
                <p className="text-xs text-[#2e7d32] opacity-80 mt-1">سيقوم فريقنا بتأكيد الطلب معكم مباشرة بعد الإرسال.</p>
              </div>
            </div>
          </div>

        </main>

        {/* Floating Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40">
          {step === 1 && (
            <Button 
              className="w-full h-12 bg-[#1a0a05] hover:bg-[#2a1a15] text-white text-base font-bold flex justify-between items-center px-4"
              disabled={cartItemsCount === 0}
              onClick={() => setStep(2)}
            >
              <span className="flex items-center gap-2">
                <span className="bg-[#c9a84c] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{cartItemsCount}</span>
                المنتجات
              </span>
              <span>مراجعة الطلب</span>
              <span className="font-bold text-[#c9a84c]">{formatPrice(cartTotal)}</span>
            </Button>
          )}

          {step === 2 && (
            <Button 
              className="w-full h-12 bg-[#1a0a05] hover:bg-[#2a1a15] text-white text-base font-bold flex justify-between items-center px-4"
              onClick={() => setStep(3)}
            >
              <span>المجموع: {formatPrice(cartTotal)}</span>
              <span className="flex items-center gap-2">
                تأكيد البيانات
                <ArrowRight className="w-5 h-5 rotate-180" />
              </span>
            </Button>
          )}

          {step === 3 && (
            <Button 
              className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white text-base font-bold flex justify-center items-center gap-2"
              onClick={() => {
                const text = `طلب جديد من: ${formData.name}\nالهاتف: ${formData.phone}\n\nالطلبات:\n${Object.entries(cart).map(([id, qty]) => `${PRODUCTS.find(p => p.id === Number(id))?.name} (${qty})`).join('\n')}\n\nالإجمالي: ${formatPrice(cartTotal)}\n\nملاحظات: ${formData.notes}`;
                window.open(`https://wa.me/1234567890?text=${encodeURIComponent(text)}`, '_blank');
              }}
              disabled={!formData.name || !formData.phone}
            >
              <MessageCircle className="w-5 h-5" />
              إرسال الطلب عبر واتساب
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
