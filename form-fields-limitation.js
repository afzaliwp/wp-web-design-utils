	document.addEventListener('DOMContentLoaded', () => {
		// Core Utilities
const InputFilter = {
  // Generic input processor
  createProcessor(config) {
    return {
      config: {
        selectors: [],
        maxLength: null,
        regex: null,
        labels: [],
        ...config
      },
      
      getAssociatedLabel(input) {
        if (input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label) return label.textContent.toLowerCase().trim();
        }
        return input.closest('label')?.textContent.toLowerCase().trim() || '';
      },

      findInputs() {
        const found = [
          ...document.querySelectorAll(this.config.selectors.join(',')),
          ...document.querySelectorAll('input')
        ].filter(input => {
          if (input.type === this.config.type) return true;
          const labelText = this.getAssociatedLabel(input);
          return this.config.labels.some(l => labelText.includes(l));
        });

        return [...new Set(found)];
      },

      init() {
        const inputs = this.findInputs();
        inputs.forEach(input => {
          input.addEventListener('input', this.process.bind(this));
        });
      }
    };
  }
};

// Email Filter Module
InputFilter.Email = (userConfig = {}) => {
  const config = {
    type: 'email',
    labels: ['email', 'ایمیل', 'آدرس ایمیل'],
    regex: /[^\w@.%+\-]/g,
    ...userConfig
  };

  const processor = InputFilter.createProcessor(config);
  
  processor.process = function(e) {
    const input = e.target;
    const newValue = input.value.replace(config.regex, '');
    if (input.value !== newValue) {
      input.value = newValue;
    }
  };

  return processor;
};

// Length Limiter Module
InputFilter.Length = (userConfig = {}) => {
  const config = {
    maxLength: 20,
    ...userConfig
  };

  const processor = InputFilter.createProcessor(config);
  
  processor.process = function(e) {
    const input = e.target;
    if (input.value.length > config.maxLength) {
      input.value = input.value.slice(0, config.maxLength);
    }
  };

  return processor;
};

// Phone Filter Module
InputFilter.Phone = (userConfig = {}) => {
  const config = {
    type: 'tel',
    labels: ['شماره', 'شماره موبایل', 'شماره تلفن', 'تلفن'],
    maxLength: 11,
    ...userConfig
  };

  const persianNumbers = { '۰':'0', '۱':'1', '۲':'2', '۳':'3', '۴':'4', '۵':'5', '۶':'6', '۷':'7', '۸':'8', '۹':'9' };
  const processor = InputFilter.createProcessor(config);
  
  processor.process = function(e) {
    const input = e.target;
    let value = input.value.replace(/[۰-۹]/g, m => persianNumbers[m]);
    value = value.replace(/\D/g, '').slice(0, config.maxLength);
    
    if (input.value !== value) {
      input.value = value;
    }
  };

  return processor;
};


// Initialize email filter
const emailFilter = InputFilter.Email({});
emailFilter.init();

// Initialize length limiter
const lengthLimiter = InputFilter.Length({
  selectors: ['#input_1_1', '#input_1_3'],
  maxLength: 20
});
lengthLimiter.init();

// Initialize phone filter
const phoneFilter = InputFilter.Phone();
phoneFilter.init();
	});
