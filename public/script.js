document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('exportForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const alertContainer = document.getElementById('alertContainer');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous alerts
        alertContainer.innerHTML = '';
        
        // Get form data
        const formData = {
            crispIdentifier: document.getElementById('crispIdentifier').value.trim(),
            crispKey: document.getElementById('crispKey').value.trim(),
            websiteId: document.getElementById('websiteId').value.trim(),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value
        };

        // Validate required fields
        if (!formData.crispIdentifier || !formData.crispKey || !formData.websiteId) {
            showAlert('Please fill in all required fields.', 'danger');
            return;
        }

        // Validate date range
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start > end) {
                showAlert('Start date must be before end date.', 'danger');
                return;
            }
        }

        try {
            // Show loading overlay
            showLoading(true);

            // Make API request
            const response = await fetch('/api/export-conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            // Check if response is CSV
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/csv')) {
                throw new Error('Invalid response format. Expected CSV file.');
            }

            // Get the blob and create download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            a.download = `crisp-conversations-${timestamp}.csv`;
            
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('Conversations exported successfully!', 'success');

        } catch (error) {
            console.error('Export error:', error);
            showAlert(`Export failed: ${error.message}`, 'danger');
        } finally {
            // Hide loading overlay
            showLoading(false);
        }
    });

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertContainer.innerHTML = alertHtml;
        
        // Auto-dismiss success alerts after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    }

    // Set default end date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = today;
});
