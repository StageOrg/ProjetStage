import { useEffect, useState } from "react";
import NotificationService from "@/services/notificationService";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // 🔄 Récupération des notifications
  useEffect(() => {
    console.log("Fetching notifications...");
    NotificationService.getNotifications()
      .then(data => {
        console.log("Notifications reçues:", data);
        setNotifications(data);
      })
      .catch(err => console.error("Erreur notifications:", err));
  }, []);

  // 🔄 Récupération du nombre de notifications non lues
  useEffect(() => {
    console.log("Fetching unread count...");
    NotificationService.getUnreadNotificationCount()
      .then(data => {
        console.log("Unread count reçu:", data);
        setUnreadCount(data.unread_count);
      })
      .catch(err => {
        console.error("Erreur récupération nombre non lus:", err);
        setUnreadCount(0);
      });
  }, []);

  // ✅ Marquer une notification comme lue
  const markAsRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      setUnreadCount(prev => (prev > 0 ? prev - 1 : 0)); 
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  return (
    <div style={styles.container}>
      {/* 🔔 Icone */}
      <div style={styles.bellWrapper} onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </div>

      {/* 📜 Liste déroulante */}
      {open && (
        <div style={styles.dropdown}>
          {notifications.length === 0 ? (
            <p style={styles.empty}>Aucune notification</p>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  ...styles.notification,
                  backgroundColor: notif.is_read ? "#f1f1f1" : "#e6f0ff",
                }}
              >
                <p style={styles.message}>{notif.message}</p>
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    style={styles.readBtn}
                  >
                    ✅ Marquer comme lue
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ✅ Styles intégrés
const styles = {
  container: { 
    position: "relative", 
    display: "inline-block" 
  },
  bellWrapper: { 
    cursor: "pointer", 
    position: "relative", 
    fontSize: 24 
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    color: "white",
    borderRadius: "50%",
    padding: "3px 7px",
    fontSize: 12,
    fontWeight: "bold",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "100%",
    marginTop: 10,
    width: 300,
    maxHeight: 400,
    overflowY: "auto",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    borderRadius: 6,
    zIndex: 1000,
  },
  notification: {
    padding: "12px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  message: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.4,
  },
  readBtn: {
    alignSelf: "flex-start",
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: 4,
  },
  empty: { 
    padding: 20, 
    textAlign: "center", 
    color: "#888" 
  },
};