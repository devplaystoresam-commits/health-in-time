import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

// Simulando dados de remédios que viriam do Banco de Dados
const MOCK_MEDICINES = [
  { id: 1, name: "Ibuprofeno", image: require("../assets/image/vemelho.png") },
  { id: 2, name: "Paracetamol", image: require("../assets/image/branco.png") },
  { id: 3, name: "Amoxicilina", image: require("../assets/image/azul.png") },
  { id: 4, name: "Dorflex", image: require("../assets/image/amarelo.png") },
];

// Calcula largura para 3 colunas com margens
const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 60) / 3; // 60 = paddings laterais e gaps

export default function MorningScreen() {
  const router = useRouter();
  const [userMedicines, setUserMedicines] = useState([]);

  // Buscar medicamentos cadastrados sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      fetchUserMedicines();
    }, [])
  );

  async function fetchUserMedicines() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medicines")
        .select("id, name")
        .eq("user_id", user.id);

      if (data) {
        setUserMedicines(data);
      }
    } catch (error) {
      console.log("Erro ao buscar medicamentos:", error);
    }
  }

  // Função para renderizar cada item (Remédio ou Botão +)
  const renderItem = (item) => {
    // Mapear a imagem para o tipo de ícone esperado pelo config
    // Como estamos usando require(), precisamos de uma lógica para passar o identificador correto
    // Visto que no Config temos um map reverso, vamos passar uma string identificadora simples baseada no ID ou Nome por enquanto
    let iconType = "red";
    if (item.name === "Paracetamol") iconType = "white";
    if (item.name === "Amoxicilina") iconType = "blue";
    if (item.name === "Dorflex") iconType = "yellow";

    // Verifica se esse remédio já está cadastrado pelo usuário
    const existingMedicine = userMedicines.find((m) => m.name === item.name);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.gridItem}
        onPress={() => {
          if (existingMedicine) {
            // Se já existe, vai direto para Detalhes
            router.push({
              pathname: "/medicine-details",
              params: { id: existingMedicine.id },
            });
          } else {
            // Se não existe, vai para Configuração
            router.push({
              pathname: "/medicine-config",
              params: { initialName: item.name, iconType: iconType },
            });
          }
        }}
      >
        <View style={styles.iconBox}>
          <Image
            source={item.image}
            style={{ width: "80%", height: "80%" }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.itemText} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Botão de Adicionar (+)
  const renderAddButton = (index) => (
    <TouchableOpacity
      key={`add-${index}`}
      style={styles.gridItem}
      onPress={() =>
        Alert.alert(
          "Em Breve",
          "Nas próximas atualizações você poderá incluir novos medicamentos."
        )
      }
    >
      <View style={[styles.iconBox, styles.addBox]}>
        <FontAwesome5 name="plus" size={30} color="#FFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0F0C29", "#302B63", "#24243E"]}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons
                name="keyboard-backspace"
                size={40}
                color="#00BFFF"
              />
            </TouchableOpacity>

            <View style={styles.sunContainer}>
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={50}
                color="#FFD700"
              />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.iconButton}
            >
              <View style={styles.profileCircle}>
                <FontAwesome5 name="user-alt" size={20} color="#1E1B4B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Grid de Medicamentos */}
          <View style={styles.gridContainer}>
            {/* Renderiza remédios existentes */}
            {MOCK_MEDICINES.map((med) => renderItem(med))}

            {/* Renderiza botões de + para preencher visualmente a grade (ex: completar até 9 itens) */}
            {[...Array(5)].map((_, i) => renderAddButton(i))}
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
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  iconButton: {
    width: 50,
    alignItems: "center",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  sunContainer: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },

  // Grid Styles
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // ou 'flex-start' com gap
    gap: 10,
    marginBottom: 40,
  },
  gridItem: {
    width: ITEM_SIZE,
    marginBottom: 15,
    alignItems: "center",
  },
  iconBox: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: "#3498DB", // Azul base do quadrado
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,

    // Efeito 3D/Sombra leve
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  addBox: {
    backgroundColor: "#007FFF", // Azul um pouco mais vivo para o botão de ação
  },
  itemText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: "auto",
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
