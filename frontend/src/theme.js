export const ubbTheme = {
  token: {
    colorPrimary: '#014898',  // Azul UBB
    colorInfo: '#014898',
    colorSuccess: '#00ADD6',  
    colorWarning: '#F9B214',  
    colorError: '#E41B1A',    
    borderRadius: 8,
    fontFamily: 'Arial, sans-serif',
  },
};

// Tema claro
export const ubbLightTheme = {
  algorithm: undefined, // usa el modo base (light)
  token: {
    ...ubbTheme.token,
    colorBgBase: '#f5f5f5',
    colorTextBase: '#1A1A1A',
    colorBorder: '#B9BBBB',
  },
};

// Tema oscuro
export const ubbDarkTheme = {
  algorithm: undefined,
  token: {
    ...ubbTheme.token,
    colorBgBase: '#1A1A1A',
    colorTextBase: '#E6E7E8',
    colorBorder: '#739edbff',
  },
};
