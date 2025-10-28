import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';

interface TermModalProps {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
  isLoading?: boolean;
}

const TermModal: React.FC<TermModalProps> = ({ 
  visible,
  onClose, 
  onAgree,
  isLoading = false 
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView 
                style={styles.modalBody}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                <Text style={styles.modalTitle}>隱私權政策與使用條款</Text>
                <Text style={styles.welcome}>
                  歡迎使用 Garbi，為了讓您能夠安心的使用本應用程式的各項服務與資訊，特此向您說明此隱私權保護政策，以保障您的權益，請詳閱下列內容:
                </Text>

                <Text style={styles.sectionTitle}>一、隱私權保護政策的適用範圍</Text>
                <Text style={styles.paragraph}>
                  隱私權保護政策內容，包括本應用程式如何處理在您使用應用程式服務時收集到的個人識別資料。隱私權保護政策不適用於本應用程式以外的相關連結應用程式，也不適用於非本應用程式所委托或參與管理的人員。
                </Text>

                <Text style={styles.sectionTitle}>二、個人資料的蒐集、處理及利用方式</Text>
                <Text style={styles.paragraph}>
                  當您造訪本應用程式或使用本應用程式所提供之功能服務時，我們將視該服務功能性質，請您提供必要的個人資料，並在該特定目的範圍內處理及利用您的個人資料;非經您書面同意，本應用程式不會將個人資料用於其他用途。
                </Text>
                <Text style={styles.paragraph}>
                  本應用程式在您使用服務信箱、回饋中心等互動性功能時，會保留您所提供的姓名、電子郵件地址及使用時間等。
                </Text>
                <Text style={styles.paragraph}>
                  於瀏覽時，伺服器會自行記錄相關行徑，包括您使用連線設備的 IP 位址、使用時間與瀏覽資料記錄等，做為我們增進應用程式服務的參考依據，此記錄為內部應用，決不對外公佈。
                </Text>
                <Text style={styles.paragraph}>
                  您可以隨時向我們提出請求，以更正或刪除您的帳戶或本應用程式所蒐集的個人資料等隱私資訊。联繫方式請見最下方联繫管道。
                </Text>

                <Text style={styles.sectionTitle}>三、資料之保護</Text>
                <Text style={styles.paragraph}>
                  本應用程式主機均設有防火牆、防毒系統等相關的各項資訊安全設備及必要的安全防護措施，加以保護應用程式及您的個人資料采用嚴格的保護措施，只由經過授權的人員才能接觸您的個人資料，若有違反保密義務者，將會受到相關的法律處分。
                </Text>
                <Text style={styles.paragraph}>
                  如因業務需要有必要委托其他單位提供服務時，本應用程式亦會嚴格要求其遵守保密義務，並且采取必要檢查程序以確定其將確實遵守。
                </Text>

                <Text style={styles.sectionTitle}>四、應用程式對外的相關連結</Text>
                <Text style={styles.paragraph}>
                  本應用程式的網頁提供其他應用程式的網路連結，您也可經由本應用程式所提供的連結，點選進入其他應用程式。但該連結應用程式不適用本應用程式的隱私權保護政策，您必須參考該連結應用程式中的隱私權保護政策。
                </Text>

                <Text style={styles.sectionTitle}>五、隱私權保護政策之修正</Text>
                <Text style={styles.paragraph}>
                  本應用程式隱私權保護政策將因應需求隨時進行修正，修正後的條款將刊登於應用程式上。
                </Text>

                <Text style={styles.sectionTitle}>六、聯繫方式</Text>
                <Text style={styles.paragraph}>
                  對於隱私權政策有任何疑問，或者想提出變更、移除個人資料之請求，請前往本應用中的「回饋中心」頁面提交表單，或是詢問客服人員：
                </Text>
                <Text style={styles.paragraph}>garbi.tw@gmail.com</Text>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.agreeButton, isLoading && styles.agreeButtonDisabled]}
                  onPress={onAgree}
                  disabled={isLoading}
                >
                  <Text style={styles.agreeButtonText}>
                    同意並繼續
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeText}>不同意</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingTop: 20,
  },
  welcome: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'justify'
  },
  contactEmail: {
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  modalFooter: {
    paddingBottom: 12,
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center'
  },
  agreeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 48,
    paddingVertical: 12,
    paddingHorizontal: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreeButtonDisabled: {
    shadowOpacity: 0,
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: '#ff0000c5',
    fontSize: 15,
  }
});

export default TermModal;