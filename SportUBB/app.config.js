export default {
  expo: {
    name: "tu-app",
    slug: "tu-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    plugins: [
      "./plugins/network.security"
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.10:3000/api"
    },
    android: {
      package: "com.tuempresa.tuapp",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    }
  }
};