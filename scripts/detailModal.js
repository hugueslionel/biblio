// scripts/detailModal.js

// Fonction pour ouvrir la fenêtre de détail
function openDetailModal(bookId) {
    const modal = document.getElementById('bookDetailModal');
    const summary = bookLibrary.summary.find(book => book.id === bookId);
    const details = bookLibrary.details[bookId] || {
        extendedDescription: '',
        images: [],
        additionalInfo: { publisher: '', year: '', isbn: '', pages: '' },
        comments: ''
    };
    
    // Sauvegarder l'ID en cours d'édition
    currentEditingId = bookId;
    
    // Remplir les champs du résumé
    document.getElementById('detailAuthor').textContent = summary?.author || '';
    document.getElementById('detailMainTitle').textContent = summary?.title || '';
    document.getElementById('detailSummary').textContent = summary?.description || '';
    
    // Remplir les champs détaillés
    document.getElementById('detailExtendedDescription').value = details.extendedDescription || '';
    document.getElementById('detailPublisher').value = details.additionalInfo?.publisher || '';
    document.getElementById('detailYear').value = details.additionalInfo?.year || '';
    document.getElementById('detailISBN').value = details.additionalInfo?.isbn || '';
    document.getElementById('detailPages').value = details.additionalInfo?.pages || '';
    document.getElementById('detailComments').value = details.comments || '';
    
    // Mettre à jour le titre
    document.getElementById('detailTitle').textContent = 
        summary?.title ? `Détails: ${summary.title}` : 'Nouveau livre';
    
    // Afficher la galerie d'images
    renderImageGallery(details.images || []);
    
    // Ouvrir la modal
    modal.style.display = 'block';
}

// Fonction pour afficher la galerie d'images
function renderImageGallery(images) {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '';
    
    if (images.length === 0) {
        gallery.innerHTML = '<div class="no-images">Aucune image</div>';
        return;
    }
    
    images.forEach((image, index) => {
        const container = document.createElement('div');
        container.className = 'gallery-image-container';
        
        const img = document.createElement('img');
        img.src = image;
        img.className = 'gallery-image';
        img.alt = `Image ${index + 1}`;
        
        img.addEventListener('click', function() {
            document.getElementById('expandedImg').src = this.src;
            document.getElementById('imageModal').style.display = 'block';
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.textContent = '×';
        removeBtn.title = 'Supprimer cette image';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Supprimer cette image ?')) {
                images.splice(index, 1);
                renderImageGallery(images);
            }
        });
        
        container.appendChild(img);
        container.appendChild(removeBtn);
        gallery.appendChild(container);
    });
}

// Gérer le glisser-déposer d'images
function setupDragAndDrop() {
    const uploadArea = document.querySelector('.image-upload-area');
    const fileInput = document.getElementById('multiImageInput');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        handleImageFiles(files);
    });
    
    document.getElementById('addImagesBtn').addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleImageFiles(e.target.files);
            // Réinitialiser l'input pour permettre de sélectionner les mêmes fichiers
            e.target.value = '';
        }
    });
}

// Traiter les fichiers images
async function handleImageFiles(files) {
    if (!currentEditingId) return;
    
    const details = bookLibrary.details[currentEditingId];
    if (!details.images) details.images = [];
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showStatusMessage('Aucun fichier image valide', true);
        return;
    }
    
    for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limite
            showStatusMessage(`L'image ${file.name} est trop volumineuse (>5MB)`, true);
            continue;
        }
        
        const base64 = await readFileAsBase64(file);
        details.images.push(base64);
    }
    
    // Mettre à jour la galerie
    renderImageGallery(details.images);
    
    // Si c'est la première image, la définir comme image principale dans le résumé
    const summary = bookLibrary.summary.find(b => b.id === currentEditingId);
    if (summary && !summary.mainImage && details.images.length > 0) {
        summary.mainImage = details.images[0];
    }
    
    showStatusMessage(`${imageFiles.length} image(s) ajoutée(s)`);
}

// Configurer les événements de la fenêtre de détail
function setupDetailModalEvents() {
    // Enregistrer les modifications
    document.getElementById('saveDetailsBtn').addEventListener('click', async function() {
        if (!currentEditingId) return;
        
        const summary = bookLibrary.summary.find(b => b.id === currentEditingId);
        const details = bookLibrary.details[currentEditingId];
        
        // Mettre à jour le résumé
        if (summary) {
            summary.author = document.getElementById('detailAuthor').textContent;
            summary.title = document.getElementById('detailMainTitle').textContent;
            summary.description = document.getElementById('detailSummary').textContent;
        }
        
        // Mettre à jour les détails
        if (details) {
            details.extendedDescription = document.getElementById('detailExtendedDescription').value;
            details.comments = document.getElementById('detailComments').value;
            details.additionalInfo = {
                publisher: document.getElementById('detailPublisher').value,
                year: document.getElementById('detailYear').value,
                isbn: document.getElementById('detailISBN').value,
                pages: document.getElementById('detailPages').value
            };
        }
        
        // Sauvegarder
        await saveCurrentLibrary();
        
        // Fermer la modal
        document.getElementById('bookDetailModal').style.display = 'none';
        currentEditingId = null;
        
        // Rafraîchir le tableau
        renderTable();
        showStatusMessage('Modifications enregistrées');
    });

    // Annuler les modifications
    document.getElementById('cancelDetailsBtn').addEventListener('click', function() {
        document.getElementById('bookDetailModal').style.display = 'none';
        currentEditingId = null;
        showStatusMessage('Modifications annulées');
    });

    // Fermer la modal
    document.querySelector('.close-detail').addEventListener('click', function() {
        document.getElementById('bookDetailModal').style.display = 'none';
        currentEditingId = null;
    });

    // Fermer en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('bookDetailModal');
        if (event.target === modal) {
            modal.style.display = 'none';
            currentEditingId = null;
        }
    });
}

// Exporter les fonctions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openDetailModal, renderImageGallery, setupDragAndDrop, setupDetailModalEvents
    };
}
