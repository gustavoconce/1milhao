const MAX_MONEY_VALUE = 10000000;
  const moneyFieldIds = ['hero-initial', 'hero-monthly', 'sim-initial', 'sim-monthly'];
  const heroMoneyFieldIds = ['hero-initial', 'hero-monthly'];
  const simMoneyFieldIds = ['sim-initial', 'sim-monthly'];
  const step2FieldIds = ['investment-objective', 'investment-relation'];
  const step3FieldIds = ['full-name', 'email', 'phone', 'simulation-goal'];
  const strategyFieldIds = ['strategy-full-name', 'strategy-email', 'strategy-phone', 'strategy-simulation-goal'];
  const CDI_ANNUAL_RATE = 0.1483;
  const riskProfiles = {
    conservador: { label: 'Conservador', cdiMultiplier: 1.02 },
    moderado: { label: 'Moderado', cdiMultiplier: 1.08 },
    agressivo: { label: 'Agressivo', cdiMultiplier: 1.15 }
  };
  let currentRiskProfile = 'conservador';

  function goToSimulator() {
    formatarNumeroBR(document.getElementById('hero-initial'));
    formatarNumeroBR(document.getElementById('hero-monthly'));

    if (!updateHeroValidation(true)) {
      const firstInvalidField = heroMoneyFieldIds
        .map((id) => document.getElementById(id))
        .find((field) => !isMoneyFieldValid(field));
      firstInvalidField.focus();
      document.querySelector('.sim-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    document.getElementById('page-landing').style.display   = 'none';
    document.getElementById('page-simulator').style.display = 'flex';
    showSimulatorStep(1);
    window.scrollTo(0, 0);

    // Sync values from hero card to simulator form
    syncMoneyField('hero-initial', 'sim-initial');
    syncMoneyField('hero-monthly', 'sim-monthly');
    updateSimStep1Validation(false);
  }

  function goToLanding() {
    document.getElementById('page-simulator').style.display = 'none';
    document.getElementById('page-landing').style.display   = 'block';
    showSimulatorStep(1);
    window.scrollTo(0, 0);
  }

  function showSimulatorStep(step) {
    const targetId = step === 'results' ? 'sim-step-results' : `sim-step-${step}`;
    document.querySelectorAll('.sim-step').forEach((screen) => {
      screen.classList.toggle('active', screen.id === targetId);
    });
  }

  function goToStep1() {
    showSimulatorStep(1);
    window.scrollTo(0, 0);
  }

  function goToStep2() {
    simMoneyFieldIds.forEach((id) => formatarNumeroBR(document.getElementById(id)));

    if (!updateSimStep1Validation(true)) {
      const firstInvalidField = [...simMoneyFieldIds, ...step2FieldIds]
        .map((id) => document.getElementById(id))
        .find((field) => {
          if (simMoneyFieldIds.includes(field.id)) return !isMoneyFieldValid(field);
          return !isStep2FieldValid(field);
        });
      firstInvalidField.focus();
      return;
    }

    showResults();
  }

  function goToStep3() {
    if (!updateStep2Validation(true)) {
      const firstInvalidField = step2FieldIds
        .map((id) => document.getElementById(id))
        .find((field) => !isStep2FieldValid(field));
      firstInvalidField.focus();
      return;
    }

    showSimulatorStep(3);
    updateStep3Validation(false);
    window.scrollTo(0, 0);
  }

  function backToStep2() {
    showSimulatorStep(1);
    updateSimStep1Validation(false);
    window.scrollTo(0, 0);
  }

  function parseMoneyValue(input) {
    const rawValue = input.dataset.rawValue || '';
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatarNumeroBR(input) {
    let digits = input.dataset.rawDigits || input.value.replace(/\D/g, '');

    if (digits.length >= 5) {
      const maxDigits = String(MAX_MONEY_VALUE).length + 1;
      digits = digits.slice(0, maxDigits);
    }

    if (!digits) {
      input.value = '';
      input.dataset.rawValue = '';
      input.dataset.cleanValue = '';
      return;
    }

    let numericValue;
    let formattedValue;

    if (digits.length < 5) {
      numericValue = digits.length === 1
        ? Number(digits)
        : Number(digits.slice(0, -1) + '.' + digits.slice(-1));
      formattedValue = digits.length === 1
        ? digits
        : digits.slice(0, -1) + ',' + digits.slice(-1);
    } else {
      numericValue = Number(digits.slice(0, -1));
      if (numericValue > MAX_MONEY_VALUE) {
        numericValue = MAX_MONEY_VALUE;
        digits = String(MAX_MONEY_VALUE) + '0';
      }
      formattedValue = Math.trunc(numericValue).toLocaleString('pt-BR') + ',00';
    }

    input.dataset.rawDigits = digits;
    input.value = formattedValue;
    input.dataset.rawValue = String(numericValue);
    input.dataset.cleanValue = String(numericValue);
  }

  function syncMoneyField(sourceId, targetId) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    target.value = source.value;
    target.dataset.rawValue = source.dataset.rawValue || '';
    target.dataset.cleanValue = source.dataset.cleanValue || '';
    target.dataset.rawDigits = source.dataset.rawDigits || '';
  }

  function getMoneyDigitsAfterInput(input) {
    const currentDigits = input.dataset.rawDigits || '';
    const typedDigits = (input.dataset.pendingInputData || '').replace(/\D/g, '');
    const insertedDigits = typedDigits || input.value.replace(/\D/g, '');
    const replaceAll = input.dataset.pendingReplace === 'true';
    const inputType = input.dataset.pendingInputType || '';

    delete input.dataset.pendingInputType;
    delete input.dataset.pendingInputData;
    delete input.dataset.pendingReplace;

    if (inputType.startsWith('delete')) {
      return replaceAll ? '' : currentDigits.slice(0, -1);
    }

    if (inputType === 'insertFromPaste') {
      return replaceAll ? insertedDigits : currentDigits + insertedDigits;
    }

    if (inputType === 'insertText') {
      return replaceAll ? typedDigits : currentDigits + typedDigits;
    }

    return input.value.replace(/\D/g, '');
  }

  function isMoneyFieldValid(input) {
    const value = parseMoneyValue(input);
    return input.value.trim() !== '' && value > 0 && value <= MAX_MONEY_VALUE;
  }

  function updateHeroValidation(showErrors = false) {
    const fields = heroMoneyFieldIds.map((id) => document.getElementById(id));
    const isValid = fields.every(isMoneyFieldValid);
    const error = document.getElementById('hero-form-error');
    const buttons = [document.getElementById('hero-submit'), document.getElementById('why-submit')];

    fields.forEach((field) => {
      const invalid = showErrors && !isMoneyFieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.closest('.input-prefix').classList.toggle('invalid', invalid);
    });

    error.classList.toggle('visible', showErrors && !isValid);
    buttons.forEach((button) => {
      button.disabled = !isValid;
    });

    return isValid;
  }

  function updateSimStep1Validation(showErrors = false) {
    const moneyFields = simMoneyFieldIds.map((id) => document.getElementById(id));
    const step2Fields = step2FieldIds.map((id) => document.getElementById(id));
    const moneyValid = moneyFields.every(isMoneyFieldValid);
    const step2Valid = step2Fields.every(isStep2FieldValid);
    const isValid = moneyValid && step2Valid;
    const error = document.getElementById('sim-step1-error');
    const button = document.getElementById('sim-step1-next');

    moneyFields.forEach((field) => {
      const invalid = showErrors && !isMoneyFieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.closest('.input-prefix-sim').classList.toggle('invalid', invalid);
    });

    step2Fields.forEach((field) => {
      const invalid = showErrors && !isStep2FieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.classList.toggle('invalid', invalid);
    });

    if (error) error.classList.toggle('visible', showErrors && !isValid);
    if (button) button.disabled = !isValid;

    return isValid;
  }

  function updateStep2Validation(showErrors = false) {
    const fields = step2FieldIds.map((id) => document.getElementById(id));
    const isValid = fields.every(isStep2FieldValid);
    const error = document.getElementById('sim-step2-error');
    const button = document.getElementById('sim-step2-next');

    fields.forEach((field) => {
      const invalid = showErrors && !isStep2FieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.classList.toggle('invalid', invalid);
    });

    if (error) error.classList.toggle('visible', showErrors && !isValid);
    if (button) button.disabled = !isValid;

    return isValid;
  }

  function isStep2FieldValid(field) {
    return field.value.trim() !== '';
  }

  function isContactFieldValid(field) {
    const value = field.value.trim();

    if (field.type === 'email' || field.id.includes('email')) {
      return value !== '' && field.checkValidity();
    }

    if (field.id.includes('phone')) {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    }

    return value !== '';
  }

  function isStep3FieldValid(field) {
    return isContactFieldValid(field);
  }

  function updateStep3Validation(showErrors = false) {
    const fields = step3FieldIds.map((id) => document.getElementById(id));
    const isValid = fields.every(isStep3FieldValid);
    const error = document.getElementById('sim-step3-error');
    const button = document.getElementById('sim-step3-next');

    fields.forEach((field) => {
      const invalid = showErrors && !isStep3FieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.classList.toggle('invalid', invalid);
    });

    error.classList.toggle('visible', showErrors && !isValid);
    button.disabled = !isValid;

    return isValid;
  }

  function validateStep3(showErrors = false) {
    return updateStep3Validation(showErrors);
  }

  function updateStrategyValidation(showErrors = false) {
    const fields = strategyFieldIds.map((id) => document.getElementById(id));
    const isValid = fields.every(isContactFieldValid);
    const error = document.getElementById('strategy-form-error');
    const button = document.getElementById('strategy-submit');

    fields.forEach((field) => {
      const invalid = showErrors && !isContactFieldValid(field);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      field.classList.toggle('invalid', invalid);
    });

    error.classList.toggle('visible', showErrors && !isValid);
    button.disabled = !isValid;

    return isValid;
  }

  function unlockStrategyAssets() {
    if (!updateStrategyValidation(true)) {
      const firstInvalidField = strategyFieldIds
        .map((id) => document.getElementById(id))
        .find((field) => !isContactFieldValid(field));
      firstInvalidField.focus();
      return;
    }

    showLeadModal();
  }

  function showLeadModal() {
    const modal = document.getElementById('lead-modal');
    document.body.classList.add('lead-modal-open');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('button').focus();
  }

  function returnToLandingFromLeadModal() {
    const modal = document.getElementById('lead-modal');
    document.body.classList.remove('lead-modal-open');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    strategyFieldIds.forEach((id) => {
      document.getElementById(id).value = '';
    });
    updateStrategyValidation(false);
    goToLanding();
  }

  function showResults({ requireContact = false } = {}) {
    simMoneyFieldIds.forEach((id) => formatarNumeroBR(document.getElementById(id)));

    if (!updateSimStep1Validation(true)) {
      const firstInvalidField = [...simMoneyFieldIds, ...step2FieldIds]
        .map((id) => document.getElementById(id))
        .find((field) => {
          if (simMoneyFieldIds.includes(field.id)) return !isMoneyFieldValid(field);
          return !isStep2FieldValid(field);
        });
      firstInvalidField.focus();
      return;
    }

    if (requireContact && !validateStep3(true)) {
      const firstInvalidField = step3FieldIds
        .map((id) => document.getElementById(id))
        .find((field) => !isStep3FieldValid(field));
      firstInvalidField.focus();
      return;
    }

    const firstName = getFirstName();
    document.getElementById('dashboard-greeting').textContent = firstName
      ? `Perfeito, ${firstName}, temos uma simulação para você!`
      : 'Perfeito, temos uma simulação para você!';
    showSimulatorStep('results');
    setRiskProfile(currentRiskProfile);
    window.scrollTo(0, 0);
  }

  function getFirstName() {
    const fullName = document.getElementById('full-name').value.trim();
    return fullName.split(/\s+/)[0] || '';
  }

  function setInvestorProfile(profileKey) {
    currentRiskProfile = profileKey;
    document.querySelectorAll('.profile-option').forEach((button) => {
      button.classList.toggle('active', button.dataset.profile === profileKey);
    });
  }

  function setRiskProfile(profileKey) {
    currentRiskProfile = profileKey;
    document.querySelectorAll('.risk-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.profile === profileKey);
    });
    renderDashboard(profileKey);
  }

  function getSimulationInputs() {
    return {
      initial: parseMoneyValue(document.getElementById('sim-initial')),
      monthly: parseMoneyValue(document.getElementById('sim-monthly'))
    };
  }

  function calculateProjection(profileKey, rateAdjustment = 1, horizonYears = 1) {
    const { initial, monthly } = getSimulationInputs();
    const profile = riskProfiles[profileKey];
    const annualRate = CDI_ANNUAL_RATE * profile.cdiMultiplier * rateAdjustment;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const startYear = new Date().getFullYear();
    const series = [{ year: startYear, value: initial }];
    let amount = initial;

    for (let month = 1; month <= horizonYears * 12; month++) {
      amount = amount * (1 + monthlyRate) + monthly;

      if (month % 12 === 0) {
        series.push({
          year: startYear + month / 12,
          value: amount
        });
      }
    }

    return { annualRate, monthlyRate, finalAmount: amount, series };
  }

  function calculateYearsToMillion(profileKey) {
    const { initial, monthly } = getSimulationInputs();
    const profile = riskProfiles[profileKey];
    const annualRate = CDI_ANNUAL_RATE * profile.cdiMultiplier;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    let amount = initial;

    for (let month = 1; month <= 80 * 12; month++) {
      amount = amount * (1 + monthlyRate) + monthly;
      if (amount >= 1000000) {
        return Math.ceil(month / 12);
      }
    }

    return null;
  }

  function renderDashboard(profileKey) {
    const { initial, monthly } = getSimulationInputs();
    const yearsToMillion = calculateYearsToMillion(profileKey);
    const projectionYears = yearsToMillion || 80;
    const expected = calculateProjection(profileKey, 1, projectionYears);
    const pessimistic = calculateProjection(profileKey, 0.92, projectionYears);
    const optimistic = calculateProjection(profileKey, 1.08, projectionYears);

    document.getElementById('summary-initial').textContent = formatCurrency(initial);
    document.getElementById('summary-monthly').textContent = formatCurrency(monthly);
    document.getElementById('summary-expected').textContent = formatCurrency(expected.finalAmount);
    document.getElementById('summary-pessimistic').textContent = formatCurrency(pessimistic.finalAmount);
    document.getElementById('summary-optimistic').textContent = formatCurrency(optimistic.finalAmount);
    document.getElementById('summary-pessimistic-rate').textContent = formatRateLabel(pessimistic.annualRate);
    document.getElementById('summary-expected-rate').textContent = formatRateLabel(expected.annualRate);
    document.getElementById('summary-optimistic-rate').textContent = formatRateLabel(optimistic.annualRate);
    document.getElementById('summary-million').textContent = yearsToMillion ? formatYears(yearsToMillion) : 'acima de 80 anos';
    document.getElementById('chart-wrap').innerHTML = buildChartSvg(expected.series, pessimistic.series, optimistic.series);
  }

  function buildChartSvg(expectedSeries, pessimisticSeries, optimisticSeries) {
    const width = 920;
    const height = 280;
    const margin = { top: 18, right: 22, bottom: 42, left: 76 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const allValues = [...expectedSeries, ...pessimisticSeries, ...optimisticSeries].map((point) => point.value);
    const maxValue = Math.max(...allValues, 1000000);
    const yMax = getNiceChartMax(maxValue);
    const maxIndex = expectedSeries.length - 1 || 1;
    const x = (index) => margin.left + (index / maxIndex) * plotWidth;
    const y = (value) => margin.top + plotHeight - (value / yMax) * plotHeight;
    const pathFrom = (series) => series
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`)
      .join(' ');
    const yTicks = Array.from({ length: 6 }, (_, index) => yMax * index / 5);
    const xStep = Math.max(1, Math.ceil(maxIndex / 12));
    const xTicks = expectedSeries.filter((_, index) => index > 0 && (index % xStep === 0 || index === maxIndex));

    return `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico da simulação de patrimônio">
        ${yTicks.map((tick) => `
          <line x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" stroke="#d0d5dd" stroke-width="1" opacity=".28" />
        `).join('')}
        ${xTicks.map((point) => `
          <line x1="${x(expectedSeries.indexOf(point))}" y1="${margin.top}" x2="${x(expectedSeries.indexOf(point))}" y2="${height - margin.bottom}" stroke="#d0d5dd" stroke-width="1" opacity=".18" />
        `).join('')}
        ${yTicks.map((tick) => `
          <text x="${margin.left - 14}" y="${y(tick) + 4}" text-anchor="end" fill="#344054" font-size="12">${formatAxisCurrency(tick)}</text>
        `).join('')}
        ${xTicks.map((point, index) => `
          <text x="${x(expectedSeries.indexOf(point))}" y="${height - 16}" text-anchor="middle" fill="#98a2b3" font-size="12">${point.year}</text>
        `).join('')}
        <path d="${pathFrom(pessimisticSeries)}" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="7 7" />
        <path d="${pathFrom(expectedSeries)}" fill="none" stroke="#155dcc" stroke-width="2.4" />
        <path d="${pathFrom(optimisticSeries)}" fill="none" stroke="#1f9d55" stroke-width="2" stroke-dasharray="7 7" />
      </svg>
    `;
  }

  function getNiceChartMax(value) {
    const million = 1000000;
    if (value <= million) return million;
    return Math.ceil(value / million) * million;
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatRateLabel(rate) {
    return `${(rate * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}% ao ano`;
  }

  function formatAxisCurrency(value) {
    if (value === 0) return 'R$ 0';
    if (value >= 1000000) return `R$ ${Math.round(value / 1000000)} Mi`;
    return `R$ ${Math.round(value / 1000)} mil`;
  }

  function updateSliderBg(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background =
      `linear-gradient(to right, #1a6fd4 ${pct}%, #d0d5dd ${pct}%)`;
  }

  function formatYears(value) {
    return Number(value) === 1 ? '1 ano' : value + ' anos';
  }

  moneyFieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener('beforeinput', (event) => {
      field.dataset.pendingInputType = event.inputType;
      field.dataset.pendingInputData = event.data || '';
      field.dataset.pendingReplace = field.selectionStart === 0 && field.selectionEnd === field.value.length ? 'true' : 'false';
    });
    field.addEventListener('keydown', (event) => {
      if (event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    });
    field.addEventListener('input', () => {
      field.dataset.rawDigits = getMoneyDigitsAfterInput(field);
      formatarNumeroBR(field);
      if (heroMoneyFieldIds.includes(id)) {
        updateHeroValidation(false);
      } else {
        updateSimStep1Validation(false);
      }
    });
    field.addEventListener('blur', () => {
      formatarNumeroBR(field);
      if (heroMoneyFieldIds.includes(id)) {
        updateHeroValidation(true);
      } else {
        updateSimStep1Validation(true);
      }
    });
  });

  step2FieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener('input', () => updateSimStep1Validation(false));
    field.addEventListener('change', () => updateSimStep1Validation(false));
    field.addEventListener('blur', () => updateSimStep1Validation(true));
  });

  step3FieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener('input', () => updateStep3Validation(false));
    field.addEventListener('change', () => updateStep3Validation(false));
    field.addEventListener('blur', () => updateStep3Validation(true));
  });

  strategyFieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener('input', () => updateStrategyValidation(false));
    field.addEventListener('change', () => updateStrategyValidation(false));
    field.addEventListener('blur', () => updateStrategyValidation(true));
  });

  ['phone', 'strategy-phone'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (event) => {
      if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
        event.preventDefault();
      }
    });
  });

  // Init slider backgrounds
  updateHeroValidation(false);
  updateSimStep1Validation(false);
  updateStep3Validation(false);
  updateStrategyValidation(false);
