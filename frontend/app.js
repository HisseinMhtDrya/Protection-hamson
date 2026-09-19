const isLocalApp = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = isLocalApp
    ? '/api'
    : 'https://protection-hamson-backend.onrender.com/api';
const HEALTH_URL = isLocalApp ? '/health' : `${API_URL}/health`;
let currentType = 'url';
let analysisHistory = loadSavedHistory();

const headersMap = {
    'tab-dashboard': {
        title: 'Phishing Threat Analyzer',
        subtitle: 'Analyse IA en temps réel des URLs et messages d\'ingénierie sociale.'
    },
    'tab-domains': {
        title: 'Monitored Domains',
        subtitle: 'Surveillance proactive des noms de domaine enregistrés contre le cybersquatting.'
    },
    'tab-threats': {
        title: 'Threats Analysis',
        subtitle: 'Journal d\'audit et historique des tentatives d\'hameçonnage interceptées.'
    },
    'tab-settings': {
        title: 'System Settings',
        subtitle: 'Ajustement des seuils de sensibilité des modèles Machine Learning.'
    },
    'tab-admin': {
        title: 'Admin Panel & Health',
        subtitle: 'Supervision de l\'infrastructure conteneurisée (Express, FastAPI, Nginx).'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;
            if (!targetTab) return;

            navItems.forEach(i => i.classList.remove('active'));
            tabViews.forEach(v => v.classList.remove('active-view'));

            item.classList.add('active');
            const activeView = document.getElementById(targetTab);
            if (activeView) activeView.classList.add('active-view');

            if (headersMap[targetTab]) {
                pageTitle.textContent = headersMap[targetTab].title;
                pageSubtitle.textContent = headersMap[targetTab].subtitle;
            }

            triggerTabDataLoader(targetTab);
        });
    });

    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;

            const input = document.getElementById('target-input');
            if (input) {
                input.placeholder = currentType === 'url'
                    ? 'https://exemple-suspect.xyz/login'
                    : 'Collez votre message suspect ici...';
                input.value = '';
            }
            updateDemoVisibility();
        });
    });

    document.querySelectorAll('[data-demo]').forEach(button => {
        button.addEventListener('click', () => loadDemo(button.dataset.demo));
    });

    updateDemoVisibility();

    const quickScanBtn = document.getElementById('btn-quick-scan');
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', () => {
            const input = document.getElementById('target-input');
            if (input) input.focus();
        });
    }

    const analyzeForm = document.getElementById('analyze-form');
    if (analyzeForm) {
        analyzeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('target-input');
            if (!input) return;

            const inputValue = input.value;
            if (!inputValue.trim()) return;

            showLoading();

            try {
                const endpoint = currentType === 'url' ? '/analyze/url' : '/analyze/message';
                const payload = currentType === 'url' ? { url: inputValue } : { message: inputValue };

                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                const responseBody = await response.text();
                let data;
                try {
                    data = responseBody ? JSON.parse(responseBody) : {};
                } catch (parseError) {
                    throw new Error(`Réponse invalide du serveur (${response.status})`);
                }
                if (!response.ok) {
                    throw new Error(data.message || data.error || `Serveur indisponible (${response.status})`);
                }
                displayResult(data);
                addToHistory(currentType === 'url' ? 'URL' : 'Message', inputValue.substring(0, 50) + '...', data);
            } catch (error) {
                showError('Erreur lors de l\'analyse: ' + error.message);
            }
        });
    }

    triggerTabDataLoader('tab-dashboard');
});

function triggerTabDataLoader(tabId) {
    switch (tabId) {
        case 'tab-domains':
            loadMonitoredDomains();
            break;
        case 'tab-threats':
            loadThreatHistory();
            break;
        case 'tab-settings':
            loadSettingsForm();
            break;
        case 'tab-admin':
            loadAdminClusterStatus();
            break;
        default:
            break;
    }
}

function updateDemoVisibility() {
    const urlDemos = document.getElementById('url-demo-buttons');
    const messageReferences = document.getElementById('message-references');
    if (urlDemos) urlDemos.hidden = currentType !== 'url';
    if (messageReferences) messageReferences.hidden = currentType !== 'message';
}

async function loadMonitoredDomains() {
    const container = document.getElementById('tab-domains');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/domains`);
        const domains = response.ok ? await response.json() : [];

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>Domaines sous Surveillance Proactive</h2>
                    <button class="btn-primary" id="btn-add-domain" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fa-solid fa-plus"></i> Ajouter un domaine
                    </button>
                </div>
                <div class="card-body">
                    <table class="custom-table" style="width:100%; border-collapse: collapse; color: #fff;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; text-align:left; border-bottom:1px solid #272935;">Domaine Organisme</th>
                                <th style="padding: 10px; text-align:left; border-bottom:1px solid #272935;">Dernier Scan</th>
                                <th style="padding: 10px; text-align:left; border-bottom:1px solid #272935;">Tentatives</th>
                                <th style="padding: 10px; text-align:left; border-bottom:1px solid #272935;">Statut Protection</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${domains.length ? domains.map(domain => `
                                <tr>
                                    <td style="padding: 12px 10px; border-bottom:1px solid #272935;">${domain.domain}</td>
                                    <td style="padding: 12px 10px; border-bottom:1px solid #272935;">${domain.lastScan}</td>
                                    <td style="padding: 12px 10px; border-bottom:1px solid #272935;">${domain.attempts} Menace</td>
                                    <td style="padding: 12px 10px; border-bottom:1px solid #272935;">
                                        <span class="status-badge ${domain.status === 'Alerte Élevée' ? 'status-phishing' : 'status-legit'}">${domain.status}</span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" style="padding: 12px; color: var(--text-secondary);">Aucun domaine enregistré.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const addDomainBtn = document.getElementById('btn-add-domain');
        if (addDomainBtn) {
            addDomainBtn.addEventListener('click', async () => {
                const domain = window.prompt('Ajouter un domaine à surveiller :', 'example.org');
                if (!domain || !domain.trim()) return;

                const response = await fetch(`${API_URL}/domains`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain: domain.trim() })
                });

                if (response.ok) {
                    await loadMonitoredDomains();
                } else {
                    const error = await response.json();
                    window.alert(error.error || 'Impossible d\'ajouter ce domaine.');
                }
            });
        }
    } catch (error) {
        container.innerHTML = `<div class="card"><div class="card-body"><p>Erreur de chargement des domaines.</p></div></div>`;
    }
}

function loadThreatHistory() {
    const container = document.getElementById('tab-threats');
    if (!container) return;

    const historyItems = analysisHistory.length
        ? analysisHistory.map(item => `
            <li class="threat-history-item ${item.is_phishing ? 'threat-detected' : 'threat-safe'}">
                <div class="threat-history-main">
                    <strong>${item.is_phishing ? '🚨' : '✅'} ${escapeHtml(item.type)} - Score ${escapeHtml(String(item.score))}%</strong>
                    <span>${escapeHtml(item.input)}</span>
                </div>
                <div class="threat-history-meta">
                    <strong>${escapeHtml(item.riskLevel || 'NON CLASSÉ')}</strong>
                    <small>${escapeHtml(item.timestamp)}</small>
                </div>
            </li>
        `).join('')
        : '<li class="placeholder-text">Aucune analyse effectuée pour le moment.</li>';

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Journal des Attaques Interceptées</h2>
                <div>
                    <span class="status-badge status-phishing">Base XAI Enrichie</span>
                    ${analysisHistory.length ? '<button type="button" class="btn-demo" id="clear-threat-history">Effacer</button>' : ''}
                </div>
            </div>
            <div class="card-body">
                <ul class="explanations-list threat-history-list">${historyItems}</ul>
            </div>
        </div>
    `;

    const clearButton = document.getElementById('clear-threat-history');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            analysisHistory = [];
            localStorage.removeItem('analysisHistory');
            loadThreatHistory();
        });
    }
}

function loadSettingsForm() {
    const container = document.getElementById('tab-settings');
    if (!container) return;
    const savedThreshold = Number(localStorage.getItem('phishingAlertThreshold')) || 75;
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Configuration Moteur d'IA & Sécurité</h2>
            </div>
            <div class="card-body">
                <form id="settings-form">
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; margin-bottom:8px; color:var(--text-secondary);">Seuil d'alerte Phishing :</label>
                        <input type="range" id="alert-threshold" min="50" max="95" value="${savedThreshold}" style="width:100%; accent-color: var(--accent-red);">
                        <output id="alert-threshold-value" for="alert-threshold" style="display:block; margin-top:8px; color:var(--text-primary); font-weight:600;">${savedThreshold}%</output>
                    </div>
                    <button type="submit" class="btn-primary">Enregistrer la configuration</button>
                    <p id="settings-status" style="margin-top: 12px; color: var(--accent-green); display:none;">Paramètres enregistrés.</p>
                </form>
            </div>
        </div>
    `;

    const settingsForm = document.getElementById('settings-form');
    const thresholdInput = document.getElementById('alert-threshold');
    const thresholdValue = document.getElementById('alert-threshold-value');
    if (thresholdInput && thresholdValue) {
        thresholdInput.addEventListener('input', () => {
            thresholdValue.textContent = `${thresholdInput.value}%`;
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (thresholdInput) {
                localStorage.setItem('phishingAlertThreshold', thresholdInput.value);
            }
            const status = document.getElementById('settings-status');
            if (status) {
                status.style.display = 'block';
                status.textContent = 'Paramètres enregistrés avec succès.';
            }
        });
    }
}

function loadAdminClusterStatus() {
    const container = document.getElementById('tab-admin');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Supervision des Microservices</h2>
                <span class="status-badge status-idle" id="cluster-status">Vérification...</span>
            </div>
            <div class="card-body">
                <div class="metrics-row">
                    <div class="metric-box"><span class="metric-value" id="nginx-status">...</span><span class="metric-label">Nginx Proxy</span></div>
                    <div class="metric-box"><span class="metric-value" id="backend-status">...</span><span class="metric-label">Express Backend</span></div>
                    <div class="metric-box"><span class="metric-value" id="ai-status">...</span><span class="metric-label">FastAPI AI Engine</span></div>
                </div>
                <p id="health-last-check" style="margin-top: 16px; color: var(--text-secondary);">Vérification en cours...</p>
            </div>
        </div>
    `;

    refreshAdminClusterStatus();
    if (window.adminHealthTimer) clearInterval(window.adminHealthTimer);
    window.adminHealthTimer = setInterval(refreshAdminClusterStatus, 10000);
}

async function refreshAdminClusterStatus() {
    const clusterStatus = document.getElementById('cluster-status');
    const nginxStatus = document.getElementById('nginx-status');
    const backendStatus = document.getElementById('backend-status');
    const aiStatus = document.getElementById('ai-status');
    const lastCheck = document.getElementById('health-last-check');
    if (!clusterStatus || !nginxStatus || !backendStatus || !aiStatus || !lastCheck) return;

    const setStatus = (element, online) => {
        element.textContent = online ? 'ONLINE' : 'OFFLINE';
        element.style.color = online ? 'var(--accent-green)' : 'var(--accent-red)';
    };

    try {
        const [nginxResponse, backendResponse] = await Promise.all([
            fetch(HEALTH_URL, { cache: 'no-store' }),
            fetch(`${API_URL}/health`, { cache: 'no-store' })
        ]);
        const nginxHealth = nginxResponse.ok && (nginxResponse.headers.get('content-type') || '').includes('application/json')
            ? await nginxResponse.json()
            : null;
        const health = backendResponse.ok ? await backendResponse.json() : null;
        const backendOnline = health?.services?.backend?.status === 'online';
        const aiOnline = health?.services?.ai?.status === 'online';
        const nginxOnline = nginxResponse.ok && nginxHealth?.status !== undefined;

        setStatus(nginxStatus, nginxOnline);
        setStatus(backendStatus, backendOnline);
        setStatus(aiStatus, aiOnline);

        const allOnline = nginxOnline && backendOnline && aiOnline;
        clusterStatus.textContent = allOnline ? 'All Systems Operational' : 'Service dégradé';
        clusterStatus.className = `status-badge ${allOnline ? 'status-legit' : 'status-phishing'}`;
        lastCheck.textContent = `Dernière vérification : ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        setStatus(nginxStatus, false);
        setStatus(backendStatus, false);
        setStatus(aiStatus, false);
        clusterStatus.textContent = 'Services indisponibles';
        clusterStatus.className = 'status-badge status-phishing';
        lastCheck.textContent = 'Dernière vérification : échec de connexion';
    }
}

function showLoading() {
    const statusBadge = document.getElementById('status-badge');
    const scoreDisplay = document.getElementById('score-display');
    const riskLevelDisplay = document.getElementById('risk-level-display');
    const classificationDisplay = document.getElementById('classification-display');
    const recommendedActionWrapper = document.getElementById('recommended-action-wrapper');
    const explanationsList = document.getElementById('explanations-list');

    if (!statusBadge || !scoreDisplay || !riskLevelDisplay || !classificationDisplay || !explanationsList) return;

    statusBadge.textContent = 'Analyse en cours...';
    statusBadge.className = 'status-badge status-idle';
    scoreDisplay.textContent = '--';
    riskLevelDisplay.textContent = '--';
    classificationDisplay.textContent = '--';
    if (recommendedActionWrapper) recommendedActionWrapper.style.display = 'none';
    explanationsList.innerHTML = '<li class="placeholder-text">Analyse en cours...</li>';
}

function showError(message) {
    const statusBadge = document.getElementById('status-badge');
    const explanationsList = document.getElementById('explanations-list');
    if (!statusBadge || !explanationsList) return;

    statusBadge.textContent = 'Erreur';
    statusBadge.className = 'status-badge status-idle';
    explanationsList.innerHTML = `<li style="color: var(--accent-red);">${message}</li>`;
}

function displayResult(data) {
    const statusBadge = document.getElementById('status-badge');
    const scoreDisplay = document.getElementById('score-display');
    const riskLevelDisplay = document.getElementById('risk-level-display');
    const classificationDisplay = document.getElementById('classification-display');
    const recommendedActionWrapper = document.getElementById('recommended-action-wrapper');
    const recommendedAction = document.getElementById('recommended-action');
    const explanationsList = document.getElementById('explanations-list');

    if (!statusBadge || !scoreDisplay || !riskLevelDisplay || !classificationDisplay || !explanationsList) return;

    const alertThreshold = Number(localStorage.getItem('phishingAlertThreshold')) || 75;
    const alertTriggered = Number(data.score) >= alertThreshold;

    scoreDisplay.textContent = `${data.score}%`;
    classificationDisplay.textContent = alertTriggered ? 'PHISHING' : 'LÉGITIME';

    if (data.risk_level) {
        riskLevelDisplay.textContent = data.risk_level;
        riskLevelDisplay.style.color = data.indicator_color || 'var(--accent-red)';
    }

    if (data.recommended_action && recommendedActionWrapper && recommendedAction) {
        recommendedAction.textContent = data.recommended_action;
        recommendedActionWrapper.style.display = 'block';
        recommendedAction.style.color = data.indicator_color || 'var(--text-secondary)';
    }

    if (alertTriggered) {
        statusBadge.textContent = 'Menace détectée';
        statusBadge.className = 'status-badge status-phishing';
        classificationDisplay.style.color = data.indicator_color || 'var(--accent-red)';
    } else {
        statusBadge.textContent = 'Sécurisé';
        statusBadge.className = 'status-badge status-legit';
        classificationDisplay.style.color = data.indicator_color || 'var(--accent-green)';
    }

    if (data.explanations && data.explanations.length > 0) {
        explanationsList.innerHTML = data.explanations.map(exp => `<li>${exp}</li>`).join('');
    } else {
        explanationsList.innerHTML = '<li class="placeholder-text">Aucun facteur de risque identifié.</li>';
    }
}

function addToHistory(type, input, data) {
    const alertThreshold = Number(localStorage.getItem('phishingAlertThreshold')) || 75;
    analysisHistory.unshift({
        type,
        input,
        is_phishing: Number(data.score) >= alertThreshold,
        score: data.score,
        riskLevel: data.risk_level,
        timestamp: new Date().toLocaleString('fr-FR')
    });
    if (analysisHistory.length > 10) analysisHistory.pop();
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    if (document.getElementById('tab-threats')?.classList.contains('active-view')) {
        loadThreatHistory();
    }
}

function loadSavedHistory() {
    try {
        const savedHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        return Array.isArray(savedHistory) ? savedHistory : [];
    } catch (error) {
        return [];
    }
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[character]));
}

function loadDemo(type) {
    const input = document.getElementById('target-input');
    if (!input) return;

    if (type === 'phishing_url') {
        input.value = 'http://paypal-verification-security-update.xyz/login.php';
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-type="url"]').classList.add('active');
        currentType = 'url';
        input.placeholder = 'https://exemple-suspect.xyz/login';
        updateDemoVisibility();
    } else if (type === 'legit_url') {
        input.value = 'https://www.google.com';
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-type="url"]').classList.add('active');
        currentType = 'url';
        input.placeholder = 'https://exemple-suspect.xyz/login';
        updateDemoVisibility();
    } else if (type === 'phishing_msg_urgent') {
        input.value = 'URGENT : Votre compte bancaire sera suspendu aujourd’hui. Confirmez vos informations immédiatement sur http://bit.ly/bank-sec';
        selectMessageType(input);
    } else if (type === 'phishing_msg_delivery') {
        input.value = 'Votre colis ne peut pas être livré. Réglez 2,99 EUR de frais de livraison ici : http://delivery-check.example';
        selectMessageType(input);
    } else if (type === 'phishing_msg_prize') {
        input.value = 'Félicitations ! Vous avez gagné 500 000 FCFA. Envoyez vos coordonnées bancaires pour recevoir votre prix.';
        selectMessageType(input);
    } else if (type === 'legit_msg') {
        input.value = 'Votre rendez-vous de consultation est confirmé pour demain à 10h00. Merci de vous présenter 15 minutes à l’avance.';
        selectMessageType(input);
    } else if (type === 'phishing_msg') {
        input.value = 'URGENT : Votre compte a été suspendu. Mettez à jour vos informations sur http://bit.ly/bank-sec';
        selectMessageType(input);
    }

    input.focus();

}

function selectMessageType(input) {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-type="message"]').classList.add('active');
        currentType = 'message';
        input.placeholder = 'Collez votre message suspect ici...';
        updateDemoVisibility();
}
