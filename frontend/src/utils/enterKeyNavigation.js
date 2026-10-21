/**
 * enterKeyNavigation.js
 * 
 * Enables keyboard "Enter" navigation across all forms, dialogs, and modals:
 * - Pressing "Enter" in an input field automatically advances focus to the next field.
 * - Pressing "Shift + Enter" moves focus back to the previous field.
 * - In <textarea>, regular Enter creates a new line as expected, while Ctrl/Cmd+Enter advances.
 * - On the last input field, pressing Enter cleanly triggers the primary/submit button.
 * - Buttons, submit inputs, and standalone search bars retain their natural behavior.
 */

// Types of inputs where selecting text on focus is safe and beneficial
function isTextSelectable(el) {
  if (!el || el.tagName !== 'INPUT') return false;
  const safeTypes = ['text', 'search', 'tel', 'url', 'email', 'password', 'number'];
  return safeTypes.includes((el.type || 'text').toLowerCase());
}

// Find the closest logical container (form, modal, dialog, card, or content area)
function getFieldContainer(element) {
  if (!element) return document.body;

  // 1. Explicit form element
  const form = element.closest('form');
  if (form) return form;

  // 2. Modal or Dialog overlay/content
  const modal = element.closest(
    '[role="dialog"], .modal, .modal-content, [style*="position: fixed"], [style*="position: absolute"]'
  );
  if (modal) return modal;

  // 3. Card / Section / Form container
  const card = element.closest(
    '.admin-card, .id-card, .card, .glass-card, .panel, .auth-form, .auth-box, .patient-card, section'
  );
  if (card) return card;

  // 4. Main content container or body fallback
  return element.closest('.admin-main, .content-area, .admin-content, main') || document.body;
}

// Get all interactive, visible, and enabled fields in visual DOM order
function getNavigableFields(container) {
  if (!container) return [];

  const selector = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"])',
    'select',
    'textarea',
    'button[type="submit"]',
    'button.action-btn.primary',
    'button.btn-primary',
    'button.btn-save',
    'button.primary',
    'button.auth-btn'
  ].join(', ');

  const rawElements = Array.from(container.querySelectorAll(selector));

  return rawElements.filter(el => {
    // Skip disabled, readonly, or aria-hidden elements
    if (el.disabled || el.readOnly) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.tabIndex === -1) return false;
    if (el.hasAttribute('data-no-enter-nav')) return false;

    // Check visibility
    if (el.offsetParent === null) {
      const style = window.getComputedStyle(el);
      if (style.position !== 'fixed' && style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
    }

    return true;
  });
}

export function handleEnterKeyNavigation(e) {
  // Only intercept Enter key
  if (e.key !== 'Enter' && e.keyCode !== 13) return;

  // Ignore during IME character composition (e.g. CJK character conversion)
  if (e.isComposing) return;

  const target = e.target;
  if (!target) return;

  // Allow custom opt-out via attribute
  if (target.hasAttribute('data-no-enter-nav')) return;

  // Don't intercept when Alt is pressed
  if (e.altKey) return;

  // Handle TEXTAREA: regular Enter allows newlines; Ctrl/Cmd+Enter proceeds to next field
  if (target.tagName === 'TEXTAREA') {
    if (e.ctrlKey || e.metaKey) {
      const container = getFieldContainer(target);
      const fields = getNavigableFields(container);
      const idx = fields.indexOf(target);
      if (idx !== -1 && idx < fields.length - 1) {
        e.preventDefault();
        const nextField = fields[idx + 1];
        nextField.focus();
        if (typeof nextField.scrollIntoView === 'function') {
          nextField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
    return;
  }

  // Do NOT intercept if focus is currently on a button (Enter activates buttons natively)
  if (target.tagName === 'BUTTON') return;
  if (target.tagName === 'INPUT' && ['submit', 'button', 'reset', 'image', 'file'].includes((target.type || '').toLowerCase())) {
    return;
  }

  // Only handle form inputs and select elements
  if (!['INPUT', 'SELECT'].includes(target.tagName)) return;

  // If this is a standalone search filter bar (e.g. table live search), don't hijack Enter
  const isSearchFilter = target.type === 'search' || (target.placeholder && target.placeholder.toLowerCase().startsWith('search'));

  const container = getFieldContainer(target);
  if (!container) return;

  const fields = getNavigableFields(container);
  
  // If it's a search filter and not part of an explicit multi-step form, don't jump to adjacent controls
  if (isSearchFilter && !target.closest('form')) {
    return;
  }

  // Get all input controls (excluding buttons)
  const inputControls = fields.filter(el => ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName));
  if (inputControls.length <= 1 && isSearchFilter) {
    return;
  }

  const currentInputIndex = inputControls.indexOf(target);
  if (currentInputIndex === -1) return;

  // SHIFT + ENTER: Move to PREVIOUS field
  if (e.shiftKey) {
    if (currentInputIndex > 0) {
      e.preventDefault();
      const prevField = inputControls[currentInputIndex - 1];
      prevField.focus();
      if (isTextSelectable(prevField)) {
        try { prevField.select(); } catch (_) {}
      }
      if (typeof prevField.scrollIntoView === 'function') {
        prevField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return;
  }

  // ENTER: Move to NEXT field if one exists
  if (currentInputIndex < inputControls.length - 1) {
    e.preventDefault();
    const nextField = inputControls[currentInputIndex + 1];
    nextField.focus();
    if (isTextSelectable(nextField)) {
      try { nextField.select(); } catch (_) {}
    }
    if (typeof nextField.scrollIntoView === 'function') {
      nextField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  // If we are on the LAST input control:
  // Trigger form submit or primary action button
  const form = target.closest('form');
  const submitBtn = container.querySelector(
    'button[type="submit"], input[type="submit"], button.action-btn.primary, button.btn-save, button.primary, button.btn-primary, button.auth-btn'
  );

  if (submitBtn && !submitBtn.disabled) {
    e.preventDefault();
    submitBtn.click();
  } else if (form) {
    e.preventDefault();
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.submit();
    }
  }
}

/**
 * Initialize global Enter key navigation listener
 */
export function initEnterKeyNavigation() {
  if (typeof window === 'undefined') return () => {};

  const listener = (e) => handleEnterKeyNavigation(e);

  // Capture phase ensures we intercept the key event before browser default form submit
  window.addEventListener('keydown', listener, true);

  return () => {
    window.removeEventListener('keydown', listener, true);
  };
}
