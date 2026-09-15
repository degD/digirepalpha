import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "net.dege.digirep",
  appName: "DigiRep",
  webDir: "out",
  backgroundColor: "#ffffff",
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT",
      hidden: false,
    },
  },
};

export default config;
