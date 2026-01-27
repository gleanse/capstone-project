const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

const prices = {
  'premium-detailing': 2500,
  'ceramic-coating': 8000,
  'powder-coating': 5000,
};

const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);

// validation functions
const validators = {
  name: (value) => {
    if (!value || value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^[A-Za-z\s]+$/.test(value)) {
      return 'Name should only contain letters and spaces';
    }
    return '';
  },

  email: (value) => {
    if (!value) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  },

  phone: (value) => {
    if (!value) {
      return 'Phone number is required';
    }
    const cleanPhone = value.replace(/\D/g, '');

    if (cleanPhone.length !== 11) {
      return 'Phone number must be 11 digits';
    }
    return '';
  },

  service: (value) => {
    if (!value) {
      return 'Please select a service';
    }
    return '';
  },

  date: (value) => {
    if (!value) {
      return 'Booking date is required';
    }
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return 'Please select a future date';
    }
    return '';
  },

  time: (value) => {
    if (!value) {
      return 'Booking time is required';
    }
    const [hours] = value.split(':').map(Number);
    if (hours < 8 || hours >= 18) {
      return 'Please select a time between 8:00 AM and 6:00 PM';
    }
    return '';
  },
};

// real time validation
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById(`${fieldId}Error`);
  const error = validators[fieldId](field.value);

  if (error) {
    field.classList.add('invalid');
    field.classList.remove('valid');
    errorSpan.textContent = error;
    return false;
  } else {
    field.classList.remove('invalid');
    field.classList.add('valid');
    errorSpan.textContent = '';
    return true;
  }
}

// add real time validation listeners
['name', 'email', 'phone', 'service', 'date', 'time'].forEach((fieldId) => {
  const field = document.getElementById(fieldId);
  field.addEventListener('blur', () => validateField(fieldId));
  field.addEventListener('input', () => {
    if (field.classList.contains('invalid')) {
      validateField(fieldId);
    }
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fields = ['name', 'email', 'phone', 'service', 'date', 'time'];
  let isValid = true;

  fields.forEach((fieldId) => {
    if (!validateField(fieldId)) {
      isValid = false;
    }
  });

  if (!isValid) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Please fix the errors above before submitting';
    messageDiv.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  messageDiv.style.display = 'none';

  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    phone: document.getElementById('phone').value.replace(/\s/g, ''),
    service: document.getElementById('service').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    amount: prices[document.getElementById('service').value],
  };

  try {
    const response = await fetch('/api/create-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      messageDiv.className = 'message success';
      messageDiv.textContent = 'Booking confirmed! Redirecting to payment...';
      messageDiv.style.display = 'block';

      // redirect to xendit payment
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1500);
    } else {
      throw new Error(data.message || 'Booking failed');
    }
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Error: ' + error.message;
    messageDiv.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Book & Pay Now';
  }
});
