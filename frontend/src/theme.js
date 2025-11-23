export const ubbTheme = {
  token: {
    colorPrimary: '#014898',  // Azul UBB oficial
    colorInfo: '#014898',      // Igual que el color primario (consistencia institucional)

    colorSuccess: '#4CAF50',   // Éxito (no está en el manual: usamos estándar accesible)
    colorWarning: '#F9B214',   // Amarillo UBB
    colorError: '#E41B1A',     // Rojo UBB

    borderRadius: 8,
    fontFamily: 'Arial, sans-serif',  // Tipografía institucional
  }
};

export const ubbLightTheme = {
  algorithm: undefined,
  token: {
    ...ubbTheme.token,
    colorBgBase: '#FFFFFF',
    colorTextBase: '#1A1A1A',
    colorBorder: '#B9BBBB', // Gris UBB
  }
};

export const ubbDarkTheme = {
  algorithm: undefined,
  token: {
    ...ubbTheme.token,
    colorBgBase: '#1A1A1A',
    colorTextBase: '#E6E7E8',
    colorBorder: '#4F4F4F', // Gris oscuro accesible
  }
};
