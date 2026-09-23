import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { buildWhatsAppMessage, saveOrder } from "@/lib/order";

interface OrderItem {
  productId: string;
  quantity: number;
}

export default function HomeScreen() {
  const colors = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("9647766463735");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("لم يتم تهيئة قاعدة البيانات");
      setLoading(false);
      return;
    }
    const [productsRes, settingsRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("admin_settings").select("*"),
    ]);
    if (productsRes.error) {
      setError("فشل تحميل المنتجات، يرجى المحاولة لاحقاً");
    } else {
      setProducts((productsRes.data || []) as Product[]);
      setError(null);
    }
    if (!settingsRes.error && settingsRes.data) {
      const map: Record<string, string> = {};
      (settingsRes.data as any[]).forEach((r) => {
        map[r.key] = r.value;
      });
      if (map.whatsapp_number) setWhatsappNumber(map.whatsapp_number);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getQty = (id: string) => orderItems.find((i) => i.productId === id)?.quantity || 0;

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setOrderItems((prev) => prev.filter((i) => i.productId !== id));
    } else {
      setOrderItems((prev) => {
        const exists = prev.find((i) => i.productId === id);
        if (exists) return prev.map((i) => (i.productId === id ? { ...i, quantity: qty } : i));
        return [...prev, { productId: id, quantity: qty }];
      });
    }
  };

  const toggleProduct = (id: string) => {
    const qty = getQty(id);
    setQty(id, qty > 0 ? 0 : 1);
  };

  const selectedItems = orderItems.filter((i) => i.quantity > 0);
  const total = selectedItems.reduce((sum, item) => {
    const p = products.find((p) => p.slug === item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  const submitOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("تنبيه", "اختر منتجاً واحداً على الأقل");
      return;
    }
    if (!name.trim()) {
      Alert.alert("تنبيه", "الاسم مطلوب");
      return;
    }
    if (!phone.trim() || !/^[\d\s+\-]{9,15}$/.test(phone.trim())) {
      Alert.alert("تنبيه", "رقم الهاتف غير صحيح");
      return;
    }
    setSubmitting(true);
    try {
      const items = selectedItems.map((i) => {
        const p = products.find((pp) => pp.slug === i.productId)!;
        return { product_id: i.productId, name: p.name, name_ar: p.name_ar, quantity: i.quantity, price: p.price };
      });
      const message = buildWhatsAppMessage(
        selectedItems,
        products.map((p) => ({ id: p.slug, name: p.name, price: p.price })),
        total,
        name,
        phone,
        notes
      );
      await saveOrder(name, phone, notes, items, total);
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
      setOrderItems([]);
      setNotes("");
    } catch (e) {
      Alert.alert("خطأ", "تعذر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const isRTL = I18nManager.isRTL;
  const textAlign = isRTL ? "right" : "right";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <Text style={[styles.brand, { color: colors.primary }]}>ROYAL DENTURE</Text>
        <Text style={[styles.brandAr, { color: colors.foreground }]}>مختبر الأسنان الملكي</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>اختر ما يناسبك والباقي علينا</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={[styles.errorBox, { borderColor: colors.destructive, backgroundColor: colors.destructive + "20" }]}>
          <Text style={{ color: colors.destructive, textAlign: "center" }}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <View style={styles.grid}>
          {products.map((p) => {
            const qty = getQty(p.slug);
            const selected = qty > 0;
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/product/${p.slug}`)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.cardImage} resizeMode="cover" />
                ) : null}
                {p.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{p.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]} numberOfLines={1}>
                  {p.name_ar}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {p.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.price, { color: colors.primary }]}>
                    {p.price.toLocaleString("ar-IQ")} د.ع
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleProduct(p.slug);
                    }}
                    style={[
                      styles.addBtn,
                      { backgroundColor: selected ? colors.destructive : colors.primary },
                    ]}
                  >
                    <Feather name={selected ? "x" : "plus"} size={16} color={colors.primaryForeground} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {selectedItems.length > 0 && (
        <View style={[styles.orderForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.cardForeground }]}>إتمام الطلب</Text>
          <Text style={[styles.totalLine, { color: colors.primary }]}>
            الإجمالي: {total.toLocaleString("ar-IQ")} د.ع
          </Text>
          <TextInput
            placeholder="الاسم الكامل"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: colors.input, color: colors.foreground, textAlign }]}
          />
          <TextInput
            placeholder="رقم الهاتف"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={[styles.input, { borderColor: colors.input, color: colors.foreground, textAlign }]}
          />
          <TextInput
            placeholder="ملاحظات (اختياري)"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea, { borderColor: colors.input, color: colors.foreground, textAlign }]}
          />
          <Pressable
            disabled={submitting}
            onPress={submitOrder}
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>إرسال الطلب عبر واتساب</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  hero: { paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20, alignItems: "center", gap: 4 },
  brand: { fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  brandAr: { fontSize: 16, fontWeight: "700" },
  tagline: { fontSize: 13, marginTop: 4 },
  center: { paddingVertical: 40, alignItems: "center" },
  errorBox: { marginHorizontal: 16, borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  grid: { paddingHorizontal: 16, gap: 14 },
  card: { borderRadius: 14, padding: 14, gap: 8 },
  cardImage: { width: "100%", height: 140, borderRadius: 10, marginBottom: 4 },
  badge: { position: "absolute", top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "800", textAlign: "right" },
  cardDesc: { fontSize: 12, textAlign: "right" },
  cardFooter: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { fontSize: 15, fontWeight: "800" },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  orderForm: { margin: 16, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  formTitle: { fontSize: 16, fontWeight: "800", textAlign: "right" },
  totalLine: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { height: 80, textAlignVertical: "top" },
  submitBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  submitText: { fontSize: 15, fontWeight: "800" },
});
