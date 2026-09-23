import { useEffect, useState } from "react";
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
import { AdminOrder, fetchAllOrders, login, logout, restoreSession, updateOrderStatus } from "@/lib/admin";

const STATUS_OPTIONS = ["قيد المعالجة", "قيد التصنيع", "جاهز للتسليم", "تم التسليم"];

export default function AdminScreen() {
  const colors = useColors();
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<{ name: string; username: string } | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await restoreSession();
      setAdmin(session);
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (admin) loadOrders();
  }, [admin]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  const doLogin = async () => {
    setLoginError(null);
    if (!username.trim() || !password.trim()) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoggingIn(true);
    const result = await login(username.trim(), password);
    setLoggingIn(false);
    if (!result.success) {
      setLoginError(result.error || "خطأ غير متوقع");
      return;
    }
    setAdmin({ name: result.name!, username: username.trim() });
    setUsername("");
    setPassword("");
  };

  const doLogout = async () => {
    await logout();
    setAdmin(null);
    setOrders([]);
  };

  const cycleStatus = async (order: AdminOrder) => {
    const idx = STATUS_OPTIONS.indexOf(order.status);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    const ok = await updateOrderStatus(order.id, next);
    if (ok) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    }
  };

  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!admin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loginBox}>
          <Feather name="lock" size={32} color={colors.primary} style={{ alignSelf: "center", marginBottom: 12 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>تسجيل دخول الإدارة</Text>
          <TextInput
            placeholder="اسم المستخدم"
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]}
          />
          <TextInput
            placeholder="كلمة المرور"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]}
          />
          {loginError && <Text style={[styles.error, { color: colors.destructive }]}>{loginError}</Text>}
          <Pressable
            onPress={doLogin}
            disabled={loggingIn}
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loggingIn ? 0.6 : 1 }]}
          >
            {loggingIn ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>دخول</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.welcome, { color: colors.foreground }]}>مرحباً، {admin.name}</Text>
        <Pressable onPress={doLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      {loadingOrders ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }}
          refreshing={loadingOrders}
          onRefresh={loadOrders}
          ListEmptyComponent={
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>لا توجد طلبات</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => cycleStatus(item)}
              style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.orderTop}>
                <Text style={[styles.caseId, { color: colors.primary }]}>#{item.case_id || item.id.slice(0, 6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={[styles.customerLine, { color: colors.cardForeground }]}>
                {item.customer_name} — {item.customer_phone}
              </Text>
              <Text style={[styles.total, { color: colors.mutedForeground }]}>
                {item.total?.toLocaleString("ar-IQ")} د.ع · {new Date(item.created_at).toLocaleDateString("ar-IQ")}
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>اضغط لتغيير الحالة</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  loginBox: { padding: 24, gap: 12, marginTop: 60 },
  title: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlign: "right" },
  error: { textAlign: "center" },
  loginBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  loginBtnText: { fontSize: 15, fontWeight: "800" },
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", padding: 16 },
  welcome: { fontSize: 15, fontWeight: "700" },
  logoutBtn: { padding: 8 },
  orderCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  orderTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  caseId: { fontSize: 16, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  customerLine: { fontSize: 13, textAlign: "right" },
  total: { fontSize: 12, textAlign: "right" },
  hint: { fontSize: 10, textAlign: "right", fontStyle: "italic" },
});
