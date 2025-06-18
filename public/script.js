document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('exportForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const alertContainer = document.getElementById('alertContainer');

    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous alerts
        alertContainer.innerHTML = '';
        
        // Show loading overlay
        showLoading();

        try {
            const formData = {
                crispIdentifier: document.getElementById('crispIdentifier').value.trim(),
                crispKey: document.getElementById('crispKey').value.trim(),
                websiteId: document.getElementById('websiteId').value.trim(),
                startDate: document.getElementById('startDate').value || null,
                endDate: document.getElementById('endDate').value || null
            };

            // Validate form data
            if (!formData.crispIdentifier || !formData.crispKey || !formData.websiteId) {
                throw new Error('Please fill in all required fields');
            }

            // Validate date range if both dates are provided
            if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
                throw new Error('Start date cannot be after end date');
            }

            const response = await fetch('/api/export-conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // Check if response is JSON (error) or CSV (success)
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                // Try to parse error as JSON
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Export failed');
                } catch (parseError) {
                    // If JSON parsing fails, it might be an HTML error page
                    const text = await response.text();
                    if (text.includes('The page') || text.includes('<!DOCTYPE html>')) {
                        throw new Error('Server timeout or error. Please try again with a smaller date range or fewer conversations.');
                    } else {
                        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
                    }
                }
            }

            if (contentType && contentType.includes('text/csv')) {
                // Success - download CSV
                const contentDisposition = response.headers.get('Content-Disposition');
                const filename = contentDisposition
                    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                    : 'crisp-conversations.csv';

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                showAlert('Export completed successfully! Your CSV file has been downloaded.', 'success');
            } else {
                throw new Error('Unexpected response format');
            }

        } catch (error) {
            console.error('Export error:', error);
            showAlert(error.message);
        } finally {
            hideLoading();
        }
    });

    // Add some helpful validation
    const crispIdentifierInput = document.getElementById('crispIdentifier');
    const crispKeyInput = document.getElementById('crispKey');
    const websiteIdInput = document.getElementById('websiteId');

    // Add input validation hints
    crispIdentifierInput.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 10) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    crispKeyInput.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 20) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    websiteIdInput.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 20) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });
});
