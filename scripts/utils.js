// scripts/utils.js

// Fonction pour afficher un message de statut
function showStatusMessage(message, isError = false) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#e74c3c' : '#27ae60';
    
    // Effacer le message après 3 secondes
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

// Fonction pour afficher un dialogue de saisie personnalisé
function showDialog(title, defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('dialogModal');
        const titleElement = document.getElementById('dialogTitle');
        const input = document.getElementById('dialogInput');
        const okBtn = document.getElementById('dialogOk');
        const cancelBtn = document.getElementById('dialogCancel');
        
        titleElement.textContent = title;
        input.value = defaultValue;
        modal.style.display = 'block';
        
        // Focus sur l'input
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
        
        function cleanup() {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            input.removeEventListener('keydown', handleKeydown);
        }
        
        function handleOk() {
            const value = input.value.trim();
            cleanup();
            resolve(value || null);
        }
        
        function handleCancel() {
            cleanup();
            resolve(null);
        }
        
        function handleKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleOk();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        }
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        input.addEventListener('keydown', handleKeydown);
    });
}

// Fonction pour convertir un fichier en base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Exporter les fonctions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showStatusMessage, showDialog, readFileAsBase64 };
}
