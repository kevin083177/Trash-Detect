import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface ConfirmModalProps {
    visible: boolean;
    text: string;
    confirm: () => void;
    cancel: () => void;
}

export default function ConfirmModal({ visible, text, confirm, cancel }: ConfirmModalProps) {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={cancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>商店訊息</Text>
                        <View style={styles.titleBorder} />
                    </View>
                    
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>
                            {text}
                        </Text>
                    </View>
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={cancel}
                        >
                            <Text style={styles.cancelButtonText}>取消</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, styles.confirmButton]} 
                            onPress={confirm}
                        >
                            <Text style={styles.confirmButtonText}>確認</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    headerContainer: {
        paddingTop: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    titleBorder: {
        width: '100%',
        height: 1,
        backgroundColor: '#e1e5e9',
        marginTop: 16,
    },
    messageContainer: {
        paddingVertical: 32,
        justifyContent: 'center',
        height: 140,
    },
    messageText: {
        fontSize: 16,
        fontWeight: 400,
        textAlign: 'center',
        color: '#1C1C1C',
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e1e5e9',
    },
    button: {
        flex: 1,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    cancelButton: {
        borderColor: '#e1e5e9',
        borderRightWidth: 1,
    },
    confirmButton: {
        borderColor: '#e1e5e9',
        borderLeftWidth: 1,
    },
    cancelButtonText: {
        color: '#e53e3e',
        fontWeight: '600',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    confirmButtonText: {
        color: '#3182ce',
        fontWeight: '600',
        fontSize: 16,
        letterSpacing: 0.3,
    },
});