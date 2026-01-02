// scripts/main.js

// Initialiser l'application
async function initializeApp() {
    await loadLibrariesList();
    setupLibraryControls();
    setupSearch();
    setupDetailModalEvents();
    setupDragAndDrop();
    setupExportImport();
    setupImageModal();
    updateInterfaceState();
    renderTable();
}

// Configurer l'export/import
function setupExportImport() {
    // Exporter les données
    document.getElementById('exportBtn').addEventListener('click', function() {
       if (!currentLibraryName) {
            showStatusMessage('Aucune bibliothèque sélectionnée', true);
            return;
       }

       const dataStr = JSON.stringify(bookLibrary, null, 2);
       const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

       const exportFileName = `${currentLibraryName}_` + new Date().toISOString().split('T')[0] + '.json';

       const linkElement = document.createElement('a');
       linkElement.setAttribute('href', dataUri);
       linkElement.setAttribute('download', exportFileName);
       document.body.appendChild(linkElement);
       linkElement.click();
       document.body.removeChild(linkElement);

       showStatusMessage(`Bibliothèque "${currentLibraryName}" exportée`);
    });

    // Importer les données
    document.getElementById('importBtn').addEventListener('click', function() {
        if (!currentLibraryName) {
            showStatusMessage('Aucune bibliothèque sélectionnée', true);
            return;
        }

        // Réinitialiser l'input file
        const importFileInput = document.getElementById('importFile');
        importFileInput.value = '';
        importFileInput.click();
    });

    document.getElementById('importFile').addEventListener('change', async function(e) {
        if (!currentLibraryName) return;
        
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Gérer l'ancien format ou le nouveau
                    if (Array.isArray(importedData)) {
                        // Ancien format - convertir en nouveau
                        bookLibrary.summary = importedData.map(book => ({
                            id: book.id,
                            author: book.author || '',
                            title: book.title || '',
                            description: book.description || '',
                            mainImage: book.image || ''
                        }));
                        
                        // Créer les détails
                        bookLibrary.details = {};
                        importedData.forEach(book => {
                            bookLibrary.details[book.id] = {
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
                    } else if (importedData.summary && importedData.details) {
                        // Nouveau format
                        bookLibrary = importedData;
                    } else {
                        throw new Error('Format de fichier invalide');
                    }
                    
                    await reindexEntries();
                    renderTable();
                    showStatusMessage('Données importées avec succès');
                } catch (error) {
                    showStatusMessage('Erreur lors de l\'importation: ' + error.message, true);
                }
            };
            
            reader.readAsText(file);
        }
    });
}

// Configurer la modal d'image
function setupImageModal() {
    // Fermer la modale d'image
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('imageModal').style.display = 'none';
    });

    // Fermer la modale si on clique en dehors de l'image
    window.addEventListener('click', function(event) {
        const imageModal = document.getElementById('imageModal');
        const dialogModal = document.getElementById('dialogModal');
        
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
        
        if (event.target === dialogModal) {
            dialogModal.style.display = 'none';
        }
    });
}

// Ajouter une nouvelle entrée
document.getElementById('addEntryBtn').addEventListener('click', async function() {
    if (!currentLibraryName) {
        showStatusMessage('Aucune bibliothèque sélectionnée', true);
        return;
    }

    const newId = nextId++;
    
    // Ajouter l'entrée sommaire
    bookLibrary.summary.unshift({
        id: newId,
        author: '',
        title: '',
        description: '',
        mainImage: ''
    });
    
    // Ajouter la structure de détails
    bookLibrary.details[newId] = {
        extendedDescription: '',
        images: [],
        additionalInfo: {
            publisher: '',
            year: '',
            isbn: '',
            pages: ''
        },
        comments: ''
    };
    
    // Réindexer les entrées
    await reindexEntries();
    renderTable();
    showStatusMessage('Nouvelle entrée ajoutée');
    
    // Ouvrir directement la fenêtre de détail pour le nouveau livre
    openDetailModal(newId);
});

// Démarrer l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
