import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/types";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      if (!supabase) {
        setError("لم يتم تهيئة قاعدة البيانات");
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (err || !data) {
        setError("المنتج غير موجود");
      } else {
        setProduct(data as Product);
      }
      setLoading(false);
    })();
  }, [slug]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: product?.name_ar || "تفاصيل المنتج", headerBackTitle: "رجوع" }} />
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: colors.destructive }}>{error}</Text>
        </View>
      )}
      {product && !loading && (
        <ScrollView contentContainerStyle={styles.content}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
          ) : null}
          <View style={styles.body}>
            <Text style={[styles.name, { color: colors.foreground }]}>{product.name_ar}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              {product.price.toLocaleString("ar-IQ")} د.ع
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>
            <View style={[styles.metaRow, { borderColor: colors.border }]}>
              <Feather name="clock" size={16} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                مدة التسليم: {product.delivery_days}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(`/?add=${product.slug}`)}
              style={[styles.orderBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.orderBtnText, { color: colors.primaryForeground }]}>أضف إلى الطلب</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 60 },
  image: { width: "100%", height: 260 },
  body: { padding: 20, gap: 12 },
  name: { fontSize: 22, fontWeight: "900", textAlign: "right" },
  price: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  description: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 12 },
  metaText: { fontSize: 13 },
  orderBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  orderBtnText: { fontSize: 15, fontWeight: "800" },
});
