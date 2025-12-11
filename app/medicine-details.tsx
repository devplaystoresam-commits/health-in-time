import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

import { MEDICINE_IMAGES } from "../utils/medicine-constants";

const { width } = Dimensions.get("window");

interface Medicine {
  id: string;
  name: string;
  icon_type: string;
  start_date: string;
  start_time: string;
  dose: string;
  interval_hours: number;
  duration_days: number;
  description?: string;
}

export default function MedicineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR");
  const timeStr = today.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (id) {
      fetchMedicineDetails(Array.isArray(id) ? id[0] : id);
    }
  }, [id]);

  async function fetchMedicineDetails(medicineId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", medicineId)
        .single();

      if (data) {
        setMedicine(data as Medicine);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !medicine) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0F0C29",
          },
        ]}
      >
        <Text style={{ color: "#FFF" }}>Carregando...</Text>
      </View>
    );
  }

  const imageSource =
    MEDICINE_IMAGES[medicine.icon_type as keyof typeof MEDICINE_IMAGES] ||
    MEDICINE_IMAGES["red"];

  let startDateDisplay = medicine.start_date;
  if (medicine.start_date) {
    const [y, m, d] = medicine.start_date.split("-");
    startDateDisplay = `${d}/${m}/${y}`;
  }

  async function handleDelete() {
    Alert.alert(
      "Excluir Medicamento",
      "Tem certeza que deseja remover este medicamento? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from("medicines")
                .delete()
                .eq("id", medicine!.id);

              if (error) throw error;

              // Voltar para a tela anterior (Morning ou Night)
              // O useFocusEffect na tela anterior vai atualizar a lista
              router.back();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir o medicamento.");
              console.error(e);
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0F0C29", "#302B63", "#24243E"]}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="keyboard-backspace"
                size={40}
                color="#00BFFF"
              />
            </TouchableOpacity>

            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateText}>{dateStr}</Text>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>

            <View style={styles.profilePlaceholder}>
              <FontAwesome5 name="user-alt" size={24} color="#1E1B4B" />
            </View>
          </View>

          <View style={styles.namePlateContainer}>
            <LinearGradient
              colors={["#004e92", "#000428"]}
              style={styles.namePlate}
            >
              <View style={styles.plateDetailTop} />
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <View style={styles.plateDetailBottom} />
            </LinearGradient>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.medicineImage}
              resizeMode="contain"
            />
            <View style={styles.shadow} />
          </View>

          <View style={styles.infoHubContainer}>
            <View style={styles.hudBorderTopUser} />

            <View style={styles.infoContent}>
              <Text style={styles.label}>Descrição do Produto:</Text>
              <Text style={styles.value}>
                {medicine.description ? `${medicine.description}\n\n` : ""}
                {medicine.dose ? `Dose: ${medicine.dose}\n` : ""}
                Início: {startDateDisplay} às {medicine.start_time}
                {"\n"}
                Intervalo: a cada {medicine.interval_hours} horas
              </Text>

              <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>Dias:</Text>
                <Text style={styles.value}>
                  {medicine.duration_days} dias de tratamento
                </Text>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Quantidades:</Text>
                <Text style={styles.value}>
                  {Math.ceil(
                    (24 / medicine.interval_hours) * medicine.duration_days
                  )}{" "}
                  doses no total
                </Text>
              </View>
            </View>

            <View style={styles.hudBorderBottomRight} />
            <View style={styles.hudBorderBottomLeft} />
          </View>

          {/* Botão de Editar */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: "/medicine-config",
                params: { id: medicine.id },
              })
            }
          >
            <LinearGradient
              colors={["#FF8C00", "#FF4500"]}
              style={styles.editGradient}
            >
              <Text style={styles.editText}>EDITAR DOSAGENS E HORÁRIOS</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botão de Excluir */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <View style={styles.deleteButtonInner}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color="#FF4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.deleteText}>EXCLUIR MEDICAMENTO</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 25,
  },
  dateTimeContainer: { alignItems: "center" },
  dateText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  timeText: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  namePlateContainer: {
    width: "100%",
    height: 80,
    marginBottom: 20,
    borderRadius: 15,
    elevation: 8,
    shadowColor: "#00BFFF",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  namePlate: {
    flex: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00BFFF",
  },
  medicineName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "serif",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  plateDetailTop: {
    position: "absolute",
    top: 5,
    width: "60%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  plateDetailBottom: {
    position: "absolute",
    bottom: 5,
    width: "60%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  imageContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  medicineImage: { width: 150, height: 150, transform: [{ rotate: "-30deg" }] },
  shadow: {
    width: 100,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    transform: [{ scaleX: 2 }],
    marginTop: 20,
  },
  infoHubContainer: {
    width: "100%",
    backgroundColor: "rgba(0, 50, 200, 0.1)",
    borderWidth: 2,
    borderColor: "#007FFF",
    borderRadius: 10,
    padding: 20,
    minHeight: 200,
    position: "relative",
  },
  infoContent: { zIndex: 1 },
  label: { color: "#CCC", fontSize: 14, marginBottom: 5 },
  value: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  hudBorderTopUser: {
    position: "absolute",
    top: -2,
    left: 20,
    width: 100,
    height: 4,
    backgroundColor: "#00BFFF",
  },
  hudBorderBottomRight: {
    position: "absolute",
    bottom: -2,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00BFFF",
    borderBottomRightRadius: 10,
  },
  hudBorderBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00BFFF",
    borderBottomLeftRadius: 10,
  },
  editButton: {
    marginTop: 30,
    width: "100%",
    borderRadius: 25,
    elevation: 5,
  },
  editGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  deleteButton: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  deleteButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.5)",
    borderRadius: 25,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
  },
  deleteText: {
    color: "#FF4444",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
