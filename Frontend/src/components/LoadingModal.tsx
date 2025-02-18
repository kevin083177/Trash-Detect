import React, { View, Modal, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingModal({ visible, text }: { visible: boolean, text: string }) {
  return (
    <Modal
        transparent
        animationType="fade"
        visible={visible}
    >
        <View style={styles.modalBackground}>
            <View style={styles.activityIndicatorWrapper}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.text}>{text}</Text>
            </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  activityIndicatorWrapper: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    marginTop: 20,
  }
});