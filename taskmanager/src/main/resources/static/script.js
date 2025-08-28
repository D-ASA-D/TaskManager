const API_BASE = 'http://localhost:8080/api';
let currentUser = null;
let notificationCheckInterval;
let shownNotifications = new Set();

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        loadMyEvents();
    }

    document.getElementById('event-time').value = new Date().toISOString().slice(0, 16);
}

function setupEventListeners() {
    document.getElementById('login-form-element').addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });

    document.getElementById('register-form-element').addEventListener('submit', async (e) => {
        e.preventDefault();
        await register();
    });

    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createEvent();
    });

    document.getElementById('show-register').addEventListener('click', showRegister);
    document.getElementById('show-login').addEventListener('click', showLogin);
    document.getElementById('refresh-events').addEventListener('click', loadMyEvents);
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-message').innerHTML = '';
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('register-message').innerHTML = '';
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/users/username/${username}`);
        if (!response.ok) {
            throw new Error('Пользователь не найден');
        }

        const user = await response.json();

        if (user.password !== password) {
            throw new Error('Неверный пароль');
        }

        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showDashboard();
        showMessage('auth-message', 'Успешный вход!', 'success');

    } catch (error) {
        showMessage('auth-message', 'Ошибка: ' + error.message, 'error');
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
        showMessage('register-message', 'Пароли не совпадают', 'error');
        return;
    }

    const user = {
        username: username,
        password: password
    };

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            showMessage('register-message', 'Регистрация успешна! Теперь войдите.', 'success');
            showLogin();
            document.getElementById('login-username').value = username;
        } else {
            throw new Error('Ошибка регистрации');
        }
    } catch (error) {
        showMessage('register-message', 'Ошибка: ' + error.message, 'error');
    }
}

function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.username;
    loadMyEvents();
    startNotificationChecker();
}

function logout() {
    stopNotificationChecker();
    shownNotifications.clear();
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('login-form-element').reset();
    document.getElementById('notifications-container').innerHTML = '';
}

async function createEvent() {
    if (!currentUser) {
        showMessage('event-message', 'Сначала войдите в систему', 'error');
        return;
    }

    const event = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        eventTime: document.getElementById('event-time').value + ':00',
        userId: currentUser.id
    };

    try {
        const response = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (response.ok) {
            showMessage('event-message', 'Событие успешно создано!', 'success');
            document.getElementById('event-form').reset();
            document.getElementById('event-time').value = new Date().toISOString().slice(0, 16);
            loadMyEvents();
        } else {
            throw new Error('Ошибка при создании события');
        }
    } catch (error) {
        showMessage('event-message', 'Ошибка: ' + error.message, 'error');
    }
}

async function loadMyEvents() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/events/user/${currentUser.id}`);
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        document.getElementById('events-container').innerHTML =
            '<div class="error">Ошибка загрузки событий</div>';
    }
}

function displayEvents(events) {
    const container = document.getElementById('events-container');

    if (events.length === 0) {
        container.innerHTML = '<div class="no-events">Событий пока нет</div>';
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="event-card">
            <h4>${event.title}</h4>
            <div class="event-time">📅 ${formatDateTime(event.eventTime)}</div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            <button onclick="deleteEvent(${event.id})" class="delete-btn">
                Удалить
            </button>
        </div>
    `).join('');
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function deleteEvent(eventId) {
    if (!confirm('Удалить это событие?')) return;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('event-message', 'Событие удалено!', 'success');
            loadMyEvents();
        } else if (response.status === 404) {
            throw new Error('Событие не найдено');
        } else {
            throw new Error('Ошибка при удалении');
        }
    } catch (error) {
        showMessage('event-message', 'Ошибка: ' + error.message, 'error');
    }
}

function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

function startNotificationChecker() {
    notificationCheckInterval = setInterval(checkForNotifications, 10000);
    checkForNotifications();
}

function stopNotificationChecker() {
    clearInterval(notificationCheckInterval);
}

async function checkForNotifications() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/notifications/user/${currentUser.id}`);
        if (!response.ok) return;

        const notifications = await response.json();

        notifications.forEach(notification => {
            const notificationKey = `event-${notification.eventId}-${notification.type}`;

            if (!shownNotifications.has(notificationKey)) {
                showSiteNotification(notification);
                shownNotifications.add(notificationKey);
            }
        });
    } catch (error) {
        console.log('Ошибка получения уведомлений:', error);
    }
}

function showSiteNotification(notification) {
    const container = document.getElementById('notifications-container');
    const notificationId = 'notification-' + Date.now();

    const notificationElement = document.createElement('div');
    notificationElement.className = `notification notification-${notification.type.toLowerCase()}`;
    notificationElement.id = notificationId;

    notificationElement.innerHTML = `
        <div class="notification-icon">${getNotificationIcon(notification.type)}</div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatDateTime(notification.eventTime)}</div>
        </div>
        <button class="notification-close" onclick="removeNotification('${notificationId}')">×</button>
    `;

    container.appendChild(notificationElement);

    setTimeout(() => {
        removeNotification(notificationId);
    }, 10000);
}

function getNotificationIcon(type) {
    const icons = {
        'FIVE_MINUTES_BEFORE': '🔔',
        'EVENT_STARTED': '⏰',
        'EVENT_EXPIRED': '⚠️'
    };
    return icons[type] || '📋';
}

function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}