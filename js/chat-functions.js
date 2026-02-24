(function() {
    'use strict';
    
    window.getChatArrays = async function() {
        const waitForWPP = async () => {
            for (let i = 0; i < 30; i++) {
                if (window.WPP?.chat?.list && window.WPP?.chat?.getActiveChat) return true;
                await new Promise(r => setTimeout(r, 1000));
            }
            return false; // Don't throw, return false
        };
        
        const wppReady = await waitForWPP();
        if (!wppReady) {
            return {
                selected: [],
                nonSelected: [],
                total: 0,
                activeChat: null,
                error: 'WPP not available'
            };
        }
        
        try {
            const allChats = await window.WPP.chat.list();
            const activeChat = window.WPP.chat.getActiveChat(); // This can be null
            
            const processedChats = allChats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name || chat.contact?.name || chat.id.user || 'Unknown',
                isGroup: chat.id?.toString().includes('@g.us'),
                unreadCount: chat.unreadCount || 0,
                phone: chat.id.user
            }));
            
            const processedActiveChat = activeChat ? {
                id: activeChat.id._serialized,
                name: activeChat.name || activeChat.contact?.name || activeChat.id.user || 'Unknown',
                isGroup: activeChat.id?.toString().includes('@g.us'),
                phone: activeChat.id.user
            } : null;
            
            const selectedChats = processedActiveChat ? [processedActiveChat] : [];
            const nonSelectedChats = processedChats.filter(chat => 
                !processedActiveChat || chat.id !== processedActiveChat.id
            );
            
            return {
                selected: selectedChats,
                nonSelected: nonSelectedChats,
                total: processedChats.length,
                activeChat: processedActiveChat // This can be null and that's OK
            };
        } catch (error) {
            console.debug('Error in getChatArrays (this is normal if no chat selected):', error.message);
            return {
                selected: [],
                nonSelected: [],
                total: 0,
                activeChat: null,
                error: error.message
            };
        }
    };
    
    window.getSelectedChatMessages = async function(count = 5) {
        try {
            const activeChat = window.WPP.chat.getActiveChat();
            if (!activeChat) {
                return []; // Return empty array instead of throwing
            }

            // Get limited messages to prevent token overflow (max 10 messages)
            const messages = await window.WPP.chat.getMessages(activeChat.id, { count: Math.min(count * 2, 10) });
            
            // Filter and process messages
            const textMessages = messages
                .filter(msg => {
                    // Include text messages and media with captions
                    return (msg.body && msg.body.trim() !== '') || 
                           (msg.caption && msg.caption.trim() !== '');
                })
                .slice(-count)
                .map(msg => ({
                    id: msg.id._serialized,
                    sender: msg.fromMe ? 'me' : 'contact',
                    message: msg.body || msg.caption || '[Media]',
                    timestamp: msg.t,
                    type: msg.type,
                    isMedia: !msg.body && msg.caption,
                    hasText: !!(msg.body && msg.body.trim()) || !!(msg.caption && msg.caption.trim())
                }));
            
            // Sort by timestamp to ensure correct order (newest last)
            return textMessages.sort((a, b) => a.timestamp - b.timestamp);
        } catch (error) {
            console.debug('No active chat - this is normal:', error.message);
            return []; // Return empty array on any error
        }
    };
    

    

    
    window.testChatExtraction = async function() {
        try {
            return await window.getChatArrays();
        } catch (error) {
            return { error: error.message };
        }
    };
    

    
    // Message handler for communication
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'GET_CHAT_DATA') {
            try {
                const data = await window.getChatArrays();
                window.postMessage({ type: 'CHAT_DATA_RESPONSE', data }, '*');
            } catch (error) {
                window.postMessage({ type: 'CHAT_DATA_ERROR', error: error.message }, '*');
            }
        }
        
        if (event.data.type === 'AI_API_RESPONSE') {
            // Forward AI API response back to the requesting function
            window.postMessage(event.data, '*');
        }
        
        if (event.data.type === 'SEND_MESSAGE_TO_CHAT') {
            try {
                const chatId = event.data.chatId;
                const message = event.data.message;
                
                // Send message using WPP
                const result = await window.WPP.chat.sendTextMessage(chatId._serialized, message);
                
                
                // Track sent message to prevent loop
                if (result?.id?._serialized) {
                    window.extensionSentMessages.add(result.id._serialized);
                    // Clean up after 5 seconds
                    setTimeout(() => {
                        window.extensionSentMessages.delete(result.id._serialized);
                    }, 5000);
                }
                
                // window.postMessage({ 
                //     type: 'SEND_MESSAGE_RESULT', 
                //     success: true 
                // }, '*');
            } catch (error) {
                console.error('❌ Failed to send message:', error);
                // window.postMessage({ 
                //     type: 'SEND_MESSAGE_RESULT', 
                //     success: false, 
                //     error: error.message 
                // }, '*');
            }
        }
        
        if (event.data.type === 'EXECUTE_SCRIPT') {
            try {
                let result;
                
                // Handle specific function calls without eval
                switch (event.data.script) {

                    case 'window.testChatExtraction()':
                        result = await window.testChatExtraction();
                        break;
                    case 'window.getSelectedChatMessages(10)':
                        result = await window.getSelectedChatMessages(10);
                        break;
                    default:
                        throw new Error('Function not supported: ' + event.data.script);
                }
                
                window.postMessage({ type: 'SCRIPT_RESULT', success: true, data: result }, '*');
            } catch (error) {
                window.postMessage({ type: 'SCRIPT_RESULT', success: false, error: error.message }, '*');
            }
        }
    });
    
    // Track messages sent by extension to prevent loop
    window.extensionSentMessages = new Set();
    

    
    console.log('💬 Chat functions loaded from external file');
})();

// (function() {
//     'use strict';
    
//     // ============ CONFIGURATION ============
//     const CONFIG = {
//         MAX_SENT_MESSAGES: 50,
//         MESSAGE_CLEANUP_TIME: 5000,
//         RATE_LIMIT_TOKENS: 10,
//         RATE_LIMIT_REFILL_MS: 6000,
//         MAX_WORKERS: 3,
//         API_TIMEOUT: 10000,
//         CIRCUIT_BREAKER_THRESHOLD: 5,
//         CIRCUIT_BREAKER_TIMEOUT: 30000,
//         RESPONSE_CACHE_SIZE: 100,
//         RESPONSE_CACHE_TTL: 300000
//     };
    
//     // ============ LRU CACHE ============
//     class LRUCache {
//         constructor(maxSize) {
//             this.maxSize = maxSize;
//             this.cache = new Map();
//         }
        
//         get(key) {
//             if (!this.cache.has(key)) return null;
//             const value = this.cache.get(key);
//             this.cache.delete(key);
//             this.cache.set(key, value);
//             return value;
//         }
        
//         set(key, value) {
//             if (this.cache.has(key)) this.cache.delete(key);
//             else if (this.cache.size >= this.maxSize) {
//                 const firstKey = this.cache.keys().next().value;
//                 this.cache.delete(firstKey);
//             }
//             this.cache.set(key, value);
//         }
        
//         has(key) {
//             return this.cache.has(key);
//         }
        
//         delete(key) {
//             this.cache.delete(key);
//         }
//     }
    
//     // ============ RATE LIMITER (Token Bucket) ============
//     class RateLimiter {
//         constructor(tokens, refillMs) {
//             this.maxTokens = tokens;
//             this.tokens = tokens;
//             this.refillMs = refillMs;
//             this.lastRefill = Date.now();
//         }
        
//         tryConsume() {
//             this.refill();
//             if (this.tokens > 0) {
//                 this.tokens--;
//                 return true;
//             }
//             return false;
//         }
        
//         refill() {
//             const now = Date.now();
//             const timePassed = now - this.lastRefill;
//             const tokensToAdd = Math.floor(timePassed / this.refillMs);
//             if (tokensToAdd > 0) {
//                 this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
//                 this.lastRefill = now;
//             }
//         }
//     }
    
//     // ============ CIRCUIT BREAKER ============
//     class CircuitBreaker {
//         constructor(threshold, timeout) {
//             this.threshold = threshold;
//             this.timeout = timeout;
//             this.failures = 0;
//             this.state = 'CLOSED';
//             this.nextAttempt = 0;
//         }
        
//         async execute(fn) {
//             if (this.state === 'OPEN') {
//                 if (Date.now() < this.nextAttempt) {
//                     throw new Error('Circuit breaker is OPEN');
//                 }
//                 this.state = 'HALF_OPEN';
//             }
            
//             try {
//                 const result = await fn();
//                 this.onSuccess();
//                 return result;
//             } catch (error) {
//                 this.onFailure();
//                 throw error;
//             }
//         }
        
//         onSuccess() {
//             this.failures = 0;
//             this.state = 'CLOSED';
//         }
        
//         onFailure() {
//             this.failures++;
//             if (this.failures >= this.threshold) {
//                 this.state = 'OPEN';
//                 this.nextAttempt = Date.now() + this.timeout;
//             }
//         }
//     }
    
//     // ============ MESSAGE QUEUE ============
//     class MessageQueue {
//         constructor(maxWorkers) {
//             this.queue = [];
//             this.processing = new Set();
//             this.maxWorkers = maxWorkers;
//         }
        
//         async enqueue(task) {
//             return new Promise((resolve, reject) => {
//                 this.queue.push({ task, resolve, reject });
//                 this.process();
//             });
//         }
        
//         async process() {
//             if (this.processing.size >= this.maxWorkers || this.queue.length === 0) return;
            
//             const { task, resolve, reject } = this.queue.shift();
//             const taskId = Date.now() + Math.random();
//             this.processing.add(taskId);
            
//             try {
//                 const result = await task();
//                 resolve(result);
//             } catch (error) {
//                 reject(error);
//             } finally {
//                 this.processing.delete(taskId);
//                 this.process();
//             }
//         }
//     }
    
//     // ============ INITIALIZE SYSTEMS ============
//     window.extensionSentMessages = new LRUCache(CONFIG.MAX_SENT_MESSAGES);
//     window.responseCache = new LRUCache(CONFIG.RESPONSE_CACHE_SIZE);
//     window.rateLimiter = new RateLimiter(CONFIG.RATE_LIMIT_TOKENS, CONFIG.RATE_LIMIT_REFILL_MS);
//     window.circuitBreaker = new CircuitBreaker(CONFIG.CIRCUIT_BREAKER_THRESHOLD, CONFIG.CIRCUIT_BREAKER_TIMEOUT);
//     window.messageQueue = new MessageQueue(CONFIG.MAX_WORKERS);
//     window.activeRequests = new Map();
    
//     // ============ UTILITY FUNCTIONS ============
//     function generateUUID() {
//         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
//             const r = Math.random() * 16 | 0;
//             const v = c === 'x' ? r : (r & 0x3 | 0x8);
//             return v.toString(16);
//         });
//     }
    
//     function hashMessage(message) {
//         let hash = 0;
//         for (let i = 0; i < message.length; i++) {
//             const char = message.charCodeAt(i);
//             hash = ((hash << 5) - hash) + char;
//             hash = hash & hash;
//         }
//         return hash.toString();
//     }
    
//     // ============ CORE FUNCTIONS ============
//     window.getChatArrays = async function() {
//         const waitForWPP = async () => {
//             for (let i = 0; i < 30; i++) {
//                 if (window.WPP?.chat?.list && window.WPP?.chat?.getActiveChat) return true;
//                 await new Promise(r => setTimeout(r, 1000));
//             }
//             return false;
//         };
        
//         const wppReady = await waitForWPP();
//         if (!wppReady) {
//             return {
//                 selected: [],
//                 nonSelected: [],
//                 total: 0,
//                 activeChat: null,
//                 error: 'WPP not available'
//             };
//         }
        
//         try {
//             const allChats = await window.WPP.chat.list();
//             const activeChat = window.WPP.chat.getActiveChat();
            
//             const processedChats = allChats.map(chat => ({
//                 id: chat.id._serialized,
//                 name: chat.name || chat.contact?.name || chat.id.user || 'Unknown',
//                 isGroup: chat.isGroup,
//                 unreadCount: chat.unreadCount || 0,
//                 phone: chat.id.user
//             }));
            
//             const processedActiveChat = activeChat ? {
//                 id: activeChat.id._serialized,
//                 name: activeChat.name || activeChat.contact?.name || activeChat.id.user || 'Unknown',
//                 isGroup: activeChat.isGroup,
//                 phone: activeChat.id.user
//             } : null;
            
//             const selectedChats = processedActiveChat ? [processedActiveChat] : [];
//             const nonSelectedChats = processedChats.filter(chat => 
//                 !processedActiveChat || chat.id !== processedActiveChat.id
//             );
            
//             return {
//                 selected: selectedChats,
//                 nonSelected: nonSelectedChats,
//                 total: processedChats.length,
//                 activeChat: processedActiveChat
//             };
//         } catch (error) {
//             console.debug('Error in getChatArrays:', error.message);
//             return {
//                 selected: [],
//                 nonSelected: [],
//                 total: 0,
//                 activeChat: null,
//                 error: error.message
//             };
//         }
//     };
    
//     window.getSelectedChatMessages = async function(count = 5) {
//         try {
//             const activeChat = window.WPP.chat.getActiveChat();
//             if (!activeChat) return [];

//             const messages = await window.WPP.chat.getMessages(activeChat.id, { count: Math.min(count * 2, 10) });
            
//             const textMessages = messages
//                 .filter(msg => (msg.body && msg.body.trim() !== '') || (msg.caption && msg.caption.trim() !== ''))
//                 .slice(-count)
//                 .map(msg => ({
//                     id: msg.id._serialized,
//                     sender: msg.fromMe ? 'me' : 'contact',
//                     message: msg.body || msg.caption || '[Media]',
//                     timestamp: msg.t,
//                     type: msg.type,
//                     isMedia: !msg.body && msg.caption,
//                     hasText: !!(msg.body && msg.body.trim()) || !!(msg.caption && msg.caption.trim())
//                 }));
            
//             return textMessages.sort((a, b) => a.timestamp - b.timestamp);
//         } catch (error) {
//             console.debug('No active chat:', error.message);
//             return [];
//         }
//     };
    
//     window.formatConversationForAI = function(messages, chatInfo) {
//         const formattedMessages = messages.map(msg => ({
//             sender: msg.sender,
//             text: msg.message || msg.text,
//             message: msg.message || msg.text,
//             timestamp: new Date(msg.timestamp * 1000).toISOString()
//         }));
        
//         return {
//             conversation: formattedMessages,
//             chatType: chatInfo?.isGroup ? 'group' : 'individual',
//             contactName: chatInfo?.name || 'Unknown',
//             lastMessage: {
//                 text: messages[messages.length - 1]?.message || messages[messages.length - 1]?.text || '',
//                 sender: messages[messages.length - 1]?.sender || 'contact'
//             },
//             messageCount: messages.length
//         };
//     };
    
//     window.getAIResponse = async function(conversation) {
//         // Check cache first
//         const cacheKey = hashMessage(JSON.stringify(conversation.conversation));
//         const cached = window.responseCache.get(cacheKey);
//         if (cached && Date.now() - cached.timestamp < CONFIG.RESPONSE_CACHE_TTL) {
//             console.log('✅ Using cached response');
//             return cached.data;
//         }
        
//         // Check rate limit
//         if (!window.rateLimiter.tryConsume()) {
//             throw new Error('Rate limit exceeded. Please wait a moment.');
//         }
        
//         // Use circuit breaker
//         return await window.circuitBreaker.execute(async () => {
//             const response = await new Promise((resolve, reject) => {
//                 const messageId = generateUUID();
                
//                 // Check for duplicate request
//                 if (window.activeRequests.has(cacheKey)) {
//                     return window.activeRequests.get(cacheKey).then(resolve).catch(reject);
//                 }
                
//                 const requestPromise = new Promise((res, rej) => {
//                     const messageHandler = (event) => {
//                         if (event.data.type === 'AI_API_RESPONSE' && event.data.messageId === messageId) {
//                             window.removeEventListener('message', messageHandler);
//                             window.activeRequests.delete(cacheKey);
//                             if (event.data.success) {
//                                 res(event.data.response);
//                             } else {
//                                 rej(new Error(event.data.error || 'Unknown AI API error'));
//                             }
//                         }
//                     };
                    
//                     window.addEventListener('message', messageHandler);
                    
//                     window.postMessage({
//                         type: 'AI_API_REQUEST',
//                         messageId,
//                         payload: {
//                             conversation: conversation.conversation,
//                             chatType: conversation.chatType,
//                             contactName: conversation.contactName
//                         }
//                     }, '*');
                    
//                     setTimeout(() => {
//                         window.removeEventListener('message', messageHandler);
//                         window.activeRequests.delete(cacheKey);
//                         rej(new Error('AI API request timeout'));
//                     }, CONFIG.API_TIMEOUT);
//                 });
                
//                 window.activeRequests.set(cacheKey, requestPromise);
//                 requestPromise.then(resolve).catch(reject);
//             });
            
//             const result = {
//                 replies: response.replies || [],
//                 bestReply: response.bestReply || response.replies?.[0] || ''
//             };
            
//             // Cache the response
//             window.responseCache.set(cacheKey, {
//                 data: result,
//                 timestamp: Date.now()
//             });
            
//             return result;
//         });
//     };
    
//     window.generateSmartReply = async function() {
//         try {
//             if (!window.WPP?.chat?.getActiveChat) {
//                 return { 
//                     success: false, 
//                     code: 'WPP_NOT_READY', 
//                     message: 'WhatsApp is still loading. Please wait and try again.' 
//                 };
//             }

//             const chatArrays = await window.getChatArrays();
//             if (!chatArrays.activeChat) {
//                 return { 
//                     success: false, 
//                     code: 'NO_CHAT', 
//                     message: 'Please open any chat to use Smart Reply.' 
//                 };
//             }

//             const messages = await window.getSelectedChatMessages(5);
//             if (messages.length === 0) {
//                 return { 
//                     success: false, 
//                     code: 'NO_MESSAGES', 
//                     message: 'No recent text messages in this chat.' 
//                 };
//             }
            
//             const lastMessage = messages[messages.length - 1];
//             const conversation = window.formatConversationForAI(messages, chatArrays.activeChat);
//             const aiResponse = await window.getAIResponse(conversation);
            
//             return {
//                 success: true,
//                 messages,
//                 lastMessage,
//                 conversation,
//                 aiResponse,
//                 chatInfo: chatArrays.activeChat
//             };
//         } catch (error) {
//             console.error('Error generating smart reply:', error);
//             return { 
//                 success: false, 
//                 code: 'UNEXPECTED', 
//                 message: error.message || 'An unexpected error occurred.' 
//                 };
//         }
//     };
    
//     window.testChatExtraction = async function() {
//         try {
//             return await window.getChatArrays();
//         } catch (error) {
//             return { error: error.message };
//         }
//     };
    
//     window.isAutoModeEnabled = async function() {
//         return new Promise((resolve) => {
//             const handler = (event) => {
//                 if (event.data.type === 'AUTO_MODE_STATUS') {
//                     window.removeEventListener('message', handler);
//                     resolve(event.data.enabled);
//                 }
//             };
//             window.addEventListener('message', handler);
//             window.postMessage({ type: 'CHECK_AUTO_MODE' }, '*');
//             setTimeout(() => {
//                 window.removeEventListener('message', handler);
//                 resolve(false);
//             }, 1000);
//         });
//     };
    
//     // ============ MESSAGE HANDLER ============
//     window.addEventListener('message', async (event) => {
//         if (event.source !== window) return;
        
//         if (event.data.type === 'GET_CHAT_DATA') {
//             try {
//                 const data = await window.getChatArrays();
//                 window.postMessage({ type: 'CHAT_DATA_RESPONSE', data }, '*');
//             } catch (error) {
//                 window.postMessage({ type: 'CHAT_DATA_ERROR', error: error.message }, '*');
//             }
//         }
        
//         if (event.data.type === 'AI_API_RESPONSE') {
//             window.postMessage(event.data, '*');
//         }
        
//         if (event.data.type === 'SEND_MESSAGE_TO_CHAT') {
//             try {
//                 const chatId = event.data.chatId;
//                 const message = event.data.message;
                
//                 // Show typing indicator
//                 await window.WPP.chat.sendPresenceAvailable();
//                 await window.WPP.chat.sendPresenceComposing(chatId);
                
//                 // Wait 1-3 seconds (simulate typing)
//                 await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                
//                 // Send message
//                 const result = await window.WPP.chat.sendTextMessage(chatId, message);
                
//                 // Stop typing indicator
//                 await window.WPP.chat.sendPresencePaused(chatId);
                
//                 // Track sent message
//                 if (result?.id?._serialized) {
//                     window.extensionSentMessages.set(result.id._serialized, Date.now());
//                 }
                
//                 window.postMessage({ 
//                     type: 'SEND_MESSAGE_RESULT', 
//                     success: true 
//                 }, '*');
//             } catch (error) {
//                 console.error('❌ Failed to send message:', error);
//                 window.postMessage({ 
//                     type: 'SEND_MESSAGE_RESULT', 
//                     success: false, 
//                     error: error.message 
//                 }, '*');
//             }
//         }
        
//         if (event.data.type === 'EXECUTE_SCRIPT') {
//             try {
//                 let result;
                
//                 switch (event.data.script) {
//                     case 'window.generateSmartReply()':
//                         result = await window.generateSmartReply();
//                         break;
//                     case 'typeof window.generateSmartReply':
//                         result = typeof window.generateSmartReply;
//                         break;
//                     case 'window.testChatExtraction()':
//                         result = await window.testChatExtraction();
//                         break;
//                     case 'window.getSelectedChatMessages(10)':
//                         result = await window.getSelectedChatMessages(10);
//                         break;
//                     default:
//                         throw new Error('Function not supported: ' + event.data.script);
//                 }
                
//                 window.postMessage({ type: 'SCRIPT_RESULT', success: true, data: result }, '*');
//             } catch (error) {
//                 window.postMessage({ type: 'SCRIPT_RESULT', success: false, error: error.message }, '*');
//             }
//         }
//     });
    
//     // ============ MESSAGE LISTENER ============
//     (async () => {
//         for (let i = 0; i < 30; i++) {
//             if (window.WPP?.on) {
//                 window.WPP.on('chat.new_message', async (message) => {
//                     // Use message queue to prevent race conditions
//                     window.messageQueue.enqueue(async () => {
//                         try {
//                             const isFromMe = message.id?.fromMe || false;
                            
//                             if (isFromMe || window.extensionSentMessages.has(message.id?._serialized)) {
//                                 return;
//                             }
                            
//                             if (message.body && message.body.trim()) {
//                                 console.log('🤖 Processing incoming message...');
                                
//                                 const chat = await window.WPP.chat.get(message.from);
//                                 const chatInfo = {
//                                     id: chat.id._serialized,
//                                     name: chat.name || chat.contact?.name || chat.id.user || 'Unknown',
//                                     isGroup: chat.isGroup
//                                 };

//                                 const messages = [{
//                                     sender: 'contact',
//                                     message: message.body,
//                                     timestamp: message.t
//                                 }];

//                                 const conversation = window.formatConversationForAI(messages, chatInfo);
//                                 const aiResponse = await window.getAIResponse(conversation);
                                
//                                 const autoEnabled = await window.isAutoModeEnabled();
//                                 if (autoEnabled && aiResponse.bestReply) {
//                                     console.log('🚀 Auto mode ON - triggering auto-send');
//                                     window.postMessage({
//                                         type: 'TRIGGER_AUTO_SEND',
//                                         reply: aiResponse.bestReply,
//                                         chatId: message.from,
//                                         chatName: chatInfo.name
//                                     }, '*');
//                                 }
//                             }
//                         } catch (error) {
//                             console.error('Error processing message:', error);
//                         }
//                     });
//                 });
//                 console.log('✅ Message listener initialized with queue system');
//                 return;
//             }
//             await new Promise(r => setTimeout(r, 1000));
//         }
//         console.error('❌ WPP not available for message listener');
//     })();
    
//     console.log('💬 Chat functions loaded (IMPROVED VERSION)');
// })();
