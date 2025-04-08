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
      return str.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1776));
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
        field.addEventListener("input", () => {
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

    // Expose the utility functions globally for easy access.
    window.inputUtils = {
      applyEmailValidation,
      applyCharLimit,
      applyTelValidation
    };

    // Initialize once the DOM is fully loaded.
    document.addEventListener("DOMContentLoaded", () => {
	    inputUtils.applyEmailValidation();
	    inputUtils.applyCharLimit({ selectors: ['#input_1_1', '#input_1_3'], limit: 20 });
	    inputUtils.applyCharLimit({ selectors: ['#input_1_5'], limit: 100 });
	    inputUtils.applyTelValidation({ selectors: ['#input_1_4'], digitLimit: 11 });
    });

