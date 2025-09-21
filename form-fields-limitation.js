document.addEventListener('DOMContentLoaded', () => {
  /**
   * Merge multiple arrays and return only unique elements.
   * @param  {...Array<HTMLElement>} arrays 
   * @returns {Array<HTMLElement>}
   */
  const mergeUnique = (...arrays) => {
    const set = new Set();
    arrays.flat().forEach(el => set.add(el));
    return Array.from(set);
  };

  /**
   * Retrieve input fields matching one or more CSS selectors.
   * @param {string[]} selectors - CSS selectors for inputs.
   * @returns {HTMLElement[]} Array of input elements.
   */
  const getElementsBySelectors = (selectors) => {
    let elements = [];
    if (Array.isArray(selectors)) {
      selectors.forEach(sel => {
        const matched = document.querySelectorAll(sel);
        if (matched.length) {
          elements = elements.concat(Array.from(matched));
        }
      });
    }
    return elements;
  };

  /**
   * Returns input fields associated with labels that match any of the provided keywords.
   *
   * The keywords are transformed into regex patterns (with the "i" flag for case-insensitive matching)
   * so that if you pass "نام", it will match any label containing "نام" even if other words or characters are present.
   *
   * @param {string[]} labelKeywords - Keywords or substrings to search within label text.
   * @returns {HTMLElement[]} Array of matching input elements.
   */
  const getElementsByLabelKeywords = (labelKeywords) => {
    const regexes = labelKeywords.map(keyword => new RegExp(keyword, 'i'));
    const inputs = [];
    document.querySelectorAll("label").forEach(label => {
      const text = label.textContent;
      if (regexes.some(regex => regex.test(text))) {
        let input = null;
        const forAttr = label.getAttribute("for");
        if (forAttr) {
          input = document.getElementById(forAttr);
        }
        if (!input) {
          // Support for labels that wrap the input element
          input = label.querySelector("input");
        }
        if (input) {
          inputs.push(input);
        }
      }
    });
    return inputs;
  };

  /**
   * Converts Persian digits (۰۱۲۳۴۵۶۷۸۹) in a string to their English equivalents.
   * @param {string} str 
   * @returns {string} Converted string.
   */
  const convertPersianDigits = (str) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    
    return str.replace(/[۰-۹]/g, (digit) => {
      const index = persianDigits.indexOf(digit);
      return index !== -1 ? englishDigits[index] : digit;
    });
  };

  /**
   * Applies email validation on input fields.
   *
   * It identifies fields based on:
   *   - Custom CSS selectors (passed in the config).
   *   - Input elements of type="email".
   *   - Inputs with associated labels containing keywords like "email", "ایمیل", or "آدرس ایمیل".
   *
   * Non-allowed characters are removed as the user types.
   * Additionally, if a `charLimit` is provided, the email input is truncated to the specified maximum length.
   *
   * @param {object} config
   * @param {string[]} [config.selectors=[]] - Custom selectors for email fields.
   * @param {RegExp} [config.allowedRegex=/[^A-Za-z0-9@._+\-]/g] - Characters to filter out.
   * @param {string[]} [config.labelKeywords=["email", "ایمیل", "آدرس ایمیل"]] - Label keywords.
   * @param {number} [config.charLimit] - Optional character limit applied to the email input.
   */
  function applyEmailValidation({
    selectors = [],
    allowedRegex = /[^A-Za-z0-9@._+\-]/g,
    labelKeywords = ["email", "ایمیل", "آدرس ایمیل"],
    charLimit = 50
  } = {}) {
    const selectorElements = getElementsBySelectors(selectors);
    const typeEmailElements = Array.from(document.querySelectorAll('input[type="email"]'));
    const labelElements = getElementsByLabelKeywords(labelKeywords);

    const emailFields = mergeUnique(selectorElements, typeEmailElements, labelElements);

    emailFields.forEach(field => {
      field.addEventListener("input", () => {
        let filteredValue = field.value.replace(allowedRegex, "");
        if (typeof charLimit === "number" && filteredValue.length > charLimit) {
          filteredValue = filteredValue.slice(0, charLimit);
        }
        if (field.value !== filteredValue) {
          field.value = filteredValue;
        }
      });
    });
  }

  /**
   * Applies URL/website validation on input fields.
   *
   * It identifies fields based on:
   *   - Custom CSS selectors (passed in the config).
   *   - Input elements of type="url".
   *   - Inputs with associated labels containing keywords like "website", "url", "وب سایت", "آدرس وب".
   *
   * Non-allowed characters are removed as the user types and basic URL formatting is enforced.
   *
   * @param {object} config
   * @param {string[]} [config.selectors=[]] - Custom selectors for URL fields.
   * @param {RegExp} [config.allowedRegex=/[^A-Za-z0-9@._+\-:/?#[\]%&=]/g] - Characters to filter out.
   * @param {string[]} [config.labelKeywords=["website", "url", "وب سایت", "آدرس وب", "سایت"]] - Label keywords.
   * @param {number} [config.charLimit=200] - Optional character limit applied to the URL input.
   * @param {boolean} [config.autoPrefix=true] - Automatically add http:// if no protocol is present.
   */
  function applyUrlValidation({
    selectors = [],
    allowedRegex = /[^A-Za-z0-9@._+\-:/?#[\]%&=]/g,
    labelKeywords = ["website", "url", "وب سایت", "آدرس وب", "سایت", "وبسایت"],
    charLimit = 200,
    autoPrefix = true
  } = {}) {
    const selectorElements = getElementsBySelectors(selectors);
    const typeUrlElements = Array.from(document.querySelectorAll('input[type="url"]'));
    const labelElements = getElementsByLabelKeywords(labelKeywords);

    const urlFields = mergeUnique(selectorElements, typeUrlElements, labelElements);

    urlFields.forEach(field => {
      field.addEventListener("input", () => {
        let filteredValue = field.value.replace(allowedRegex, "");
        
        // Convert Persian digits
        filteredValue = convertPersianDigits(filteredValue);
        
        // Apply character limit
        if (typeof charLimit === "number" && filteredValue.length > charLimit) {
          filteredValue = filteredValue.slice(0, charLimit);
        }

        if (field.value !== filteredValue) {
          field.value = filteredValue;
        }
      });

      // Add blur event to handle auto-prefixing
      if (autoPrefix) {
        field.addEventListener("blur", () => {
          let value = field.value.trim();
          if (value && !value.match(/^https?:\/\//i)) {
            // Only add prefix if it looks like a domain (contains at least one dot)
            if (value.includes('.') && !value.includes(' ')) {
              field.value = 'http://' + value;
            }
          }
        });
      }
    });
  }

  /**
   * Limits the number of characters in the specified input fields.
   *
   * @param {object} config
   * @param {string[]} [config.selectors=[]] - CSS selectors for target inputs.
   * @param {number} [config.limit=20] - Maximum allowed characters.
   */
  function applyCharLimit({
    selectors = [],
    limit = 20
  } = {}) {
    const fields = mergeUnique(getElementsBySelectors(selectors));
        
    fields.forEach(field => {
      field.addEventListener("input", () => {
        if (field.value.length > limit) {
          field.value = field.value.slice(0, limit);
        }
      });
    });
  }

  /**
   * Validates telephone input fields by:
   *   - Identifying fields via custom selectors, type="tel", or label text that matches telephone-related keywords.
   *   - Converting Persian digits to English.
   *   - Removing non-digit characters.
   *   - Enforcing a maximum digit count (default is 11).
   *
   * @param {object} config
   * @param {string[]} [config.selectors=[]] - CSS selectors for telephone inputs.
   * @param {number} [config.digitLimit=11] - Maximum allowed digits.
   * @param {string[]} [config.labelKeywords=["شماره", "شماره موبایل", "شماره تلفن", "تلفن"]] - Label keywords.
   */
  function applyTelValidation({
    selectors = [],
    digitLimit = 11,
    labelKeywords = ["شماره", "شماره موبایل", "شماره تلفن", "تلفن"]
  } = {}) {
    const selectorElements = getElementsBySelectors(selectors);
    const typeTelElements = Array.from(document.querySelectorAll('input[type="tel"]'));
    const labelElements = getElementsByLabelKeywords(labelKeywords);

    const telFields = mergeUnique(selectorElements, typeTelElements, labelElements);

    telFields.forEach(field => {
      field.addEventListener("input", (e) => {
        let newValue = convertPersianDigits(field.value);
        newValue = newValue.replace(/\D/g, "");
        if (newValue.length > digitLimit) {
          newValue = newValue.slice(0, digitLimit);
        }

        if (field.value !== newValue) {
          field.value = newValue;
        }
      });
    });
  }

  /**
   * Applies mobile number assistance and validation:
   *   - Identifies mobile fields via custom selectors or label text that matches mobile-related keywords.
   *   - Auto-prefixes with "09" when the field is clicked and empty.
   *   - Converts Persian digits to English.
   *   - Removes non-digit characters.
   *   - Enforces exactly 11 digits (Iranian mobile number format).
   *
   * @param {object} config
   * @param {string[]} [config.selectors=[]] - CSS selectors for mobile inputs.
   * @param {string[]} [config.labelKeywords=["شماره موبایل", "موبایل", "mobile number", "mobile"]] - Label keywords.
   * @param {string} [config.prefix="09"] - Prefix to auto-add when field is clicked and empty.
   * @param {number} [config.exactDigits=11] - Exact number of digits required.
   */
  function applyMobileValidation({
    selectors = [],
    labelKeywords = ["شماره موبایل", "موبایل", "mobile number", "mobile"],
    prefix = "09",
    exactDigits = 11
  } = {}) {
    const selectorElements = getElementsBySelectors(selectors);
    const labelElements = getElementsByLabelKeywords(labelKeywords);

    const mobileFields = mergeUnique(selectorElements, labelElements);

    mobileFields.forEach(field => {
      // Auto-prefix with "09" when field is clicked and empty
      field.addEventListener("focus", () => {
        // Disable submit buttons when user focuses on mobile field
        disableSubmitButtons(field);
        
        if (!field.value.trim()) {
          field.value = prefix;
        }
        
        // Always position cursor at the end (handles both empty and existing values)
        setTimeout(() => {
          field.setSelectionRange(field.value.length, field.value.length);
        }, 0);
      });

      // Validate input to maintain exactly 11 digits
      field.addEventListener("input", () => {
        let newValue = convertPersianDigits(field.value);
        newValue = newValue.replace(/\D/g, "");
        
        // Ensure it starts with 09 if user tries to modify the prefix
        if (newValue.length > 0 && !newValue.startsWith("09")) {
          // If user typed something that doesn't start with 09, prepend 09
          if (newValue.length <= exactDigits - 2) {
            newValue = prefix + newValue;
          } else {
            // If too long, keep only the allowed digits starting with 09
            newValue = prefix + newValue.slice(0, exactDigits - 2);
          }
        }
        
        // Enforce exactly 11 digits
        if (newValue.length > exactDigits) {
          newValue = newValue.slice(0, exactDigits);
        }

        if (field.value !== newValue) {
          field.value = newValue;
        }

        // Real-time validation and submit button control
        validateMobileFieldRealtime(field, exactDigits);
      });

      // Prevent deletion of the "09" prefix
      field.addEventListener("keydown", (e) => {
        const cursorPosition = field.selectionStart;
        const value = field.value;
        
        // If user tries to delete and cursor is at position 0, 1, or 2, prevent it
        if ((e.key === "Backspace" || e.key === "Delete") && cursorPosition <= 2 && value.startsWith(prefix)) {
          e.preventDefault();
        }
      });

      // Handle paste events
      field.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        let cleanData = convertPersianDigits(pasteData).replace(/\D/g, "");
        
        // If pasted data doesn't start with 09, add it
        if (cleanData && !cleanData.startsWith("09")) {
          cleanData = prefix + cleanData;
        }
        
        // Limit to exact digits
        if (cleanData.length > exactDigits) {
          cleanData = cleanData.slice(0, exactDigits);
        }
        
        field.value = cleanData;
        
        // Validate after paste
        validateMobileFieldRealtime(field, exactDigits);
      });

      // Handle click events to ensure cursor is at the end
      field.addEventListener("click", () => {
        // If user clicks anywhere in the field, move cursor to end
        setTimeout(() => {
          field.setSelectionRange(field.value.length, field.value.length);
        }, 0);
      });


    });

    // Store mobile fields for form validation
    if (!window.mobileFields) {
      window.mobileFields = [];
    }
    window.mobileFields = [...new Set([...window.mobileFields, ...mobileFields])];
  }

  /**
   * Finds and disables submit buttons for the form containing the given field
   * @param {HTMLElement} field - The input field
   */
  function disableSubmitButtons(field) {
    const form = field.closest('form');
    if (form) {
      const submitButtons = form.querySelectorAll('input[type="submit"], button[type="submit"], button:not([type])');
      submitButtons.forEach(btn => {
        btn.disabled = true;
        btn.setAttribute('data-mobile-disabled', 'true');
      });
    }
  }

  /**
   * Enables submit buttons for all forms if all mobile fields are valid
   */
  function enableSubmitButtons() {
    // Find all submit buttons that were disabled by mobile validation
    const disabledButtons = document.querySelectorAll('[data-mobile-disabled="true"]');
    disabledButtons.forEach(btn => {
      btn.disabled = false;
      btn.removeAttribute('data-mobile-disabled');
    });
  }

  /**
   * Real-time validation that happens during typing
   * @param {HTMLElement} field - The mobile input field
   * @param {number} exactDigits - Required number of digits
   */
  function validateMobileFieldRealtime(field, exactDigits) {
    const value = field.value.trim();
    const isValid = value.length === exactDigits && value.startsWith("09") && /^\d+$/.test(value);
    
    // Remove existing error message
    if (field.nextElementSibling && field.nextElementSibling.classList.contains("mobile-validation-message")) {
      field.nextElementSibling.remove();
    }
    
    if (!isValid && value.length > 0) {
      // Add error styling
      field.classList.add("mobile-validation-error");
      
      // Add error message
      const errorMsg = document.createElement("div");
      errorMsg.className = "mobile-validation-message";
      errorMsg.style.cssText = "color: #dc3545; font-size: 12px; margin-top: 4px;";
      errorMsg.textContent = "شماره موبایل باید دقیقاً ۱۱ رقم و با ۰۹ شروع شود";
      
      field.parentNode.insertBefore(errorMsg, field.nextSibling);
    } else {
      field.classList.remove("mobile-validation-error");
    }

    // Check if all mobile fields are valid and enable/disable submit buttons
    checkAllMobileFieldsAndToggleSubmit();
  }

  /**
   * Checks all mobile fields and enables submit buttons if all are valid
   */
  function checkAllMobileFieldsAndToggleSubmit() {
    if (!window.mobileFields || window.mobileFields.length === 0) {
      enableSubmitButtons();
      return;
    }

    let allValid = true;
    let hasContent = false;

    window.mobileFields.forEach(field => {
      if (document.contains(field)) {
        const value = field.value.trim();
        if (value.length > 0) {
          hasContent = true;
          const isValid = value.length === 11 && value.startsWith("09") && /^\d+$/.test(value);
          if (!isValid) {
            allValid = false;
          }
        }
      }
    });

    // Only enable submit if all mobile fields with content are valid
    if (allValid && hasContent) {
      enableSubmitButtons();
    }
  }

  /**
   * Validates all mobile fields on the page (for form submission)
   * @returns {boolean} True if all mobile fields are valid
   */
  function validateAllMobileFields() {
    if (!window.mobileFields || window.mobileFields.length === 0) {
      return true; // No mobile fields to validate
    }

    let allValid = true;
    
    window.mobileFields.forEach(field => {
      // Check if field still exists in DOM
      if (document.contains(field)) {
        const value = field.value.trim();
        if (value.length > 0) {
          const isValid = value.length === 11 && value.startsWith("09") && /^\d+$/.test(value);
          if (!isValid) {
            allValid = false;
            validateMobileFieldRealtime(field, 11); // Show error
          }
        }
      }
    });

    return allValid;
  }

  /**
   * Prevents form submission if mobile validation fails
   */
  function setupFormValidation() {
    // Handle form submissions
    document.addEventListener("submit", (e) => {
      if (!validateAllMobileFields()) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show general error message
        const firstInvalidField = window.mobileFields.find(field => 
          document.contains(field) && 
          field.classList.contains("mobile-validation-error")
        );
        
        if (firstInvalidField) {
          firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return false;
      }
    });

    // Handle Gravity Forms AJAX submissions (if using Gravity Forms)
    if (typeof gform !== 'undefined') {
      document.addEventListener("gform_pre_submission", (e) => {
        if (!validateAllMobileFields()) {
          e.preventDefault();
          return false;
        }
      });
    }

    // Handle Contact Form 7 submissions (if using CF7)
    document.addEventListener("wpcf7beforesubmit", (e) => {
      if (!validateAllMobileFields()) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Expose the utility functions globally for easy access.
  window.inputUtils = {
    applyEmailValidation,
    applyUrlValidation,
    applyCharLimit,
    applyTelValidation,
    applyMobileValidation,
    validateAllMobileFields
  };

  /**
   * Initialize all validations - can be called multiple times safely
   */
  function initializeValidations() {
    inputUtils.applyEmailValidation();
    inputUtils.applyUrlValidation();
    inputUtils.applyMobileValidation(); // Add mobile validation
    
    // Updated selectors based on your actual form HTML
    inputUtils.applyCharLimit({ selectors: ['#input_4_3'], limit: 50 }); // Name field
    inputUtils.applyCharLimit({ selectors: ['#input_4_1'], limit: 200 }); // Website field
    inputUtils.applyTelValidation({ selectors: ['#input_4_8'], digitLimit: 11 }); // Tel field
    
    // Setup form validation
    setupFormValidation();
  }

  // Initialize validations
  initializeValidations();

  // Add CSS for validation styling
  const style = document.createElement('style');
  style.textContent = `
    .mobile-validation-error {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }
    .mobile-validation-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);

  // Handle Elementor popups and off-canvas (if using Elementor Pro)
  document.addEventListener("elementor/popup/show", initializeValidations);

  // Handle dynamic content changes with MutationObserver
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      let shouldReinitialize = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain forms or inputs
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const hasForm = node.querySelector && (
                node.querySelector('form') || 
                node.querySelector('input') ||
                node.tagName === 'FORM' ||
                node.tagName === 'INPUT'
              );
              if (hasForm) {
                shouldReinitialize = true;
              }
            }
          });
        }
      });
      
      if (shouldReinitialize) {
        // Debounce reinitializations
        clearTimeout(window.validationTimeout);
        window.validationTimeout = setTimeout(initializeValidations, 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Expose initialization function globally
  window.inputUtils.reinitialize = initializeValidations;
});
