import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  // Função auxiliar para extrair parâmetros da URL (hash)
  const extractParamsFromUrl = (url: string) => {
    const params: Record<string, string> = {};
    // O Supabase envia tokens no fragmento (#)
    const parts = url.split("#");
    if (parts.length > 1) {
      const hash = parts[1];
      hash.split("&").forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }
    return params;
  };

  // 1. Monitora Deep Links manualmente (necessário pois detectSessionInUrl: false)
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const params = extractParamsFromUrl(url);
      if (
        params.access_token &&
        params.refresh_token &&
        params.type === "recovery"
      ) {
        setLoading(true);
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        setLoading(false);

        if (error) {
          Alert.alert("Erro no Link", "O link expirou ou é inválido.");
        } else {
          // Sessão estabelecida com sucesso
          setIsRecoverySession(true);
          setStep("reset");
        }
      }
    };

    // Check inicial (Cold Start)
    Linking.getInitialURL().then(handleDeepLink);

    // Listener (Warm Start)
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Monitora mudanças na autenticação (Deep Link)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setStep("reset");
          setIsRecoverySession(true); // Adicionado para indicar que a sessão de recuperação está ativa
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Passo 1: Solicitar o link para o email
  async function handleRequestCode() {
    if (!email) {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);

    // Envia o link de redefinição apontando para o esquema do app
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "healthintime://forgot-password",
    });

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert(
        "Verifique seu e-mail",
        "Enviamos um link para redefinição de senha. Clique no link para voltar ao app e definir sua nova senha."
      );
      // Não mudamos o step imediatamente para 'reset' forçado, esperamos o usuário clicar no link
      // ou se ele tiver um código manual, ele pode navegar.
      // Opcional: Se quiser permitir digitação manual de token, mantenha a opção visual.
    }
    setLoading(false);
  }

  // Passo 2: Atualizar a senha (já autenticado pelo Link ou via Token)
  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (!newPassword) {
      Alert.alert("Erro", "Preencha a nova senha.");
      return;
    }

    setLoading(true);

    // Se o usuário veio pelo LINK, ele já tem uma sessão válida do tipo "PASSWORD_RECOVERY"
    // Então basta atualizar o usuário.
    // Se você ainda quiser suportar o código manual (OTP) sem link, a lógica seria diferente,
    // mas o padrão do resetPasswordForEmail é Link.

    // Caso o usuário tenha digitado um código manual:
    if (code && !isRecoverySession) {
      // Verifica o código APENAS se não for uma sessão de recuperação via link
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      if (verifyError) {
        Alert.alert("Erro no código", verifyError.message);
        setLoading(false);
        return;
      }
    }

    // Atualiza a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      Alert.alert("Erro ao atualizar senha", updateError.message);
    } else {
      Alert.alert("Sucesso", "Sua senha foi redefinida!");
      router.replace("/login");
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
              <Text style={styles.userNameText}>
                {step === "reset" ? "Nova Senha" : "Recuperar Senha"}
              </Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              {step === "request" && (
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
              )}

              {/* Só mostra campo de código se estiver no passo reset E NÃO for via link (sessão ativa) 
                  Se o usuário quiser digitar código manual, ele teria que ter digitado antes ou ter um fluxo pra isso.
                  Como focamos no link, se isRecoverySession for true, ESCONDE o código.
              */}
              {step === "reset" && !isRecoverySession && (
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
              )}

              {step === "reset" && (
                <>
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
                </>
              )}
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
