const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurity = (config) => {
  // Agregar referencia al manifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    
    if (mainApplication) {
      mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      mainApplication.$['android:usesCleartextTraffic'] = 'true';
    }
    
    return config;
  });

  // Crear el archivo XML
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      const xmlPath = path.join(xmlDir, 'network_security_config.xml');
      
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">146.83.198.35</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>`;

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      
      fs.writeFileSync(xmlPath, xmlContent);
      
      return config;
    },
  ]);

  return config;
};

module.exports = withNetworkSecurity;