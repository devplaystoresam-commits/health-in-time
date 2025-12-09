import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

import * as Notifications from "expo-notifications"; // Adicione ao topo
// ... (imports existentes)

// Configuração básica do Handler de notificações (pode ficar fora do componente ou num arquivo de config)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ProfileScreen() {
  const router = useRouter();

  // Estados para os dados do perfil
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados de configuração
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); // Som geralmente é atrelado à notificação no iOS/Android, mas vamos simular o controle

  useEffect(() => {
    fetchProfile();
    checkPermissions();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function checkPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsNotificationsEnabled(status === "granted");
    } catch (e) {
      console.log(
        "Aviso: Falha ao checar permissões (comum no Expo Go Android):",
        e
      );
    }
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted") {
          setIsNotificationsEnabled(true);
          Alert.alert("Sucesso", "Notificações ativadas!");
        } else {
          setIsNotificationsEnabled(false);
          Alert.alert(
            "Permissão necessária",
            "Ative as notificações nas configurações do celular."
          );
        }
      } catch (error) {
        // Fallback para Expo Go no Android (SDK 53+ removeu suporte a push nativo no Go)
        console.log("Erro Expo Go (Ignorado):", error);
        setIsNotificationsEnabled(true);
        Alert.alert(
          "Modo Dev",
          "Ativando visualmente (Limitação do Expo Go no Android)."
        );
      }
    } else {
      setIsNotificationsEnabled(false);
    }
  }

  function toggleSound(value: boolean) {
    setIsSoundEnabled(value);
    if (value) {
      Alert.alert("Som ativado", "O app emitirá sons nos alertas.");
    } else {
      Alert.alert("Silencioso", "O app ficará mudo nos alertas.");
    }
    // TODO: Salvar essa preferência (isSoundEnabled) no Supabase ou AsyncStorage
  }

  async function fetchProfile() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");

        // Buscar dados extras na tabela de profiles
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, birth_date")
          .eq("id", user.id)
          .single();

        if (data) {
          setName(data.full_name || "");
          // Formatar data de YYYY-MM-DD para DD/MM/AAAA se necessário
          let formattedDate = "";
          if (data.birth_date) {
            const [year, month, day] = data.birth_date.split("-");
            formattedDate = `${day}/${month}/${year}`;
          }
          setBirthDate(formattedDate);
        }
      }
    } catch (error) {
      console.log("Erro ao buscar perfil", error);
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
          {/* Header: Botão Voltar e Logout */}
          <View
            style={[
              styles.headerRow,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
              },
            ]}
          >
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

            <TouchableOpacity onPress={handleLogout} style={{ padding: 5 }}>
              <MaterialCommunityIcons name="logout" size={30} color="#FF6347" />
            </TouchableOpacity>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-alt" size={45} color="#00BFFF" />
            </View>
            <Text style={styles.avatarLabel}>Usuário</Text>
          </View>

          {/* Dados do Usuário */}
          <View style={styles.infoContainer}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Nome :</Text>
              <TextInput
                style={styles.input}
                value={name}
                // editable={false} // Pode desbloquear se for implementar edição
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Data de nascimento :</Text>
              <TextInput
                style={[styles.input, { width: 130 }]}
                value={birthDate}
                onChangeText={setBirthDate}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>E-mail :</Text>
              <TextInput
                style={[styles.input, { textDecorationLine: "underline" }]} // Visual do print
                value={email}
                editable={false} // Email geralmente não se edita fácil
              />
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>Editar informações</Text>
            </TouchableOpacity>
          </View>

          {/* Seção Configuração */}
          <View style={styles.configContainer}>
            <Text style={styles.configTitle}>Configuração</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Notificação:</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#00BFFF" }}
                thumbColor={isNotificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
                onValueChange={toggleNotifications}
                value={isNotificationsEnabled}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Som:</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#00BFFF" }}
                thumbColor={isSoundEnabled ? "#f4f3f4" : "#f4f3f4"}
                onValueChange={toggleSound}
                value={isSoundEnabled}
              />
            </View>
          </View>

          {/* Footer Logo */}
          <View style={styles.footer}>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerRow: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 25,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E1B4B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00BFFF",
    marginBottom: 5,
  },
  avatarLabel: {
    color: "#FFF",
    fontSize: 14,
  },
  infoContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "flex-end",
  },
  label: {
    color: "#FFF",
    marginRight: 10,
    fontSize: 14,
    width: 140,
    textAlign: "right",
  },
  input: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    borderRadius: 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#000",
    height: 35,
  },
  editButton: {
    alignItems: "flex-end",
    marginTop: -5,
  },
  editText: {
    color: "#CCC",
    fontSize: 12,
  },
  configContainer: {
    marginBottom: 40,
    alignItems: "center", // Centralizar o título e os switches visualmente
  },
  configTitle: {
    color: "#00BFFF", // Azul claro
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textDecorationLine: "underline",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centralizado
    marginBottom: 10,
    width: "100%",
  },
  switchLabel: {
    color: "#FFF",
    fontSize: 14,
    marginRight: 10,
    width: 100,
    textAlign: "right",
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
  logoContainer: {
    marginBottom: 5,
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
  },
  footerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "serif",
    fontWeight: "bold",
  },
});
