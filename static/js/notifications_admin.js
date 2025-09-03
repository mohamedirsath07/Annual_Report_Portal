// Function to fetch notifications from the backend
function fetchNotifications() {
    fetch('/get_notifications')
        .then(response => response.json())
        .then(data => {
            const notificationList = document.getElementById('notificationList');
            notificationList.innerHTML = ''; // Clear existing notifications

            // Populate notifications dynamically
            if (data.notifications && data.notifications.length > 0) {
                data.notifications.forEach(notification => {
                    const notificationItem = document.createElement('li');
                    notificationItem.classList.add('notification', notification.status);

                    notificationItem.innerHTML = `
                        <div class="notification-header">
                            <strong>${notification.user_name}</strong> has submitted a form in <strong>${notification.category}</strong>
                        </div>
                        <div class="notification-body">
                            <p><em>Submitted Data:</em> ${notification.submitted_data}</p>
                            <p><small><em>Timestamp:</em> ${notification.timestamp}</small></p>
                        </div>
                        <div class="notification-footer">
                            <a href="/view_submission/${notification._id}">View Submission</a>
                        </div>
                    `;

                    notificationList.appendChild(notificationItem);
                });
            } else {
                notificationList.innerHTML = '<p>No new notifications.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
            const notificationList = document.getElementById('notificationList');
            notificationList.innerHTML = '<p>Failed to load notifications. Please try again later.</p>';
        });
}

// Function to clear all notifications
function clearAllNotifications() {
    const notificationList = document.getElementById('notificationList');
    const previousContent = notificationList.innerHTML;

    // Clear notifications visually
    notificationList.innerHTML = '<p>Clearing notifications...</p>';

    fetch('/clear_notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Notify success
        notificationList.innerHTML = '<p>All notifications cleared successfully.</p>';
    })
    .catch(error => {
        console.error('Error clearing notifications:', error);
        notificationList.innerHTML = previousContent; // Restore previous content
        alert('Failed to clear notifications. Please try again.');
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', fetchNotifications);

// Poll for new notifications every 30 seconds
setInterval(fetchNotifications, 30000);
