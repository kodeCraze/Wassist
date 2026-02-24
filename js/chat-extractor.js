// WhatsApp Chat Extractor using WPP API
class ChatExtractor {
  constructor() {
    this.allChats = [];
    this.activeChat = null;
    this.isReady = false;
    this.init();
  }

  // Initialize and wait for WPP to be ready
  async init() {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    const checkWPP = () => {
      attempts++;
      if (window.WPP && window.WPP.chat && window.WPP.chat.list) {
        this.isReady = true;
        console.log('✅ ChatExtractor ready');
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkWPP, 1000);
      } else {
        console.error('❌ ChatExtractor failed to initialize - WPP not available');
      }
    };
    
    checkWPP();
  }

  // Wait for WPP to be ready
  async waitForReady() {
    let attempts = 0;
    while (!this.isReady && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!this.isReady) {
      throw new Error('WPP not available after waiting');
    }
  }

  // Get all chats from WhatsApp
  async getAllChats() {
    try {
      await this.waitForReady();

      const chats = await window.WPP.chat.list();
      
      this.allChats = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.contact?.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount || 0,
        phone: chat.id.user, // Phone number without country code
        fullId: chat.id._serialized
      }));

      return this.allChats;
    } catch (error) {
      console.error('Error getting all chats:', error);
      return [];
    }
  }

  // Get currently active/selected chat
  async getActiveChat() {
    try {
      await this.waitForReady();

      // getActiveChat returns directly, not a promise
      const activeChat = window.WPP.chat.getActiveChat();
      
      if (activeChat) {
        this.activeChat = {
          id: activeChat.id._serialized,
          name: activeChat.name || activeChat.contact?.name || activeChat.id.user || 'Unknown',
          isGroup: activeChat.isGroup,
          phone: activeChat.id.user,
          fullId: activeChat.id._serialized
        };
      }

      return this.activeChat;
    } catch (error) {
      console.error('Error getting active chat:', error);
      return null;
    }
  }

  // Get selected and non-selected chat arrays
  async getChatArrays() {
    try {
      // Get all chats
      const allChats = await this.getAllChats();
      
      // Get active chat
      const activeChat = await this.getActiveChat();
      
      // Separate selected and non-selected
      const selectedChats = activeChat ? [activeChat] : [];
      const nonSelectedChats = allChats.filter(chat => 
        !activeChat || chat.id !== activeChat.id
      );

      return {
        selected: selectedChats,
        nonSelected: nonSelectedChats,
        total: allChats.length,
        activeChat: activeChat
      };
    } catch (error) {
      console.error('Error getting chat arrays:', error);
      return {
        selected: [],
        nonSelected: [],
        total: 0,
        activeChat: null
      };
    }
  }

  // Filter chats by type
  filterChats(chats, options = {}) {
    let filtered = [...chats];

    if (options.groupsOnly) {
      filtered = filtered.filter(chat => chat.isGroup);
    }

    if (options.contactsOnly) {
      filtered = filtered.filter(chat => !chat.isGroup);
    }

    if (options.unreadOnly) {
      filtered = filtered.filter(chat => chat.unreadCount > 0);
    }

    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.name.toLowerCase().includes(term) ||
        chat.phone.includes(term)
      );
    }

    return filtered;
  }
}

// Initialize chat extractor immediately
window.chatExtractor = new ChatExtractor();
console.log('💬 ChatExtractor script loaded');

// Also create a simple function for direct testing
window.testChatExtraction = async function() {
  try {
    if (!window.WPP || !window.WPP.chat) {
      return { error: 'WPP not available' };
    }
    
    const chats = await window.WPP.chat.list();
    const activeChat = window.WPP.chat.getActiveChat();
    
    return {
      totalChats: chats.length,
      activeChat: activeChat ? {
        id: activeChat.id._serialized,
        name: activeChat.name || 'Unknown'
      } : null,
      firstFewChats: chats.slice(0, 3).map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.contact?.name || 'Unknown',
        isGroup: chat.isGroup
      }))
    };
  } catch (error) {
    return { error: error.message };
  }
};