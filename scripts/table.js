// scripts/table.js

// Fonction pour rendre le tableau avec les données actuelles
async function renderTable() {
    const tableBody = document.getElementById('bookTableBody');
    tableBody.innerHTML = '';
    
    if (!currentLibraryName || bookLibrary.summary.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = !currentLibraryName 
            ? 'Aucune bibliothèque sélectionnée. Choisissez ou créez une bibliothèque.'
            : 'Aucun livre dans cette bibliothèque. Cliquez sur "Nouvelle entrée" pour commencer.';
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
        cell.style.color = '#7f8c8d';
        cell.style.padding = '30px';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    bookLibrary.summary.forEach((book, index) => {
        const row = document.createElement('tr');
        row.className = 'clickable-row';
        
        // N° d'entrée
        const idCell = document.createElement('td');
        idCell.textContent = book.id;
        row.appendChild(idCell);
        
        // Auteur (sans édition directe)
        const authorCell = document.createElement('td');
        authorCell.textContent = book.author || '';
        row.appendChild(authorCell);
        
        // Titre (sans édition directe)
        const titleCell = document.createElement('td');
        titleCell.textContent = book.title || '';
        row.appendChild(titleCell);
        
        // Description (limitée à 100 caractères)
        const descCell = document.createElement('td');
        const shortDesc = book.description 
            ? (book.description.length > 100 ? book.description.substring(0, 100) + '...' : book.description)
            : '';
        descCell.textContent = shortDesc;
        descCell.title = book.description || '';
        row.appendChild(descCell);
        
        // Photo (affichage avec badge si plusieurs images)
        const photoCell = document.createElement('td');
        const details = bookLibrary.details[book.id];
        const images = details?.images || [];
        
        if (book.mainImage || (images && images.length > 0)) {
            const imgUrl = book.mainImage || images[0];
            const thumbnail = document.createElement('img');
            thumbnail.src = imgUrl;
            thumbnail.className = 'thumbnail';
            thumbnail.addEventListener('click', function(e) {
                e.stopPropagation();
                document.getElementById('expandedImg').src = this.src;
                document.getElementById('imageModal').style.display = 'block';
            });
            photoCell.appendChild(thumbnail);
            
            // Badge pour le nombre d'images
            if (images.length > 1) {
                const badge = document.createElement('span');
                badge.className = 'image-count-badge';
                badge.textContent = images.length;
                badge.title = `${images.length} images disponibles`;
                photoCell.appendChild(badge);
            }
        } else {
            const noImageText = document.createElement('span');
            noImageText.textContent = 'Aucune';
            noImageText.style.fontStyle = 'italic';
            noImageText.style.color = '#999';
            photoCell.appendChild(noImageText);
        }
        row.appendChild(photoCell);
        
        // Supprimer
        const actionsCell = document.createElement('td');
        actionsCell.className = 'supprimer-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Supprimer cette entrée';
        deleteBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrée n°${book.id} ?`)) {
                // Supprimer le résumé
                bookLibrary.summary.splice(index, 1);
                // Supprimer les détails
                delete bookLibrary.details[book.id];
                // Réindexer
                await reindexEntries();
                renderTable();
                showStatusMessage('Entrée supprimée');
            }
        });
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        
        // Ouvrir la fenêtre de détail au clic sur la ligne
        row.addEventListener('click', function(e) {
            // Ne pas ouvrir si on a cliqué sur le bouton de suppression
            if (!e.target.closest('.delete-btn')) {
                openDetailModal(book.id);
            }
        });
        
        tableBody.appendChild(row);
    });
}

// Recherche
function setupSearch() {
    document.getElementById('searchInput').addEventListener('input', function() {
        if (!currentLibraryName) return; // Pas de recherche si pas de bibliothèque
        
        const searchValue = this.value.toLowerCase();
        const rows = document.getElementById('bookTableBody').getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;
            
            for (let j = 1; j < cells.length - 1; j++) { // Ignorer l'ID et la dernière cellule (supprimer)
                const cellText = cells[j].textContent.toLowerCase();
                if (cellText.includes(searchValue)) {
                    found = true;
                    break;
                }
            }
            
            row.style.display = found ? '' : 'none';
        }
    });
}

// Exporter les fonctions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderTable, setupSearch };
}
