import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, AntDesign } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from './CustomText'; 
import { ThemeContext } from './theme/ThemeContext'; 
import { useTranslation } from './context/TranslationContext'; 

import AddLocation from './Screens/Location/AddLocation';
import Location from './Screens/Location/';
import Category from './Screens/Category';
import Contact from './Screens/Account/Contact';
import EditProfile from './Screens/Account/EditProfile';
import RegisterServicemen from './Screens/Account/RegisterServicemen';
import Settings from './Screens/Account/Settings';
import EditReview from './Screens/EditReview';
import FullImage from './Screens/FullImage';
import Login from './Screens/Login/LoginOtp';
import OtpVerification from './Screens/Login/OtpVerification';
import RegisterOtp from './Screens/Login/RegisterOtp';
import RegisterOtpVerification from './Screens/Login/RegisterOtpVerification';
import Results from './Screens/Search/Result/';
import ReviewCard from './Screens/ReviewCard';
import Search from './Screens/Search/';
import Services from './Screens/Services';
import SetProfile from './Screens/SetProfile';
import ShowAllMedia from './Screens/ShowAllMedia';
import Splash from './Screens/Splash';
import ViewReviews from './Screens/ViewReviews';
import ViewService from './Screens/ViewService';
import Voice from './Screens/Voice/';
import Welcome from './Screens/Welcome';
import WriteReview from './Screens/WriteReview';
import Chat from './Screens/Messages';
import Done from './Screens/Account/Done';
import BookingsScreen from './Screens/Bookings/';
import Chats from './Screens/Home/Chats';
import Favorites from './Screens/Home/Favorites';
import AccountScreen from './Screens/Account/';
import Main from './Screens/Home/';
import FullMedia from './Screens/FullMedia';
import LanguageSelection from './Screens/LanguageSelection';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BookingsIcon = ({ color }) => (
  <View style={bookingsIconStyles.customIconContainer}>
    <Feather name="clipboard" size={26} color={color} />
    <Feather name="list" size={14} color={color} style={bookingsIconStyles.overlayIcon} />
  </View>
);

const bookingsIconStyles = StyleSheet.create({
  customIconContainer: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayIcon: {
    position: 'absolute',
    top: 8,
    left: 6,
  },
});

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);

  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        let iconName = options.tabBarIconName;

        if (route.name === 'Chats') {
          iconName = 'message1'; 
        }

        const getTabLabel = (routeName) => {
          switch (routeName) {
            case 'Main':
              return t('home') || 'Home';
            case 'Bookings':
              return t('bookings') || 'Bookings';
            case 'Chats':
              return t('chats') || 'Chats';
            case 'Account':
              return t('profile') || 'Profile';
            default:
              return routeName;
          }
        };

        const label = getTabLabel(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity 
            key={index} 
            onPress={onPress} 
            style={styles.tabButton}
            accessibilityLabel={`${label} ${t('tab') || 'tab'}`} 
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}  state
          >
            <View style={styles.iconWrapper}>
              {iconName === 'clipboard' ? (
                <BookingsIcon
                  color={isFocused ? (theme === 'light' ? '#000' : '#fff') : (theme === 'light' ? '#888' : '#aaa')}
                />
              ) : iconName === 'message1' ? (
                <AntDesign 
                  name={iconName}
                  size={26}
                  color={isFocused ? (theme === 'light' ? '#000' : '#fff') : (theme === 'light' ? '#888' : '#aaa')}
                />
              ) : (
                <Feather 
                  name={iconName}
                  size={26}
                  color={isFocused ? (theme === 'light' ? '#000' : '#fff') : (theme === 'light' ? '#888' : '#aaa')}
                />
              )}
            </View>
            <CustomText
              style={[
                styles.label,
                isFocused && styles.focusedLabel,
                { color: isFocused ? (theme === 'light' ? '#000' : '#fff') : (theme === 'light' ? '#888' : '#aaa') },
              ]}
            >
              {label}
            </CustomText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Tab Navigator Component
const TabNavigator = () => {
  const { t } = useTranslation(); 
  
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen
        name="Main"
        component={Main}
        options={{
          tabBarIconName: 'home',
          tabBarLabel: t('home') || 'Home', 
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIconName: 'clipboard',
          tabBarLabel: t('bookings') || 'Bookings', 
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={Chats}
        options={{
          tabBarIconName: 'message1', 
          tabBarLabel: t('chats') || 'Chats', 
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIconName: 'user',
          tabBarLabel: t('profile') || 'Profile', 
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, 
          cardStyle: {
            backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A', 
          },
        }}
      >
        <Stack.Screen
          name="AddLocation"
          component={AddLocation}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Category" component={Category} options={{ headerShown: false }} />
        <Stack.Screen name="Contact" component={Contact} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
        <Stack.Screen name="EditReview" component={EditReview} options={{ headerShown: false }} />
        <Stack.Screen name="FullImage" component={FullImage} options={{ headerShown: false }} />
        <Stack.Screen name="FullMedia" component={FullMedia} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Location" component={Location} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterOtp" component={RegisterOtp} options={{ headerShown: false }} />
        <Stack.Screen
          name="RegisterOtpVerification"
          component={RegisterOtpVerification}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Results" component={Results} options={{ headerShown: false }} />
        <Stack.Screen name="ReviewCard" component={ReviewCard} options={{ headerShown: false }} />
        <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
        <Stack.Screen name="Services" component={Services} options={{ headerShown: false }} />
        <Stack.Screen name="SetProfile" component={SetProfile} options={{ headerShown: false }} />
        <Stack.Screen name="ShowAllMedia" component={ShowAllMedia} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
        <Stack.Screen name="ViewReviews" component={ViewReviews} options={{ headerShown: false }} />
        <Stack.Screen name="ViewService" component={ViewService} options={{ headerShown: false }} />
        <Stack.Screen name="Voice" component={Voice} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
        <Stack.Screen name="WriteReview" component={WriteReview} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterServicemen" component={RegisterServicemen} options={{ headerShown: false }} />
        <Stack.Screen name="Done" component={Done} options={{ headerShown: false }} />
        <Stack.Screen name="Favorites" component={Favorites} options={{ headerShown: false }} />
        <Stack.Screen name="Language" component={LanguageSelection} options={{ headerShown: false }} />
      </Stack.Navigator>
    </View>
  );
};

// Styles
const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: theme === 'light' ? '#1A1A1A' : '#ffffff',
      height: 70,
      position: 'absolute',
      bottom: 10,
      left: 10,
      right: 10,
      paddingBottom: 10,
    },
    tabButton: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    iconWrapper: {
      height: 30,
      justifyContent: 'flex-end',
    },
    label: {
      fontSize: 12,
    },
    focusedLabel: {},
  });

export default Navigation;
