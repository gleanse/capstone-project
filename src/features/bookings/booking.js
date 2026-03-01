// State
const serviceId = window.location.pathname.split('/').pop();
let state = {
  service: null,
  selectedVariant: null,
  selectedDate: null,
  availabilityId: null,
  bookingId: null,
  timerInterval: null,
  timerSeconds: 15 * 60,
  currentStep: 1,
};

// Utils
function showStep(step) {
  document
    .querySelectorAll('.step-content')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById(`step-${step}`).classList.remove('hidden');
  state.currentStep = step;
  updateStepIndicator(step);
}

function updateStepIndicator(activeStep) {
  document.querySelectorAll('.step-indicator').forEach((el) => {
    const s = parseInt(el.dataset.step);
    const dot = el.querySelector('.step-dot');
    const label = el.querySelector('.step-label');
    if (s < activeStep) {
      dot.className =
        'step-dot w-8 h-8 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center text-xs font-bold transition-all duration-300';
      dot.innerHTML = '<i class="ph ph-check text-white text-sm"></i>';
      label.className =
        'step-label text-sm text-white/60 transition-colors duration-300';
    } else if (s === activeStep) {
      dot.className =
        'step-dot w-8 h-8 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center text-xs font-bold transition-all duration-300';
      dot.innerHTML = s;
      label.className =
        'step-label text-sm text-white font-medium transition-colors duration-300';
    } else {
      dot.className =
        'step-dot w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white/40 transition-all duration-300';
      dot.innerHTML = s;
      label.className =
        'step-label text-sm text-white/40 transition-colors duration-300';
    }
  });

  // Update connector lines
  for (let i = 1; i <= 3; i++) {
    const line = document.getElementById(`line-${i}`);
    line.className = `step-line flex-1 h-px mx-3 transition-colors duration-300 ${
      i < activeStep ? 'bg-red-500/50' : 'bg-white/10'
    }`;
  }
}

function showModal(title, message, onConfirm, confirmLabel = 'Yes, go back') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  document.getElementById('modal-confirm-btn').textContent = confirmLabel;
  const modal = document.getElementById('modal-confirm');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel');

  const cleanup = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  };

  document.getElementById('modal-confirm-btn').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
  document.getElementById('modal-cancel').addEventListener('click', cleanup);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(price) {
  return (
    '₱' +
    parseFloat(price).toLocaleString('en-PH', { minimumFractionDigits: 2 })
  );
}

// Timer
function startTimer() {
  state.timerSeconds = 15 * 60;
  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    const m = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
    const s = String(state.timerSeconds % 60).padStart(2, '0');
    const display = `${m}:${s}`;
    document.getElementById('timer-display').textContent = display;
    document.getElementById('timer-display-2').textContent = display;
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      handleTimerExpired();
    }
  }, 1000);
}

function handleTimerExpired() {
  showModal(
    'Time Expired',
    'Your slot reservation has expired. You will be redirected to select a new date.',
    async () => {
      await fetch('/api/booking/release', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: state.bookingId }),
      });
      showStep(2);
      loadDates();
    }
  );
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// Load service
async function loadService() {
  const res = await fetch(`/api/booking/service/${serviceId}`);
  const json = await res.json();
  if (!json.success) return;
  state.service = json.data;

  document.getElementById('service-skeleton').classList.add('hidden');
  document.getElementById('service-heading').classList.remove('hidden');
  document.getElementById('service-name').textContent = state.service.name;

  renderVariants(state.service.variants);
}

// Step 1 - Variants
function renderVariants(variants) {
  const container = document.getElementById('variants-container');
  container.innerHTML = '';

  if (!variants || variants.length === 0) {
    // No variants — service uses base price
    const card = document.createElement('div');
    card.className =
      'variant-card cursor-pointer flex items-center justify-between bg-white/5 border-2 border-red-500 rounded-xl px-5 py-4 transition-all duration-200 selected';
    card.innerHTML = /* html */ `
          <div class="flex items-center gap-3">
            <i class="ph ph-check-circle text-red-500 text-xl"></i>
            <span class="text-white font-medium">Standard</span>
          </div>
          <span class="text-white font-bold">${formatPrice(
            state.service.price
          )}</span>
        `;
    container.appendChild(card);
    state.selectedVariant = {
      id: null,
      name: 'Standard',
      price: state.service.price,
    };
    document.getElementById('btn-step1-next').disabled = false;
    return;
  }

  variants.forEach((v) => {
    const card = document.createElement('div');
    card.className =
      'variant-card cursor-pointer flex items-center justify-between bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 transition-all duration-200 hover:border-white/30';
    card.dataset.id = v.id;
    card.dataset.name = v.name;
    card.dataset.price = v.price;
    card.innerHTML = /* html */ `
          <div class="flex items-center gap-3">
            <i class="ph ph-circle text-white/20 text-xl variant-icon"></i>
            <span class="text-white/70 font-medium variant-name">${
              v.name
            }</span>
          </div>
          <span class="text-white font-bold">${formatPrice(v.price)}</span>
        `;
    card.addEventListener('click', () => selectVariant(card, v));
    container.appendChild(card);
  });
}

function selectVariant(card, variant) {
  document.querySelectorAll('.variant-card').forEach((c) => {
    c.classList.remove('border-red-500');
    c.classList.add('border-white/10');
    c.querySelector('.variant-icon').className =
      'ph ph-circle text-white/20 text-xl variant-icon';
    c.querySelector('.variant-name').classList.remove('text-white');
    c.querySelector('.variant-name').classList.add('text-white/70');
  });
  card.classList.add('border-red-500');
  card.classList.remove('border-white/10');
  card.querySelector('.variant-icon').className =
    'ph ph-check-circle text-red-500 text-xl variant-icon';
  card.querySelector('.variant-name').classList.add('text-white');
  card.querySelector('.variant-name').classList.remove('text-white/70');
  state.selectedVariant = variant;
  document.getElementById('btn-step1-next').disabled = false;
}

// Step 2 - Calendar
let calendarData = {};
let calendarMonth = new Date();
calendarMonth.setDate(1);

async function loadDates() {
  document.getElementById('dates-empty').classList.add('hidden');
  document.getElementById('btn-step2-next').disabled = true;
  document.getElementById('selected-date-display').classList.add('hidden');
  state.selectedDate = null;
  state.availabilityId = null;
  calendarData = {};

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = Array(35)
    .fill('<div class="skeleton-line h-9 rounded-lg"></div>')
    .join('');

  const res = await fetch(`/api/booking/availability/${serviceId}`);
  const json = await res.json();

  if (json.success && json.data.length > 0) {
    json.data.forEach((slot) => {
      const dateStr = slot.date.split('T')[0];
      calendarData[dateStr] = slot;
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  const monthYearEl = document.getElementById('cal-month-year');
  const prevBtn = document.getElementById('cal-prev');

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  monthYearEl.textContent = calendarMonth.toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  prevBtn.disabled = calendarMonth <= currentMonth;

  // Render day headers
  const headersEl = document.getElementById('cal-day-headers');
  headersEl.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map(
      (d) =>
        `<div class="text-center text-xs text-white/30 uppercase tracking-widest py-3">${d}</div>`
    )
    .join('');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      d
    ).padStart(2, '0')}`;
    const slot = calendarData[dateStr];
    const isPast = dateObj < today;
    const isAvailable = !isPast && slot;
    const isSelected =
      state.selectedDate && state.selectedDate.split('T')[0] === dateStr;
    const isToday = dateObj.toDateString() === today.toDateString();

    const cell = document.createElement('div');
    cell.className =
      'relative flex items-center justify-center rounded-lg h-10 text-sm font-medium transition-all duration-200 ';

    if (isSelected) {
      cell.className +=
        'bg-red-500 text-white cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]';
    } else if (isAvailable) {
      cell.className +=
        'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white cursor-pointer border border-green-500/40';
      cell.addEventListener('click', () => confirmSelectDate(slot, dateStr));
    } else {
      cell.className += 'text-white/20 cursor-not-allowed';
    }

    cell.textContent = d;

    if (isToday) {
      const dot = document.createElement('div');
      dot.className =
        'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ' +
        (isSelected ? 'bg-white' : 'bg-white/40');
      cell.appendChild(dot);
    }

    grid.appendChild(cell);
  }
}

function confirmSelectDate(slot, dateStr) {
  if (state.selectedDate && state.selectedDate.split('T')[0] === dateStr) {
    state.selectedDate = null;
    state.availabilityId = null;
    document.getElementById('btn-step2-next').disabled = true;
    document.getElementById('selected-date-display').classList.add('hidden');
    renderCalendar();
    return;
  }

  const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  showModal(
    'Confirm Date',
    `Book for ${label}? You can still go back to change this.`,
    () => {
      state.selectedDate = slot.date;
      state.availabilityId = slot.availability_id;
      document.getElementById('btn-step2-next').disabled = false;

      const display = document.getElementById('selected-date-display');
      display.classList.remove('hidden');
      display.classList.add('flex');
      document.getElementById('selected-date-text').textContent = `${label} — ${
        slot.remaining
      } slot${slot.remaining > 1 ? 's' : ''} left`;

      renderCalendar();
    }
  );
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});

// Lock slot
async function lockSlot() {
  const res = await fetch('/api/booking/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId,
      variantId: state.selectedVariant?.id || null,
      availabilityId: state.availabilityId,
    }),
  });
  const json = await res.json();
  if (json.success) {
    state.bookingId = json.data.id;
    startTimer();
  }
  return json.success;
}

// Step 4 - Payment summary
function populateSummary() {
  const price = state.selectedVariant?.price || state.service?.price || 0;
  document.getElementById('summary-service').textContent =
    state.service?.name || '';
  document.getElementById('summary-variant').textContent =
    state.selectedVariant?.name || 'Standard';
  document.getElementById('summary-date').textContent = formatDate(
    state.selectedDate
  );
  document.getElementById('summary-price').textContent = formatPrice(price);
  document.getElementById('full-amount').textContent = formatPrice(price);
  document.getElementById('down-amount').textContent = formatPrice(price / 2);
}

// Payment option toggle
document.querySelectorAll('.payment-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.payment-option').forEach((o) => {
      o.classList.remove('border-red-500');
      o.classList.add('border-white/10');
      o.querySelector('i').className = 'ph ph-circle text-white/30 text-xl';
    });
    opt.classList.add('border-red-500');
    opt.classList.remove('border-white/10');
    opt.querySelector('i').className =
      'ph ph-check-circle text-red-500 text-xl';
    opt.querySelector('input').checked = true;
  });
});

// Navigation
document.getElementById('btn-back-services').addEventListener('click', () => {
  if (state.currentStep === 1) {
    showModal(
      'Leave Booking?',
      'Are you sure you want to go back? Your variant selection will be lost.',
      () => (window.location.href = '/services')
    );
  } else {
    showModal(
      'Leave Booking?',
      'Are you sure you want to go back to services? Your progress will be lost.',
      () => (window.location.href = '/services')
    );
  }
});

document.getElementById('btn-step1-next').addEventListener('click', () => {
  showStep(2);
  loadDates();
});

document.getElementById('btn-step2-back').addEventListener('click', () => {
  showStep(1);
});

document
  .getElementById('btn-step2-next')
  .addEventListener('click', async () => {
    const btn = document.getElementById('btn-step2-next');
    btn.disabled = true;
    btn.innerHTML =
      '<i class="ph ph-spinner animate-spin"></i> Reserving slot...';
    const success = await lockSlot();
    if (success) {
      showStep(3);
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Continue <i class="ph ph-arrow-right"></i>';
      alert('Failed to lock slot. Please try again.');
    }
  });

document.getElementById('btn-step3-back').addEventListener('click', () => {
  showModal(
    'Release Slot?',
    'Going back will release your reserved slot and someone else may take it. Are you sure?',
    async () => {
      stopTimer();
      const res = await fetch('/api/booking/release', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: state.bookingId }),
      });
      const json = await res.json();
      if (!json.success) {
        alert('Failed to release slot. Please try again.');
        startTimer();
        return;
      }
      showStep(2);
      loadDates();
    }
  );
});

document
  .getElementById('btn-step3-next')
  .addEventListener('click', async () => {
    const name = document.getElementById('input-name').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const phone = document.getElementById('input-phone').value.trim();
    const plate = document.getElementById('input-plate').value.trim();
    const model = document.getElementById('input-model').value.trim();
    const color = document.getElementById('input-color').value.trim();
    const description = document
      .getElementById('input-description')
      .value.trim();

    if (!name || !email || !phone || !plate || !model || !color) {
      alert('Please fill in all required fields.');
      return;
    }

    const res = await fetch(`/api/booking/${state.bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        motorcyclePlate: plate,
        motorcycleModel: model,
        motorcycleColor: color,
        motorcycleDescription: description,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      alert('Failed to save details. Please try again.');
      return;
    }

    populateSummary();
    showStep(4);
  });

document.getElementById('btn-step4-back').addEventListener('click', () => {
  showStep(3);
});

document.getElementById('btn-pay').addEventListener('click', () => {
  const paymentType = document.querySelector(
    'input[name="payment_type"]:checked'
  ).value;
  // TODO: call Xendit payment API
  console.log('Proceeding to payment:', paymentType);
});

// Init
loadService();
