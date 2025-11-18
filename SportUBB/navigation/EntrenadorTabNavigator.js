import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen.js';
import SesionScreens from '../screens/SesionScreens.js';
import SesionDetalleScreen from '../screens/SesionDetalleScreen.js';
import AsistenciasScreen from '../screens/AsistenciaScreen.js';
import EditarSesionScreen from '../screens/EditarSesionScreen.js';
import NuevaSesionScreen from '../screens/NuevaSesionScreen.js';
import EntrenamientosScreen from '../screens/EntrenamientoScreen.js';
import AlineacionScreen from '../screens/AlineacionScreen.js';

//  Importar las pantallas de jugadores
import JugadoresScreen from '../screens/JugadoresScreen.jsx';
import NuevoJugadorScreen from '../screens/NuevoJugadorScreen.jsx';
import EditarJugadorScreen from '../screens/EditarJugadorScreen.jsx';
import GruposScreen from '../screens/GrupoScreen.jsx';
import GrupoMiembrosScreen from '../screens/GrupoMiembros.jsx';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack de Sesiones
function SesionesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="SesionesList" 
        component={SesionScreens}
      />
      <Stack.Screen 
        name="SesionDetalle" 
        component={SesionDetalleScreen}
        options={{
          title: 'Detalle de Sesión',
          headerShown: true,
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="NuevaSesion" 
        component={NuevaSesionScreen}
        options={{
          title: 'Nueva Sesión',
          headerShown: true,
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="EditarSesion" 
        component={EditarSesionScreen}
        options={{
          title: 'Editar Sesión',
          headerShown: true,
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="Asistencias" 
        component={AsistenciasScreen}
        options={{
          title: 'Gestionar Asistencias',
          headerShown: true,
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="Entrenamientos" 
        component={EntrenamientosScreen}
        options={{ title: 'Entrenamientos' }}
      />
      <Stack.Screen
        name="Alineacion"
        component={AlineacionScreen}
        options={{ title: "Alineación" }}
      />
    </Stack.Navigator>
  );
}

// ✅ Stack de Jugadores (con todas sus pantallas)
function JugadoresStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="JugadoresList" 
        component={JugadoresScreen}
      />
      <Stack.Screen 
        name="NuevoJugador" 
        component={NuevoJugadorScreen}
      />
      <Stack.Screen 
        name="EditarJugador" 
        component={EditarJugadorScreen}
      />
    </Stack.Navigator>
  );

}
function GruposStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="GruposList" 
        component={GruposScreen}
      />
      <Stack.Screen 
        name="GrupoMiembros" 
        component={GrupoMiembrosScreen}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator
export default function EntrenadorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Sesiones"
        component={SesionesStack}
        options={{
          tabBarLabel: 'Sesiones',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>📅</Text>
          ),
        }}
      />
      {/* ✅ Nueva pestaña de Jugadores */}
      <Tab.Screen
        name="Jugadores"
        component={JugadoresStack}
        options={{
          tabBarLabel: 'Jugadores',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Grupos"
        component={GruposStack}
        options={{
          tabBarLabel: 'Grupos',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>👥</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}