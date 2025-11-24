// navigation/EstudianteTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import DisponibilidadCanchaScreen from '../screens/DisponibilidadCanchaScreen';
import NuevaReservaScreen from '../screens/NuevaReservaScreen';
import MisReservasScreen from '../screens/MisReservasScreen';
import MarcarAsistenciaScreen from '../screens/MarcarAsistenciaScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack de Disponibilidad/Canchas (incluye la pantalla de nueva reserva)
function DisponibilidadStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="DisponibilidadList" 
        component={DisponibilidadCanchaScreen}
      />
      <Stack.Screen 
        name="NuevaReserva" 
        component={NuevaReservaScreen}
        options={{
          title: 'Nueva Reserva',
          headerShown: true,
          headerStyle: { backgroundColor: '#014898' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}

// Stack de Mis Reservas
function MisReservasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MisReservasList" 
        component={MisReservasScreen}
      />
    </Stack.Navigator>
  );
}

// Stack de Marcar Asistencia
function MarcarAsistenciaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MarcarAsistenciaList" 
        component={MarcarAsistenciaScreen}
      />
    </Stack.Navigator>
  );
}

export default function EstudianteTabNavigator() {
  const { usuario } = useAuth();
  
  // Verificar si el usuario es jugador (tiene la relación jugador)
  const esJugador = usuario?.jugador !== null && usuario?.jugador !== undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: {
          backgroundColor: '#014898',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Disponibilidad"
        component={DisponibilidadStack}
        options={{
          tabBarLabel: 'Canchas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'football' : 'football-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="MisReservas"
        component={MisReservasStack}
        options={{
          tabBarLabel: 'Reservas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Solo mostrar si es jugador */}
      {esJugador && (
        <Tab.Screen
          name="MarcarAsistencia"
          component={MarcarAsistenciaStack}
          options={{
            tabBarLabel: 'Asistencia',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Perfil"
        component={HomeScreen} // TODO: Crear pantalla de perfil
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}