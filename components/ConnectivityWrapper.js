import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NoInternetModal = ({ visible, onRetry }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
  >
    <StatusBar barStyle="dark-content" backgroundColor="#777"  />
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalText}>No Internet Connection</Text>
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ConnectivityWrapper = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        setModalVisible(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        setModalVisible(false);
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <NoInternetModal
        visible={modalVisible}
        onRetry={handleRetry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 20,
    fontSize: 18,   
    textAlign: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ConnectivityWrapper;
