document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileUpload');
    const preview = document.getElementById('previewImage');
    let currentPreviewUrl = null;
    try {
        const stored = await Storage.get('cooltab_background');
        if (stored) {
            preview.src = stored;
        }
        let name = await Storage.get('cooltab_background_name');
        document.getElementById('imgText').textContent = name || 'taptappingu.gif';
    } catch (e) {
        console.warn('Failed to read background from storage', e);
    }
    if (fileInput) {
        fileInput.addEventListener('change', async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            
            // Convert file to base64 data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                if (preview) preview.src = dataUrl;
                try {
                    await Storage.set('cooltab_background', dataUrl);
                    await Storage.set('cooltab_background_name', file.name);
                } catch (err) {
                    console.warn('Failed to save background to storage', err);
                }
            };
            reader.onerror = () => {
                console.warn('Failed to read file');
            };
            reader.readAsDataURL(file);
        });
    }

    // Add event listener for upload button
    const uploadBtn = document.getElementById('upload_btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            document.getElementById('fileUpload').click();
        });
    }

    // Add event listener for logo button
    const logoButton = document.getElementById('logo_button');
    if (logoButton) {
        logoButton.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    const blendCheckbox = document.getElementById('blend_px');
    if (blendCheckbox) {
        const blendStored = await Storage.get('cooltab_bg_blendpx');
        blendCheckbox.checked = blendStored === true;
        blendCheckbox.addEventListener('change', async () => {
            try {
                await Storage.set('cooltab_bg_blendpx', blendCheckbox.checked);
            } catch (e) {
                console.warn('Failed to save blend setting', e);
            }
        });
    }
});
async function loadTheme() {
    const theme = await Storage.get('cooltab_theme');
    if (theme && typeof theme === 'object') {
        for (const [name, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(`--${name}`, value);
        }
    } else {
        await saveCurrentTheme();
    }
}
async function main() {
    await Storage.init();
    await loadTheme();
    await formatVariables();
    await loadApps();
}
async function formatVariables() {
    const theme = await Storage.get('cooltab_theme');
    let result = "";
    if (theme && typeof theme === 'object') {
        for (const [name, value] of Object.entries(theme)) {
            result += `
            <div class="var-line" data-name="${name}" data-value="${value}">
                <span class="var-name" style="color: #75b8ff;">${name}</span>
                <span class="colon">:</span>
                <span class="var-value" style="color: #6dfdba; cursor: pointer;">${value}</span>
            </div>`;
        }
    }
    const output = document.getElementById('themeOutput');
    if (output) {
        output.innerHTML = result;
        output.addEventListener('click', evt => {
            const line = evt.target.closest('.var-line');
            if (!line) return;
            showVarPanel(line.dataset.name, line.dataset.value);
        });
    }
}
async function saveCurrentTheme() {
    const theme = {};
    const declared = new Set();
    for (let sheet of document.styleSheets) {
        try {
            for (let rule of sheet.cssRules) {
                if (rule.selectorText === ':root') {
                    for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        if (prop.startsWith('--')) {
                            const name = prop.slice(2);
                            declared.add(name);
                            theme[name] = rule.style.getPropertyValue(prop);
                        }
                    }
                }
            }
        } catch (e) {}
    }
    const rootStyle = getComputedStyle(document.documentElement);
    for (let prop of declared) {
        const value = rootStyle.getPropertyValue(`--${prop}`).trim();
        theme[prop] = value;
    }
    await Storage.set('cooltab_theme', theme);
}
function showVarPanel(name, value) {
    let panel = document.getElementById('varPanel');
    if (!panel) return;
    panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <strong>${name}</strong>
            <div class="color-swatch" style="width:24px;height:24px;background:${value};border:1px solid #ffffff;cursor:pointer;border-radius:4px;"></div>
            <span class="color-value" contenteditable="true" style="min-width:60px;outline:1px solid #75b8ff;padding:2px 4px;border-radius:4px;cursor:text;">${value}</span>
        </div>`;
    const swatch = panel.querySelector('.color-swatch');
    const valDisplay = panel.querySelector('.color-value');
    valDisplay.addEventListener('input', () => {
        const newVal = valDisplay.textContent.trim();
        swatch.style.background = newVal;
        document.documentElement.style.setProperty(`--${name}`, newVal);
    });
    valDisplay.addEventListener('blur', async () => {
        const newVal = valDisplay.textContent.trim();
        valDisplay.textContent = newVal;
        await saveCurrentTheme();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    main().catch(err => console.error('error in main()', err));
});
async function loadApps() {
    try {
        let apps = await Storage.get('cooltab_apps');
        if (!apps || typeof apps !== 'object') apps = {};
        const appsArray = Object.entries(apps).map(([name, data]) => ({
            name,
            url: data.url || '',
            icon: data.icon || ''
        }));
        renderApps(appsArray);
    } catch (e) {
        console.error('Failed to load apps', e);
    }
}
let selectedAppIndex = null;

function renderApps(apps) {
    const container = document.getElementById('appsList');
    container.innerHTML = '';
    apps.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'app-item';
        item.draggable = true;
        item.dataset.index = index;
        item.style.position = 'relative';
        const icon = document.createElement('img');
        icon.className = 'app-icon';
        icon.src = app.icon || `https://favicon.is/${app.url}?larger=true`;
        const name = document.createElement('span');
        name.className = 'app-name';
        name.textContent = app.name;
        item.appendChild(icon);
        item.appendChild(name);
        
        Storage.get('cooltab_pinned').then(p => {
            const pinnedApps = p || {};
            const isPinned = pinnedApps[app.name];
            const pinBtn = document.createElement('button');
            pinBtn.style.position = 'absolute';
            pinBtn.style.top = '4px';
            pinBtn.style.right = '4px';
            pinBtn.style.background = 'var(--tertiary)';
            pinBtn.style.border = 'none';
            pinBtn.style.color = 'var(--text-primary)';
            pinBtn.style.cursor = 'pointer';
            pinBtn.style.padding = '4px';
            pinBtn.style.borderRadius = '4px';
            pinBtn.style.fontSize = '18px';
            pinBtn.style.display = 'flex';
            pinBtn.style.alignItems = 'center';
            pinBtn.style.justifyContent = 'center';
            pinBtn.style.width = '26px';
            pinBtn.style.height = '26px';
            pinBtn.style.transition = 'opacity 0.16s ease-in-out';
            pinBtn.style.zIndex = '10';
            // If pinned (keep_off), always visible; if not pinned (keep), hidden initially
            pinBtn.style.opacity = isPinned ? '1' : '0';
            pinBtn.style.pointerEvents = isPinned ? 'auto' : 'none';
            pinBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; line-height: 1; display: flex;">${isPinned ? 'keep_off' : 'keep'}</span>`;
            pinBtn.onclick = (e) => {
                e.preventDefault();
                togglePinApp(app.name, app, !isPinned);
            };
            item.appendChild(pinBtn);
            item.addEventListener('mouseenter', () => {
                pinBtn.style.opacity = '1';
                pinBtn.style.pointerEvents = 'auto';
            });
            item.addEventListener('mouseleave', () => {
                // Hide pin button on mouseleave only if not pinned
                if (!isPinned) {
                    pinBtn.style.opacity = '0';
                    pinBtn.style.pointerEvents = 'none';
                }
            });
        });
        
        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            document.querySelectorAll('.app-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedAppIndex = index;
            updateAppControls(index);
        });
        
        container.appendChild(item);
    });
    setupDragAndDrop();
}

function updateAppControls(index) {
    const appControls = document.querySelector('.app-controls');
    let editBtn = appControls.querySelector('#editSelectedAppBtn');
    
    if (editBtn) {
        editBtn.remove();
    }
    
    if (index !== null) {
        const editButton = document.createElement('button');
        editButton.id = 'editSelectedAppBtn';
        editButton.className = 'control-btn';
        editButton.style.background = 'none';
        editButton.style.padding = '0';
        editButton.title = 'Edit selected app';
        editButton.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        editButton.onclick = () => editApp(index);
        appControls.appendChild(editButton);
    }
}
async function togglePinApp(name, app, pin) {
    let pinned = await Storage.get('cooltab_pinned') || {};
    if (pin) {
        pinned[name] = { url: app.url, icon: app.icon };
    } else {
        delete pinned[name];
    }
    await Storage.set('cooltab_pinned', pinned);
    const apps = await Storage.get('cooltab_apps') || {};
    const appsArray = Object.entries(apps).map(([appName, data]) => ({
        name: appName,
        url: data.url || '',
        icon: data.icon || ''
    }));
    selectedAppIndex = null;
    renderApps(appsArray);
}
function setupDragAndDrop() {
    const items = document.querySelectorAll('.app-item');
    const bin = document.getElementById('recycleBin');
    let draggedIndex = null;
    let draggedElement = null;
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(item.dataset.index);
            draggedElement = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setDragImage(new Image(), 0, 0);
        });
        item.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
            }
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(item.dataset.index);
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                reorderApps(draggedIndex, targetIndex);
            }
        });
    });
    bin.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    bin.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedIndex !== null) {
            deleteApp(draggedIndex);
        }
    });
}
async function reorderApps(from, to) {
    try {
        let appsObj = await Storage.get('cooltab_apps') || {};
        const appsArray = Object.entries(appsObj).map(([name, data]) => ({
            name,
            url: data.url || '',
            icon: data.icon || ''
        }));
        const [moved] = appsArray.splice(from, 1);
        appsArray.splice(to, 0, moved);
        
        const newAppsObj = {};
        appsArray.forEach(app => {
            newAppsObj[app.name] = { url: app.url, icon: app.icon };
        });
        await Storage.set('cooltab_apps', newAppsObj);
        selectedAppIndex = null;
        renderApps(appsArray);
    } catch (e) {
        console.error('Failed to reorder apps', e);
    }
}
async function deleteApp(index) {
    try {
        let appsObj = await Storage.get('cooltab_apps') || {};
        const appsArray = Object.entries(appsObj).map(([name, data]) => ({
            name,
            url: data.url || '',
            icon: data.icon || ''
        }));
        const deletedApp = appsArray.splice(index, 1)[0];
        
        const newAppsObj = {};
        appsArray.forEach(app => {
            newAppsObj[app.name] = { url: app.url, icon: app.icon };
        });
        await Storage.set('cooltab_apps', newAppsObj);
        selectedAppIndex = null;
        renderApps(appsArray);
    } catch (e) {
        console.error('Failed to delete app', e);
    }
}
async function editApp(index) {
    try {
        let appsObj = await Storage.get('cooltab_apps') || {};
        const appsArray = Object.entries(appsObj).map(([name, data]) => ({
            name,
            url: data.url || '',
            icon: data.icon || ''
        }));
        const app = appsArray[index];
        showModal(app, index);
    } catch (e) {
        console.error('Failed to edit app', e);
    }
}
document.getElementById('addAppBtn').addEventListener('click', () => showModal());
function showModal(app = null, index = null) {
    const modal = document.getElementById('appModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('appNameInput');
    const urlInput = document.getElementById('appUrlInput');
    const saveBtn = document.getElementById('saveAppBtn');
    selectedAppIndex = null;
    if (app) {
        title.textContent = 'Edit App';
        nameInput.value = app.name;
        urlInput.value = app.url;
        saveBtn.onclick = () => saveApp(index);
    } else {
        title.textContent = 'Add App';
        nameInput.value = '';
        urlInput.value = '';
        saveBtn.onclick = () => saveApp();
    }
    modal.style.display = 'flex';
}
async function saveApp(index = null) {
    const name = document.getElementById('appNameInput').value.trim();
    const url = document.getElementById('appUrlInput').value.trim();
    if (!name || !url) return;
    try {
        let appsObj = await Storage.get('cooltab_apps') || {};
        const appsArray = Object.entries(appsObj).map(([appName, data]) => ({
            name: appName,
            url: data.url || '',
            icon: data.icon || ''
        }));
        
        const icon = `https://favicon.is/${url}?larger=true`;
        if (index !== null) {
            appsArray[index] = { name, url, icon };
        } else {
            appsArray.push({ name, url, icon });
        }
        
        const newAppsObj = {};
        appsArray.forEach(app => {
            newAppsObj[app.name] = { url: app.url, icon: app.icon };
        });
        await Storage.set('cooltab_apps', newAppsObj);
        renderApps(appsArray);
        hideModal();
    } catch (e) {
        console.error('Failed to save app', e);
    }
}
function hideModal() {
    document.getElementById('appModal').style.display = 'none';
}
document.getElementById('cancelAppBtn').addEventListener('click', hideModal);