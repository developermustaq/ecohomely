
import React, {
  useEffect,
  useState,
  useMemo,
  useContext,
  memo,
  useCallback,
} from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../utils/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../theme/ThemeContext';
import CustomText from '../../CustomText';
import { format } from 'date-fns';
import { useTranslation } from '../../context/TranslationContext';

const SearchBar = memo(
  ({ value, onChange, theme, t }) => (
    <View
      style={[
        stylesStatic.searchContainer,
        { backgroundColor: theme === 'light' ? '#f5f5f5' : '#333' },
      ]}
    >
      <MaterialIcons
        name="search"
        size={20}
        color={theme === 'light' ? '#999' : '#ccc'}
        style={stylesStatic.searchIcon}
      />

      <TextInput
        style={[
          stylesStatic.searchInput,
          { color: theme === 'light' ? '#000' : '#fff' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={'Search chats'}
        placeholderTextColor={theme === 'light' ? '#999' : '#ccc'}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChange('')}
          style={stylesStatic.clearButton}
        >
          <MaterialIcons
            name="clear"
            size={20}
            color={theme === 'light' ? '#999' : '#ccc'}
          />
        </TouchableOpacity>
      )}
    </View>
  ),
  (prev, next) =>
    prev.value === next.value && prev.theme === next.theme
);

const Chatting = () => {
  const { theme = 'light' } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserID, setCurrentUserID] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      ({ name = '', lastMessage = '' }) =>
        name.toLowerCase().includes(q) || lastMessage.toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  useEffect(() => {
    AsyncStorage.getItem('uid')
      .then(uid => uid && setCurrentUserID(uid))
      .catch(console.error);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('cachedChats')
      .then(cached => cached && setChats(JSON.parse(cached)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUserID) return;

    const qMessages = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUserID),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(
      qMessages,
      async snap => {
        const latest = new Map(); 
        snap.forEach(d => {
          const { sender, receiver, text, timestamp } = d.data();
          const other = sender === currentUserID ? receiver : sender;
          if (!latest.has(other)) {
            latest.set(other, {
              text,
              date: format(
                timestamp?.toDate ? timestamp.toDate() : new Date(timestamp),
                'dd MMM'
              ),
            });
          }
        });

        const ids = [...latest.keys()];
        const users = (
          await Promise.all(
            ids.map(async id => {
              const ref = doc(db, 'servicemen', id);
              const usnap = await getDoc(ref);
              if (!usnap.exists()) return null;
              return {
                id,
                ...usnap.data(),
                lastMessage:
                  latest.get(id)?.text ||
                  t('serviceBookedMessage') ||
                  'Your Service has been Booked',
                lastMessageDate: latest.get(id)?.date || '',
              };
            })
          )
        ).filter(Boolean);

        setChats(users);
        setLoading(false);
        AsyncStorage.setItem('cachedChats', JSON.stringify(users)).catch(() => {});
      },
      err => {
        console.error('stream error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUserID, t]);

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { otherUserId: item.id })}
    >
      <View style={styles.avatarContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <MaterialIcons
            name="account-circle"
            size={55}
            color={theme === 'light' ? '#ccc' : '#aaa'}
          />
        )}
        {item.active && <View style={styles.activeDot} />}
      </View>

      <View style={styles.chatDetails}>
        <CustomText style={styles.chatName}>
          {item.name || t('unknownUser') || 'Unknown'}
        </CustomText>
        <CustomText
          style={styles.chatMessage}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.lastMessage.length > 20
            ? `${item.lastMessage.slice(0, 20)}…`
            : item.lastMessage}
        </CustomText>
      </View>

      <CustomText style={styles.chatDate}>{item.lastMessageDate}</CustomText>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.noChatsContainer}>
      <MaterialIcons
        name={searchQuery ? 'search-off' : 'chat-bubble-outline'}
        size={80}
        color={theme === 'light' ? '#ccc' : '#555'}
        style={styles.noChatIcon}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />

      <CustomText style={styles.titleFixed}>
        {t('chats') || 'Chats'}
      </CustomText>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme === 'light' ? '#000' : '#e5e5e7'}
          />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={i => i.id}
          renderItem={renderChat}
          ListHeaderComponent={
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              theme={theme}
              t={t}
            />
          } 
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const stylesStatic = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 45,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  clearButton: { padding: 5, marginLeft: 5 },
});

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 60,
    },
    titleFixed: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 15,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    /* list row */
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'light' ? '#eee' : '#555',
    },
    avatarContainer: { position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    activeDot: {
      position: 'absolute',
      top: 0,
      right: 15,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme === 'light' ? '#00ff00' : '#00ff55',
    },
    chatDetails: { flex: 1 },
    chatName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    chatMessage: {
      fontSize: 14,
      color: theme === 'light' ? '#666' : '#aaa',
      marginTop: 2,
    },
    chatDate: { fontSize: 12, color: theme === 'light' ? '#666' : '#aaa' },
    /* empty / loader */
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noChatsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noChatIcon: { marginBottom: 20 },
    noChatsText: {
      fontSize: 18,
      color: theme === 'light' ? '#666' : '#aaa',
      textAlign: 'center',
    },
    listContent: { paddingBottom: 20 },
  });

export default Chatting;
