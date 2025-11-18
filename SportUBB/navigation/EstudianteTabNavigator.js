// navigation/EstudianteTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import DisponibilidadCanchaScreen from '../screens/DisponibilidadCanchaScreen';
import NuevaReservaScreen from '../screens/NuevaReservaScreen';
import MisReservasScreen from '../screens/MisReservasScreen';

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
          headerStyle: { backgroundColor: '#1976d2' },
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

export default function EstudianteTabNavigator() {
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
        name="Disponibilidad"
        component={DisponibilidadStack}
        options={{
          tabBarLabel: 'Canchas',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>⚽</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MisReservas"
        component={MisReservasStack}
        options={{
          tabBarLabel: 'Mis Reservas',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={HomeScreen} // TODO: Crear pantalla de perfil
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}