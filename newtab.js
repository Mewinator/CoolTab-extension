window.addEventListener('error', e => console.error('window error', e.error || e.message || e));
window.addEventListener('unhandledrejection', e => console.error('unhandled promise rejection', e.reason));

async function initChangelog() {
    let status = await Storage.get('cooltab_changelog_read_status');
    if (status === null) {
        status = 'n';
        await Storage.set('cooltab_changelog_read_status', status);
    }
    if (status === 'n') {
        const dialog = document.getElementById('changelog');
        dialog.showModal();
    }
    if (status === 'y') {
        const dialog = document.getElementById('changelog');
        dialog.style.display = 'none';
    }
}
async function hideChangelog() {
    const dialog = document.getElementById('changelog');
    dialog.close();
    dialog.style.display = 'none';
    await Storage.set('cooltab_changelog_read_status', 'y');
}

function setupEventListeners() {
    const settingsButton = document.getElementById('settings_button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            window.location.href = './settings.html';
        });
    }

    const changelogCloseBtn = document.getElementById('changelog_close_btn');
    if (changelogCloseBtn) {
        changelogCloseBtn.addEventListener('click', hideChangelog);
    }
} 
function updateTime() {
    const ampm = document.getElementById('ampm');
    const time = document.getElementById('hhmmss');
    const date = document.getElementById('date');
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    const ampmValue = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    time.textContent = hours + ':' + minutes + ':' + seconds;
    ampm.textContent = ampmValue;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    date.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
}
let search, searchBar, suggestionsContainer, debounceTimeout;

function setupSearch() {
    search = document.getElementById('search');
    searchBar = document.querySelector('.search_bar');
    suggestionsContainer = document.getElementById('suggestions');
    if (!search) return;

    search.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const query = search.value;
        if (query.length > 0) {
            searchBar.classList.add('active');
            suggestionsContainer.classList.add('active');
            debounceTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://api.suggestions.victr.me/?q=${encodeURIComponent(query)}&l=en&with=duckduckgo`);
                    const suggestions = await response.json();
                    suggestionsContainer.innerHTML = '';
                    suggestions.slice(0, 10).forEach(suggestion => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.classList.add('suggestion-item');
                        suggestionItem.textContent = suggestion.text;
                        suggestionItem.addEventListener('click', () => {
                            window.location.href = `https://duckduckgo.com/?q=${suggestion.text}`;
                        });
                        suggestionsContainer.appendChild(suggestionItem);
                    });
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                    suggestionsContainer.innerHTML = '<div class="suggestion-item">Error loading suggestions.</div>';
                }
            }, 300);
        } else {
            searchBar.classList.remove('active');
            suggestionsContainer.classList.remove('active');
        }
    });
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = 'https://duckduckgo.com/search?q=';
            window.location.href = url + search.value;
        }
    });
}
const defaultApps = {
    'Gmail': { url: 'https://mail.google.com/', icon: './img/gmail.png' },
    'Github': { url: 'https://github.com', icon: './img/github.svg', pinned: true },
    'Figma': { url: 'https://figma.com', icon: './img/figma.png', pinned: true },
    'Docs': { url: 'https://docs.google.com/document/u/0/', icon: './img/docs.png' },
    'Drive': { url: 'https://drive.google.com/', icon: './img/drive.png' },
    'Slides': { url: 'https://docs.google.com/presentation/u/0/', icon: './img/slides.png' },
    'Forms': { url: 'https://forms.google.com/', icon: './img/forms.png' },
    'Sites': { url: 'https://sites.google.com', icon: './img/sites.png' },
    'Sheets': { url: 'https://docs.google.com/spreadsheets/u/0/', icon: './img/sheets.png' },
    'Earth': { url: 'https://earth.google.com/web/', icon: './img/earth.png' },
    'Maps': { url: 'https://google.com/maps/', icon: './img/maps.png' },
    'TinkerCAD': { url: 'https://tinkercad.com/', icon: './img/tinkercad.png' },
    'Copilot': { url: 'https://copilot.microsoft.com/', icon: './img/copilot.png' },
    'Gemini': { url: 'https://gemini.google.com/', icon: './img/gemini.png' },
    'Claude': { url: 'https://claude.ai', icon: './img/claude.svg', pinned: true },
    'Firebase Studio': { url: 'https://studio.firebase.google.com/', icon:'https://favicon.is/studio.firebase.google.com?larger=true', pinned: true },
    'Onecompiler': { url: 'https://onecompiler.com/', icon: './img/onecompiler.png', pinned: true }
};
async function loadApps() {
    const grid = document.querySelector('.apps_grid');
    grid.innerHTML = '';
    let apps = await Storage.get('cooltab_apps');
    let pinnedApps = await Storage.get('cooltab_pinned') || {};
    if (!apps) {
        apps = {};
        for (const name in defaultApps) {
            apps[name] = { url: defaultApps[name].url, icon: defaultApps[name].icon };
        }
        await Storage.set('cooltab_apps', apps);
        for (const name in defaultApps) {
            if (defaultApps[name].pinned) {
                pinnedApps[name] = { url: defaultApps[name].url, icon: defaultApps[name].icon };
            }
        }
        await Storage.set('cooltab_pinned', pinnedApps);
    }
    for (const name in apps) {
        if (!Object.prototype.hasOwnProperty.call(apps, name)) continue;
        const app = apps[name];
        const link = document.createElement('a');
        link.href = app.url || '#';
        link.title = name;
        link.classList.add('app-link');
        link.style.position = 'relative';
        const img = document.createElement('img');
        img.src = app.icon || '';
        img.alt = name;
        link.appendChild(img);
        const span = document.createElement('span');
        span.textContent = name;
        link.appendChild(span);
        grid.appendChild(link);
    }
}
async function togglePinApp(name, app, pin) {
    let pinned = await Storage.get('cooltab_pinned') || {};
    if (pin) {
        pinned[name] = app;
    } else {
        delete pinned[name];
    }
    await Storage.set('cooltab_pinned', pinned);
    await loadApps();
    await loadPinnedAppsBar();
}
async function loadPinnedAppsBar() {
    const bar = document.querySelector('.bottom_bar');
    bar.innerHTML = '';
    const pinned = await Storage.get('cooltab_pinned') || {};
    for (const name in pinned) {
        if (!Object.prototype.hasOwnProperty.call(pinned, name)) continue;
        const app = pinned[name];
        const link = document.createElement('a');
        link.href = app.url || '#';
        link.title = name;
        const img = document.createElement('img');
        img.src = app.icon || '';
        img.alt = name;
        link.appendChild(img);
        bar.appendChild(link);
    }
}
function installAppHandlers() {
    const app_button = document.getElementById('app_button');
    const apps_dialog = document.getElementById('apps');
    if (!app_button || !apps_dialog) return;
    function showApps() { apps_dialog.setAttribute('open', ''); }
    function hideApps() { apps_dialog.removeAttribute('open'); }
    app_button.addEventListener('click', showApps);
    window.addEventListener('click', (e) => {
        if (!apps_dialog.contains(e.target) && e.target !== app_button) {
            hideApps();
        }
    });
}
let _currentBgUrl = null;
async function updateBg() {
    const stored = await Storage.get('cooltab_background');
    const body = document.querySelector('body');
    let bgUrl = stored || './taptappingu.gif';
    body.style.setProperty('--bg-url', `url(${bgUrl})`);
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundSize = 'cover';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundPosition = 'center';
}
async function loadTheme() {
    const theme = await Storage.get('cooltab_theme');
    if (theme && typeof theme === 'object') {
        for (const [name, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(`--${name}`, value);
        }
    }
}
async function main() {
    await Storage.init();
    await loadTheme();
    await initChangelog();
    updateTime();
    setInterval(updateTime, 100);
    await updateBg();
    await loadApps();
    await loadPinnedAppsBar();
    const bg_blendpx = await Storage.get('cooltab_bg_blendpx');
    if (bg_blendpx === true || bg_blendpx === 'True' || bg_blendpx === 'true') {
        document.querySelector('body').style.imageRendering = 'pixelated';
    }
    setupEventListeners();
}
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    installAppHandlers();
    main().catch(err => console.error('error in main()', err));
});