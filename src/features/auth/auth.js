// ===========================
// AUTH.JS — Login & Signup
// ===========================

const isLoginPage = document.getElementById('loginForm') !== null;
const isSignupPage = document.getElementById('signupForm') !== null;

// ===========================
// SHARED UTILITIES
// ===========================
function setFieldState(fieldId, state, message = '') {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + 'Error');
  const wrap = field?.closest('.input-wrap');
  const status = wrap?.querySelector('.input-status');

  if (!field) return;

  field.classList.remove('is-valid', 'is-error');

  if (state === 'valid') {
    field.classList.add('is-valid');
    if (status) { status.className = 'input-status valid'; status.innerHTML = '<i class="fas fa-check"></i>'; }
    if (error) error.textContent = '';
  } else if (state === 'error') {
    field.classList.add('is-error');
    if (status) { status.className = 'input-status error'; status.innerHTML = '<i class="fas fa-times"></i>'; }
    if (error) error.textContent = message;
  } else {
    if (status) { status.className = 'input-status'; status.innerHTML = ''; }
    if (error) error.textContent = '';
  }
}

function showMessage(type, text) {
  const msg = document.getElementById('formMessage');
  if (!msg) return;
  msg.className = 'form-message ' + type;
  msg.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${text}`;
  msg.style.display = 'flex';
}

function setLoading(isLoading) {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = isLoading;
  if (text) text.style.display = isLoading ? 'none' : 'flex';
  if (loader) loader.style.display = isLoading ? 'flex' : 'none';
}

// ===========================
// PASSWORD TOGGLE
// ===========================
const togglePw = document.getElementById('togglePw');
const pwIcon = document.getElementById('pwIcon');

if (togglePw) {
  togglePw.addEventListener('click', () => {
    const pwField = document.getElementById('password');
    const isHidden = pwField.type === 'password';
    pwField.type = isHidden ? 'text' : 'password';
    pwIcon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
  });
}

// ===========================
// LOGIN PAGE
// ===========================
if (isLoginPage) {
  const loginForm = document.getElementById('loginForm');

  const validators = {
    email: (val) => {
      if (!val) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
      return '';
    },
    password: (val) => {
      if (!val) return 'Password is required';
      if (val.length < 6) return 'Password must be at least 6 characters';
      return '';
    },
  };

  function validateLoginField(id) {
    const val = document.getElementById(id)?.value || '';
    const err = validators[id](val);
    setFieldState(id, err ? 'error' : 'valid', err);
    return !err;
  }

  ['email', 'password'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => validateLoginField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('is-error')) validateLoginField(id);
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOk = validateLoginField('email');
    const passwordOk = validateLoginField('password');

    if (!emailOk || !passwordOk) return;

    setLoading(true);
    document.getElementById('formMessage').style.display = 'none';

    const payload = {
      email: document.getElementById('email').value.trim().toLowerCase(),
      password: document.getElementById('password').value,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = data.redirect || '/admin/dashboard.html';
        }, 1000);
      } else {
        showMessage('error', data.message || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      showMessage('error', 'Network error. Please try again.');
      setLoading(false);
    }
  });
}

// ===========================
// SIGNUP PAGE
// ===========================
if (isSignupPage) {
  const signupForm = document.getElementById('signupForm');
  const pwStrength = document.getElementById('pwStrength');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');

  // Role card visual selection
  const roleCards = document.querySelectorAll('.role-card');
  const roleSelect = document.getElementById('role');

  roleCards.forEach((card) => {
    card.addEventListener('click', () => {
      roleCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      if (roleSelect) {
        roleSelect.value = card.dataset.role;
        const err = validators.role(roleSelect.value);
        setFieldState('role', err ? 'error' : 'valid', err);
      }
    });
  });

  // Password strength checker
  function checkStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (password.length === 0) {
      strengthFill.className = 'strength-fill';
      strengthFill.style.width = '0%';
      strengthLabel.textContent = 'Password strength';
      return;
    }

    if (score <= 1) {
      strengthFill.className = 'strength-fill weak';
      strengthLabel.textContent = 'Weak password';
    } else if (score <= 2) {
      strengthFill.className = 'strength-fill medium';
      strengthLabel.textContent = 'Medium password';
    } else {
      strengthFill.className = 'strength-fill strong';
      strengthLabel.textContent = 'Strong password';
    }
  }

  const validators = {
    name: (val) => {
      if (!val || val.trim().length < 2) return 'Name must be at least 2 characters';
      if (!/^[A-Za-z\s]+$/.test(val)) return 'Name should only contain letters and spaces';
      return '';
    },
    email: (val) => {
      if (!val) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
      return '';
    },
    role: (val) => {
      if (!val) return 'Please select a role';
      return '';
    },
    password: (val) => {
      if (!val) return 'Password is required';
      if (val.length < 8) return 'Password must be at least 8 characters';
      return '';
    },
    confirmPassword: (val) => {
      const pw = document.getElementById('password')?.value || '';
      if (!val) return 'Please confirm your password';
      if (val !== pw) return 'Passwords do not match';
      return '';
    },
  };

  function validateSignupField(id) {
    const val = document.getElementById(id)?.value || '';
    const err = validators[id] ? validators[id](val) : '';
    setFieldState(id, err ? 'error' : 'valid', err);
    return !err;
  }

  // Password field events
  const pwField = document.getElementById('password');
  if (pwField) {
    pwField.addEventListener('input', () => {
      pwStrength.classList.add('visible');
      checkStrength(pwField.value);
      if (pwField.classList.contains('is-error')) validateSignupField('password');
    });
    pwField.addEventListener('blur', () => validateSignupField('password'));
  }

  ['name', 'email', 'role', 'confirmPassword'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => validateSignupField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('is-error')) validateSignupField(id);
    });
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = ['name', 'email', 'role', 'password', 'confirmPassword'];
    const allValid = fields.map((id) => validateSignupField(id)).every(Boolean);

    if (!allValid) return;

    setLoading(true);
    document.getElementById('formMessage').style.display = 'none';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim().toLowerCase(),
      role: document.getElementById('role').value,
      password: document.getElementById('password').value,
    };

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'Account created! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1500);
      } else {
        showMessage('error', data.message || 'Failed to create account');
        setLoading(false);
      }
    } catch (err) {
      showMessage('error', 'Network error. Please try again.');
      setLoading(false);
    }
  });
}