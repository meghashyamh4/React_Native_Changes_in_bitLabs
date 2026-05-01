






// InterviewPrepPageRN.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Replace these with your real imports in your project
import { useAuth } from '@context/Authcontext';
import apiClient from '@services/login/ApiClient';
import { showToast } from '@services/login/ToastService';
import { trackAnalyticsEvent } from '@services/Analytics/AnalyticsService';
import RNFS from 'react-native-fs';

let MarkdownLib: any;
let useMarkdownLib = true;
try {
  MarkdownLib = require('react-native-markdown-display').default;
} catch (e) {
  useMarkdownLib = false;
}

let SnackbarLib: any;
let useSnackbarLib = true;
try {
  SnackbarLib = require('react-native-snackbar').default;
} catch (e) {
  useSnackbarLib = false;
}

import Icon from 'react-native-vector-icons/MaterialIcons';



const safeParseJSON = (raw: any) => {
  // Return parsed value or null
  try {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      return JSON.parse(trimmed);
    }
    return raw;
  } catch {
    return null;
  }
};
const normalizeSavedChat = (raw: any) => {
  try {
    if (!raw) return [];

    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.messages)) return parsed.messages;
      return [];
    }

    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.messages)) return raw.messages;

    return [];
  } catch {
    return [];
  }
};

const normalizeSavedChatToArray = (maybe: any): Array<any> => {
  // Accept:
  // - Array (already)
  // - Object with `messages` property (array) -> return messages
  // - Object which *is* a message map -> try to convert
  // - Null/undefined -> []
  try {
    if (!maybe) return [];
    // If string, attempt parse
    const parsed = typeof maybe === 'string' ? safeParseJSON(maybe) : maybe;

    if (!parsed) return [];

    if (Array.isArray(parsed)) return parsed;

    if (parsed.messages && Array.isArray(parsed.messages)) return parsed.messages;

    // Some backends might return `{ data: [...] }`
    if (parsed.data && Array.isArray(parsed.data)) return parsed.data;

    // If it's an object where keys are numeric or indices -> try to extract values
    if (typeof parsed === 'object') {
      const possibleArray = Object.keys(parsed)
        .sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return a.localeCompare(b);
        })
        .map((k) => parsed[k])
        .filter(Boolean);
      if (possibleArray.length) return possibleArray;
    }

    return [];
  } catch {
    return [];
  }
};

const formatResponse = (raw: any) => {
  // Friendly, robust formatting for display text
  try {
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'string') {
      // try parse small json
      const trimmed = raw.trim();
      if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 1) {
        const parsed = safeParseJSON(raw);
        if (parsed) {
          if (Array.isArray(parsed)) {
            return parsed.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join('\n');
          }
          if (typeof parsed === 'object') {
            // common fields
            return String(parsed.response ?? parsed.content ?? parsed.message ?? parsed.text ?? JSON.stringify(parsed));
          }
        }
      }
      return raw;
    }
    if (Array.isArray(raw)) {
      return raw.map((r) => (typeof r === 'string' ? r : JSON.stringify(r))).join('\n');
    }
    if (typeof raw === 'object') {
      return String(raw.response ?? raw.content ?? raw.message ?? raw.text ?? JSON.stringify(raw));
    }
    return String(raw);
  } catch {
    return String(raw || '');
  }
};

const skillsRequired = (profile: any) => {
  return profile?.applicant?.skillsRequired?.map((s: any) => s.skillName).filter(Boolean) || [];
};

/* -------------------- Component -------------------- */

const InterviewPrepPageRN: React.FC = () => {
  const chatIdRef = useRef<string | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const trackRef = useRef<View | null>(null);
  const [trackTop, setTrackTop] = useState(0);
  const navigation = useNavigation<any>();
  const { userId, userToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time?: string; followup?: string[] }>>([]);
  const [usedFollowups, setUsedFollowups] = useState<Set<string>>(new Set()); // Track which follow-up questions have been used
  const [hasSentMessage, setHasSentMessage] = useState(false); // Track if user has sent at least one message
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width <= 768);
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<Array<{ id: string; title: string; createdAt?: number; messages?: any[] }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<any>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [queuedMessage, setQueuedMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; chatId: string | null; title: string }>({ open: false, chatId: null, title: '' });
  const [isSaving, setIsSaving] = useState(false); // ChatGPT-style saving indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle'); // Save status for UI
  const chatScrollRef = useRef<FlatList | null>(null);
  const textInputRef = useRef<TextInput | null>(null);
  const cooldownIntervalRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const isPostingRef = useRef<boolean>(false); // Track if POST is in progress to prevent double POST
  const lastSavedTitleRef = useRef<string>('');
  const lastSavedTimeRef = useRef<number>(0);
  // TEMPORARY: deletedChatIdsRef is cleared after each successful fetch
  // Server response is the source of truth - we only use this temporarily during delete operations
  // to prevent immediate reappearance before the server processes the deletion
  const deletedChatIdsRef = useRef<Set<string>>(new Set()); // Temporary tracking during delete operations
  const isDeletingRef = useRef<Set<string>>(new Set()); // Track chats currently being deleted to prevent multiple calls
  const isFetchingRef = useRef<boolean>(false); // Prevent concurrent fetch calls

  // Ensure the Set is never accidentally cleared - add safeguard
  if (!deletedChatIdsRef.current || !(deletedChatIdsRef.current instanceof Set)) {
    deletedChatIdsRef.current = new Set();
  }
  const messagesRef = useRef<Array<{ sender: 'user' | 'bot'; text: string; time?: string; followup?: string[] }>>([]); // Track messages for save on blur
  const saveStatusTimeoutRef = useRef<any>(null); // For clearing "Saved" status

  // --- Custom Scrollbar Logic ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [listHeight, setListHeight] = useState(1);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollbarOpacity = useRef(new Animated.Value(1)).current; // Always visible

  // Calculate thumb height and position
  const MIN_THUMB = 30;
  const thumbHeight = Math.max(
    MIN_THUMB,
    Math.min(
      listHeight,
      listHeight * (listHeight / (contentHeight || 1))
    )
  );
  const scrollableContentHeight = contentHeight - listHeight;
  const scrollableTrackHeight = listHeight - thumbHeight;

  const thumbPosition = scrollY.interpolate({
    inputRange: [0, Math.max(1, scrollableContentHeight)],
    outputRange: [0, Math.max(0, scrollableTrackHeight)],
    extrapolate: 'clamp',
  });

  const showScrollbar = () => {
    // Keep it always visible, no fade out
    scrollbarOpacity.setValue(1);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,

      onPanResponderMove: (evt) => {
        if (contentHeight <= listHeight) return;

        const pageY = evt.nativeEvent.pageY;
        const relativeY = pageY - trackTop;

        const trackHeight = Math.max(1, listHeight - thumbHeight);
        const clampedY = Math.max(0, Math.min(relativeY, trackHeight));
        const ratio = clampedY / trackHeight;

        const targetOffset = ratio * (contentHeight - listHeight);

        chatScrollRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: false,
        });
      },

    })
  ).current;
  // --- End Custom Scrollbar Logic ---

  useEffect(() => {
    // Improved scroll to end with better timing for real devices
    const scrollToEnd = () => {
      if (chatScrollRef.current) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          setTimeout(() => {
            chatScrollRef.current?.scrollToEnd({ animated: true });
          }, 50);
        });
      }
    };

    const id = setTimeout(scrollToEnd, 100);
    return () => clearTimeout(id);
  }, [messages]);

  useEffect(() => {
    const onChange = ({ window }: any) => setIsMobile(window.width <= 768);
    const sub = Dimensions.addEventListener?.('change', onChange);
    return () => {
      try {
        sub?.remove?.();
      } catch {
        // older RN
      }
      // Cleanup save status timeout
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => setSidebarOpen(!isMobile), [isMobile]);

  useEffect(() => {
    if (isCoolingDown && cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownIntervalRef.current);
            setIsCoolingDown(false);
            if (queuedMessage) {
              setInput(queuedMessage);
              setQueuedMessage('');
              void sendMessage();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownIntervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoolingDown, queuedMessage]);

  // fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const { data } = await apiClient.get(`/applicantprofile/${userId}/profile-view`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setApplicantProfile(data);
      } catch {
        // silent
      }
    };
    void fetchProfile();
  }, [userId, userToken]);

  // Handle keyboard show/hide for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardWillShow = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }
  }, []);

  // REUSABLE: Dedupe chats by title - always keep the one with highest chatId
  const dedupeChats = (chatList: any[]): any[] => {
    const titleMap = new Map<string, any>();

    chatList.forEach((item: any) => {
      const title = (item.title || '').toLowerCase().trim();
      if (!title) return; // Skip items without title

      const chatId = Number(item.rawId || item.id || item.chatId) || 0;

      const existing = titleMap.get(title);
      if (!existing) {
        // First chat with this title - keep it
        titleMap.set(title, item);
      } else {
        // Compare chatIds - always keep the one with HIGHEST chatId
        const existingId = Number(existing.rawId || existing.id || existing.chatId) || 0;

        if (chatId > existingId) {
          // Current chat has higher ID - replace existing
          titleMap.set(title, item);
        } else if (chatId === existingId) {
          // Same ID - compare by createdAt as tiebreaker
          const existingTime = existing.createdAt || 0;
          const currentTime = item.createdAt || 0;
          if (currentTime > existingTime) {
            titleMap.set(title, item);
          }
        }
        // If existing has higher ID, keep existing (don't replace)
      }
    });

    return Array.from(titleMap.values()).sort((a: any, b: any) => {
      // Sort by createdAt descending (newest first)
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      if (timeB !== timeA) return timeB - timeA;

      // If timestamps are equal, sort by chatId descending
      const idA = Number(a.rawId || a.id || a.chatId) || 0;
      const idB = Number(b.rawId || b.id || b.chatId) || 0;
      return idB - idA;
    });
  };

  // Function to fetch and update saved chat titles
  const fetchChatTitles = async () => {
    // GUARD: Prevent concurrent fetch calls
    if (isFetchingRef.current) {
      console.log("📋 [FETCH CHATS] Already fetching - skipping duplicate call");
      return;
    }

    if (!userId) {
      console.log("📋 [FETCH CHATS] Skipping: userId is null");
      return;
    }

    // Mark as fetching
    isFetchingRef.current = true;

    // Get current deleted IDs for filtering (before clearing)
    const tempDeletedIds = new Set(deletedChatIdsRef.current);

    console.log("📋 [FETCH CHATS] Fetching chat titles...", {
      userId: userId,
      tempDeletedIdsCount: tempDeletedIds.size,
      tempDeletedIds: Array.from(tempDeletedIds),
    });

    try {
      console.log("📋 [FETCH CHATS] API CALL:", {
        method: "GET",
        url: `/aiPrepChat/getAllChatTitles/${userId}`,
        userId: userId,
      });

      const { data } = await apiClient.get(`/aiPrepChat/getAllChatTitles/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      console.log("📋 [FETCH CHATS] API Response received:", {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : data?.titles?.length || 0,
        rawData: data,
      });

      // CRITICAL: Check if server says "no chats" - this is the source of truth
      const isServerEmpty =
        (typeof data === 'string' && data.includes('no saved chats')) ||
        (Array.isArray(data) && data.length === 0) ||
        (!Array.isArray(data) && !data?.titles && !data?.length);

      // Accept various shapes
      const list = Array.isArray(data) ? data : data?.titles || [];
      const mapped = (list || []).map((t: any) => {
        let createdAt: number | undefined = undefined;
        if (t.createdAt) {
          if (Array.isArray(t.createdAt) && t.createdAt.length >= 3) {
            const [y, mo, d, h = 0, mi = 0, s = 0] = t.createdAt;
            createdAt = new Date(y, mo - 1, d, h, mi, s).getTime();
          } else {
            const dt = new Date(t.createdAt);
            if (!Number.isNaN(dt.getTime())) createdAt = dt.getTime();
          }
        }
        // Normalize ID - try all possible fields and convert to string
        // Handle both number and string formats from API
        const rawId = t.id ?? t.chatId ?? t.chatID ?? t.chat_id;
        const normalizedId = rawId ? String(rawId) : String(Date.now());

        return {
          id: normalizedId,
          title: (t.title ?? t.name ?? 'Untitled')?.toString() || 'Untitled',
          createdAt,
          rawId: rawId, // Keep original for debugging
        };
      }).filter((x: any) => x.id && x.title);

      console.log("📋 [FETCH CHATS] Mapped chat IDs:", {
        mappedIds: mapped.map((m: any) => ({ id: m.id, rawId: m.rawId, idType: typeof m.id })),
        tempDeletedIds: Array.from(tempDeletedIds),
      });
      // CRITICAL: Filter deleted chats BEFORE deduplication
      // This prevents duplicates from reappearing when one is deleted
      // If we delete chat 643, we don't want chat 642 (duplicate with same title) to appear
      const isChatDeletedTemp = (chatId: string | number): boolean => {
        const idStr = String(chatId);
        const idNum = Number(chatId);
        return tempDeletedIds.has(idStr) ||
          tempDeletedIds.has(String(idNum)) ||
          tempDeletedIds.has(String(Number(chatId)));
      };

      // Filter deleted chats BEFORE deduplication
      const beforeDedupeFiltered = mapped.filter((chat: any) => {
        return !isChatDeletedTemp(chat.id);
      });

      console.log("📋 [FETCH CHATS] After filtering deleted chats BEFORE deduplication:", {
        beforeFilter: mapped.length,
        afterFilter: beforeDedupeFiltered.length,
        filteredOut: mapped.length - beforeDedupeFiltered.length,
        filteredIds: mapped
          .filter((c: any) => isChatDeletedTemp(c.id))
          .map((c: any) => ({ id: c.id, title: c.title })),
      });

      // Dedupe by id first (remove exact duplicates)
      const byId = Array.from(new Map(beforeDedupeFiltered.map((m: any) => [m.id, m])).values());

      // Use reusable dedupeChats function - ALWAYS keeps highest chatId for same title
      const dedupedList = dedupeChats(byId);

      console.log("📋 [FETCH CHATS] Deduplication result:", {
        beforeDedupe: byId.length,
        afterDedupe: dedupedList.length,
        removed: byId.length - dedupedList.length,
        keptIds: dedupedList.map((c: any) => ({ id: c.id, title: c.title, rawId: c.rawId })),
      });

      const filteredList = dedupedList;

      console.log("📋 [FETCH CHATS] Final processed chat list (after deduplication):", {
        finalCount: filteredList.length,
        finalIds: filteredList.map((c: any) => c.id),
      });

      // CRITICAL: Clear deletedChatIdsRef after successful fetch
      // Server response is now the source of truth
      deletedChatIdsRef.current.clear();
      console.log("📋 [FETCH CHATS] Cleared deletedChatIdsRef - server is source of truth");

      // SINGLE SOURCE OF TRUTH: Replace entire list with server response
      // DO NOT merge with prevChats - server is the only source of truth
      console.log("📋 [FETCH CHATS] Setting chat list directly from server (single source of truth):", {
        serverChatCount: filteredList.length,
        serverChatIds: filteredList.map((c: any) => c.id),
      });

      // Directly set server response - no merging
      setSavedChats(filteredList);
    } catch (err: any) {
      console.error("❌ [FETCH CHATS] Error fetching chat titles:", {
        error: err,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        userId: userId,
      });
    } finally {
      // Always clear fetching flag
      isFetchingRef.current = false;
    }
  };

  // fetch saved chat titles - normalize createdAt properly
  useEffect(() => {
    void fetchChatTitles();
  }, [userId, userToken]);
  useEffect(() => {
    if (trackRef.current) {
      requestAnimationFrame(() => {
        trackRef.current?.measureInWindow((x, y) => {
          setTrackTop(y);
        });
      });
    }
  }, [inputHeight, insets.bottom, listHeight]);


  const addSnackbar = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
    if (useSnackbarLib && SnackbarLib) {
      SnackbarLib.show({ text: message, duration: SnackbarLib.LENGTH_SHORT, backgroundColor: type === 'error' ? '#ef4444' : '#10b981' });
    } else {
      Alert.alert(type === 'error' ? 'Error' : 'Success', message);
    }
  };

  const focusInput = () => setTimeout(() => textInputRef.current?.focus(), 50);

  /* -------------------- SEND & SAVE (fixed) -------------------- */

  const buildApiMsgsFromLocalMessages = (localMessages: Array<{ sender: 'user' | 'bot'; text: string; time?: string }>) => {
    return localMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      time: m.time ?? new Date().toISOString(),
    }));
  };


  // const saveChatToServer = async (snapshot) => {
  //   const apiFormatted = snapshot.map(m => ({
  //     role: m.sender === "user" ? "user" : "assistant",
  //     message: m.text,
  //     time: m.time ?? new Date().toISOString(),
  //   }));

  //   try {
  //     if (!currentChatId) {
  //       // CREATE CHAT
  //       const resp = await apiClient.post(
  //         "/aiPrepChat/saveChat",
  //         {
  //           applicantId: userId,
  //           title: snapshot[0]?.text?.slice(0, 50) || "Untitled",
  //           savedChat: JSON.stringify(apiFormatted)
  //         },
  //         { headers: { Authorization: `Bearer ${userToken}` } }
  //       );

  //       const newId = resp?.data?.chatId || resp?.data?.id;
  //       setCurrentChatId(String(newId));
  //     } else {
  //       // UPDATE CHAT
  //       await apiClient.put(
  //         `/aiPrepChat/${currentChatId}/updateChatDetails/${userId}`,
  //         {
  //           title: snapshot[0]?.text?.slice(0, 50) || "Untitled",
  //           savedChat: JSON.stringify(apiFormatted)
  //         },
  //         { headers: { Authorization: `Bearer ${userToken}` } }
  //       );
  //     }
  //   } catch (err) {
  //     console.log("SAVE ERROR", err);
  //   }
  // };

  const saveChatToServer = async (snapshot: any[]) => {
    // Don't save empty chats
    if (!snapshot || snapshot.length === 0) {
      console.log("📝 [SAVE CHAT] Skipping save: empty chat");
      return;
    }

    // Filter out empty messages
    const validMessages = snapshot.filter((m: any) => m && m.text && String(m.text).trim().length > 0);
    if (validMessages.length === 0) {
      console.log("📝 [SAVE CHAT] Skipping save: no valid messages");
      return;
    }

    // CRITICAL GUARD 1: Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log("📝 [SAVE CHAT] ⚠️ Save already in progress, skipping duplicate call");
      return;
    }

    // CRITICAL GUARD 2: If chatIdRef already exists, NEVER call POST
    // This prevents creating duplicate chats
    const hasExistingChatId = chatIdRef.current || currentChatId;
    const willCreateNew = !hasExistingChatId;

    // CRITICAL GUARD 3: If POST is already in progress, skip
    if (willCreateNew && isPostingRef.current) {
      console.log("📝 [SAVE CHAT] ⚠️ POST already in progress, skipping duplicate POST call");
      return;
    }

    console.log("📝 [SAVE CHAT] Starting save operation...", {
      messageCount: validMessages.length,
      chatIdRef: chatIdRef.current,
      currentChatId: currentChatId,
      hasExistingChatId: !!hasExistingChatId,
      willCreateNew: willCreateNew,
      isPosting: isPostingRef.current,
      isSaving: isSavingRef.current,
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    // Set saving state for UI feedback (ChatGPT-style)
    setIsSaving(true);
    setSaveStatus('saving');
    isSavingRef.current = true;

    // Mark POST as in progress if creating new chat
    if (willCreateNew) {
      isPostingRef.current = true;
      console.log("📝 [SAVE CHAT] 🔒 Locked POST - preventing duplicate POST calls");
    }

    // Clear any existing timeout
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    const apiFormatted = validMessages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "assistant",
      message: m.text,
      time: m.time ?? new Date().toISOString(),
    }));

    try {

      // -------------------------
      // FIRST MESSAGE → CREATE (POST)
      // -------------------------
      if (!chatIdRef.current && !currentChatId) {
        // DOUBLE-CHECK: If chatIdRef was set by another concurrent call, use PUT instead
        if (chatIdRef.current || currentChatId) {
          console.log("📝 [SAVE CHAT] ⚠️ Chat ID was set during POST check, switching to PUT");
          isPostingRef.current = false;
          // Fall through to PUT logic below
        } else {
          const payload = {
            applicantId: userId,
            title: validMessages[0]?.text?.slice(0, 50) || "Untitled",
            savedChat: JSON.stringify(apiFormatted),
          };

          console.log("📝 [SAVE CHAT] 🆕 [POST] Creating new chat - API CALL:", {
            method: "POST",
            url: "/aiPrepChat/saveChat",
            payload: {
              ...payload,
              savedChat: `[${apiFormatted.length} messages]`, // Don't log full chat content
            },
            chatIdRef: chatIdRef.current,
            currentChatId: currentChatId,
            timestamp: new Date().toISOString(),
          });

          const resp = await apiClient.post(
            "/aiPrepChat/saveChat",
            payload,
            { headers: { Authorization: `Bearer ${userToken}` } }
          );

          const newId = resp?.data?.chatId || resp?.data?.id || resp?.data?.chatID;
          const finalId = String(newId);

          console.log("✅ [SAVE CHAT] 🆕 [POST] Chat created successfully:", {
            newChatId: newId,
            finalId: finalId,
            response: {
              ...resp?.data,
              savedChat: resp?.data?.savedChat ? `[${JSON.parse(resp?.data?.savedChat || '[]').length} messages]` : 'N/A',
            },
            timestamp: new Date().toISOString(),
          });

          // CRITICAL: Set both ref and state IMMEDIATELY and ATOMICALLY
          chatIdRef.current = finalId;
          setCurrentChatId(finalId);

          // CRITICAL: Unlock POST flag AFTER setting chatId
          isPostingRef.current = false;

          console.log("📝 [SAVE CHAT] ✅ Chat ID set after POST, POST unlocked:", {
            chatIdRef: chatIdRef.current,
            currentChatId: finalId,
            isPosting: isPostingRef.current,
            timestamp: new Date().toISOString(),
          });

          // Show saved status
          setSaveStatus('saved');
          setIsSaving(false);
          isSavingRef.current = false;

          // Clear "Saved" status after 2 seconds
          saveStatusTimeoutRef.current = setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);

          // Refresh chat list to show the new chat (debounced to prevent multiple calls)
          setTimeout(() => {
            fetchChatTitles().catch(err => console.error('Error refreshing chat list:', err));
          }, 500);

          return;
        }
      }

      // -------------------------
      // NEXT MESSAGES → UPDATE (PUT)
      // -------------------------
      // Use chatIdRef.current if available, otherwise use currentChatId
      const chatIdToUpdate = chatIdRef.current || currentChatId;

      if (!chatIdToUpdate) {
        // This should never happen if guards above worked, but log it
        console.error("❌ [SAVE CHAT] ⚠️ No chat ID available for update - this should not happen");
        console.error("📝 [SAVE CHAT] State check:", {
          chatIdRef: chatIdRef.current,
          currentChatId: currentChatId,
          isPosting: isPostingRef.current,
          isSaving: isSavingRef.current,
        });

        // DO NOT create new chat here - this would cause duplicates
        // Instead, wait for POST to complete or return early
        console.log("📝 [SAVE CHAT] ⚠️ Skipping save - waiting for POST to complete");
        setIsSaving(false);
        isSavingRef.current = false;
        if (isPostingRef.current) {
          isPostingRef.current = false;
        }
        return;
      }

      const updatePayload = {
        title: validMessages[0]?.text?.slice(0, 50) || "Untitled",
        savedChat: JSON.stringify(apiFormatted),
      };

      console.log("📝 [SAVE CHAT] 🔄 [PUT] Updating existing chat - API CALL:", {
        method: "PUT",
        url: `/aiPrepChat/${chatIdToUpdate}/updateChatDetails/${userId}`,
        chatId: chatIdToUpdate,
        chatIdRef: chatIdRef.current,
        currentChatId: currentChatId,
        timestamp: new Date().toISOString(),
        payload: {
          ...updatePayload,
          savedChat: `[${apiFormatted.length} messages]`, // Don't log full chat content
        },
      });

      const updateResp = await apiClient.put(
        `/aiPrepChat/${chatIdToUpdate}/updateChatDetails/${userId}`,
        updatePayload,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      console.log("✅ [SAVE CHAT] 🔄 [PUT] Chat updated successfully:", {
        chatId: chatIdToUpdate,
        response: updateResp?.data,
        timestamp: new Date().toISOString(),
      });

      // Show saved status
      setSaveStatus('saved');
      setIsSaving(false);
      isSavingRef.current = false;

      // Clear "Saved" status after 2 seconds
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

    } catch (err: any) {
      // CRITICAL: Always unlock flags on error
      console.error("❌ [SAVE CHAT] Error saving chat:", {
        error: err,
        message: err?.message,
        chatIdRef: chatIdRef.current,
        currentChatId: currentChatId,
        isPosting: isPostingRef.current,
        isSaving: isSavingRef.current,
        timestamp: new Date().toISOString(),
      });

      // Unlock all flags
      isSavingRef.current = false;
      if (isPostingRef.current) {
        isPostingRef.current = false;
        console.log("📝 [SAVE CHAT] 🔓 Unlocked POST flag after error");
      }

      setIsSaving(false);
      setSaveStatus('idle');
      console.error("❌ [SAVE CHAT] Error saving chat:", {
        error: err,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        chatId: chatIdRef.current,
        userId: userId,
      });
      setIsSaving(false);
      setSaveStatus('idle');
      isSavingRef.current = false;
    }
  };


  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg = textToSend.trim();
    setInput("");
    setIsLoading(true);

    // Mark that user has sent at least one message (enables New Chat button)
    setHasSentMessage(true);

    // Clear all follow-up questions when sending a new message
    setUsedFollowups(new Set());

    const userUiMsg = { sender: "user" as const, text: userMsg, time: new Date().toISOString() };
    let botUiMsg: { sender: "bot"; text: string; time: string; followup?: string[] } | null = null;

    try {
      // 1) Ask AI
      const aiRes = await apiClient.post(
        "/aiPrepModel/postQuery",
        {
          applicantId: userId,
          chatId: chatIdRef.current,
          request: userMsg
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      botUiMsg = {
        sender: "bot" as const,
        text: formatResponse(aiRes?.data?.response || aiRes?.data),
        time: new Date().toISOString(),
        followup: Array.isArray(aiRes?.data?.followup) ? aiRes.data.followup : undefined
      };

      // 2) Update UI - backend gives a chatId → update (matching web version)
      if (aiRes?.data?.chatId) {
        const newChatId = String(aiRes.data.chatId);
        chatIdRef.current = newChatId;
        setCurrentChatId(newChatId);
        console.log("📝 [SAVE CHAT] Backend provided chatId:", newChatId);
      }

      // 3) Update messages - DO NOT save automatically (matching web version)
      // Save only happens in startNewChat if chat is new
      if (botUiMsg) {
        setMessages(prev => {
          const updated = [...prev, userUiMsg, botUiMsg] as Array<{ sender: 'user' | 'bot'; text: string; time?: string; followup?: string[] }>;
          messagesRef.current = updated; // Update ref for save on blur

          // If new bot message has follow-ups, clear all old follow-ups
          if (botUiMsg && botUiMsg.followup && Array.isArray(botUiMsg.followup) && botUiMsg.followup.length > 0) {
            // Mark all follow-ups from previous messages as used (hide old follow-ups)
            setUsedFollowups(prevUsed => {
              const newSet = new Set(prevUsed);
              // Mark all follow-ups from all previous bot messages (before the new one)
              prev.forEach((m, idx) => {
                if (m.sender === 'bot' && m.followup && Array.isArray(m.followup)) {
                  m.followup.forEach((_, fIdx) => {
                    newSet.add(`${idx}-${fIdx}`);
                  });
                }
              });
              return newSet;
            });
          }

          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev, userUiMsg] as Array<{ sender: 'user' | 'bot'; text: string; time?: string; followup?: string[] }>;
          messagesRef.current = updated;
          return updated;
        });
      }

    } catch (err) {
      console.log("sendMessage error:", err);
      setMessages(prev => [...prev, userUiMsg, { sender: "bot" as const, text: "⚠️ Connection error", time: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };




  /* -------------------- LOAD / DELETE / EXPORT (robust parsing) -------------------- */

  const startNewChat = async () => {
    try {
      // Match web version: Check if current chat is new (not yet saved)
      const isExistingChat = currentChatId && savedChats.some(c => String(c.id) === String(currentChatId));

      // Save ONLY if this chat is NEW (not yet saved) - matching web version exactly
      if (messages.length > 0 && currentChatId && !isExistingChat) {
        try {
          console.log("📝 [SAVE CHAT] Triggered from startNewChat - saving NEW chat:", {
            currentChatId,
            isExistingChat,
            messageCount: messages.length,
          });

          // Title from first user message (matching web version)
          const firstUserMsg = messages.find(m => m.sender === "user")?.text || "Untitled Chat";
          const trimmedTitle = firstUserMsg.length > 35
            ? firstUserMsg.substring(0, 35) + "..."
            : firstUserMsg;

          // Format messages for backend (matching web version)
          const chatArray = messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            message: m.text,
            time: m.time ?? new Date().toISOString(),
          }));

          const payload = {
            title: trimmedTitle,
            savedChat: JSON.stringify(chatArray),
          };

          // SAVE using PUT (matching web version)
          await apiClient.put(
            `/aiPrepChat/${currentChatId}/updateChatDetails/${userId}`,
            payload,
            { headers: { Authorization: `Bearer ${userToken}` } }
          );

          console.log("✅ [SAVE CHAT] Chat saved successfully in startNewChat:", {
            chatId: currentChatId,
            title: trimmedTitle,
          });

          // Refresh chat list to show the new saved chat
          setTimeout(() => {
            fetchChatTitles().catch(err => console.error('Error refreshing chat list:', err));
          }, 500);

          addSnackbar({
            message: "Chat saved successfully before starting a new one.",
            type: "success"
          });
        } catch (error) {
          console.error("❌ [SAVE CHAT] Failed to save chat before new chat:", error);
          addSnackbar({
            message: "Unable to save previous chat. Starting new chat anyway.",
            type: "error"
          });
        }
      } else {
        console.log("📝 [SAVE CHAT] Skipping save in startNewChat:", {
          hasMessages: messages.length > 0,
          hasCurrentChatId: !!currentChatId,
          isExistingChat,
          reason: !currentChatId ? "no chatId" : isExistingChat ? "already saved" : "no messages",
        });
      }

      // Reset for brand new chat
      console.log("📝 [SAVE CHAT] Clearing chat IDs for new chat:", {
        oldChatIdRef: chatIdRef.current,
        oldCurrentChatId: currentChatId,
      });

      setMessages([]);
      messagesRef.current = [];
      setCurrentChatId(null);
      chatIdRef.current = null;

      // CRITICAL: Reset POST flag to allow new POST for next chat
      isPostingRef.current = false;
      isSavingRef.current = false;

      // Clear chat options menu when starting new chat
      setOpenOptionsId(null);

      // Clear used follow-ups when starting new chat
      setUsedFollowups(new Set());

      // Reset hasSentMessage to false for new chat (will be enabled after first message)
      setHasSentMessage(false);

      setInput(''); // Clear input field
      setQueuedMessage(''); // Clear queued message
      focusInput();
      setSidebarOpen(false);
    } catch (error) {
      console.error("Error in startNewChat:", error);
      setMessages([]);
      messagesRef.current = [];
      setCurrentChatId(null);
      chatIdRef.current = null;
      setUsedFollowups(new Set());
      setHasSentMessage(false);
      setInput(''); // Clear input field
      setQueuedMessage(''); // Clear queued message
      focusInput();
      setSidebarOpen(false);
    }
  };

  const loadChat = async (id: string) => {
    // Don't load if this chat is deleted
    const chatIdStr = String(id);
    if (deletedChatIdsRef.current.has(chatIdStr)) {
      console.log('[loadChat] Attempted to load deleted chat, ignoring:', chatIdStr);
      showToast('error', 'This chat has been deleted');
      return;
    }

    setIsLoading(true);

    // FIX 1 → set chatIdRef immediately
    chatIdRef.current = id;

    // FIX 2 → also set state
    setCurrentChatId(id);

    // Close sidebar when loading a chat
    if (isMobile) {
      setSidebarOpen(false);
    }

    // Clear input when loading a chat
    setInput('');
    setQueuedMessage('');

    try {
      const { data } = await apiClient.get(
        `/aiPrepChat/${id}/getChatDetailsById/${userId}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      let parsed = data?.savedChat;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (!Array.isArray(parsed)) parsed = [];

      const mapped = parsed.map((m: any) => ({
        sender: m.role === "user" ? "user" : "bot",
        text: String(m.message || ""),
        time: m.time
      }));

      setMessages(mapped);
      messagesRef.current = mapped; // Update ref when loading chat

      // If loaded chat has messages, enable New Chat button
      if (mapped && mapped.length > 0) {
        setHasSentMessage(true);
      } else {
        setHasSentMessage(false);
      }

      // Clear any stale follow-ups when loading a chat
      setUsedFollowups(new Set());
    } catch (err) {
      console.log("LOAD CHAT ERROR", err);
      setMessages([]);
      messagesRef.current = [];
      setUsedFollowups(new Set());
      setHasSentMessage(false);
    } finally {
      setIsLoading(false);
    }
  };


  const deleteChat = async (id: string) => {
    // GUARD 1: Check if chatId is null/undefined
    if (!id) {
      console.log("🗑️ [DELETE CHAT] Chat ID is null/undefined - skipping delete");
      return;
    }

    // GUARD 2: Check if chat list is empty
    if (savedChats.length === 0) {
      console.log("🗑️ [DELETE CHAT] Chat list is empty - skipping delete");
      return;
    }

    // GUARD 3: Check if chat exists in current UI list
    const chat = savedChats.find((c) => String(c.id) === String(id));
    if (!chat) {
      console.log("🗑️ [DELETE CHAT] Chat not found in savedChats - skipping delete:", id);
      return;
    }

    // GUARD 4: Check if already deleting this chat (prevent multiple calls)
    const chatIdStr = String(id);
    if (isDeletingRef.current.has(chatIdStr)) {
      console.log("🗑️ [DELETE CHAT] Already deleting this chat - skipping duplicate call:", chatIdStr);
      return;
    }

    // Mark as deleting to prevent duplicate calls
    isDeletingRef.current.add(chatIdStr);

    // Normalize ID - try multiple formats
    const chatIdToDelete = String(id);
    const chatIdNum = Number(id);
    const chatIdNumStr = String(chatIdNum);

    // CRITICAL: Initialize deletedChatIdsRef BEFORE marking chats
    if (!deletedChatIdsRef.current || !(deletedChatIdsRef.current instanceof Set)) {
      deletedChatIdsRef.current = new Set();
    }

    // Mark the deleted chat ID in multiple formats
    deletedChatIdsRef.current.add(chatIdToDelete);
    deletedChatIdsRef.current.add(String(id));
    if (!isNaN(chatIdNum)) {
      deletedChatIdsRef.current.add(chatIdNumStr);
      deletedChatIdsRef.current.add(String(chatIdNum));
    }
    if (id !== chatIdToDelete) {
      deletedChatIdsRef.current.add(id);
    }

    // CRITICAL: Also mark ALL chats with the same title as deleted
    // This prevents duplicates from reappearing after deletion
    const chatTitle = (chat.title || '').toLowerCase().trim();
    const deletedSameTitleIds: string[] = [];
    savedChats.forEach((c) => {
      const cTitle = (c.title || '').toLowerCase().trim();
      if (cTitle === chatTitle) {
        const cIdStr = String(c.id);
        const cIdNum = Number(c.id);
        // Mark in multiple formats
        deletedChatIdsRef.current.add(cIdStr);
        deletedChatIdsRef.current.add(String(cIdNum));
        if (!isNaN(cIdNum)) {
          deletedChatIdsRef.current.add(String(cIdNum));
        }
        deletedSameTitleIds.push(cIdStr);
      }
    });

    console.log("🗑️ [DELETE CHAT] Starting delete operation...", {
      originalId: id,
      chatIdToDelete: chatIdToDelete,
      chatIdNum: chatIdNum,
      chatIdNumStr: chatIdNumStr,
      chatTitle: chat.title,
      userId: userId,
      currentChatId: currentChatId,
      deletedSameTitleIds,
      totalMarked: deletedChatIdsRef.current.size,
    });

    console.log("🗑️ [DELETE CHAT] Added to temp deletedChatIdsRef:", {
      deletedIds: Array.from(deletedChatIdsRef.current),
      setSize: deletedChatIdsRef.current.size,
    });

    // Remove from local state IMMEDIATELY (optimistic update)
    // Also remove ALL chats with the same title to prevent duplicates from showing
    setSavedChats((prev) => {
      const beforeCount = prev.length;
      const chatTitleToDelete = (chat.title || '').toLowerCase().trim();

      const filtered = prev.filter(c => {
        const cId = String(c.id);
        const cTitle = (c.title || '').toLowerCase().trim();

        // Remove the deleted chat
        if (cId === chatIdToDelete || cId === String(id)) {
          return false;
        }

        // CRITICAL: Also remove ALL chats with the same title
        // This prevents duplicates from appearing in UI
        if (cTitle === chatTitleToDelete) {
          console.log("🗑️ [DELETE CHAT] Also removing same-title chat from UI:", {
            chatId: c.id,
            title: c.title,
            deletedTitle: chat.title,
          });
          return false;
        }

        return true;
      });

      console.log("🗑️ [DELETE CHAT] Removed from local state:", {
        beforeCount,
        afterCount: filtered.length,
        removed: beforeCount - filtered.length,
        remainingIds: filtered.map(c => c.id),
        removedSameTitle: deletedSameTitleIds,
      });
      return filtered;
    });

    // Clear current chat if it's the one being deleted
    if (String(currentChatId) === chatIdToDelete || String(currentChatId) === String(id)) {
      console.log("🗑️ [DELETE CHAT] Clearing current chat as it's being deleted");
      setMessages([]);
      messagesRef.current = [];
      setCurrentChatId(null);
      chatIdRef.current = null;
      setUsedFollowups(new Set());
      setHasSentMessage(false);
      setInput('');
    }

    setOpenOptionsId(null);

    try {
      const jwtToken = userToken;

      console.log("🗑️ [DELETE CHAT] API CALL:", {
        method: "DELETE",
        url: `/aiPrepChat/${id}/deleteChat/${userId}`,
        chatId: id,
        userId: userId,
      });

      const deleteResp = await apiClient.delete(`/aiPrepChat/${id}/deleteChat/${userId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      console.log("✅ [DELETE CHAT] Chat deleted successfully on server:", {
        chatId: id,
        response: deleteResp?.data,
        status: deleteResp?.status,
      });

      // Close sidebar on mobile when chat is deleted
      if (isMobile) {
        setSidebarOpen(false);
      }

      showToast('success', 'Chat deleted successfully');

      // Refresh immediately - server has processed deletion, trust server response
      // fetchChatTitles will clear deletedChatIdsRef after successful fetch
      console.log("🗑️ [DELETE CHAT] Refreshing chat list immediately (server is source of truth)");
      await fetchChatTitles(); // Always fetch first page after delete

      // Remove from deleting set after successful fetch
      isDeletingRef.current.delete(chatIdStr);

    } catch (e: any) {
      console.error("❌ [DELETE CHAT] Error deleting chat on backend:", {
        error: e,
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status,
        chatId: id,
        userId: userId,
      });

      // Remove from deleting set on error
      isDeletingRef.current.delete(chatIdStr);

      // On error, keep the chat removed locally and keep it in temp ref
      // User can manually refresh if needed
      showToast('error', 'Removed locally. Server error deleting chat.');
    }
  };


  // Save chat when navigating away (on blur) and clear on focus
  useFocusEffect(
    React.useCallback(() => {
      // On focus: Clear chat state to start fresh
      console.log("📝 [SAVE CHAT] Clearing chat IDs on focus (useFocusEffect)");
      // Trigger analytics event
      trackAnalyticsEvent("MOBILE-ASK NEWTON", userId);
      setMessages([]);
      messagesRef.current = [];
      setCurrentChatId(null);
      chatIdRef.current = null;
      setUsedFollowups(new Set());
      setHasSentMessage(false);

      // CRITICAL: Reset POST flag to allow new POST for next chat
      isPostingRef.current = false;
      isSavingRef.current = false;

      setInput(''); // Clear input field
      setQueuedMessage(''); // Clear queued message

      // Ensure deletedChatIdsRef exists (will be cleared on next fetch)
      if (!deletedChatIdsRef.current || !(deletedChatIdsRef.current instanceof Set)) {
        deletedChatIdsRef.current = new Set();
      }

      // On blur: Save current chat before leaving (matching web version logic)
      return () => {
        // Use ref to get the latest messages without dependency issues
        const currentMessages = messagesRef.current;
        const currentChatIdValue = chatIdRef.current || currentChatId;

        // Match web version: Only save if chat is NEW (not yet in savedChats)
        if (currentMessages.length > 0 && currentChatIdValue) {
          const isExistingChat = savedChats.some(c => String(c.id) === String(currentChatIdValue));

          if (!isExistingChat) {
            console.log("📝 [SAVE CHAT] Triggered from useFocusEffect cleanup (blur) - saving NEW chat:", {
              chatId: currentChatIdValue,
              isExistingChat,
            });

            // Save using PUT (matching web version)
            const firstUserMsg = currentMessages.find(m => m.sender === "user")?.text || "Untitled Chat";
            const trimmedTitle = firstUserMsg.length > 35
              ? firstUserMsg.substring(0, 35) + "..."
              : firstUserMsg;

            const chatArray = currentMessages.map(m => ({
              role: m.sender === "user" ? "user" : "assistant",
              message: m.text,
              time: m.time ?? new Date().toISOString(),
            }));

            const payload = {
              title: trimmedTitle,
              savedChat: JSON.stringify(chatArray),
            };

            apiClient.put(
              `/aiPrepChat/${currentChatIdValue}/updateChatDetails/${userId}`,
              payload,
              { headers: { Authorization: `Bearer ${userToken}` } }
            ).catch(err => {
              console.error('❌ [SAVE CHAT] Failed to save chat on blur:', err);
            });
          } else {
            console.log("📝 [SAVE CHAT] Skipping blur save - chat already saved:", {
              chatId: currentChatIdValue,
              isExistingChat,
            });
          }
        }
      };
    }, [])
  );

  const handleExportChatById = async (chatId: string) => {
    try {
      const { data } = await apiClient.get(`/aiPrepChat/${chatId}/getChatDetailsById/${userId}`, { headers: { Authorization: `Bearer ${userToken}` } });
      let parsed = null;
      if (data?.savedChat) parsed = safeParseJSON(data.savedChat) ?? data.savedChat;
      else parsed = data;
      const msgs = normalizeSavedChatToArray(parsed);
      if (!msgs || !msgs.length) {
        if (isMobile) {
          setSidebarOpen(false);
        }
        return showToast('error', 'Empty chat');
      }

      const chatText = msgs.map((m: any) => `${(m.role ?? '').toUpperCase()}: ${m.content ?? m.message ?? m.text ?? ''}`).join('\n\n');
      const path = `${RNFS.DownloadDirectoryPath}/InterviewPrepChat_${Date.now()}.txt`;
      await RNFS.writeFile(path, chatText, 'utf8');

      // Close sidebar on mobile when chat is exported
      if (isMobile) {
        setSidebarOpen(false);
      }

      showToast('success', 'Chat exported to Downloads folder');
    } catch {
      // Close sidebar on mobile even on error
      if (isMobile) {
        setSidebarOpen(false);
      }
      showToast('error', 'Export failed');
    }
  };

  const handleExportChat = async () => {
    if (!messages.length) return showToast('error', 'Empty chat');
    try {
      const chatText = messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
      const path = `${RNFS.DownloadDirectoryPath}/InterviewPrepChat_${Date.now()}.txt`;
      await RNFS.writeFile(path, chatText, 'utf8');
      showToast('success', 'Chat exported to Downloads folder');
    } catch {
      showToast('error', 'Failed to export chat');
    }
  };

  /* -------------------- UI -------------------- */

  const Markdown = useMarkdownLib ? MarkdownLib : undefined;

  return (
    <ImageBackground
      source={require('../../assests/Images/backgrounds/image.png')}
      style={styles.background}
    >
      <View style={styles.safeAreaContainer}>
        {/* Header - Same as MentorSphere */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.heading}>Ask Newton</Text>
            <View style={styles.headerRightContainer}>
              <View style={styles.headerRightContent}>
                {saveStatus === 'saving' && (
                  <View style={styles.saveStatusContainer}>
                    <ActivityIndicator size="small" color="#F97316" style={{ marginRight: 6 }} />
                    <Text style={styles.saveStatusText}>Saving...</Text>
                  </View>
                )}
                {saveStatus === 'saved' && (
                  <View style={styles.saveStatusContainer}>
                    <Icon name="check-circle" size={16} color="#10b981" style={{ marginRight: 6 }} />
                    <Text style={[styles.saveStatusText, { color: '#10b981' }]}>Saved</Text>
                  </View>
                )}
                {(!saveStatus || (saveStatus !== 'saving' && saveStatus !== 'saved')) && (
                  <View style={styles.backButtonPlaceholder} />
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSidebarOpen(!sidebarOpen)}
                style={styles.hamburgerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="menu" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Row Container */}
        <View style={styles.container}>
          {/* Sidebar dim overlay */}
          {isMobile && sidebarOpen && (
            <View pointerEvents="auto" style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}>
              <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.28)' }]} activeOpacity={1} onPress={() => setSidebarOpen(false)} />
            </View>
          )}

          {/* Sidebar */}
          <View style={[styles.sidebar, isMobile && styles.sidebarMobile, !sidebarOpen && styles.sidebarClosed]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => setSidebarOpen(false)}
                activeOpacity={1}
              >
                <Icon name="chevron-right" size={16} color="#fff" />
                <Text style={styles.toggleBtnText}>Hide</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarButtons}>
              <TouchableOpacity
                style={[
                  styles.sidebarButton,
                  !hasSentMessage && styles.sidebarButtonDisabled
                ]}
                onPress={() => {
                  if (!hasSentMessage) {
                    showToast('error', 'You’re already in a new chat.');
                  } else {
                    startNewChat();
                  }
                }}
                activeOpacity={1}
              >
                <Text style={[
                  styles.sidebarButtonText,
                  !hasSentMessage && styles.sidebarButtonTextDisabled
                ]}>New Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sidebarButton}
                activeOpacity={1}
                onPress={() => {
                  console.log("📝 [SAVE CHAT] Clearing chat IDs from Clear Chat button");
                  setMessages([]);
                  messagesRef.current = [];
                  setCurrentChatId(null);
                  chatIdRef.current = null;

                  // CRITICAL: Reset POST flag to allow new POST for next chat
                  isPostingRef.current = false;
                  isSavingRef.current = false;

                  // Clear used follow-ups when clearing chat
                  setUsedFollowups(new Set());

                  // Reset hasSentMessage to false
                  setHasSentMessage(false);

                  setInput(''); // Clear input field
                  setQueuedMessage(''); // Clear queued message

                  // Close sidebar on mobile when chat is cleared
                  if (isMobile) {
                    setSidebarOpen(false);
                  }

                  showToast('success', 'Chat cleared');
                }}
              >
                <Text style={styles.sidebarButtonText}>Clear Chat</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.chatsSectionTitle}>Chats</Text>

            <FlatList
              style={{ overflow: 'visible', zIndex: 1, flex: 1 }}
              contentContainerStyle={{ overflow: 'visible', paddingBottom: 40, zIndex: 1, flexGrow: 1 }}
              data={savedChats}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              alwaysBounceVertical={false}
              bounces={true}
              removeClippedSubviews={false}
              maintainVisibleContentPosition={null}
              renderItem={({ item }) => (
                <View style={[styles.savedChatRow, openOptionsId === item.id && styles.savedChatRowActive]}>
                  <TouchableOpacity
                    style={[styles.chatListItem, currentChatId === item.id && styles.chatListItemActive]}
                    onPress={() => loadChat(item.id)}
                    activeOpacity={1}
                  >
                    <Text numberOfLines={1} style={styles.chatListItemText}>{item.title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionsBtn}
                    onPress={() => setOpenOptionsId(openOptionsId === item.id ? null : item.id)}
                    activeOpacity={1}
                  >
                    {/*changed */}
                    {/* <Icon name="settings" size={22} color="#0f172a" /> */}
                    <Icon name="more-vert" size={18} color="#0f172a" />

                  </TouchableOpacity>

                  {openOptionsId === item.id && (
                    <View style={styles.optionsMenu}>
                      <TouchableOpacity
                        style={[styles.optionsMenuItem, styles.optionsMenuItemFirst]}
                        onPress={() => (handleExportChatById(item.id), setOpenOptionsId(null))}
                        activeOpacity={1}
                      >
                        <Text style={styles.optionsMenuItemText}>Export Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionsMenuItem, styles.optionsMenuItemLast]}
                        onPress={() => { setConfirmDelete({ open: true, chatId: item.id, title: item.title }); setOpenOptionsId(null); }}
                        activeOpacity={1}
                      >
                        <Text style={styles.optionsMenuItemText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={() => <Text style={styles.emptyListText}>No saved chats</Text>}
            />
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
              style={styles.contentWrapper}
              enabled={true}>

              <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <FlatList
                  ref={chatScrollRef}
                  data={messages}
                  keyExtractor={(msg, i) => `${msg.sender}-${i}-${String(msg.text).slice(0, 10)}`}
                  style={styles.chatWindow}
                  contentContainerStyle={styles.chatContentContainer}
                  showsVerticalScrollIndicator={false} // Disable native to show custom
                  persistentScrollbar={false}
                  removeClippedSubviews={false}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                      useNativeDriver: false, // contentOffset.y interpolation with Animated.event often needs false if driving UI styles
                      listener: () => showScrollbar(),
                    }
                  )}
                  onContentSizeChange={(_, h) => setContentHeight(h)}
                  onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
                  ListEmptyComponent={() => (
                    <Text style={styles.emptyState}>Hi! Ask me anything.</Text>
                  )}
                  renderItem={({ item: msg, index: i }) => (
                    <View style={[styles.messageContainer, msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer]}>
                      <View style={[styles.messageBubble, msg.sender === 'user' ? styles.userMessage : styles.botMessage]}>
                        {useMarkdownLib && Markdown ? (
                          <MarkdownLib style={{ body: { color: msg.sender === 'user' ? '#fff' : '#111827', fontSize: 15, lineHeight: 22, fontFamily: 'PlusJakartaSans-Medium' } }}>
                            {msg.text}
                          </MarkdownLib>
                        ) : (
                          <Text style={[styles.messageText, msg.sender === 'user' ? styles.messageTextUser : styles.messageTextBot]}>{msg.text}</Text>
                        )}
                      </View>
                    </View>
                  )}
                  ListFooterComponent={() => (
                    <>
                      {/* Follow-up questions displayed separately below bot messages */}
                      {(() => {
                        // Find the most recent bot message with follow-ups that hasn't been hidden
                        let latestFollowupIndex = -1;
                        for (let i = messages.length - 1; i >= 0; i--) {
                          const msg = messages[i];
                          if (msg.sender === 'bot' && msg.followup && Array.isArray(msg.followup) && msg.followup.length > 0) {
                            // Check if any follow-up from this message has been used
                            const hasUsedFollowup = msg.followup.some((_, qIndex) => {
                              const followupKey = `${i}-${qIndex}`;
                              return usedFollowups.has(followupKey);
                            });

                            // Only show if none have been used yet
                            if (!hasUsedFollowup) {
                              latestFollowupIndex = i;
                              break; // Found the latest valid follow-up set
                            }
                          }
                        }

                        // Only render the latest follow-up set
                        if (latestFollowupIndex >= 0) {
                          const msg = messages[latestFollowupIndex];
                          if (msg.followup && Array.isArray(msg.followup) && msg.followup.length > 0) {
                            return (
                              <View key={`followup-${latestFollowupIndex}`} style={styles.followupWrapper}>
                                <Text style={styles.followupTitle}>Choose the related question</Text>
                                {msg.followup.map((question, qIndex) => {
                                  const followupKey = `${latestFollowupIndex}-${qIndex}`;

                                  return (
                                    <TouchableOpacity
                                      key={qIndex}
                                      style={styles.followupQuestion}
                                      activeOpacity={1}
                                      onPress={() => {
                                        // Mark ALL follow-ups from this message as used (hides the list)
                                        setUsedFollowups(prev => {
                                          const newSet = new Set(prev);
                                          msg.followup!.forEach((_, fIdx) => {
                                            newSet.add(`${latestFollowupIndex}-${fIdx}`);
                                          });
                                          return newSet;
                                        });
                                        // Send the selected follow-up question immediately
                                        sendMessage(question);
                                      }}
                                    >
                                      <Text style={styles.followupQuestionText}>Q{qIndex + 1}: {question}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            );
                          }
                        }
                        return null;
                      })()}

                      {isLoading && (
                        <View style={styles.botMessageContainer}>
                          <View style={[styles.messageBubble, styles.botMessage]}>
                            <ActivityIndicator size="small" />
                            <Text style={[styles.messageText, styles.messageTextBot]}> Thinking...</Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                />

                {/* Input row */}
                <View style={styles.inputContainer} onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}>
                  <View style={[styles.inputWrapper, inputFocused && styles.inputFocus]}>
                    <TextInput
                      ref={textInputRef}
                      style={styles.input}
                      placeholder="Type your question"
                      placeholderTextColor="#999"
                      value={input}
                      onChangeText={(v) => { setInput(v); if (isCoolingDown) setQueuedMessage(v); }}
                      onFocus={() => { setInputFocused(true); setOpenOptionsId(null); }}
                      onBlur={() => setInputFocused(false)}
                      onSubmitEditing={() => void sendMessage()}
                      editable={!isLoading && !isCoolingDown}
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, (!String(input || '').trim() || isLoading || isCoolingDown) && styles.sendButtonDisabled]}
                      onPress={() => void sendMessage()}
                      disabled={!String(input || '').trim() || isLoading || isCoolingDown}
                      activeOpacity={1}
                    >
                      <Text style={styles.sendButtonText}>{isLoading ? '...' : 'Send'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Custom Scrollbar */}
                {contentHeight > listHeight && (
                  <Animated.View
                    ref={trackRef}
                    {...panResponder.panHandlers}
                    onLayout={() => {
                      trackRef.current?.measureInWindow((x, y) => {
                        setTrackTop(y); // ✅ absolute screen Y
                      });
                    }}

                    style={[
                      styles.scrollbarTrack,
                      {
                        opacity: scrollbarOpacity,
                        bottom: inputHeight + insets.bottom + 8,
                      },
                    ]}
                  >

                    <Animated.View
                      style={[
                        styles.scrollbarThumb,
                        {
                          height: Math.max(30, thumbHeight),
                          transform: [{ translateY: thumbPosition }],
                        }
                      ]}
                    />
                  </Animated.View>
                )}

              </View>
            </KeyboardAvoidingView>
          </View>

          {/* Delete modal */}
          <Modal visible={confirmDelete.open} transparent animationType="fade" onRequestClose={() => setConfirmDelete({ open: false, chatId: null, title: '' })}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setConfirmDelete({ open: false, chatId: null, title: '' })}
            >
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Delete Chat?</Text>
                  <Text style={styles.modalText}>Are you sure you want to delete <Text style={styles.modalTextBold}>"{confirmDelete.title}"</Text>? This action cannot be undone.</Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalBtnSecondary}
                      onPress={() => setConfirmDelete({ open: false, chatId: null, title: '' })}
                      activeOpacity={1}
                    >
                      <Text style={styles.modalBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalBtnPrimary}
                      onPress={() => {
                        if (confirmDelete.chatId) {
                          void deleteChat(confirmDelete.chatId);
                          setConfirmDelete({ open: false, chatId: null, title: '' });
                        }
                      }}
                      activeOpacity={1}
                    >
                      <Text style={styles.modalBtnTextPrimary}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </ImageBackground>
  );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeAreaContainer: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row-reverse' },
  sidebar: { width: 280, backgroundColor: '#fff', padding: 16, borderLeftWidth: 1, borderLeftColor: '#e2e8f0', zIndex: 100, elevation: 10, overflow: 'visible', flex: 1, minHeight: 0 },
  sidebarMobile: { position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 100, elevation: 10 },
  sidebarClosed: { width: 0, padding: 0, overflow: 'hidden' },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sidebarTitle: { fontSize: 16, color: '#111827', fontFamily: 'PlusJakartaSans-Medium' },
  toggleBtn: {
    flexDirection: 'row',
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center', // Vertically center icon and text
    justifyContent: 'center', // Horizontally center content
  },
  toggleBtnText: {
    color: '#fff',
    marginLeft: 4, // Space between icon and text
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20, // Better line height for alignment
  },
  sidebarButtons: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sidebarButton: { backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  sidebarButtonDisabled: { backgroundColor: '#d1d5db', opacity: 0.6 },
  sidebarButtonText: { color: '#fff', fontFamily: 'PlusJakartaSans-Medium' },
  sidebarButtonTextDisabled: { color: '#9ca3af', fontFamily: 'PlusJakartaSans-Medium' },
  chatsSectionTitle: { fontSize: 12, textTransform: 'uppercase', marginVertical: 8, color: '#374151', fontFamily: 'PlusJakartaSans-Medium' },
  savedChatRow: { position: 'relative', marginBottom: 16, minHeight: 48, overflow: 'visible', zIndex: 1 },
  savedChatRowActive: { zIndex: 5000, marginBottom: 80 },
  chatListItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingRight: 50 },
  chatListItemText: { fontSize: 14, fontFamily: 'PlusJakartaSans-Medium', color: '#000000' },
  chatListItemActive: { backgroundColor: '#f3f4f6' },
  optionsBtn: { position: 'absolute', right: 8, top: 8, zIndex: 100, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  optionsMenu: { position: 'absolute', zIndex: 10000, right: 4, top: 44, backgroundColor: '#fff', borderRadius: 8, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, minWidth: 140, maxWidth: 200, overflow: 'hidden' },
  optionsMenuItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', minHeight: 48 },
  optionsMenuItemFirst: { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  optionsMenuItemLast: { borderBottomWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  optionsMenuItemText: { fontSize: 14, lineHeight: 20, fontFamily: 'PlusJakartaSans-Medium', color: '#000000' },
  emptyListText: { padding: 10, color: '#64748b', fontFamily: 'PlusJakartaSans-Medium' },
  mainContent: { flex: 1 },
  contentWrapper: {
    flex: 1,
    padding: 16,
    minHeight: 0, // Important for proper flex behavior
    justifyContent: 'space-between', // Push input to bottom
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 32,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  headerRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 32,
  },
  hamburgerButton: {
    padding: 4,
  },
  saveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  saveStatusText: {
    fontSize: 12,
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  chatWindow: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    minHeight: 0, // Important for ScrollView to work properly
  },
  chatContentContainer: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingRight: 28,
  },
  emptyState: { textAlign: 'center', color: '#64748b', marginTop: 80, fontFamily: 'PlusJakartaSans-Medium' },
  messageContainer: { marginVertical: 16, flexDirection: 'row' },
  userMessageContainer: { justifyContent: 'flex-end' },
  botMessageContainer: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, borderRadius: 18, paddingVertical: 10 },
  userMessage: { backgroundColor: '#F97316', borderBottomRightRadius: 6 },
  botMessage: { backgroundColor: '#f5f5f2', borderBottomLeftRadius: 6 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#111827', fontFamily: 'PlusJakartaSans-Medium' },
  messageTextUser: { color: '#fff', fontFamily: 'PlusJakartaSans-Medium' },
  messageTextBot: { color: '#111827', fontFamily: 'PlusJakartaSans-Medium' },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#e5e7eb',
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingRight: 4,
  },
  inputFocus: { borderColor: '#F97316', borderWidth: 1 },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 12,
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Medium',
    backgroundColor: 'transparent',
  },
  sendButton: { backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, marginLeft: 4 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontFamily: 'PlusJakartaSans-Medium' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', elevation: 10 },
  modalTitle: { fontSize: 20, marginBottom: 12, fontFamily: 'PlusJakartaSans-Bold', color: '#111827' },
  modalText: { fontSize: 14, fontFamily: 'PlusJakartaSans-Regular', marginBottom: 16, color: '#374151', lineHeight: 20 },
  modalTextBold: { fontFamily: 'PlusJakartaSans-SemiBold', color: '#F97316' },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 16, fontFamily: 'PlusJakartaSans-Medium' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnSecondary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e5e7eb' },
  modalBtnText: { fontFamily: 'PlusJakartaSans-Medium', color: '#000000' },
  modalBtnPrimary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F97316' },
  modalBtnTextPrimary: { color: '#fff', fontFamily: 'PlusJakartaSans-Medium' },
  followupWrapper: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  followupTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  followupQuestion: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  followupQuestionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#F97316',
    lineHeight: 20,
  },
  // scrollbarTrack: {
  //   position: 'absolute',
  //   right: 2,
  //   top: 0,
  //   bottom: 12,
  //   width: 10,
  //   backgroundColor: 'transparent',
  //   zIndex: 1000,
  // },
  scrollbarTrack: {
    position: 'absolute',
    right: 4,    // ⬅ move inside border
    top: - 10,
    width: 8,
    zIndex: 1000,
  },

  // scrollbarThumb: {
  //   width: 6,
  //   backgroundColor: '#F97314',
  //   borderRadius: 3,
  //   right: 0,
  //   position: 'absolute',
  // },
  scrollbarThumb: {
    width: 4,
    backgroundColor: '#D3D3D3',
    borderRadius: 2,
    position: 'absolute',
  },

});

export default InterviewPrepPageRN;

