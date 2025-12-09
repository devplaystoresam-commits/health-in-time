import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function RegisterScreen() {
  const router = useRouter();

  // Estados do formulário
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !name) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    // Tratamento básico da data (assumindo DD/MM/YYYY do input para YYYY-MM-DD do banco)
    const [day, month, year] = birthDate.split("/");
    const formattedDate = `${year}-${month}-${day}`;

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          username: username,
          birth_date: formattedDate, // Envia para ser salvo pelo Trigger
        },
      },
    });

    if (error) {
      Alert.alert("Erro ao cadastrar", error.message);
    } else {
      Alert.alert(
        "Sucesso",
        "Cadastro realizado! Verifique seu email para confirmar."
      );
      router.back();
    }
    setLoading(false);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0F0C29", "#302B63", "#24243E"]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header: Botão Voltar */}
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

            {/* Avatar Section */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarCircle}>
                <FontAwesome5 name="user-alt" size={50} color="#00BFFF" />
              </TouchableOpacity>
              <Text style={styles.editText}>Editar</Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Nome :</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Data de nascimento :</Text>
                <TextInput
                  style={[styles.input, { width: 120 }]} // Input menor conforme print
                  value={birthDate}
                  onChangeText={setBirthDate} // Ideal usar uma máscara aqui
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>E-mail :</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Login:</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Senha:</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="*********"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Botão Cadastrar */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#00BFFF", "#007FFF"]}
                  style={styles.registerGradient}
                >
                  <Text style={styles.registerText}>CADASTRAR</Text>
                </LinearGradient>
              </TouchableOpacity>
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
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
    backgroundColor: "rgba(0,0,0,0.2)", // Fundo sutil pro botão voltar
    borderRadius: 25,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1E1B4B", // Azul escuro
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00BFFF",
    marginBottom: 5,
  },
  editText: {
    color: "#CCC",
    fontSize: 12,
  },
  formContainer: {
    marginBottom: 40,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "flex-end", // Alinha inputs à direita visualmente
  },
  label: {
    color: "#FFF",
    marginRight: 10,
    fontSize: 14,
    textAlign: "right", // Texto alinhado à direita
    width: 130, // Largura fixa para alinhar os inputs
  },
  input: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    borderRadius: 12, // Cantos bem arredondados
    paddingVertical: 8, // Um pouco mais de altura interna
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#000",
    height: 45, // Altura um pouco maior para ficar mais moderno
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
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
    fontSize: 20,
    fontFamily: "serif",
    fontWeight: "bold",
  },
  actionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  registerButton: {
    width: "60%",
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  registerGradient: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  registerText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});
