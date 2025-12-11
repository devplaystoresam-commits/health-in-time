import {
  AntDesign,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Erro no Login", error.message);
    } else {
      router.replace("/home");
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    try {
      const redirectUri = makeRedirectUri({
        scheme: "healthintime",
        path: "auth",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (res.type === "success" && res.url) {
        // Extrair tokens da URL (hash fragment)
        const params: any = {};
        const hash = res.url.split("#")[1];
        if (hash) {
          hash.split("&").forEach((part) => {
            const [key, value] = part.split("=");
            params[key] = decodeURIComponent(value);
          });
        }

        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
          router.replace("/home");
        }
      }
    } catch (e) {
      Alert.alert("Erro Google Login", e.message);
    }
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
          {/* Logo e Título */}
          <View style={styles.header}>
            <Image
              source={require("../assets/image/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>Health in Time</Text>
          </View>

          {/* Campos de Login */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Login:</Text>
            <TextInput
              style={styles.input}
              placeholder="nome.usuario@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder="***********"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Ações: Esqueci senha, Cadastrar, Google */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/forgot-password")}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={24}
                    color="#00BFFF"
                  />
                </View>
                <Text style={styles.actionText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/register")}
              >
                <View style={styles.iconCircle}>
                  <FontAwesome5 name="user-plus" size={20} color="#00BFFF" />
                </View>
                <Text style={styles.actionText}>Cadastrar-se</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={signInWithGoogle}
              >
                <View style={styles.iconCircleWhite}>
                  <AntDesign name="google" size={24} color="#DB4437" />
                </View>
                <Text style={styles.actionText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão de Entrar (Seta) */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={signInWithEmail}
              disabled={loading}
            >
              <LinearGradient
                colors={["#00BFFF", "#007FFF"]}
                style={styles.submitGradient}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={40}
                  color="#FFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appTitle: {
    color: "#FFF",
    fontSize: 22,
    fontFamily: "serif",
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    color: "#FFF",
    marginBottom: 5,
    marginLeft: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#EAEAEA",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    alignItems: "center",
    width: 80,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: "#00BFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  iconCircleWhite: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  actionText: {
    color: "#CCC",
    fontSize: 10,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
  },
  submitButton: {
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  submitGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
