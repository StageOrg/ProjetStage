import api from "./api";

const NotificationService = {
    // Envoie une notification à un utilisateur spécifique
    sendNotification: async ({userId, message}) => {
    try {
      const response = await api.post('/notifications/send-notification/', {
        user_id: userId,    
        message
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
      throw error;
    }
  },
  // Récupère les notifications de l'utilisateur connecté
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications/mes-notifications/');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      throw error;
    }
  }, 
  getUnreadNotificationCount: async () => {
    try {
        const response = await api.get('/notifications/unread-count/');
        console.log("Unread count response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre de notifications non lues:", error);
        throw error;
    }
 },
    // Marque une notification comme lue
    markAsRead: async (id) => {
        try {
            await api.post(`/notifications/mark-as-read/${id}/`);
        } catch (error) {
            console.error("Erreur lors du marquage comme lu:", error);
            throw error;
        }
    },
    // Marque toutes les notifications comme lues
    markAllAsRead: async () => {
        try {
            await api.post('/notifications/mark-all-as-read/');
        } catch (error) {
            console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
            throw error;
        }
    },

};

export default NotificationService;

