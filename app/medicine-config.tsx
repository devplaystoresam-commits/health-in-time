import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

// Helper para selecionar imagem do remédio
const MEDICINE_IMAGES = {
  red: require("../assets/image/vemelho.png"),
  blue: require("../assets/image/azul.png"),
  white: require("../assets/image/branco.png"),
  yellow: require("../assets/image/amarelo.png"),
};

export default function MedicineConfigScreen() {
  const router = useRouter();
  const { initialName, iconType, id } = useLocalSearchParams(); // id opcional para edição

  // Estados do Formulário
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(""); // DD/MM/AAAA
  const [startTime, setStartTime] = useState(""); // HH:MM
  const [dose, setDose] = useState("");
  const [interval, setInterval] = useState("");
  const [days, setDays] = useState("");
  const [description, setDescription] = useState("");

  // Imagem selecionada (padrão red)
  const [selectedImage, setSelectedImage] = useState("red");
  const [loading, setLoading] = useState(false);

  // Efeito para carregar dados se for EDIÇÃO ou INICIALIZAÇÃO
  useEffect(() => {
    // Solicitar permissão de notificação
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Ative as notificações para receber os lembretes dos remédios!"
        );
      }
    }
    requestPermissions();

    if (id) {
      loadMedicineData(id);
    } else {
      if (initialName) setName(initialName as string);
      if (iconType) setSelectedImage(iconType as string);
    }
  }, [id, initialName, iconType]);

  async function loadMedicineData(medicineId) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", medicineId)
        .single();
      if (error) throw error;
      if (data) {
        setName(data.name);
        setSelectedImage(data.icon_type);
        setDescription(data.description || "");
        setDose(data.dose || "");
        setInterval(data.interval_hours?.toString() || "");
        setDays(data.duration_days?.toString() || "");

        if (data.start_date) {
          const [y, m, d] = data.start_date.split("-");
          setStartDate(`${d}/${m}/${y}`);
        }
        if (data.start_time) {
          setStartTime(data.start_time.substring(0, 5)); // HH:MM
        }
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os dados para edição.");
      console.log(e);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  // Máscara de Data (DD/MM/AAAA)
  const handleDateChange = (text) => {
    // Remove tudo que não é número
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(
        2,
        4
      )}/${cleaned.slice(4, 8)}`;
    }

    if (formatted.length <= 10) {
      setStartDate(formatted);
    }
  };

  // Máscara de Hora (HH:MM)
  const handleTimeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }

    if (formatted.length <= 5) {
      setStartTime(formatted);
    }
  };

  async function scheduleMedicationNotifications(
    medicineId,
    medName,
    medInterval,
    medDuration,
    startDateTime
  ) {
    try {
      const totalHours = medDuration * 24;
      const numberOfDoses = Math.floor(totalHours / medInterval);
      const startTime = new Date(startDateTime);

      for (let i = 0; i < numberOfDoses; i++) {
        const triggerDate = new Date(
          startTime.getTime() + i * medInterval * 60 * 60 * 1000
        );
        if (triggerDate <= new Date()) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hora do Medicamento! 💊",
            body: `Está na hora de tomar seu ${medName}.`,
            sound: true,
            data: { medicineId: medicineId },
          },
          trigger: {
            type: "date",
            date: triggerDate,
          } as Notifications.DateTriggerInput, // Cast explícito para satisfazer TypeScript se necessário
        });
      }
      console.log(`Notificações agendadas: ${numberOfDoses}`);
    } catch (e) {
      console.log("Erro ao agendar (Expo Go):", e);
    }
  }

  async function handleSave() {
    if (!name || !startDate || !startTime || !interval || !days) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const [day, month, year] = startDate.split("/");
      const formattedDate = `${year}-${month}-${day}`;
      const hour = parseInt(startTime.split(":")[0]);
      const initialPeriod = hour >= 6 && hour < 18 ? "morning" : "night";

      const startDateTimeString = `${formattedDate}T${startTime}:00`;

      let medicineId = id;

      if (id) {
        // MODO EDIÇÃO: Atualizar registro existente
        const { error: updateError } = await supabase
          .from("medicines")
          .update({
            name: name,
            description: description,
            icon_type: selectedImage,
            start_date: formattedDate,
            start_time: startTime,
            dose: dose,
            interval_hours: parseInt(interval),
            duration_days: parseInt(days),
            period: initialPeriod,
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // Cancelar notificações antigas deste remédio antes de reagendar
        // (Aqui uma abordagem simples é cancelar todas ou tentar filtrar se tivéssemos salvo os IDs das notificações)
        // Como não salvamos os IDs das notificações, vamos apenas agendar as novas.
        // TODO: Para produção robusta, deveríamos "limpar" as notificações anteriores.
        // Notifications.cancelAllScheduledNotificationsAsync(); // Cuidado: cancela DE TODOS os remédios.
      } else {
        // MODO CRIAÇÃO: Inserir novo
        const { data, error } = await supabase
          .from("medicines")
          .insert({
            user_id: user.id,
            name: name,
            description: description,
            icon_type: selectedImage,
            start_date: formattedDate,
            start_time: startTime,
            dose: dose,
            interval_hours: parseInt(interval),
            duration_days: parseInt(days),
            period: initialPeriod,
          })
          .select()
          .single();

        if (error) throw error;
        medicineId = data.id;
      }

      // Agendar notificações (Seja criação ou edição, reagendamos daqui pra frente)
      await scheduleMedicationNotifications(
        medicineId,
        name,
        parseInt(interval),
        parseInt(days),
        startDateTimeString
      );

      Alert.alert(
        "Sucesso",
        id
          ? "Medicamento atualizado!"
          : "Medicamento configurado e lembretes definidos!"
      );

      // Navegar para a tela de Detalhes
      router.replace({
        pathname: "/medicine-details",
        params: { id: medicineId },
      });
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0F0C29", "#302B63", "#24243E"]}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Voltar */}
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
          </View>

          {/* Seleção de Ícone (Visual do print: Tipo de Medicação ao lado da imagem) */}
          <View style={styles.iconSelectionContainer}>
            <Text style={styles.labelTitle}>Tipo de Medicação:</Text>
            <View style={styles.iconPreviewBox}>
              <Image
                source={MEDICINE_IMAGES[selectedImage]}
                style={{ width: "80%", height: "80%" }}
                resizeMode="contain"
              />
            </View>
            {/* Aqui poderíamos ter botões para trocar a cor/imagem, por enquanto fixo ou com seletor simples */}
          </View>

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Medicação:</Text>
            <TextInput
              style={[
                styles.inputLarge,
                { opacity: 0.7, backgroundColor: "#CCC" },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Ibuprofeno"
              placeholderTextColor="#999"
              editable={false} // Nome travado
            />
          </View>

          {/* Grid de Inputs (Data, Qtd, Hora, Intervalo) */}
          <View style={styles.gridInputs}>
            {/* Linha 1 */}
            <View style={styles.col}>
              <Text style={styles.label}>Data de Início:</Text>
              <TextInput
                style={styles.inputSmall}
                value={startDate}
                onChangeText={handleDateChange} // Usando a máscara
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                placeholderTextColor="#999"
                maxLength={10}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Quantidade de Dias:</Text>
              <TextInput
                style={styles.inputSmall}
                value={days}
                onChangeText={setDays}
                placeholder="Ex: 7"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            {/* Linha 2 */}
            <View style={styles.col}>
              <Text style={styles.label}>Hora de Início:</Text>
              <TextInput
                style={styles.inputSmall}
                value={startTime}
                onChangeText={handleTimeChange} // Usando a máscara
                placeholder="HH:MM"
                keyboardType="numeric"
                placeholderTextColor="#999"
                maxLength={5}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Intervalo de Horas:</Text>
              <TextInput
                style={styles.inputSmall}
                value={interval}
                onChangeText={setInterval}
                placeholder="Ex: 8"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            {/* Dose (Extra solicitado) */}
            <View style={styles.fullWidthCol}>
              <Text style={styles.label}>Dose (mg ou cp):</Text>
              <TextInput
                style={styles.inputSmall}
                value={dose}
                onChangeText={setDose}
                placeholder="Ex: 500mg"
                placeholderTextColor="#999"
              />
            </View>
            {/* Descrição (Novo Campo) */}
            <View style={styles.fullWidthCol}>
              <Text style={styles.label}>Descrição / Observações:</Text>
              <TextInput
                style={[
                  styles.inputSmall,
                  { height: 80, textAlignVertical: "top" },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Tomar após o almoço..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Botão Salvar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <LinearGradient
                colors={["#00BFFF", "#007FFF"]}
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>SALVAR E CONTINUAR</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/image/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.footerTitle}>Health in Time</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },
  headerRow: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 25,
  },
  iconSelectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  labelTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconPreviewBox: {
    width: 80,
    height: 80,
    backgroundColor: "#3498DB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: "#FFF",
    marginBottom: 8,
    fontSize: 14,
  },
  inputLarge: {
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
    textAlign: "center", // Conforme print
  },
  gridInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  col: {
    width: "48%", // 2 colunas
    marginBottom: 20,
  },
  fullWidthCol: {
    width: "100%",
    marginBottom: 20,
  },
  inputSmall: {
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },

  // Footer / Botão
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  saveButton: {
    width: "100%",
    borderRadius: 25,
    marginBottom: 30,
    elevation: 5,
  },
  saveGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  saveText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  logoContainer: {
    marginBottom: 5,
  },
  logo: {
    width: 60,
    height: 60,
  },
  footerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "serif",
    fontWeight: "bold",
  },
});
