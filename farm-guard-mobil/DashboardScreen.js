import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { getMyReadings } from "../api";

export default function DashboardScreen({ navigation }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }
      const data = await getMyReadings(token);
      // newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setReadings(sorted);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    navigation.replace("Login");
  };

  const latest = readings[0];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Farm Guard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {latest && (
        <View style={styles.latestCard}>
          <Text style={styles.latestLabel}>Latest reading</Text>
          <View style={styles.statRow}>
            <Stat label="Temp" value={`${latest.temperature}°C`} />
            <Stat label="Humidity" value={`${latest.humidity}%`} />
            <Stat
              label="Power"
              value={latest.electricity_on ? "ON" : "OFF"}
              danger={!latest.electricity_on}
            />
          </View>
          <Text style={styles.timestamp}>
            {new Date(latest.created_at).toLocaleString()}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>History</Text>
      <FlatList
        data={readings}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            <Text style={styles.rowText}>
              {item.temperature}°C · {item.humidity}% ·{" "}
              {item.electricity_on ? "Power OK" : "Power OFF"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No readings yet.</Text>
        }
      />
    </View>
  );
}

function Stat({ label, value, danger }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, danger && styles.statDanger]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7ff", paddingTop: 50, paddingHorizontal: 18 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f7ff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  logout: { color: "#dc2626", fontSize: 14 },
  error: { color: "#dc2626", marginBottom: 10 },
  latestCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  latestLabel: { color: "#6b7280", fontSize: 13, marginBottom: 10 },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statDanger: { color: "#dc2626" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  timestamp: { marginTop: 10, fontSize: 11, color: "#9ca3af" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937", marginBottom: 10 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowText: { fontSize: 13, color: "#374151" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 30 },
});
