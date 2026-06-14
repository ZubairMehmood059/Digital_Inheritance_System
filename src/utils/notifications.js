export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

export function checkAndShowNotifications(items, type) {
  if (Notification.permission !== "granted") return;

  const todayStr = new Date().toISOString().split("T")[0];
  const shownKey = `notified_${type}_${todayStr}`;
  let shownIds = [];
  try {
    shownIds = JSON.parse(localStorage.getItem(shownKey) || "[]");
  } catch {
    shownIds = [];
  }

  const now = new Date();
  
  items.forEach(item => {
    // Skip if no due date, or if it is paid/settled
    if (!item.dueDate || item.status === "paid" || item.settled === true) return;
    
    // Skip if we already showed a notification for this item today
    if (shownIds.includes(item.id)) return;

    const due = new Date(item.dueDate);
    const diffMs = due - now;
    const daysUntilDue = Math.ceil(diffMs / 86400000);

    // If due today or overdue
    if (daysUntilDue <= 0) {
      const isOverdue = daysUntilDue < 0;
      const title = type === "bill" 
        ? `${isOverdue ? "Overdue" : "Due Today"}: ${item.provider} Bill` 
        : `${isOverdue ? "Overdue" : "Due Today"}: Udhaar from ${item.name}`;
      
      const body = `Amount: PKR ${item.amount}\nDue Date: ${item.dueDate}`;
      
      new Notification(title, {
        body,
        icon: "/vite.svg" // You can replace with an actual icon path later
      });

      shownIds.push(item.id);
    }
  });

  localStorage.setItem(shownKey, JSON.stringify(shownIds));
}
