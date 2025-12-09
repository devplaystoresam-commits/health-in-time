import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a tela de login após 3 segundos
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        // Cores extraídas visualmente do print: Azul bem escuro no topo -> Azul arroxeado embaixo
        colors={["#0F0C29", "#302B63", "#24243E"]}
        style={styles.container}
      >
        <View style={styles.content}>
          <Image
            source={require("../assets/image/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Health in Time</Text>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    // Tentando aproximar do estilo serifado do print.
    fontFamily: "serif",
    letterSpacing: 1,
  },
});
