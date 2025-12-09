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

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request"); // Controla se está pedindo o código ou resetando

  // Passo 1: Solicitar o código OTP para o email
  async function handleRequestCode() {
    if (!email) {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    // Nota: O comportamento padrão do resetPasswordForEmail envia um LINK.
    // Para funcionar com CÓDIGO (OTP) no mobile, você precisa configurar o template de email no Supabase
    // para enviar o {{ .Token }} ou usar a lógica de OTP.
    // Vamos assumir aqui que o usuário vai receber um código ou link mágico.

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert(
        "Sucesso",
        "Código de verificação enviado para o seu e-mail!"
      );
      setStep("reset");
    }
    setLoading(false);
  }

  // Passo 2: Verificar o código e atualizar a senha
  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (!code || !newPassword) {
      Alert.alert("Erro", "Preencha o código e a nova senha.");
      return;
    }

    setLoading(true);

    // 1. Verificar o OTP
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });

    if (verifyError) {
      Alert.alert("Erro ao verificar código", verifyError.message);
      setLoading(false);
      return;
    }

    // 2. Se verificado com sucesso, atualizar o usuário (a sessão é criada automaticamente após verifyOtp)
    if (data.session) {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert("Erro ao atualizar senha", updateError.message);
      } else {
        Alert.alert("Sucesso", "Sua senha foi redefinida!");
        router.replace("/login");
      }
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
              <View style={styles.avatarCircle}>
                <FontAwesome5 name="user-alt" size={50} color="#00BFFF" />
              </View>
              {/* Nome do usuário oculto/placeholder até sabermos quem é */}
              <Text style={styles.userNameText}>Recuperar Senha</Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail :</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="seu.email@exemplo.com"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código de Verificação</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="Código recebido no e-mail"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova Senha:</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="**********"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar nova senha:</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="**********"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Footer / Ação */}
            <View style={styles.footer}>
              {/* 
                  Lógica do botão simplificada:
                  Se não tiver código digitado, tenta ENVIAR O CÓDIGO (Passo 1).
                  Se tiver código, tenta RESETAR A SENHA (Passo 2).
               */}
              <TouchableOpacity
                onPress={
                  step === "request" ? handleRequestCode : handleResetPassword
                }
                disabled={loading}
              >
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../assets/image/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.2)",
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
    backgroundColor: "#1E1B4B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00BFFF",
    marginBottom: 10,
  },
  userNameText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 30,
    paddingHorizontal: 10, // Um pouco de padding lateral para centralizar mais
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: "#FFF",
    marginBottom: 5,
    fontSize: 14,
    marginLeft: 5, // Alinhado levemente à esquerda
  },
  input: {
    width: "100%",
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
    height: 45,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  footerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "serif",
    fontWeight: "bold",
  },
});
