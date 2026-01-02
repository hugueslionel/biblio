// scripts/library.js

const { ipcRenderer } = require('electron');

// Structure pour stocker les données de la bibliothèque
let bookLibrary = {
    summary: [],
    details: {}
};
let nextId = 1;
let currentLibraryName = '';
let currentEditingId = null; // ID du livre en cours d'édition

// Charger la liste des bibliothèques
async function loadLibrariesList() {
    const libraries = await ipcRenderer.invoke('get-libraries-list');
    const select = document.getElementById('librarySelect');
    select.innerHTML = '<option value="">-- Choisir une bibliothèque --</option>';
    
    libraries.forEach(library => {
        const option = document.createElement('option');
        option.value = library;
        option.textContent = library;
        select.appendChild(option);
    });
}

// Sauvegarder la bibliothèque actuelle
async function saveCurrentLibrary() {
    if (currentLibraryName) {
        await ipcRenderer.invoke('save-library', currentLibraryName, bookLibrary);
    }
}

// Charger une bibliothèque
async function loadLibrary(libraryName) {
    const data = await ipcRenderer.invoke('load-library', libraryName);
    if (data) {
        // Vérifier si c'est l'ancien format et migrer si nécessaire
        if (Array.isArray(data)) {
            bookLibrary = await migrateOldFormat(data);
            // Sauvegarder au nouveau format
            await ipcRenderer.invoke('save-library', libraryName, bookLibrary);
            showStatusMessage(`Bibliothèque migrée vers le nouveau format`);
        } else {
            bookLibrary = data;
        }
        
        currentLibraryName = libraryName;
        document.getElementById('currentLibraryName').textContent = libraryName;
        document.getElementById('librarySelect').value = libraryName;
        
        // Recalculer nextId
        if (bookLibrary.summary.length > 0) {
            nextId = Math.max(...bookLibrary.summary.map(book => book.id)) + 1;
        } else {
            nextId = 1;
        }
        
        updateInterfaceState();
        renderTable();
        showStatusMessage(`Bibliothèque "${libraryName}" chargée`);
    }
}

// Réindexer les entrées de manière séquentielle
async function reindexEntries() {
    // Réassigner tous les IDs séquentiellement
    const newDetails = {};
    const newSummary = [];
    
    for (let i = 0; i < bookLibrary.summary.length; i++) {
        const oldId = bookLibrary.summary[i].id;
        const newId = i + 1;
        
        // Mettre à jour le résumé
        const updatedSummary = {...bookLibrary.summary[i], id: newId};
        newSummary.push(updatedSummary);
        
        // Mettre à jour les détails si l'ancien ID existe
        if (bookLibrary.details[oldId]) {
            newDetails[newId] = bookLibrary.details[oldId];
        }
    }
    
    // Mettre à jour les structures
    bookLibrary.summary = newSummary;
    bookLibrary.details = newDetails;
    
    // Mettre à jour le prochain ID
    nextId = bookLibrary.summary.length + 1;
    
    // Sauvegarder les changements
    await saveCurrentLibrary();
}

// Fonction pour migrer les anciennes données vers le nouveau format
async function migrateOldFormat(oldData) {
    if (!Array.isArray(oldData)) return oldData;
    
    const newFormat = {
        summary: [],
        details: {}
    };
    
    oldData.forEach((book, index) => {
        const newId = index + 1;
        
        newFormat.summary.push({
            id: newId,
            author: book.author || '',
            title: book.title || '',
            description: book.description || '',
            mainImage: book.image || ''
        });
        
        newFormat.details[newId] = {
            extendedDescription: '',
            images: book.image ? [book.image] : [],
            additionalInfo: {
                publisher: '',
                year: '',
                isbn: '',
                pages: ''
            },
            comments: book.comments || ''
        };
    });
    
    return newFormat;
}

// Réinitialiser l'interface (pas de bibliothèque sélectionnée)
function resetInterface() {
    bookLibrary = { summary: [], details: {} };
    nextId = 1;
    currentLibraryName = '';
    document.getElementById('currentLibraryName').textContent = 'Aucune';
    document.getElementById('librarySelect').value = '';
    updateInterfaceState();
    renderTable();
}

// Mettre à jour l'état de l'interface selon la bibliothèque sélectionnée
function updateInterfaceState() {
    const hasLibrary = currentLibraryName !== '';
    const mainControls = document.getElementById('mainControls');
    const searchInput = document.getElementById('searchInput');
    const renameBtn = document.getElementById('renameLibraryBtn');
    const deleteBtn = document.getElementById('deleteLibraryBtn');
    
    if (hasLibrary) {
        mainControls.classList.remove('controls-disabled');
        searchInput.disabled = false;
        renameBtn.disabled = false;
        deleteBtn.disabled = false;
    } else {
        mainControls.classList.add('controls-disabled');
        searchInput.disabled = true;
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
    }
}

// Configurer les contrôles des bibliothèques
function setupLibraryControls() {
    // Sélection d'une bibliothèque
    document.getElementById('librarySelect').addEventListener('change', function() {
        if (this.value) {
            loadLibrary(this.value);
        } else {
            resetInterface();
        }
    });

    // Nouvelle bibliothèque
    document.getElementById('newLibraryBtn').addEventListener('click', async function() {
        const name = await showDialog('Nom de la nouvelle bibliothèque :');
        if (name) {
            bookLibrary = { summary: [], details: {} };
            nextId = 1;
            currentLibraryName = name;
            
            await saveCurrentLibrary();
            await loadLibrariesList();
            
            document.getElementById('currentLibraryName').textContent = name;
            document.getElementById('librarySelect').value = name;
            updateInterfaceState();
            renderTable();
            showStatusMessage(`Bibliothèque "${name}" créée`);
        }
    });

    // Renommer bibliothèque
    document.getElementById('renameLibraryBtn').addEventListener('click', async function() {
        if (!currentLibraryName) {
            showStatusMessage('Aucune bibliothèque sélectionnée', true);
            return;
        }
        
        const newName = await showDialog('Nouveau nom :', currentLibraryName);
        if (newName && newName !== currentLibraryName) {
            // Supprimer l'ancienne et créer la nouvelle
            await ipcRenderer.invoke('delete-library', currentLibraryName);
            currentLibraryName = newName;
            await saveCurrentLibrary();
            await loadLibrariesList();
            
            document.getElementById('currentLibraryName').textContent = newName;
            document.getElementById('librarySelect').value = newName;
            showStatusMessage(`Bibliothèque renommée en "${newName}"`);
        }
    });

    // Supprimer bibliothèque
    document.getElementById('deleteLibraryBtn').addEventListener('click', async function() {
        if (!currentLibraryName) {
            showStatusMessage('Aucune bibliothèque sélectionnée', true);
            return;
        }
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer la bibliothèque "${currentLibraryName}" ?`)) {
            await ipcRenderer.invoke('delete-library', currentLibraryName);
            await loadLibrariesList();
            
            resetInterface();
            showStatusMessage('Bibliothèque supprimée');
        }
    });
}

// Exporter les variables et fonctions nécessaires
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bookLibrary, nextId, currentLibraryName, currentEditingId,
        loadLibrariesList, saveCurrentLibrary, loadLibrary, reindexEntries,
        resetInterface, updateInterfaceState, setupLibraryControls
    };
}
