import React, { useContext } from "react";
import { View, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import CustomText from "../../CustomText";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const RegistrationSuccess = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.iconContainer}>
        <Icon name="check" size={50} color="#fff" />
      </View>

      <CustomText style={styles.successText}>
        {t('registrationSuccess') || 'Registration is Successful'}
      </CustomText>
      <CustomText style={styles.subText}>
        {t('registrationMessage') || 'Our Team will contact you\nin the next 24-48 hours'}
      </CustomText>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("Home")}
        accessibilityLabel={t('done') || 'Done'} 
        accessibilityRole="button"
      >
        <CustomText style={styles.buttonText}>
          {t('done') || 'Done'}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme === 'light' ? "#fff" : "#1A1A1A",
      marginTop: 30,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme === 'light' ? "#1fad5b" : "#27AE60",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      elevation: 5,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
    successText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme === 'light' ? "#1fad5b" : "#27AE60",
      textAlign: "center",
      marginBottom: 10,
    },
    subText: {
      fontSize: 16,
      fontWeight: "500",
      color: theme === 'light' ? "#27AE60" : "#2ECC71",
      textAlign: "center",
      marginBottom: 100,
      marginHorizontal: 20,
    },
    button: {
      position: "absolute",
      bottom: 30,
      backgroundColor: "#333",
      paddingVertical: 16,
      width: "90%",
      borderRadius: 30,
      alignItems: "center",
      elevation: 3,
    },
    buttonText: {
      color: "#fff",
      textAlign: "center",
      fontSize: 16,
    },
  });

export default RegistrationSuccess;
