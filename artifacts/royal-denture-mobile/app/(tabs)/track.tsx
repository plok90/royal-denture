import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { fetchOrdersByPhone } from "@/lib/order";
import { Order } from "@/lib/types";

export default function TrackScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!phone.trim()) {
      setError("أدخل رقم الهاتف");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrdersByPhone(phone.trim());
      setOrders(result);
      if (result.length === 0) setError("لا توجد طلبات بهذا الرقم");
    } catch {
      setError("تعذر البحث، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>تتبع طلبك</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          أدخل رقم الهاتف المستخدم عند الطلب
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="رقم الهاتف"
          placeholderTextColor={colors.mutedForeground}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]}
        />
        <Pressable
          onPress={search}
          disabled={loading}
          style={[styles.searchBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Feather name="search" size={18} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>

      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

      <FlatList
        data={orders || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderRow}>
              <Text style={[styles.caseId, { color: colors.primary }]}>#{item.case_id || item.id.slice(0, 6)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>{item.status}</Text>
              </View>
            </View>
            {item.items?.map((it, idx) => (
              <Text key={idx} style={[styles.itemLine, { color: colors.cardForeground }]}>
                {it.name_ar || it.name} × {it.quantity}
              </Text>
            ))}
            <Text style={[styles.total, { color: colors.mutedForeground }]}>
              الإجمالي: {item.total?.toLocaleString("ar-IQ")} د.ع
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {new Date(item.created_at).toLocaleDateString("ar-IQ")}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { alignItems: "center", marginBottom: 20, gap: 4 },
  title: { fontSize: 20, fontWeight: "900" },
  subtitle: { fontSize: 13 },
  searchRow: { flexDirection: "row-reverse", gap: 8, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlign: "right" },
  searchBtn: { width: 46, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  error: { textAlign: "center", marginBottom: 12 },
  orderCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  orderRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  caseId: { fontSize: 16, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  itemLine: { fontSize: 13, textAlign: "right" },
  total: { fontSize: 13, textAlign: "right", marginTop: 4 },
  date: { fontSize: 11, textAlign: "right" },
});
