import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function HomeScreen() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // Componente interno para os Cards (Manhã / Noite) para reutilizar estilos
  const TimeCard = ({ icon, title, times, colors, iconColor, onPress }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardGradient}
      >
        {/* Círculo do Ícone (Sol/Lua) */}
        <View style={styles.iconCircle}>
          {icon === "sun" ? (
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={50}
              color={iconColor}
            />
          ) : (
            <FontAwesome5
              name="moon"
              size={40}
              color={iconColor}
              style={{ marginRight: 5 }}
            />
          )}
          {/* Estrelinhas decorativas se for noite */}
          {icon === "moon" && (
            <View style={{ position: "absolute", top: 15, left: 15 }}>
              <FontAwesome5 name="star" size={10} color="#FFD700" />
            </View>
          )}
        </View>

        {/* Textos */}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.timesContainer}>
            {times.map((time, index) => (
              <Text key={index} style={styles.timeText}>
                {time}
              </Text>
            ))}
          </View>
        </View>
      </LinearGradient>
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                /* Voltar ou Menu? O print tem seta de voltar */
              }}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="keyboard-backspace"
                size={40}
                color="#00BFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.profileButton}
            >
              <View style={styles.profileCircle}>
                <FontAwesome5 name="user-alt" size={24} color="#1E1B4B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Cards */}
          <View style={styles.cardsWrapper}>
            {/* Card Manhã */}
            <TimeCard
              icon="sun"
              title="Manhã"
              times={["06:00 am", "18:00 pm"]}
              colors={["#00BFFF", "#006994"]}
              iconColor="#FFD700"
              onPress={() => router.push("/morning")}
            />

            {/* Card Noite */}
            <TimeCard
              icon="moon"
              title="Noite"
              times={["18:00 pm", "06:00 am"]}
              colors={["#00BFFF", "#006994"]}
              iconColor="#FFD700" // Amarelo Lua
              onPress={() => router.push("/night")}
            />
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
    paddingTop: 50,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 60,
  },
  backButton: {
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 25,
  },
  profileButton: {
    // Ação de perfil/logout
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)", // Círculo translúcido roxo/azulado
    justifyContent: "center",
    alignItems: "center",
  },
  cardsWrapper: {
    gap: 30, // Espaçamento entre os cards
    marginBottom: 60,
  },
  cardContainer: {
    height: 100, // Altura dos cards
    borderRadius: 50, // Bordas bem redondas (formato pílula)
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4AA9FF", // Borda azul clara brilhante
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0099FF", // Azul vibrante do círculo do ícone
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#80CAFF", // Borda mais clara
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "serif",
  },
  timesContainer: {
    alignItems: "flex-end",
  },
  timeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: "auto", // Empurra para o final
  },
  logoContainer: {
    marginBottom: 10,
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
