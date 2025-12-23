// Main JavaScript file for Consultancy Service Portal

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (window.bootstrap) {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (el) { return new bootstrap.Tooltip(el); });
            var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            popoverTriggerList.map(function (el) { return new bootstrap.Popover(el); });
        }
    } catch (e) {}
});

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
    }
    form.classList.add('was-validated');
}

// AJAX helper function
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            let message = `Request failed (${response.status})`;
            if (contentType.includes('application/json')) {
                const errJson = await response.json().catch(() => null);
                if (errJson && errJson.message) message = errJson.message;
                return { success: false, message };
            }
            const errText = await response.text().catch(() => '');
            if (errText) message = errText.substring(0, 200);
            return { success: false, message };
        }
        if (contentType.includes('application/json')) {
            const result = await response.json();
            return result;
        }
        return { success: false, message: 'Unexpected response format' };
    } catch (error) {
        console.error('Request failed:', error);
        return { success: false, message: 'Request failed' };
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Use existing toast container if available, otherwise create one
    const toastContainer = document.getElementById('toastContainer') || document.body;
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.style.minWidth = '250px';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            toast.remove();
        }
    }, 5000);
}

// Booking form handler
function handleBookingSubmit(event) {
    event.preventDefault();
    
    const form = document.getElementById('bookingForm');
    const formData = new FormData(form);
    
    const bookingData = {
        workerId: formData.get('workerId'),
        serviceCategory: formData.get('serviceCategory'),
        serviceDescription: formData.get('serviceDescription'),
        requestedDate: formData.get('requestedDate'),
        requestedTime: formData.get('requestedTime'),
        budget: formData.get('budget'),
        location: JSON.stringify({
            address: formData.get('address')
        })
    };

    console.log('Sending booking request:', bookingData);
    
    // Disable submit button during submission
    const submitBtn = document.getElementById('bookingSubmitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    
    makeRequest('/bookings', 'POST', bookingData)
        .then(result => {
            console.log('Booking response:', result);
            if (result.success) {
                showToast('Booking request created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/client/bookings';
                }, 1500);
            } else {
                showToast(result.message || 'Failed to create booking', 'danger');
            }
        }).catch(error => {
            console.error('Booking request error:', error);
            showToast('Failed to create booking request', 'danger');
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
}

// Add event listener to booking form
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
});

// Accept/Reject booking
function handleBookingAction(bookingId, action, param = '') {
    let url, method = 'POST', data = {};
    
    if (action === 'accept' || action === 'reject') {
        url = `/bookings/${bookingId}/${action}`;
        if (action === 'reject' && param) {
            data.reason = param;
        }
    } else if (action === 'status') {
        url = `/bookings/${bookingId}/status`;
        method = 'PUT';
        data.status = param;
    } else if (action === 'cancel') {
        url = `/bookings/${bookingId}/cancel`;
        if (param) {
            data.reason = param;
        }
    } else {
        console.error('Unknown action:', action);
        return;
    }

    makeRequest(url, method, data)
        .then(result => {
            if (result.success) {
                let message = '';
                if (action === 'accept') {
                    message = 'Booking accepted successfully!';
                } else if (action === 'reject') {
                    message = 'Booking rejected successfully!';
                } else if (action === 'status') {
                    message = `Booking status updated to ${param}!`;
                } else if (action === 'cancel') {
                    message = 'Booking cancelled successfully!';
                }
                showToast(message, 'success');
                // Redirect to appropriate page instead of reloading
                setTimeout(() => {
                    // Check if we're on a detail page
                    if (window.location.pathname.includes('/bookings/') && !window.location.pathname.includes('/bookings/new')) {
                        // On detail page, redirect to list page
                        if (window.location.pathname.includes('/worker/')) {
                            window.location.href = '/worker/requests';
                        } else {
                            window.location.href = '/client/bookings';
                        }
                    } else {
                        // On list page, just reload to show updated status
                        window.location.reload();
                    }
                }, 1500);
            } else {
                showToast(result.message || `Failed to ${action} booking`, 'danger');
            }
        })
        .catch(error => {
            console.error('Booking action error:', error);
            showToast('An error occurred. Please try again.', 'danger');
        });
}

// Rating stars
function setRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('bi-star-fill');
            star.classList.remove('bi-star');
        } else {
            star.classList.add('bi-star');
            star.classList.remove('bi-star-fill');
        }
    });
    document.getElementById('rating').value = rating;
}

// Export functions for use in other scripts
window.ConsultancyPortal = {
    makeRequest,
    showToast,
    handleBookingSubmit,
    handleBookingAction,
    setRating
};

