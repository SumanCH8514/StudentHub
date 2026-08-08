import { messaging } from "../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

class NotificationService {
  constructor() {
    this.tokensStored = false;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return null;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return await this.getToken();
      } else {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  async getToken() {
    if (!messaging) {
      console.warn('Messaging is not initialized or supported.');
      return null;
    }
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // VAPID key is required for web push
      });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // In a real app, you'd send this token to your server
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return null;
    }
  }

  // Local notification for immediate feedback or class reminders
  showLocalNotification(title, body, options = {}) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const defaultOptions = {
        body: body,
        icon: '/fav.png',
        badge: '/fav.png',
        ...options
      };
      
      // If the app is in background, the service worker will handle this.
      // For foreground, we can trigger it manually.
      try {
        new Notification(title, defaultOptions);
      } catch (e) {
        // Fallback for Android Chrome where new Notification() throws an Illegal Constructor error
        if (e.name === 'TypeError' || e.message.includes('Illegal constructor')) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, defaultOptions);
            });
          }
        }
      }
    }
  }

  // Helper to schedule a notification for a specific time
  scheduleNotification(title, body, scheduledTime, id) {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      console.log(`Scheduling notification "${title}" in ${Math.round(delay/1000/60)} minutes (ID: ${id})`);
      
      const timeoutId = setTimeout(() => {
        this.showLocalNotification(title, body, { tag: id });
      }, delay);
      
      return timeoutId;
    }
    return null;
  }
}

export const notificationService = new NotificationService();
