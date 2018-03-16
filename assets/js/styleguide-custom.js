/*!
 * jQuery Validation Plugin v1.15.0
 *
 * http://jqueryvalidation.org/
 *
 * Copyright (c) 2016 Jörn Zaefferer
 * Released under the MIT license
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

$.extend( $.fn, {

	// http://jqueryvalidation.org/validate/
	validate: function( options ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// Check if a validator for this form was already created
		var validator = $.data( this[ 0 ], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[ 0 ] );
		$.data( this[ 0 ], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.on( "click.validate", ":submit", function( event ) {
				if ( validator.settings.submitHandler ) {
					validator.submitButton = event.target;
				}

				// Allow suppressing validation by adding a cancel class to the submit button
				if ( $( this ).hasClass( "cancel" ) ) {
					validator.cancelSubmit = true;
				}

				// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
				if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
					validator.cancelSubmit = true;
				}
			} );

			// Validate the form on submit
			this.on( "submit.validate", function( event ) {
				if ( validator.settings.debug ) {

					// Prevent form submit to be able to see console output
					event.preventDefault();
				}
				function handle() {
					var hidden, result;
					if ( validator.settings.submitHandler ) {
						if ( validator.submitButton ) {

							// Insert a hidden input as a replacement for the missing submit button
							hidden = $( "<input type='hidden'/>" )
								.attr( "name", validator.submitButton.name )
								.val( $( validator.submitButton ).val() )
								.appendTo( validator.currentForm );
						}
						result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( validator.submitButton ) {

							// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						if ( result !== undefined ) {
							return result;
						}
						return false;
					}
					return true;
				}

				// Prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			} );
		}

		return validator;
	},

	// http://jqueryvalidation.org/valid/
	valid: function() {
		var valid, validator, errorList;

		if ( $( this[ 0 ] ).is( "form" ) ) {
			valid = this.validate().form();
		} else {
			errorList = [];
			valid = true;
			validator = $( this[ 0 ].form ).validate();
			this.each( function() {
				valid = validator.element( this ) && valid;
				if ( !valid ) {
					errorList = errorList.concat( validator.errorList );
				}
			} );
			validator.errorList = errorList;
		}
		return valid;
	},

	// http://jqueryvalidation.org/rules/
	rules: function( command, argument ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			return;
		}

		var element = this[ 0 ],
			settings, staticRules, existingRules, data, param, filtered;

		if ( command ) {
			settings = $.data( element.form, "validator" ).settings;
			staticRules = settings.rules;
			existingRules = $.validator.staticRules( element );
			switch ( command ) {
			case "add":
				$.extend( existingRules, $.validator.normalizeRule( argument ) );

				// Remove messages from rules, but allow them to be set separately
				delete existingRules.messages;
				staticRules[ element.name ] = existingRules;
				if ( argument.messages ) {
					settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[ element.name ];
					return existingRules;
				}
				filtered = {};
				$.each( argument.split( /\s/ ), function( index, method ) {
					filtered[ method ] = existingRules[ method ];
					delete existingRules[ method ];
					if ( method === "required" ) {
						$( element ).removeAttr( "aria-required" );
					}
				} );
				return filtered;
			}
		}

		data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules( element ),
			$.validator.attributeRules( element ),
			$.validator.dataRules( element ),
			$.validator.staticRules( element )
		), element );

		// Make sure required is at front
		if ( data.required ) {
			param = data.required;
			delete data.required;
			data = $.extend( { required: param }, data );
			$( element ).attr( "aria-required", "true" );
		}

		// Make sure remote is at back
		if ( data.remote ) {
			param = data.remote;
			delete data.remote;
			data = $.extend( data, { remote: param } );
		}

		return data;
	}
} );

// Custom selectors
$.extend( $.expr[ ":" ], {

	// http://jqueryvalidation.org/blank-selector/
	blank: function( a ) {
		return !$.trim( "" + $( a ).val() );
	},

	// http://jqueryvalidation.org/filled-selector/
	filled: function( a ) {
		var val = $( a ).val();
		return val !== null && !!$.trim( "" + val );
	},

	// http://jqueryvalidation.org/unchecked-selector/
	unchecked: function( a ) {
		return !$( a ).prop( "checked" );
	}
} );

// Constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

// http://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray( arguments );
			args.unshift( source );
			return $.validator.format.apply( this, args );
		};
	}
	if ( params === undefined ) {
		return source;
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray( arguments ).slice( 1 );
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each( params, function( i, n ) {
		source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
			return n;
		} );
	} );
	return source;
};

$.extend( $.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		pendingClass: "pending",
		validClass: "valid",
		errorElement: "label",
		focusCleanup: false,
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function( element ) {
			this.lastActive = element;

			// Hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.hideThese( this.errorsFor( element ) );
			}
		},
		onfocusout: function( element ) {
			if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
				this.element( element );
			}
		},
		onkeyup: function( element, event ) {

			// Avoid revalidate the field when pressing one of the following keys
			// Shift       => 16
			// Ctrl        => 17
			// Alt         => 18
			// Caps lock   => 20
			// End         => 35
			// Home        => 36
			// Left arrow  => 37
			// Up arrow    => 38
			// Right arrow => 39
			// Down arrow  => 40
			// Insert      => 45
			// Num lock    => 144
			// AltGr key   => 225
			var excludedKeys = [
				16, 17, 18, 20, 35, 36, 37,
				38, 39, 40, 45, 144, 225
			];

			if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
				return;
			} else if ( element.name in this.submitted || element.name in this.invalid ) {
				this.element( element );
			}
		},
		onclick: function( element ) {

			// Click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element( element );

			// Or option elements, check parent select in that case
			} else if ( element.parentNode.name in this.submitted ) {
				this.element( element.parentNode );
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
			} else {
				$( element ).addClass( errorClass ).removeClass( validClass );
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
			} else {
				$( element ).removeClass( errorClass ).addClass( validClass );
			}
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.setDefaults/
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date ( ISO ).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format( "Please enter no more than {0} characters." ),
		minlength: $.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range: $.validator.format( "Please enter a value between {0} and {1}." ),
		max: $.validator.format( "Please enter a value less than or equal to {0}." ),
		min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
		step: $.validator.format( "Please enter a multiple of {0}." )
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $( this.settings.errorLabelContainer );
			this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
			this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = ( this.groups = {} ),
				rules;
			$.each( this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split( /\s/ );
				}
				$.each( value, function( index, name ) {
					groups[ name ] = key;
				} );
			} );
			rules = this.settings.rules;
			$.each( rules, function( key, value ) {
				rules[ key ] = $.validator.normalizeRule( value );
			} );

			function delegate( event ) {
				var validator = $.data( this.form, "validator" ),
					eventType = "on" + event.type.replace( /^validate/, "" ),
					settings = validator.settings;
				if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
					settings[ eventType ].call( validator, this, event );
				}
			}

			$( this.currentForm )
				.on( "focusin.validate focusout.validate keyup.validate",
					":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
					"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
					"[type='radio'], [type='checkbox'], [contenteditable]", delegate )

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.validate", "select, option, [type='radio'], [type='checkbox']", delegate );

			if ( this.settings.invalidHandler ) {
				$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
			}

			// Add aria-required to any Static/Data/Class required fields before first validation
			// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
			$( this.currentForm ).find( "[required], [data-rule-required], .required" ).attr( "aria-required", "true" );
		},

		// http://jqueryvalidation.org/Validator.form/
		form: function() {
			this.checkForm();
			$.extend( this.submitted, this.errorMap );
			this.invalid = $.extend( {}, this.errorMap );
			if ( !this.valid() ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
				this.check( elements[ i ] );
			}
			return this.valid();
		},

		// http://jqueryvalidation.org/Validator.element/
		element: function( element ) {
			var cleanElement = this.clean( element ),
				checkElement = this.validationTargetFor( cleanElement ),
				v = this,
				result = true,
				rs, group;

			if ( checkElement === undefined ) {
				delete this.invalid[ cleanElement.name ];
			} else {
				this.prepareElement( checkElement );
				this.currentElements = $( checkElement );

				// If this element is grouped, then validate all group elements already
				// containing a value
				group = this.groups[ checkElement.name ];
				if ( group ) {
					$.each( this.groups, function( name, testgroup ) {
						if ( testgroup === group && name !== checkElement.name ) {
							cleanElement = v.validationTargetFor( v.clean( v.findByName( name ) ) );
							if ( cleanElement && cleanElement.name in v.invalid ) {
								v.currentElements.push( cleanElement );
								result = result && v.check( cleanElement );
							}
						}
					} );
				}

				rs = this.check( checkElement ) !== false;
				result = result && rs;
				if ( rs ) {
					this.invalid[ checkElement.name ] = false;
				} else {
					this.invalid[ checkElement.name ] = true;
				}

				if ( !this.numberOfInvalids() ) {

					// Hide error containers on last error
					this.toHide = this.toHide.add( this.containers );
				}
				this.showErrors();

				// Add aria-invalid status for screen readers
				$( element ).attr( "aria-invalid", !rs );
			}

			return result;
		},

		// http://jqueryvalidation.org/Validator.showErrors/
		showErrors: function( errors ) {
			if ( errors ) {
				var validator = this;

				// Add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = $.map( this.errorMap, function( message, name ) {
					return {
						message: message,
						element: validator.findByName( name )[ 0 ]
					};
				} );

				// Remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !( element.name in errors );
				} );
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// http://jqueryvalidation.org/Validator.resetForm/
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.invalid = {};
			this.submitted = {};
			this.prepareForm();
			this.hideErrors();
			var elements = this.elements()
				.removeData( "previousValue" )
				.removeAttr( "aria-invalid" );

			this.resetElements( elements );
		},

		resetElements: function( elements ) {
			var i;

			if ( this.settings.unhighlight ) {
				for ( i = 0; elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ],
						this.settings.errorClass, "" );
					this.findByName( elements[ i ].name ).removeClass( this.settings.validClass );
				}
			} else {
				elements
					.removeClass( this.settings.errorClass )
					.removeClass( this.settings.validClass );
			}
		},

		numberOfInvalids: function() {
			return this.objectLength( this.invalid );
		},

		objectLength: function( obj ) {
			/* jshint unused: false */
			var count = 0,
				i;
			for ( i in obj ) {
				if ( obj[ i ] ) {
					count++;
				}
			}
			return count;
		},

		hideErrors: function() {
			this.hideThese( this.toHide );
		},

		hideThese: function( errors ) {
			errors.not( this.containers ).text( "" );
			this.addWrapper( errors ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [] )
					.filter( ":visible" )
					.focus()

					// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger( "focusin" );
				} catch ( e ) {

					// Ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep( this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			} ).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// Select all valid inputs inside the form (no submit or reset buttons)
			return $( this.currentForm )
			.find( "input, select, textarea, [contenteditable]" )
			.not( ":submit, :reset, :image, :disabled" )
			.not( this.settings.ignore )
			.filter( function() {
				var name = this.name || $( this ).attr( "name" ); // For contenteditable
				if ( !name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this );
				}

				// Set form expando on contenteditable
				if ( this.hasAttribute( "contenteditable" ) ) {
					this.form = $( this ).closest( "form" )[ 0 ];
				}

				// Select only the first element for each name, and only those with rules specified
				if ( name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
					return false;
				}

				rulesCache[ name ] = true;
				return true;
			} );
		},

		clean: function( selector ) {
			return $( selector )[ 0 ];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.split( " " ).join( "." );
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		resetInternals: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $( [] );
			this.toHide = $( [] );
		},

		reset: function() {
			this.resetInternals();
			this.currentElements = $( [] );
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor( element );
		},

		elementValue: function( element ) {
			var $element = $( element ),
				type = element.type,
				val, idx;

			if ( type === "radio" || type === "checkbox" ) {
				return this.findByName( element.name ).filter( ":checked" ).val();
			} else if ( type === "number" && typeof element.validity !== "undefined" ) {
				return element.validity.badInput ? "NaN" : $element.val();
			}

			if ( element.hasAttribute( "contenteditable" ) ) {
				val = $element.text();
			} else {
				val = $element.val();
			}

			if ( type === "file" ) {

				// Modern browser (chrome & safari)
				if ( val.substr( 0, 12 ) === "C:\\fakepath\\" ) {
					return val.substr( 12 );
				}

				// Legacy browsers
				// Unix-based path
				idx = val.lastIndexOf( "/" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Windows-based path
				idx = val.lastIndexOf( "\\" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Just the file name
				return val;
			}

			if ( typeof val === "string" ) {
				return val.replace( /\r/g, "" );
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $( element ).rules(),
				rulesCount = $.map( rules, function( n, i ) {
					return i;
				} ).length,
				dependencyMismatch = false,
				val = this.elementValue( element ),
				result, method, rule;

			// If a normalizer is defined for this element, then
			// call it to retreive the changed value instead
			// of using the real one.
			// Note that `this` in the normalizer is `element`.
			if ( typeof rules.normalizer === "function" ) {
				val = rules.normalizer.call( element, val );

				if ( typeof val !== "string" ) {
					throw new TypeError( "The normalizer should return a string value." );
				}

				// Delete the normalizer from rules to avoid treating
				// it as a pre-defined method.
				delete rules.normalizer;
			}

			for ( method in rules ) {
				rule = { method: method, parameters: rules[ method ] };
				try {
					result = $.validator.methods[ method ].call( this, val, element, rule.parameters );

					// If a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" && rulesCount === 1 ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor( element ) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch ( e ) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					if ( e instanceof TypeError ) {
						e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
					}

					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength( rules ) ) {
				this.successList.push( element );
			}
			return true;
		},

		// Return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		// return the generic message if present and no method specific message is present
		customDataMessage: function( element, method ) {
			return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
				method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
		},

		// Return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[ name ];
			return m && ( m.constructor === String ? m : m[ method ] );
		},

		// Return the first defined argument, allowing empty strings
		findDefined: function() {
			for ( var i = 0; i < arguments.length; i++ ) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		defaultMessage: function( element, rule ) {
			var message = this.findDefined(
					this.customMessage( element.name, rule.method ),
					this.customDataMessage( element, rule.method ),

					// 'title' is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					$.validator.messages[ rule.method ],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call( this, rule.parameters, element );
			} else if ( theregex.test( message ) ) {
				message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
			}

			return message;
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule );

			this.errorList.push( {
				message: message,
				element: element,
				method: rule.method
			} );

			this.errorMap[ element.name ] = message;
			this.submitted[ element.name ] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements, error;
			for ( i = 0; this.errorList[ i ]; i++ ) {
				error = this.errorList[ i ];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if ( this.settings.success ) {
				for ( i = 0; this.successList[ i ]; i++ ) {
					this.showLabel( this.successList[ i ] );
				}
			}
			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not( this.invalidElements() );
		},

		invalidElements: function() {
			return $( this.errorList ).map( function() {
				return this.element;
			} );
		},

		showLabel: function( element, message ) {
			var place, group, errorID, v,
				error = this.errorsFor( element ),
				elementID = this.idOrName( element ),
				describedBy = $( element ).attr( "aria-describedby" );

			if ( error.length ) {

				// Refresh error/success class
				error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// Replace message on existing label
				error.html( message );
			} else {

				// Create error element
				error = $( "<" + this.settings.errorElement + ">" )
					.attr( "id", elementID + "-error" )
					.addClass( this.settings.errorClass )
					.html( message || "" );

				// Maintain reference to the element to be placed into the DOM
				place = error;
				if ( this.settings.wrapper ) {

					// Make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
				}
				if ( this.labelContainer.length ) {
					this.labelContainer.append( place );
				} else if ( this.settings.errorPlacement ) {
					this.settings.errorPlacement( place, $( element ) );
				} else {
					place.insertAfter( element );
				}

				// Link error back to the element
				if ( error.is( "label" ) ) {

					// If the error is a label, then associate using 'for'
					error.attr( "for", elementID );

					// If the element is not a child of an associated label, then it's necessary
					// to explicitly apply aria-describedby
				} else if ( error.parents( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 ) {
					errorID = error.attr( "id" );

					// Respect existing non-error aria-describedby
					if ( !describedBy ) {
						describedBy = errorID;
					} else if ( !describedBy.match( new RegExp( "\\b" + this.escapeCssMeta( errorID ) + "\\b" ) ) ) {

						// Add to end of list if not already present
						describedBy += " " + errorID;
					}
					$( element ).attr( "aria-describedby", describedBy );

					// If this element is grouped, then assign to all elements in the same group
					group = this.groups[ element.name ];
					if ( group ) {
						v = this;
						$.each( v.groups, function( name, testgroup ) {
							if ( testgroup === group ) {
								$( "[name='" + v.escapeCssMeta( name ) + "']", v.currentForm )
									.attr( "aria-describedby", error.attr( "id" ) );
							}
						} );
					}
				}
			}
			if ( !message && this.settings.success ) {
				error.text( "" );
				if ( typeof this.settings.success === "string" ) {
					error.addClass( this.settings.success );
				} else {
					this.settings.success( error, element );
				}
			}
			this.toShow = this.toShow.add( error );
		},

		errorsFor: function( element ) {
			var name = this.escapeCssMeta( this.idOrName( element ) ),
				describer = $( element ).attr( "aria-describedby" ),
				selector = "label[for='" + name + "'], label[for='" + name + "'] *";

			// 'aria-describedby' should directly reference the error element
			if ( describer ) {
				selector = selector + ", #" + this.escapeCssMeta( describer )
					.replace( /\s+/g, ", #" );
			}

			return this
				.errors()
				.filter( selector );
		},

		// See https://api.jquery.com/category/selectors/, for CSS
		// meta-characters that should be escaped in order to be used with JQuery
		// as a literal part of a name/id or any selector.
		escapeCssMeta: function( string ) {
			return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
		},

		idOrName: function( element ) {
			return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
		},

		validationTargetFor: function( element ) {

			// If radio/checkbox, validate first element in group instead
			if ( this.checkable( element ) ) {
				element = this.findByName( element.name );
			}

			// Always apply ignore filter
			return $( element ).not( this.settings.ignore )[ 0 ];
		},

		checkable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		findByName: function( name ) {
			return $( this.currentForm ).find( "[name='" + this.escapeCssMeta( name ) + "']" );
		},

		getLength: function( value, element ) {
			switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[ typeof param ] ? this.dependTypes[ typeof param ]( param, element ) : true;
		},

		dependTypes: {
			"boolean": function( param ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$( param, element.form ).length;
			},
			"function": function( param, element ) {
				return param( element );
			}
		},

		optional: function( element ) {
			var val = this.elementValue( element );
			return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		startRequest: function( element ) {
			if ( !this.pending[ element.name ] ) {
				this.pendingRequest++;
				$( element ).addClass( this.settings.pendingClass );
				this.pending[ element.name ] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;

			// Sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[ element.name ];
			$( element ).removeClass( this.settings.pendingClass );
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$( this.currentForm ).submit();
				this.formSubmitted = false;
			} else if ( !valid && this.pendingRequest === 0 && this.formSubmitted ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
				this.formSubmitted = false;
			}
		},

		previousValue: function( element, method ) {
			return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, { method: method } )
			} );
		},

		// Cleans up all forms and elements, removes validator-specific events
		destroy: function() {
			this.resetForm();

			$( this.currentForm )
				.off( ".validate" )
				.removeData( "validator" )
				.find( ".validate-equalTo-blur" )
					.off( ".validate-equalTo" )
					.removeClass( "validate-equalTo-blur" );
		}

	},

	classRuleSettings: {
		required: { required: true },
		email: { email: true },
		url: { url: true },
		date: { date: true },
		dateISO: { dateISO: true },
		number: { number: true },
		digits: { digits: true },
		creditcard: { creditcard: true }
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[ className ] = rules;
		} else {
			$.extend( this.classRuleSettings, className );
		}
	},

	classRules: function( element ) {
		var rules = {},
			classes = $( element ).attr( "class" );

		if ( classes ) {
			$.each( classes.split( " " ), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend( rules, $.validator.classRuleSettings[ this ] );
				}
			} );
		}
		return rules;
	},

	normalizeAttributeRule: function( rules, type, method, value ) {

		// Convert the value to a number for number inputs, and for text for backwards compability
		// allows type="date" and others to be compared as strings
		if ( /min|max|step/.test( method ) && ( type === null || /number|range|text/.test( type ) ) ) {
			value = Number( value );

			// Support Opera Mini, which returns NaN for undefined minlength
			if ( isNaN( value ) ) {
				value = undefined;
			}
		}

		if ( value || value === 0 ) {
			rules[ method ] = value;
		} else if ( type === method && type !== "range" ) {

			// Exception: the jquery validate 'range' method
			// does not test for the html5 'range' type
			rules[ method ] = true;
		}
	},

	attributeRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {

			// Support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = element.getAttribute( method );

				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}

				// Force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr( method );
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}

		// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test( rules.maxlength ) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {
			value = $element.data( "rule" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() );
			this.normalizeAttributeRule( rules, type, method, value );
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {},
			validator = $.data( element.form, "validator" );

		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule( validator.settings.rules[ element.name ] ) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {

		// Handle dependency check
		$.each( rules, function( prop, val ) {

			// Ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[ prop ];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch ( typeof val.depends ) {
				case "string":
					keepRule = !!$( val.depends, element.form ).length;
					break;
				case "function":
					keepRule = val.depends.call( element, element );
					break;
				}
				if ( keepRule ) {
					rules[ prop ] = val.param !== undefined ? val.param : true;
				} else {
					$.data( element.form, "validator" ).resetElements( $( element ) );
					delete rules[ prop ];
				}
			}
		} );

		// Evaluate parameters
		$.each( rules, function( rule, parameter ) {
			rules[ rule ] = $.isFunction( parameter ) && rule !== "normalizer" ? parameter( element ) : parameter;
		} );

		// Clean number parameters
		$.each( [ "minlength", "maxlength" ], function() {
			if ( rules[ this ] ) {
				rules[ this ] = Number( rules[ this ] );
			}
		} );
		$.each( [ "rangelength", "range" ], function() {
			var parts;
			if ( rules[ this ] ) {
				if ( $.isArray( rules[ this ] ) ) {
					rules[ this ] = [ Number( rules[ this ][ 0 ] ), Number( rules[ this ][ 1 ] ) ];
				} else if ( typeof rules[ this ] === "string" ) {
					parts = rules[ this ].replace( /[\[\]]/g, "" ).split( /[\s,]+/ );
					rules[ this ] = [ Number( parts[ 0 ] ), Number( parts[ 1 ] ) ];
				}
			}
		} );

		if ( $.validator.autoCreateRanges ) {

			// Auto-create ranges
			if ( rules.min != null && rules.max != null ) {
				rules.range = [ rules.min, rules.max ];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength != null && rules.maxlength != null ) {
				rules.rangelength = [ rules.minlength, rules.maxlength ];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			} );
			data = transformed;
		}
		return data;
	},

	// http://jqueryvalidation.org/jQuery.validator.addMethod/
	addMethod: function( name, method, message ) {
		$.validator.methods[ name ] = method;
		$.validator.messages[ name ] = message !== undefined ? message : $.validator.messages[ name ];
		if ( method.length < 3 ) {
			$.validator.addClassRules( name, $.validator.normalizeRule( name ) );
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.methods/
	methods: {

		// http://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			// Check if dependency is met
			if ( !this.depend( param, element ) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {

				// Could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.checkable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value.length > 0;
		},

		// http://jqueryvalidation.org/email-method/
		email: function( value, element ) {

			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// http://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// http://jqueryvalidation.org/date-method/
		date: function( value, element ) {
			return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
		},

		// http://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// http://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
		},

		// http://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// http://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// http://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// http://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// http://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// http://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/step-method/
		step: function( value, element, param ) {
			var type = $( element ).attr( "type" ),
				errorMessage = "Step attribute on input type " + type + " is not supported.",
				supportedTypes = [ "text", "number", "range" ],
				re = new RegExp( "\\b" + type + "\\b" ),
				notSupported = type && !re.test( supportedTypes.join() );

			// Works only for text, number and range input types
			// TODO find a way to support input types date, datetime, datetime-local, month, time and week
			if ( notSupported ) {
				throw new Error( errorMessage );
			}
			return this.optional( element ) || ( value % param === 0 );
		},

		// http://jqueryvalidation.org/equalTo-method/
		equalTo: function( value, element, param ) {

			// Bind to the blur event of the target in order to revalidate whenever the target field is updated
			var target = $( param );
			if ( this.settings.onfocusout && target.not( ".validate-equalTo-blur" ).length ) {
				target.addClass( "validate-equalTo-blur" ).on( "blur.validate-equalTo", function() {
					$( element ).valid();
				} );
			}
			return value === target.val();
		},

		// http://jqueryvalidation.org/remote-method/
		remote: function( value, element, param, method ) {
			if ( this.optional( element ) ) {
				return "dependency-mismatch";
			}

			method = typeof method === "string" && method || "remote";

			var previous = this.previousValue( element, method ),
				validator, data, optionDataString;

			if ( !this.settings.messages[ element.name ] ) {
				this.settings.messages[ element.name ] = {};
			}
			previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
			this.settings.messages[ element.name ][ method ] = previous.message;

			param = typeof param === "string" && { url: param } || param;
			optionDataString = $.param( $.extend( { data: value }, param.data ) );
			if ( previous.old === optionDataString ) {
				return previous.valid;
			}

			previous.old = optionDataString;
			validator = this;
			this.startRequest( element );
			data = {};
			data[ element.name ] = value;
			$.ajax( $.extend( true, {
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				context: validator.currentForm,
				success: function( response ) {
					var valid = response === true || response === "true",
						errors, message, submitted;

					validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
					if ( valid ) {
						submitted = validator.formSubmitted;
						validator.resetInternals();
						validator.toHide = validator.errorsFor( element );
						validator.formSubmitted = submitted;
						validator.successList.push( element );
						validator.invalid[ element.name ] = false;
						validator.showErrors();
					} else {
						errors = {};
						message = response || validator.defaultMessage( element, { method: method, parameters: value } );
						errors[ element.name ] = previous.message = message;
						validator.invalid[ element.name ] = true;
						validator.showErrors( errors );
					}
					previous.valid = valid;
					validator.stopRequest( element, valid );
				}
			}, param ) );
			return "pending";
		}
	}

} );

// Ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

var pendingRequests = {},
	ajax;

// Use a prefilter if available (1.5+)
if ( $.ajaxPrefilter ) {
	$.ajaxPrefilter( function( settings, _, xhr ) {
		var port = settings.port;
		if ( settings.mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = xhr;
		}
	} );
} else {

	// Proxy ajax
	ajax = $.ajax;
	$.ajax = function( settings ) {
		var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
			port = ( "port" in settings ? settings : $.ajaxSettings ).port;
		if ( mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = ajax.apply( this, arguments );
			return pendingRequests[ port ];
		}
		return ajax.apply( this, arguments );
	};
}

}));

/*jshint browser:true */
/*!
* FitVids 1.1
*
* Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
*/

;(function( $ ){

  'use strict';

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null,
      ignore: null
    };

    if(!document.getElementById('fit-vids-style')) {
      // appendStyles: https://github.com/toddmotto/fluidvids/blob/master/dist/fluidvids.js
      var head = document.head || document.getElementsByTagName('head')[0];
      var css = '.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}';
      var div = document.createElement("div");
      div.innerHTML = '<p>x</p><style id="fit-vids-style">' + css + '</style>';
      head.appendChild(div.childNodes[1]);
    }

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        'iframe[src*="player.vimeo.com"]',
        'iframe[src*="youtube.com"]',
        'iframe[src*="youtube-nocookie.com"]',
        'iframe[src*="kickstarter.com"][src*="video.html"]',
        'object',
        'embed'
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var ignoreList = '.fitvidsignore';

      if(settings.ignore) {
        ignoreList = ignoreList + ', ' + settings.ignore;
      }

      var $allVideos = $(this).find(selectors.join(','));
      $allVideos = $allVideos.not('object object'); // SwfObj conflict patch
      $allVideos = $allVideos.not(ignoreList); // Disable FitVids on this video.

      $allVideos.each(function(){
        var $this = $(this);
        if($this.parents(ignoreList).length > 0) {
          return; // Disable FitVids on this video.
        }
        if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        if ((!$this.css('height') && !$this.css('width')) && (isNaN($this.attr('height')) || isNaN($this.attr('width'))))
        {
          $this.attr('height', 9);
          $this.attr('width', 16);
        }
        var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
            width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('name')){
          var videoName = 'fitvid' + $.fn.fitVids._count;
          $this.attr('name', videoName);
          $.fn.fitVids._count++;
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+'%');
        $this.removeAttr('height').removeAttr('width');
      });
    });
  };

  // Internal counter for unique video names.
  $.fn.fitVids._count = 0;

})( jQuery );
/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

/**
 * @file
 * Initialization script for global processes
 */

(function ($, Drupal) {

/**
 *
 * Initialize fitVid for YouTube vieos.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */

	Drupal.behaviors.fitvidinit = {
	 attach: function (context, settings) {
			(function ($) {
				$(document).ready(function(){
					$('.video-container').fitVids();
				});
			})(jQuery);
		}
	};

	Drupal.behaviors.jumpMenu = {
		attach: function (context, settings) {
			$('.js-dropdown-select').on('change', function () {
				window.location = $(this).find(':selected').data('url');
			});
		}
	};

})(jQuery, Drupal);

/**
 * @file
 * Interactions for form validation.
 * Reference http://codepen.io/anon/pen/GHKJj
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */

(function ($, Drupal) {
  Drupal.behaviors.formitems = {
    attach: function (context, settings) {
      (function ($) {

        //////////////////////////////////
        // Validate form
        //////////////////////////////////

        // Validate on page load
        $('.simple-step-form, .multi-step-form').validate({
          rules: {
            tel: {
              number: true
            }
          },
          ignore: ':hidden'
        });

        // Multi step form next link
        $('.step-form-next').click(function() {

          // Fieldset variables
          var current_fs = $(this).closest('fieldset');
          var next_fs = $(this).closest('fieldset').next('fieldset');
          var prev_fs = $(this).closest('fieldset').prevAll('fieldset');

          // If current fieldset is valid go to next fieldset
          if($('.multi-step-form').valid()) {
            current_fs.removeClass('active').addClass('complete');
            next_fs.addClass('active');
            prev_fs.addClass('complete');
          }
        });

        // Step anchor links
        $('.step-form-anchor').click(function() {

          // Fieldset variable
          var current_fs = $(this).closest('fieldset');

          // If current fieldset has class do this
          if(current_fs.hasClass('complete')) {
            current_fs.removeClass('complete').addClass('active');
            current_fs.siblings('fieldset').removeClass('active');
          }
        });


        //////////////////////////////////
        // Initiate form icons
        //////////////////////////////////

        // Create variable for all selectors needed for icon validator
        var iconSelector = $('.form-item input[type="text"], .form-item input[type="email"], .form-item input[type="url"], .form-item input[type="date"], .form-item input[type="month"], .form-item input[type="time"], .form-item input[type="datetime"], .form-item input[type="datetime-local"], .form-item input[type="week"], .form-item input[type="number"], .form-item input[type="search"], .form-item input[type="tel"], .form-item input[type="color"], .form-item select, .form-item textarea, .form-item-radio label.error, .form-item-radio-label_group label:last-child, .form-item-checkbox label.error');

        // Create form item icon
        $(iconSelector).after('<span class="form-item_icon"></span>');


        //////////////////////////////////
        // Initiate label show/hide
        //////////////////////////////////
        var onClass = 'on';
        var showClass = 'show';

        $('input, textarea, select')
        .bind('checkval', function()
        {
          var label = $(this).prev('label');

          if (this.value !== '')
          label.addClass(showClass);

          else
          label.removeClass(showClass);
        })
        .on('keyup', function()
        {
          $(this).trigger('checkval');
        })
        .on('focus', function()
        {
          $(this).prev('label').addClass(onClass);
        })
        .on('blur', function()
        {
          $(this).prev('label').removeClass(onClass);
        })
        .trigger('checkval');

        //////////////////////////////////
        // Show / Hide password text
        //////////////////////////////////

        $('.form-item_password').click(function() {
          $(this).toggleClass('show');

          if($(this).hasClass('show')) {
            $(this).siblings('input').attr('type', 'text');
          }
          else {
            $(this).siblings('input').attr('type', 'password');
          }
        });

      })(jQuery);
    }
  };
})(jQuery, Drupal);

/**
 * @file
 * Ribbon nav user interactions.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.ribbonnav = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // When a user clicks on the ribbon trigger (main)
         $('.ribbon_dropdown_trigger').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_dropdown_nav').toggleClass('is-active').slideToggle(300);
           $('.ribbon_user-menu_trigger').removeClass('is-active');
           $('.ribbon_user-menu_nav').removeClass('is-active').slideUp(300);;
           $('.ribbon_user-menu_trigger-auth').removeClass('is-active');
           $('.ribbon_user-menu_nav-child').removeClass('is-active').slideUp(300);
         });

         // When a user clicks on the ribbon trigger for user dropdown
         $('.ribbon_user-menu_trigger').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_user-menu_nav').toggleClass('is-active').slideToggle(300);
           $('.ribbon_dropdown_trigger').removeClass('is-active');
           $('.ribbon_dropdown_nav').removeClass('is-active').slideUp(300);
         });

         // When a user clicks on the ribbon trigger for authenticated user dropdown
         $('.ribbon_user-menu_trigger-auth').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_user-menu_nav-child').toggleClass('is-active').slideToggle(300);
           $('.ribbon_dropdown_trigger').removeClass('is-active');
           $('.ribbon_dropdown_nav').removeClass('is-active').slideUp(300);
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Triger overlay when search box is used.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.searchModal = {
     attach: function (context, settings) {
       (function ($) {

         // Trigger events on search button click
         $('.button-search').click(function() {

           // Remove classes for nav dropdowns
           $('.nav-primary_section, .nav-primary_section').removeClass('nav-primary_section-active, nav-primary_section-active');
           $('.nav-primary_section_subnav').removeClass('is-open');

           // If is-open class exists
           if( $('.search_modal').hasClass('is-open') ) {
             $('.search_modal').removeClass('is-open');
             $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
           }

           // If is-open class doesn't exist
           else {
             $('.search_modal').addClass('is-open');
             $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');

             // Focus search input
             setTimeout(function(){
               $('.search_modal .search-field_input').focus();
             }, 300);
           };

           // Remove nav primary list open class and add closed class on search button click
           if ( $(window).width() < 740 ) {
             $('.nav-primary_list').removeClass('nav-primary_list-mobile-open').addClass('nav-primary_list-mobile-closed');
           };
         });

         // Remove classes when clicking close
         $('.search_modal_close').click(function() {
           $('.search_modal').removeClass('is-open');
           $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Interactions for search field.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.searchField = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // Check when a user is typing in search
         $('#search-field').keypress(function() {
           // add a class to the sibling reset button
           $(this).addClass('is-active');
           $(this).siblings('.search-field_reset').addClass('is-active');
         });

         // After the reset is clicked, remove the classes
         $('.search-field_reset').click(function() {
           $(this).blur();
           $(this).removeClass('is-active');
           $(this).siblings('#search-field').removeClass('is-active');
           $('#search-field').focus();
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Behaviors for main menu dropdowns.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.primaryNav = {
     attach: function (context, settings) {
       (function ($) {

         function closeSearch() {
           search = $('.search_modal');
           if (search.hasClass('is-open')) {
             $('.search_modal').removeClass('is-open');
           }
         }

         function showMenu() {
           // add a body class saying that the menu is open
           $('body').addClass('body-nav-primary-open');
           $('.nav-primary_list').addClass('nav-primary_list-mobile-open');
         }

         function showOverlay() {
           setTimeout(function () {
             $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');
           }, 50);
         }

         function closeMenu() {
           $('body').removeClass('body-nav-primary-open');
           $('.nav-primary_list').removeClass('nav-primary_list-mobile-open').addClass('nav-primary_list-mobile-closed');
         }

         function removeActive() {
           setTimeout(function () {
             $('.nav-primary_section').removeClass('nav-primary_section-active').removeClass('is-hidden');
           }, 500);
         }

         function closeOverlay() {
           $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
         }

         function changeActive(section) {
           if (section.hasClass('nav-primary_button')) {
             // toggle a clicked state on the trigger
             $(this).toggleClass('nav-primary_button-clicked');
             // show the overlay
             showOverlay();
           } else {
             section.addClass('nav-primary_section-active');
             section.siblings('.nav-primary_section').removeClass('nav-primary_section-active');
             if ( $(window).width() < 740 ) {
               section.siblings('.nav-primary_section').addClass('is-hidden');
             }
           }
         }

         // Handling for click events. When someone clicks the nav, the mobile nav button, or anywhere
         // on the page if the menu is already open:

         $(document).on('touchstart click', '.body-nav-primary-open, .nav-primary_section, .nav-primary_button', function(e) {
           e.stopPropagation();
           e.preventDefault();

           // is this the mobile button?
           if ($(this).hasClass('nav-primary_button')) {
             // is the menu already open?
             if ($('body').hasClass('body-nav-primary-open')) {
               closeMenu();
               closeOverlay();
             } else {
               showMenu();
               showOverlay();
               closeSearch();
             }
           }
           // is this the nav?
           else if ($(this).hasClass('nav-primary_section')) {
             // is this the active item?
             if ($(this).hasClass('nav-primary_section-active')) {
               if ( $(window).width() < 740 ) {
                 removeActive();
               } else {
                 closeMenu();
                 closeOverlay();
                 removeActive();
               }
             } else {
               if (!$('body').hasClass('body-nav-primary-open')) {
                 showMenu();
                 showOverlay();
                 closeSearch();
               }
               changeActive($(this));
             }
           }
           // is this some other part of the document (clicking outside the nav)?
           else {
             closeMenu();
             closeOverlay();
             removeActive();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Jump nav behaviors for article pages.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.jumpNav = {
     attach: function (context, settings) {
       (function ($) {

         //check if a jump nav exists and is visible on the page
         //otherwise we shouldn't do any of this
         if ($('.jumpnav-content').length > 0 &&
         $('.article-body').length > 0 &&
         $('.jump-nav_list li').children().length > 0) {
           initializeJumpNav();
         }

         function initializeJumpNav(){
           // When a user clicks on the ribbon trigger (main)
           $('.jump-nav_title').click(function() {
             // Unfocus on the dropdown
             $(this).blur();
             // add a class to the parent
             $(this).parents('#jump-nav').toggleClass('is-closed');
           });

           // When a user clicks on a title link, close dropdown
           $('.jump-nav_list-item a').click(function() {
             // add a class to the parent
             $('#jump-nav').toggleClass('is-closed');
           });


           // On page scroll
           $(window).scroll(function() {
             var doc = $(document);
             var windowTop = $(window).scrollTop();
             var divTop = $('.jumpnav-anchor').offset().top;
             var body = doc.find('.article-body');
             var content = doc.find('.jumpnav-content');
             var stickyBottom = content.offset().top + content.height();
             var bodyBottom = body.offset().top + body.height();

             // Trigger fixed class
             if (windowTop > divTop) {
               $('#jump-nav').addClass('fixed');
             } else {
               $('#jump-nav').removeClass('fixed');
             }

             // Show / hide jump nav
             if(stickyBottom > bodyBottom) {
               content.hide();
             } else {
               content.fadeIn(250);
             }
           });


           // Animate scroll on jump nav click
           $('.jump-nav_list a').click(function(e) {
             var jumpobj = $(this);
             var target = jumpobj.attr('href');
             var thespeed = 500;
             var offset = $(target).offset().top - 100;
             e.preventDefault();

             $('html,body').animate({
               scrollTop: offset
             }, thespeed);
           });


           var aChildren = $('.jump-nav_list li').children(); // find the a children of the list items
           var aArray = []; // create the empty aArray
           for (var i=0; i < aChildren.length; i++) {
             var aChild = aChildren[i];
             var ahref = $(aChild).attr('href');
             aArray.push(ahref);
           }

           // Trigger is-active class when user scrolls into each section
           $(window).scroll(function() {
             var windowPos = $(window).scrollTop() + 105; // get the offset of the window from the top of page
             var windowHeight = $(window).height(); // get the height of the window
             var docHeight = $(document).height();

             for (var i=0; i < aArray.length; i++) {
               var theID = aArray[i];
               var divPos = $(theID).offset().top; // get the offset of the div from the top of page
               var divHeight = $(theID).height(); // get the height of the div in question
               if (windowPos >= divPos && windowPos < (divPos + divHeight)) {
                 $('a[href="' + theID + '"]').parent("li").addClass('is-active');
               } else {
                 $('a[href="' + theID + '"]').parent("li").removeClass('is-active');
               }
             }

             if(windowPos + windowHeight == docHeight) {
               if (!$('.jump-nav_list li:last-child').hasClass('is-active')) {
                 var navActiveCurrent = $('.is-active').attr('href');
                 $('a[href="' + navActiveCurrent + '"]').parent("li").removeClass('is-active');
                 $('.jump-nav_list li:last-child').addClass('is-active');
               }
             }
           });
         }

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Behavior for tabs on homepage audience selector.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.tabsAudienceSelector = {
     attach: function (context, settings) {
       (function ($) {

         var bp_med = 900; // 900px = $bp-med css variable

         // checkWidth function
         function checkWidth() {
           if (($(window).width() >= bp_med)) {
             // Show all li selectors
             $('.tabs-audience_selector_list > li').css('display', 'inline-block');
           }
           else {
             // Display list-item for all li selectors
             $('.tabs-audience_selector_list > li').css('display', 'list-item');
             // Hide all li selectors expect first one
             $('.tabs-audience_selector_list > li:gt(0)').hide();
           }
         }

         // Run checkWidth
         checkWidth();
         // Re-run checkWidth on window resize
         $(window).resize(checkWidth);

         // Mobile Audience Selector tabs
         $('.tabs-audience_selector_list').click(function () {
           // If viewport is smaller than 900px
           if (($(window).width() < bp_med)) {
             // Add the active class to the list when it is clicked
             $(this).toggleClass('open');
             // Toggle hidden items on click
             $(this).children('li:gt(0)').slideToggle();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Make accordions accordion-y.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.accordion = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // When a user clicks on the ribbon trigger (main)
         $('.accordion-trigger').click(function() {
           // Unfocus on the trigger
           $(this).blur();
           // add a class to the sibling accordion content
           $(this).toggleClass('is-active');
           $(this).siblings('.accordion-content').toggleClass('is-active').slideToggle(300);
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Behaviors for the homepage featured content block.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.featuredContent = {
     attach: function (context, settings) {
       (function ($) {

         // Hide items except first 3
         $('.audience_featured-hero_item').each(function() {
           $(this).find('.list_featured_content-item:gt(2)').addClass('hidden').hide();
         });

         // Create a toggle between Load more and less
         $('.link_load_more_less a').on('click', function() {

           // Featured content path variable
           var featuredContent = '.audience_featured-hero_item.active .list_featured_content-item';
           var featuredContentShown = $(featuredContent+'.shown');
           var featuredContentHidden = $(featuredContent+'.hidden');

           // If featured content has show class do this
           if($(featuredContent).hasClass('hidden')) {

             // Updated link text and icon
             $(this).contents().first()[0].textContent='Load less ';
             $(this).children('.icon').removeClass('icon-viewmore').addClass('icon-viewless');

             // Slide open hidden content on click
             featuredContentHidden.each(function() {
               $(this).removeClass('hidden').addClass('shown');
               $(this).slideDown(300);
             });
           }

           // If featured content has hide class do this
           else if($(featuredContent).hasClass('shown')) {

             // Updated link text and icon
             $(this).contents().first()[0].textContent='Load more ';
             $(this).children('.icon').removeClass('icon-viewless').addClass('icon-viewmore');

             // Slide close hidden content on click
             featuredContentShown.each(function() {
               $(this).removeClass('shown').addClass('hidden');
               $(this).slideUp(300);
             });
           };

         });

         // Audience tab interaction
         $('.tabs-audience_selector_list_item a').click(function() {

           // Tab data variable
           var tab_id = $(this).attr('data-tab');

           // Remove classes
           $('.tabs-audience_selector_list_item a').removeClass('active');
           $('.audience_featured-hero_item').removeClass('active');

           // Add classes
           $(this).addClass('active');
           $('#'+tab_id).addClass('active');
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Toggle select block message.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.blockSelect = {
     attach: function (context, settings) {
       (function ($) {

         $('.block-select').click(function() {
           $(this).toggleClass('block-select-selected');
           $('.block-select_message').toggleClass('block-select_message-hidden');  });

         })(jQuery);
       }
     };
   })(jQuery, Drupal);

/**
 * @file
 * Make primary header sticky.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.headerPrimary = {
     attach: function (context, settings) {
       (function ($) {

         //check if a primary nav exists and is visible on the page
         //otherwise we shouldn't do any of this
         if ($('.header-primary-span').length > 0){
           initializePrimaryHeader();
         }

         // Find height of ribbon and header-primary to create proper spacing
         function checkHeight() {
           var headerHeight = $('.header-primary').height();
           var ribbonHeight = $('.ribbon').height();

           $('.header-primary-span').css({'height':(headerHeight)+'px'});
           $('.header-primary').css({'top':(ribbonHeight)+'px'});
         }

         function initializePrimaryHeader(){
           // Set height on page load
           setTimeout(function(){ checkHeight(); }, 100);
           // Check height on window resize
           $(window).resize(checkHeight);

           // Add class to header-primary on scroll
           $(window).scroll(function() {
             var scroll = $(window).scrollTop();
             var os = $('.header-primary-span').offset().top;
             var ht = $('.header-primary-span').height();

             if(scroll > os + ht){
               $(".header-primary").addClass("header-primary--sticky");
             } else {
               $(".header-primary").removeClass("header-primary--sticky");
             }
           });
         }

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Interactions for wayfinder.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
(function ($, Drupal) {
  Drupal.behaviors.wayfinder = {
    attach: function (context, settings) {
      (function ($) {

        // Read wayfinder cookies set from ama-assn domains
        $.cookie.json = true;
        var ama_wayfinder_cookie = $.cookie('ama_wayfinder_cookie');
        
        if (typeof ama_wayfinder_cookie !== 'undefined') {
          $('.wayfinder_referrer .link-back').show().css('display', 'flex');
          $('.link-back').attr("href", ama_wayfinder_cookie[1]);
          $('.link-back .link-back_text').text(ama_wayfinder_cookie[0]);
        } else {
          $('.wayfinder_referrer .link-back').hide()
        }
      })(jQuery);
    }
  };
})(jQuery, Drupal);

/**
 * @file
 * Responsive behaviors for EC Tabs Course Browser.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.ecTabsCourseBrowser = {
     attach: function (context, settings) {
       (function ($) {

         var bp_med = 900; // 900px = $bp-med css variable

         // checkWidth function
         function checkWidth() {
           if (($(window).width() >= bp_med)) {
             // Show all li selectors
             $('.tabs-course_browser_list-tabs > li').css('display', 'inline-block');
           }
           else {
             // Display list-item for all li selectors
             $('.tabs-course_browser_list-tabs > li').css('display', 'list-item');
             // Hide all li selectors expect first one
             $('.tabs-course_browser_list-tabs > li:gt(0)').hide();
           }
         }

         // Run checkWidth
         checkWidth();
         // Re-run checkWidth on window resize
         $(window).resize(checkWidth);

         // Mobile Course Browser tabs
         $('.tabs-course_browser_list-tabs').click(function () {
           // If viewport is smaller than 900px
           if (($(window).width() < bp_med)) {
             // Add the active class to the list when it is clicked
             $(this).toggleClass('open');
             // Toggle hidden items on click
             $(this).children('li:gt(0)').slideToggle();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS52YWxpZGF0ZS5qcyIsImZpdHZpZHMuanMiLCJqcXVlcnkuY29va2llLmpzIiwiaW5pdC5qcyIsImZvcm0taXRlbXMuanMiLCJuYXYuanMiLCIwMC1hdG9tcy8wNi1idXR0b25zLzAxLWJ1dHRvbi1zZWFyY2gvc2VhcmNoLW1vZGFsLmpzIiwiMDEtbW9sZWN1bGVzLzA0LWZvcm1zLzAwLXNlYXJjaC1maWVsZC9zZWFyY2guanMiLCIwMS1tb2xlY3VsZXMvMDUtbmF2aWdhdGlvbi8wMC1wcmltYXJ5LW5hdi9wcmltYXJ5LW5hdi5qcyIsIjAxLW1vbGVjdWxlcy8wNS1uYXZpZ2F0aW9uLzAxLWp1bXAtbmF2L2p1bXAtbmF2LmpzIiwiMDEtbW9sZWN1bGVzLzA1LW5hdmlnYXRpb24vMDYtdGFicy1hdWRpZW5jZS1zZWxlY3Rvci90YWJzLWF1ZGllbmNlLXNlbGVjdG9yLmpzIiwiMDEtbW9sZWN1bGVzLzA2LWNvbXBvbmVudHMvMTMtYWNjb3JkaW9uL2FjY29yZGlvbi5qcyIsIjAxLW1vbGVjdWxlcy8wOC1saXN0cy8wNi1saXN0LWZlYXR1cmVkLWNvbnRlbnQtaGVyby9mZWF0dXJlZC1jb250ZW50LmpzIiwiMDEtbW9sZWN1bGVzLzExLWFjY291bnQtbWdtdC1jZW50ZXIvMDEtYmxvY2stc2VsZWN0L2Jsb2NrLXNlbGVjdC5qcyIsIjAyLW9yZ2FuaXNtcy8wMC1nbG9iYWwvMDAtaGVhZGVyLXByaW1hcnkvaGVhZGVyLXByaW1hcnkuanMiLCIwMi1vcmdhbmlzbXMvMDAtZ2xvYmFsLzA2LXdheWZpbmRlci93YXlmaW5kZXIuanMiLCIwMi1vcmdhbmlzbXMvMDUtZWMvMDMtZWMtdGFicy1jb3Vyc2UtYnJvd3Nlci9lYy10YWJzLWNvdXJzZS1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzUvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InN0eWxlZ3VpZGUtY3VzdG9tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcbiAqIGpRdWVyeSBWYWxpZGF0aW9uIFBsdWdpbiB2MS4xNS4wXHJcbiAqXHJcbiAqIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE2IErDtnJuIFphZWZmZXJlclxyXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcclxuICovXHJcbihmdW5jdGlvbiggZmFjdG9yeSApIHtcclxuXHRpZiAoIHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kICkge1xyXG5cdFx0ZGVmaW5lKCBbXCJqcXVlcnlcIl0sIGZhY3RvcnkgKTtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSggcmVxdWlyZSggXCJqcXVlcnlcIiApICk7XHJcblx0fSBlbHNlIHtcclxuXHRcdGZhY3RvcnkoIGpRdWVyeSApO1xyXG5cdH1cclxufShmdW5jdGlvbiggJCApIHtcclxuXHJcbiQuZXh0ZW5kKCAkLmZuLCB7XG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3ZhbGlkYXRlL1xuXHR2YWxpZGF0ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cblx0XHQvLyBJZiBub3RoaW5nIGlzIHNlbGVjdGVkLCByZXR1cm4gbm90aGluZzsgY2FuJ3QgY2hhaW4gYW55d2F5XG5cdFx0aWYgKCAhdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5kZWJ1ZyAmJiB3aW5kb3cuY29uc29sZSApIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCBcIk5vdGhpbmcgc2VsZWN0ZWQsIGNhbid0IHZhbGlkYXRlLCByZXR1cm5pbmcgbm90aGluZy5cIiApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENoZWNrIGlmIGEgdmFsaWRhdG9yIGZvciB0aGlzIGZvcm0gd2FzIGFscmVhZHkgY3JlYXRlZFxuXHRcdHZhciB2YWxpZGF0b3IgPSAkLmRhdGEoIHRoaXNbIDAgXSwgXCJ2YWxpZGF0b3JcIiApO1xuXHRcdGlmICggdmFsaWRhdG9yICkge1xuXHRcdFx0cmV0dXJuIHZhbGlkYXRvcjtcblx0XHR9XG5cblx0XHQvLyBBZGQgbm92YWxpZGF0ZSB0YWcgaWYgSFRNTDUuXG5cdFx0dGhpcy5hdHRyKCBcIm5vdmFsaWRhdGVcIiwgXCJub3ZhbGlkYXRlXCIgKTtcblxuXHRcdHZhbGlkYXRvciA9IG5ldyAkLnZhbGlkYXRvciggb3B0aW9ucywgdGhpc1sgMCBdICk7XG5cdFx0JC5kYXRhKCB0aGlzWyAwIF0sIFwidmFsaWRhdG9yXCIsIHZhbGlkYXRvciApO1xuXG5cdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3Mub25zdWJtaXQgKSB7XG5cblx0XHRcdHRoaXMub24oIFwiY2xpY2sudmFsaWRhdGVcIiwgXCI6c3VibWl0XCIsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3Muc3VibWl0SGFuZGxlciApIHtcblx0XHRcdFx0XHR2YWxpZGF0b3Iuc3VibWl0QnV0dG9uID0gZXZlbnQudGFyZ2V0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQWxsb3cgc3VwcHJlc3NpbmcgdmFsaWRhdGlvbiBieSBhZGRpbmcgYSBjYW5jZWwgY2xhc3MgdG8gdGhlIHN1Ym1pdCBidXR0b25cblx0XHRcdFx0aWYgKCAkKCB0aGlzICkuaGFzQ2xhc3MoIFwiY2FuY2VsXCIgKSApIHtcblx0XHRcdFx0XHR2YWxpZGF0b3IuY2FuY2VsU3VibWl0ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEFsbG93IHN1cHByZXNzaW5nIHZhbGlkYXRpb24gYnkgYWRkaW5nIHRoZSBodG1sNSBmb3Jtbm92YWxpZGF0ZSBhdHRyaWJ1dGUgdG8gdGhlIHN1Ym1pdCBidXR0b25cblx0XHRcdFx0aWYgKCAkKCB0aGlzICkuYXR0ciggXCJmb3Jtbm92YWxpZGF0ZVwiICkgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHR2YWxpZGF0b3IuY2FuY2VsU3VibWl0ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBWYWxpZGF0ZSB0aGUgZm9ybSBvbiBzdWJtaXRcblx0XHRcdHRoaXMub24oIFwic3VibWl0LnZhbGlkYXRlXCIsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3MuZGVidWcgKSB7XG5cblx0XHRcdFx0XHQvLyBQcmV2ZW50IGZvcm0gc3VibWl0IHRvIGJlIGFibGUgdG8gc2VlIGNvbnNvbGUgb3V0cHV0XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRmdW5jdGlvbiBoYW5kbGUoKSB7XG5cdFx0XHRcdFx0dmFyIGhpZGRlbiwgcmVzdWx0O1xuXHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnNldHRpbmdzLnN1Ym1pdEhhbmRsZXIgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zdWJtaXRCdXR0b24gKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gSW5zZXJ0IGEgaGlkZGVuIGlucHV0IGFzIGEgcmVwbGFjZW1lbnQgZm9yIHRoZSBtaXNzaW5nIHN1Ym1pdCBidXR0b25cblx0XHRcdFx0XHRcdFx0aGlkZGVuID0gJCggXCI8aW5wdXQgdHlwZT0naGlkZGVuJy8+XCIgKVxuXHRcdFx0XHRcdFx0XHRcdC5hdHRyKCBcIm5hbWVcIiwgdmFsaWRhdG9yLnN1Ym1pdEJ1dHRvbi5uYW1lIClcblx0XHRcdFx0XHRcdFx0XHQudmFsKCAkKCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uICkudmFsKCkgKVxuXHRcdFx0XHRcdFx0XHRcdC5hcHBlbmRUbyggdmFsaWRhdG9yLmN1cnJlbnRGb3JtICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSB2YWxpZGF0b3Iuc2V0dGluZ3Muc3VibWl0SGFuZGxlci5jYWxsKCB2YWxpZGF0b3IsIHZhbGlkYXRvci5jdXJyZW50Rm9ybSwgZXZlbnQgKTtcblx0XHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnN1Ym1pdEJ1dHRvbiApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBBbmQgY2xlYW4gdXAgYWZ0ZXJ3YXJkczsgdGhhbmtzIHRvIG5vLWJsb2NrLXNjb3BlLCBoaWRkZW4gY2FuIGJlIHJlZmVyZW5jZWRcblx0XHRcdFx0XHRcdFx0aGlkZGVuLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKCByZXN1bHQgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBQcmV2ZW50IHN1Ym1pdCBmb3IgaW52YWxpZCBmb3JtcyBvciBjdXN0b20gc3VibWl0IGhhbmRsZXJzXG5cdFx0XHRcdGlmICggdmFsaWRhdG9yLmNhbmNlbFN1Ym1pdCApIHtcblx0XHRcdFx0XHR2YWxpZGF0b3IuY2FuY2VsU3VibWl0ID0gZmFsc2U7XG5cdFx0XHRcdFx0cmV0dXJuIGhhbmRsZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdmFsaWRhdG9yLmZvcm0oKSApIHtcblx0XHRcdFx0XHRpZiAoIHZhbGlkYXRvci5wZW5kaW5nUmVxdWVzdCApIHtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5mb3JtU3VibWl0dGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGhhbmRsZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5mb2N1c0ludmFsaWQoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdmFsaWRhdG9yO1xuXHR9LFxuXG5cdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy92YWxpZC9cblx0dmFsaWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2YWxpZCwgdmFsaWRhdG9yLCBlcnJvckxpc3Q7XG5cblx0XHRpZiAoICQoIHRoaXNbIDAgXSApLmlzKCBcImZvcm1cIiApICkge1xuXHRcdFx0dmFsaWQgPSB0aGlzLnZhbGlkYXRlKCkuZm9ybSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRlcnJvckxpc3QgPSBbXTtcblx0XHRcdHZhbGlkID0gdHJ1ZTtcblx0XHRcdHZhbGlkYXRvciA9ICQoIHRoaXNbIDAgXS5mb3JtICkudmFsaWRhdGUoKTtcblx0XHRcdHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhbGlkID0gdmFsaWRhdG9yLmVsZW1lbnQoIHRoaXMgKSAmJiB2YWxpZDtcblx0XHRcdFx0aWYgKCAhdmFsaWQgKSB7XG5cdFx0XHRcdFx0ZXJyb3JMaXN0ID0gZXJyb3JMaXN0LmNvbmNhdCggdmFsaWRhdG9yLmVycm9yTGlzdCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0XHR2YWxpZGF0b3IuZXJyb3JMaXN0ID0gZXJyb3JMaXN0O1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsaWQ7XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3J1bGVzL1xuXHRydWxlczogZnVuY3Rpb24oIGNvbW1hbmQsIGFyZ3VtZW50ICkge1xuXG5cdFx0Ly8gSWYgbm90aGluZyBpcyBzZWxlY3RlZCwgcmV0dXJuIG5vdGhpbmc7IGNhbid0IGNoYWluIGFueXdheVxuXHRcdGlmICggIXRoaXMubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBlbGVtZW50ID0gdGhpc1sgMCBdLFxuXHRcdFx0c2V0dGluZ3MsIHN0YXRpY1J1bGVzLCBleGlzdGluZ1J1bGVzLCBkYXRhLCBwYXJhbSwgZmlsdGVyZWQ7XG5cblx0XHRpZiAoIGNvbW1hbmQgKSB7XG5cdFx0XHRzZXR0aW5ncyA9ICQuZGF0YSggZWxlbWVudC5mb3JtLCBcInZhbGlkYXRvclwiICkuc2V0dGluZ3M7XG5cdFx0XHRzdGF0aWNSdWxlcyA9IHNldHRpbmdzLnJ1bGVzO1xuXHRcdFx0ZXhpc3RpbmdSdWxlcyA9ICQudmFsaWRhdG9yLnN0YXRpY1J1bGVzKCBlbGVtZW50ICk7XG5cdFx0XHRzd2l0Y2ggKCBjb21tYW5kICkge1xuXHRcdFx0Y2FzZSBcImFkZFwiOlxuXHRcdFx0XHQkLmV4dGVuZCggZXhpc3RpbmdSdWxlcywgJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggYXJndW1lbnQgKSApO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSBtZXNzYWdlcyBmcm9tIHJ1bGVzLCBidXQgYWxsb3cgdGhlbSB0byBiZSBzZXQgc2VwYXJhdGVseVxuXHRcdFx0XHRkZWxldGUgZXhpc3RpbmdSdWxlcy5tZXNzYWdlcztcblx0XHRcdFx0c3RhdGljUnVsZXNbIGVsZW1lbnQubmFtZSBdID0gZXhpc3RpbmdSdWxlcztcblx0XHRcdFx0aWYgKCBhcmd1bWVudC5tZXNzYWdlcyApIHtcblx0XHRcdFx0XHRzZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0gPSAkLmV4dGVuZCggc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdLCBhcmd1bWVudC5tZXNzYWdlcyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcInJlbW92ZVwiOlxuXHRcdFx0XHRpZiAoICFhcmd1bWVudCApIHtcblx0XHRcdFx0XHRkZWxldGUgc3RhdGljUnVsZXNbIGVsZW1lbnQubmFtZSBdO1xuXHRcdFx0XHRcdHJldHVybiBleGlzdGluZ1J1bGVzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZpbHRlcmVkID0ge307XG5cdFx0XHRcdCQuZWFjaCggYXJndW1lbnQuc3BsaXQoIC9cXHMvICksIGZ1bmN0aW9uKCBpbmRleCwgbWV0aG9kICkge1xuXHRcdFx0XHRcdGZpbHRlcmVkWyBtZXRob2QgXSA9IGV4aXN0aW5nUnVsZXNbIG1ldGhvZCBdO1xuXHRcdFx0XHRcdGRlbGV0ZSBleGlzdGluZ1J1bGVzWyBtZXRob2QgXTtcblx0XHRcdFx0XHRpZiAoIG1ldGhvZCA9PT0gXCJyZXF1aXJlZFwiICkge1xuXHRcdFx0XHRcdFx0JCggZWxlbWVudCApLnJlbW92ZUF0dHIoIFwiYXJpYS1yZXF1aXJlZFwiICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cdFx0XHRcdHJldHVybiBmaWx0ZXJlZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRkYXRhID0gJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZXMoXG5cdFx0JC5leHRlbmQoXG5cdFx0XHR7fSxcblx0XHRcdCQudmFsaWRhdG9yLmNsYXNzUnVsZXMoIGVsZW1lbnQgKSxcblx0XHRcdCQudmFsaWRhdG9yLmF0dHJpYnV0ZVJ1bGVzKCBlbGVtZW50ICksXG5cdFx0XHQkLnZhbGlkYXRvci5kYXRhUnVsZXMoIGVsZW1lbnQgKSxcblx0XHRcdCQudmFsaWRhdG9yLnN0YXRpY1J1bGVzKCBlbGVtZW50IClcblx0XHQpLCBlbGVtZW50ICk7XG5cblx0XHQvLyBNYWtlIHN1cmUgcmVxdWlyZWQgaXMgYXQgZnJvbnRcblx0XHRpZiAoIGRhdGEucmVxdWlyZWQgKSB7XG5cdFx0XHRwYXJhbSA9IGRhdGEucmVxdWlyZWQ7XG5cdFx0XHRkZWxldGUgZGF0YS5yZXF1aXJlZDtcblx0XHRcdGRhdGEgPSAkLmV4dGVuZCggeyByZXF1aXJlZDogcGFyYW0gfSwgZGF0YSApO1xuXHRcdFx0JCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1yZXF1aXJlZFwiLCBcInRydWVcIiApO1xuXHRcdH1cblxuXHRcdC8vIE1ha2Ugc3VyZSByZW1vdGUgaXMgYXQgYmFja1xuXHRcdGlmICggZGF0YS5yZW1vdGUgKSB7XG5cdFx0XHRwYXJhbSA9IGRhdGEucmVtb3RlO1xuXHRcdFx0ZGVsZXRlIGRhdGEucmVtb3RlO1xuXHRcdFx0ZGF0YSA9ICQuZXh0ZW5kKCBkYXRhLCB7IHJlbW90ZTogcGFyYW0gfSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBkYXRhO1xuXHR9XG59ICk7XG5cbi8vIEN1c3RvbSBzZWxlY3RvcnNcbiQuZXh0ZW5kKCAkLmV4cHJbIFwiOlwiIF0sIHtcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvYmxhbmstc2VsZWN0b3IvXG5cdGJsYW5rOiBmdW5jdGlvbiggYSApIHtcblx0XHRyZXR1cm4gISQudHJpbSggXCJcIiArICQoIGEgKS52YWwoKSApO1xuXHR9LFxuXG5cdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9maWxsZWQtc2VsZWN0b3IvXG5cdGZpbGxlZDogZnVuY3Rpb24oIGEgKSB7XG5cdFx0dmFyIHZhbCA9ICQoIGEgKS52YWwoKTtcblx0XHRyZXR1cm4gdmFsICE9PSBudWxsICYmICEhJC50cmltKCBcIlwiICsgdmFsICk7XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3VuY2hlY2tlZC1zZWxlY3Rvci9cblx0dW5jaGVja2VkOiBmdW5jdGlvbiggYSApIHtcblx0XHRyZXR1cm4gISQoIGEgKS5wcm9wKCBcImNoZWNrZWRcIiApO1xuXHR9XG59ICk7XG5cbi8vIENvbnN0cnVjdG9yIGZvciB2YWxpZGF0b3JcbiQudmFsaWRhdG9yID0gZnVuY3Rpb24oIG9wdGlvbnMsIGZvcm0gKSB7XG5cdHRoaXMuc2V0dGluZ3MgPSAkLmV4dGVuZCggdHJ1ZSwge30sICQudmFsaWRhdG9yLmRlZmF1bHRzLCBvcHRpb25zICk7XG5cdHRoaXMuY3VycmVudEZvcm0gPSBmb3JtO1xuXHR0aGlzLmluaXQoKTtcbn07XG5cbi8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9qUXVlcnkudmFsaWRhdG9yLmZvcm1hdC9cbiQudmFsaWRhdG9yLmZvcm1hdCA9IGZ1bmN0aW9uKCBzb3VyY2UsIHBhcmFtcyApIHtcblx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICkge1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhcmdzID0gJC5tYWtlQXJyYXkoIGFyZ3VtZW50cyApO1xuXHRcdFx0YXJncy51bnNoaWZ0KCBzb3VyY2UgKTtcblx0XHRcdHJldHVybiAkLnZhbGlkYXRvci5mb3JtYXQuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcblx0XHR9O1xuXHR9XG5cdGlmICggcGFyYW1zID09PSB1bmRlZmluZWQgKSB7XG5cdFx0cmV0dXJuIHNvdXJjZTtcblx0fVxuXHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIHBhcmFtcy5jb25zdHJ1Y3RvciAhPT0gQXJyYXkgICkge1xuXHRcdHBhcmFtcyA9ICQubWFrZUFycmF5KCBhcmd1bWVudHMgKS5zbGljZSggMSApO1xuXHR9XG5cdGlmICggcGFyYW1zLmNvbnN0cnVjdG9yICE9PSBBcnJheSApIHtcblx0XHRwYXJhbXMgPSBbIHBhcmFtcyBdO1xuXHR9XG5cdCQuZWFjaCggcGFyYW1zLCBmdW5jdGlvbiggaSwgbiApIHtcblx0XHRzb3VyY2UgPSBzb3VyY2UucmVwbGFjZSggbmV3IFJlZ0V4cCggXCJcXFxce1wiICsgaSArIFwiXFxcXH1cIiwgXCJnXCIgKSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gbjtcblx0XHR9ICk7XG5cdH0gKTtcblx0cmV0dXJuIHNvdXJjZTtcbn07XG5cbiQuZXh0ZW5kKCAkLnZhbGlkYXRvciwge1xuXG5cdGRlZmF1bHRzOiB7XG5cdFx0bWVzc2FnZXM6IHt9LFxuXHRcdGdyb3Vwczoge30sXG5cdFx0cnVsZXM6IHt9LFxuXHRcdGVycm9yQ2xhc3M6IFwiZXJyb3JcIixcblx0XHRwZW5kaW5nQ2xhc3M6IFwicGVuZGluZ1wiLFxuXHRcdHZhbGlkQ2xhc3M6IFwidmFsaWRcIixcblx0XHRlcnJvckVsZW1lbnQ6IFwibGFiZWxcIixcblx0XHRmb2N1c0NsZWFudXA6IGZhbHNlLFxuXHRcdGZvY3VzSW52YWxpZDogdHJ1ZSxcblx0XHRlcnJvckNvbnRhaW5lcjogJCggW10gKSxcblx0XHRlcnJvckxhYmVsQ29udGFpbmVyOiAkKCBbXSApLFxuXHRcdG9uc3VibWl0OiB0cnVlLFxuXHRcdGlnbm9yZTogXCI6aGlkZGVuXCIsXG5cdFx0aWdub3JlVGl0bGU6IGZhbHNlLFxuXHRcdG9uZm9jdXNpbjogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHR0aGlzLmxhc3RBY3RpdmUgPSBlbGVtZW50O1xuXG5cdFx0XHQvLyBIaWRlIGVycm9yIGxhYmVsIGFuZCByZW1vdmUgZXJyb3IgY2xhc3Mgb24gZm9jdXMgaWYgZW5hYmxlZFxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmZvY3VzQ2xlYW51cCApIHtcblx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0ICkge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCggdGhpcywgZWxlbWVudCwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLmhpZGVUaGVzZSggdGhpcy5lcnJvcnNGb3IoIGVsZW1lbnQgKSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25mb2N1c291dDogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRpZiAoICF0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICYmICggZWxlbWVudC5uYW1lIGluIHRoaXMuc3VibWl0dGVkIHx8ICF0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgKSApIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50KCBlbGVtZW50ICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvbmtleXVwOiBmdW5jdGlvbiggZWxlbWVudCwgZXZlbnQgKSB7XG5cblx0XHRcdC8vIEF2b2lkIHJldmFsaWRhdGUgdGhlIGZpZWxkIHdoZW4gcHJlc3Npbmcgb25lIG9mIHRoZSBmb2xsb3dpbmcga2V5c1xuXHRcdFx0Ly8gU2hpZnQgICAgICAgPT4gMTZcblx0XHRcdC8vIEN0cmwgICAgICAgID0+IDE3XG5cdFx0XHQvLyBBbHQgICAgICAgICA9PiAxOFxuXHRcdFx0Ly8gQ2FwcyBsb2NrICAgPT4gMjBcblx0XHRcdC8vIEVuZCAgICAgICAgID0+IDM1XG5cdFx0XHQvLyBIb21lICAgICAgICA9PiAzNlxuXHRcdFx0Ly8gTGVmdCBhcnJvdyAgPT4gMzdcblx0XHRcdC8vIFVwIGFycm93ICAgID0+IDM4XG5cdFx0XHQvLyBSaWdodCBhcnJvdyA9PiAzOVxuXHRcdFx0Ly8gRG93biBhcnJvdyAgPT4gNDBcblx0XHRcdC8vIEluc2VydCAgICAgID0+IDQ1XG5cdFx0XHQvLyBOdW0gbG9jayAgICA9PiAxNDRcblx0XHRcdC8vIEFsdEdyIGtleSAgID0+IDIyNVxuXHRcdFx0dmFyIGV4Y2x1ZGVkS2V5cyA9IFtcblx0XHRcdFx0MTYsIDE3LCAxOCwgMjAsIDM1LCAzNiwgMzcsXG5cdFx0XHRcdDM4LCAzOSwgNDAsIDQ1LCAxNDQsIDIyNVxuXHRcdFx0XTtcblxuXHRcdFx0aWYgKCBldmVudC53aGljaCA9PT0gOSAmJiB0aGlzLmVsZW1lbnRWYWx1ZSggZWxlbWVudCApID09PSBcIlwiIHx8ICQuaW5BcnJheSggZXZlbnQua2V5Q29kZSwgZXhjbHVkZWRLZXlzICkgIT09IC0xICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9IGVsc2UgaWYgKCBlbGVtZW50Lm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgfHwgZWxlbWVudC5uYW1lIGluIHRoaXMuaW52YWxpZCApIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50KCBlbGVtZW50ICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvbmNsaWNrOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblxuXHRcdFx0Ly8gQ2xpY2sgb24gc2VsZWN0cywgcmFkaW9idXR0b25zIGFuZCBjaGVja2JveGVzXG5cdFx0XHRpZiAoIGVsZW1lbnQubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCApIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50KCBlbGVtZW50ICk7XG5cblx0XHRcdC8vIE9yIG9wdGlvbiBlbGVtZW50cywgY2hlY2sgcGFyZW50IHNlbGVjdCBpbiB0aGF0IGNhc2Vcblx0XHRcdH0gZWxzZSBpZiAoIGVsZW1lbnQucGFyZW50Tm9kZS5uYW1lIGluIHRoaXMuc3VibWl0dGVkICkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQucGFyZW50Tm9kZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aGlnaGxpZ2h0OiBmdW5jdGlvbiggZWxlbWVudCwgZXJyb3JDbGFzcywgdmFsaWRDbGFzcyApIHtcblx0XHRcdGlmICggZWxlbWVudC50eXBlID09PSBcInJhZGlvXCIgKSB7XG5cdFx0XHRcdHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkuYWRkQ2xhc3MoIGVycm9yQ2xhc3MgKS5yZW1vdmVDbGFzcyggdmFsaWRDbGFzcyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JCggZWxlbWVudCApLmFkZENsYXNzKCBlcnJvckNsYXNzICkucmVtb3ZlQ2xhc3MoIHZhbGlkQ2xhc3MgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHVuaGlnaGxpZ2h0OiBmdW5jdGlvbiggZWxlbWVudCwgZXJyb3JDbGFzcywgdmFsaWRDbGFzcyApIHtcblx0XHRcdGlmICggZWxlbWVudC50eXBlID09PSBcInJhZGlvXCIgKSB7XG5cdFx0XHRcdHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkucmVtb3ZlQ2xhc3MoIGVycm9yQ2xhc3MgKS5hZGRDbGFzcyggdmFsaWRDbGFzcyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JCggZWxlbWVudCApLnJlbW92ZUNsYXNzKCBlcnJvckNsYXNzICkuYWRkQ2xhc3MoIHZhbGlkQ2xhc3MgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2pRdWVyeS52YWxpZGF0b3Iuc2V0RGVmYXVsdHMvXG5cdHNldERlZmF1bHRzOiBmdW5jdGlvbiggc2V0dGluZ3MgKSB7XG5cdFx0JC5leHRlbmQoICQudmFsaWRhdG9yLmRlZmF1bHRzLCBzZXR0aW5ncyApO1xuXHR9LFxuXG5cdG1lc3NhZ2VzOiB7XG5cdFx0cmVxdWlyZWQ6IFwiVGhpcyBmaWVsZCBpcyByZXF1aXJlZC5cIixcblx0XHRyZW1vdGU6IFwiUGxlYXNlIGZpeCB0aGlzIGZpZWxkLlwiLFxuXHRcdGVtYWlsOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGVtYWlsIGFkZHJlc3MuXCIsXG5cdFx0dXJsOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIFVSTC5cIixcblx0XHRkYXRlOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGUuXCIsXG5cdFx0ZGF0ZUlTTzogXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBkYXRlICggSVNPICkuXCIsXG5cdFx0bnVtYmVyOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIG51bWJlci5cIixcblx0XHRkaWdpdHM6IFwiUGxlYXNlIGVudGVyIG9ubHkgZGlnaXRzLlwiLFxuXHRcdGVxdWFsVG86IFwiUGxlYXNlIGVudGVyIHRoZSBzYW1lIHZhbHVlIGFnYWluLlwiLFxuXHRcdG1heGxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBubyBtb3JlIHRoYW4gezB9IGNoYXJhY3RlcnMuXCIgKSxcblx0XHRtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYXQgbGVhc3QgezB9IGNoYXJhY3RlcnMuXCIgKSxcblx0XHRyYW5nZWxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGJldHdlZW4gezB9IGFuZCB7MX0gY2hhcmFjdGVycyBsb25nLlwiICksXG5cdFx0cmFuZ2U6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYSB2YWx1ZSBiZXR3ZWVuIHswfSBhbmQgezF9LlwiICksXG5cdFx0bWF4OiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiApLFxuXHRcdG1pbjogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB7MH0uXCIgKSxcblx0XHRzdGVwOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgbXVsdGlwbGUgb2YgezB9LlwiIClcblx0fSxcblxuXHRhdXRvQ3JlYXRlUmFuZ2VzOiBmYWxzZSxcblxuXHRwcm90b3R5cGU6IHtcblxuXHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sYWJlbENvbnRhaW5lciA9ICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciApO1xuXHRcdFx0dGhpcy5lcnJvckNvbnRleHQgPSB0aGlzLmxhYmVsQ29udGFpbmVyLmxlbmd0aCAmJiB0aGlzLmxhYmVsQ29udGFpbmVyIHx8ICQoIHRoaXMuY3VycmVudEZvcm0gKTtcblx0XHRcdHRoaXMuY29udGFpbmVycyA9ICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JDb250YWluZXIgKS5hZGQoIHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciApO1xuXHRcdFx0dGhpcy5zdWJtaXR0ZWQgPSB7fTtcblx0XHRcdHRoaXMudmFsdWVDYWNoZSA9IHt9O1xuXHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XG5cdFx0XHR0aGlzLnBlbmRpbmcgPSB7fTtcblx0XHRcdHRoaXMuaW52YWxpZCA9IHt9O1xuXHRcdFx0dGhpcy5yZXNldCgpO1xuXG5cdFx0XHR2YXIgZ3JvdXBzID0gKCB0aGlzLmdyb3VwcyA9IHt9ICksXG5cdFx0XHRcdHJ1bGVzO1xuXHRcdFx0JC5lYWNoKCB0aGlzLnNldHRpbmdzLmdyb3VwcywgZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHRcdHZhbHVlID0gdmFsdWUuc3BsaXQoIC9cXHMvICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JC5lYWNoKCB2YWx1ZSwgZnVuY3Rpb24oIGluZGV4LCBuYW1lICkge1xuXHRcdFx0XHRcdGdyb3Vwc1sgbmFtZSBdID0ga2V5O1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9ICk7XG5cdFx0XHRydWxlcyA9IHRoaXMuc2V0dGluZ3MucnVsZXM7XG5cdFx0XHQkLmVhY2goIHJ1bGVzLCBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcblx0XHRcdFx0cnVsZXNbIGtleSBdID0gJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggdmFsdWUgKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0ZnVuY3Rpb24gZGVsZWdhdGUoIGV2ZW50ICkge1xuXHRcdFx0XHR2YXIgdmFsaWRhdG9yID0gJC5kYXRhKCB0aGlzLmZvcm0sIFwidmFsaWRhdG9yXCIgKSxcblx0XHRcdFx0XHRldmVudFR5cGUgPSBcIm9uXCIgKyBldmVudC50eXBlLnJlcGxhY2UoIC9edmFsaWRhdGUvLCBcIlwiICksXG5cdFx0XHRcdFx0c2V0dGluZ3MgPSB2YWxpZGF0b3Iuc2V0dGluZ3M7XG5cdFx0XHRcdGlmICggc2V0dGluZ3NbIGV2ZW50VHlwZSBdICYmICEkKCB0aGlzICkuaXMoIHNldHRpbmdzLmlnbm9yZSApICkge1xuXHRcdFx0XHRcdHNldHRpbmdzWyBldmVudFR5cGUgXS5jYWxsKCB2YWxpZGF0b3IsIHRoaXMsIGV2ZW50ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApXG5cdFx0XHRcdC5vbiggXCJmb2N1c2luLnZhbGlkYXRlIGZvY3Vzb3V0LnZhbGlkYXRlIGtleXVwLnZhbGlkYXRlXCIsXG5cdFx0XHRcdFx0XCI6dGV4dCwgW3R5cGU9J3Bhc3N3b3JkJ10sIFt0eXBlPSdmaWxlJ10sIHNlbGVjdCwgdGV4dGFyZWEsIFt0eXBlPSdudW1iZXInXSwgW3R5cGU9J3NlYXJjaCddLCBcIiArXG5cdFx0XHRcdFx0XCJbdHlwZT0ndGVsJ10sIFt0eXBlPSd1cmwnXSwgW3R5cGU9J2VtYWlsJ10sIFt0eXBlPSdkYXRldGltZSddLCBbdHlwZT0nZGF0ZSddLCBbdHlwZT0nbW9udGgnXSwgXCIgK1xuXHRcdFx0XHRcdFwiW3R5cGU9J3dlZWsnXSwgW3R5cGU9J3RpbWUnXSwgW3R5cGU9J2RhdGV0aW1lLWxvY2FsJ10sIFt0eXBlPSdyYW5nZSddLCBbdHlwZT0nY29sb3InXSwgXCIgK1xuXHRcdFx0XHRcdFwiW3R5cGU9J3JhZGlvJ10sIFt0eXBlPSdjaGVja2JveCddLCBbY29udGVudGVkaXRhYmxlXVwiLCBkZWxlZ2F0ZSApXG5cblx0XHRcdFx0Ly8gU3VwcG9ydDogQ2hyb21lLCBvbGRJRVxuXHRcdFx0XHQvLyBcInNlbGVjdFwiIGlzIHByb3ZpZGVkIGFzIGV2ZW50LnRhcmdldCB3aGVuIGNsaWNraW5nIGEgb3B0aW9uXG5cdFx0XHRcdC5vbiggXCJjbGljay52YWxpZGF0ZVwiLCBcInNlbGVjdCwgb3B0aW9uLCBbdHlwZT0ncmFkaW8nXSwgW3R5cGU9J2NoZWNrYm94J11cIiwgZGVsZWdhdGUgKTtcblxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmludmFsaWRIYW5kbGVyICkge1xuXHRcdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkub24oIFwiaW52YWxpZC1mb3JtLnZhbGlkYXRlXCIsIHRoaXMuc2V0dGluZ3MuaW52YWxpZEhhbmRsZXIgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWRkIGFyaWEtcmVxdWlyZWQgdG8gYW55IFN0YXRpYy9EYXRhL0NsYXNzIHJlcXVpcmVkIGZpZWxkcyBiZWZvcmUgZmlyc3QgdmFsaWRhdGlvblxuXHRcdFx0Ly8gU2NyZWVuIHJlYWRlcnMgcmVxdWlyZSB0aGlzIGF0dHJpYnV0ZSB0byBiZSBwcmVzZW50IGJlZm9yZSB0aGUgaW5pdGlhbCBzdWJtaXNzaW9uIGh0dHA6Ly93d3cudzMub3JnL1RSL1dDQUctVEVDSFMvQVJJQTIuaHRtbFxuXHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLmZpbmQoIFwiW3JlcXVpcmVkXSwgW2RhdGEtcnVsZS1yZXF1aXJlZF0sIC5yZXF1aXJlZFwiICkuYXR0ciggXCJhcmlhLXJlcXVpcmVkXCIsIFwidHJ1ZVwiICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9WYWxpZGF0b3IuZm9ybS9cblx0XHRmb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuY2hlY2tGb3JtKCk7XG5cdFx0XHQkLmV4dGVuZCggdGhpcy5zdWJtaXR0ZWQsIHRoaXMuZXJyb3JNYXAgKTtcblx0XHRcdHRoaXMuaW52YWxpZCA9ICQuZXh0ZW5kKCB7fSwgdGhpcy5lcnJvck1hcCApO1xuXHRcdFx0aWYgKCAhdGhpcy52YWxpZCgpICkge1xuXHRcdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkudHJpZ2dlckhhbmRsZXIoIFwiaW52YWxpZC1mb3JtXCIsIFsgdGhpcyBdICk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnNob3dFcnJvcnMoKTtcblx0XHRcdHJldHVybiB0aGlzLnZhbGlkKCk7XG5cdFx0fSxcblxuXHRcdGNoZWNrRm9ybTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnByZXBhcmVGb3JtKCk7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIGVsZW1lbnRzID0gKCB0aGlzLmN1cnJlbnRFbGVtZW50cyA9IHRoaXMuZWxlbWVudHMoKSApOyBlbGVtZW50c1sgaSBdOyBpKysgKSB7XG5cdFx0XHRcdHRoaXMuY2hlY2soIGVsZW1lbnRzWyBpIF0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzLnZhbGlkKCk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9WYWxpZGF0b3IuZWxlbWVudC9cblx0XHRlbGVtZW50OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciBjbGVhbkVsZW1lbnQgPSB0aGlzLmNsZWFuKCBlbGVtZW50ICksXG5cdFx0XHRcdGNoZWNrRWxlbWVudCA9IHRoaXMudmFsaWRhdGlvblRhcmdldEZvciggY2xlYW5FbGVtZW50ICksXG5cdFx0XHRcdHYgPSB0aGlzLFxuXHRcdFx0XHRyZXN1bHQgPSB0cnVlLFxuXHRcdFx0XHRycywgZ3JvdXA7XG5cblx0XHRcdGlmICggY2hlY2tFbGVtZW50ID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLmludmFsaWRbIGNsZWFuRWxlbWVudC5uYW1lIF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnByZXBhcmVFbGVtZW50KCBjaGVja0VsZW1lbnQgKTtcblx0XHRcdFx0dGhpcy5jdXJyZW50RWxlbWVudHMgPSAkKCBjaGVja0VsZW1lbnQgKTtcblxuXHRcdFx0XHQvLyBJZiB0aGlzIGVsZW1lbnQgaXMgZ3JvdXBlZCwgdGhlbiB2YWxpZGF0ZSBhbGwgZ3JvdXAgZWxlbWVudHMgYWxyZWFkeVxuXHRcdFx0XHQvLyBjb250YWluaW5nIGEgdmFsdWVcblx0XHRcdFx0Z3JvdXAgPSB0aGlzLmdyb3Vwc1sgY2hlY2tFbGVtZW50Lm5hbWUgXTtcblx0XHRcdFx0aWYgKCBncm91cCApIHtcblx0XHRcdFx0XHQkLmVhY2goIHRoaXMuZ3JvdXBzLCBmdW5jdGlvbiggbmFtZSwgdGVzdGdyb3VwICkge1xuXHRcdFx0XHRcdFx0aWYgKCB0ZXN0Z3JvdXAgPT09IGdyb3VwICYmIG5hbWUgIT09IGNoZWNrRWxlbWVudC5uYW1lICkge1xuXHRcdFx0XHRcdFx0XHRjbGVhbkVsZW1lbnQgPSB2LnZhbGlkYXRpb25UYXJnZXRGb3IoIHYuY2xlYW4oIHYuZmluZEJ5TmFtZSggbmFtZSApICkgKTtcblx0XHRcdFx0XHRcdFx0aWYgKCBjbGVhbkVsZW1lbnQgJiYgY2xlYW5FbGVtZW50Lm5hbWUgaW4gdi5pbnZhbGlkICkge1xuXHRcdFx0XHRcdFx0XHRcdHYuY3VycmVudEVsZW1lbnRzLnB1c2goIGNsZWFuRWxlbWVudCApO1xuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCA9IHJlc3VsdCAmJiB2LmNoZWNrKCBjbGVhbkVsZW1lbnQgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJzID0gdGhpcy5jaGVjayggY2hlY2tFbGVtZW50ICkgIT09IGZhbHNlO1xuXHRcdFx0XHRyZXN1bHQgPSByZXN1bHQgJiYgcnM7XG5cdFx0XHRcdGlmICggcnMgKSB7XG5cdFx0XHRcdFx0dGhpcy5pbnZhbGlkWyBjaGVja0VsZW1lbnQubmFtZSBdID0gZmFsc2U7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5pbnZhbGlkWyBjaGVja0VsZW1lbnQubmFtZSBdID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggIXRoaXMubnVtYmVyT2ZJbnZhbGlkcygpICkge1xuXG5cdFx0XHRcdFx0Ly8gSGlkZSBlcnJvciBjb250YWluZXJzIG9uIGxhc3QgZXJyb3Jcblx0XHRcdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLmFkZCggdGhpcy5jb250YWluZXJzICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5zaG93RXJyb3JzKCk7XG5cblx0XHRcdFx0Ly8gQWRkIGFyaWEtaW52YWxpZCBzdGF0dXMgZm9yIHNjcmVlbiByZWFkZXJzXG5cdFx0XHRcdCQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtaW52YWxpZFwiLCAhcnMgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5zaG93RXJyb3JzL1xuXHRcdHNob3dFcnJvcnM6IGZ1bmN0aW9uKCBlcnJvcnMgKSB7XG5cdFx0XHRpZiAoIGVycm9ycyApIHtcblx0XHRcdFx0dmFyIHZhbGlkYXRvciA9IHRoaXM7XG5cblx0XHRcdFx0Ly8gQWRkIGl0ZW1zIHRvIGVycm9yIGxpc3QgYW5kIG1hcFxuXHRcdFx0XHQkLmV4dGVuZCggdGhpcy5lcnJvck1hcCwgZXJyb3JzICk7XG5cdFx0XHRcdHRoaXMuZXJyb3JMaXN0ID0gJC5tYXAoIHRoaXMuZXJyb3JNYXAsIGZ1bmN0aW9uKCBtZXNzYWdlLCBuYW1lICkge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRcdFx0ZWxlbWVudDogdmFsaWRhdG9yLmZpbmRCeU5hbWUoIG5hbWUgKVsgMCBdXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSBpdGVtcyBmcm9tIHN1Y2Nlc3MgbGlzdFxuXHRcdFx0XHR0aGlzLnN1Y2Nlc3NMaXN0ID0gJC5ncmVwKCB0aGlzLnN1Y2Nlc3NMaXN0LCBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdFx0XHRyZXR1cm4gISggZWxlbWVudC5uYW1lIGluIGVycm9ycyApO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Muc2hvd0Vycm9ycyApIHtcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zaG93RXJyb3JzLmNhbGwoIHRoaXMsIHRoaXMuZXJyb3JNYXAsIHRoaXMuZXJyb3JMaXN0ICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmRlZmF1bHRTaG93RXJyb3JzKCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9WYWxpZGF0b3IucmVzZXRGb3JtL1xuXHRcdHJlc2V0Rm9ybTogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICQuZm4ucmVzZXRGb3JtICkge1xuXHRcdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkucmVzZXRGb3JtKCk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmludmFsaWQgPSB7fTtcblx0XHRcdHRoaXMuc3VibWl0dGVkID0ge307XG5cdFx0XHR0aGlzLnByZXBhcmVGb3JtKCk7XG5cdFx0XHR0aGlzLmhpZGVFcnJvcnMoKTtcblx0XHRcdHZhciBlbGVtZW50cyA9IHRoaXMuZWxlbWVudHMoKVxuXHRcdFx0XHQucmVtb3ZlRGF0YSggXCJwcmV2aW91c1ZhbHVlXCIgKVxuXHRcdFx0XHQucmVtb3ZlQXR0ciggXCJhcmlhLWludmFsaWRcIiApO1xuXG5cdFx0XHR0aGlzLnJlc2V0RWxlbWVudHMoIGVsZW1lbnRzICk7XG5cdFx0fSxcblxuXHRcdHJlc2V0RWxlbWVudHM6IGZ1bmN0aW9uKCBlbGVtZW50cyApIHtcblx0XHRcdHZhciBpO1xuXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQgKSB7XG5cdFx0XHRcdGZvciAoIGkgPSAwOyBlbGVtZW50c1sgaSBdOyBpKysgKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodC5jYWxsKCB0aGlzLCBlbGVtZW50c1sgaSBdLFxuXHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCBcIlwiICk7XG5cdFx0XHRcdFx0dGhpcy5maW5kQnlOYW1lKCBlbGVtZW50c1sgaSBdLm5hbWUgKS5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnRzXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdG51bWJlck9mSW52YWxpZHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMub2JqZWN0TGVuZ3RoKCB0aGlzLmludmFsaWQgKTtcblx0XHR9LFxuXG5cdFx0b2JqZWN0TGVuZ3RoOiBmdW5jdGlvbiggb2JqICkge1xuXHRcdFx0LyoganNoaW50IHVudXNlZDogZmFsc2UgKi9cblx0XHRcdHZhciBjb3VudCA9IDAsXG5cdFx0XHRcdGk7XG5cdFx0XHRmb3IgKCBpIGluIG9iaiApIHtcblx0XHRcdFx0aWYgKCBvYmpbIGkgXSApIHtcblx0XHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gY291bnQ7XG5cdFx0fSxcblxuXHRcdGhpZGVFcnJvcnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5oaWRlVGhlc2UoIHRoaXMudG9IaWRlICk7XG5cdFx0fSxcblxuXHRcdGhpZGVUaGVzZTogZnVuY3Rpb24oIGVycm9ycyApIHtcblx0XHRcdGVycm9ycy5ub3QoIHRoaXMuY29udGFpbmVycyApLnRleHQoIFwiXCIgKTtcblx0XHRcdHRoaXMuYWRkV3JhcHBlciggZXJyb3JzICkuaGlkZSgpO1xuXHRcdH0sXG5cblx0XHR2YWxpZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zaXplKCkgPT09IDA7XG5cdFx0fSxcblxuXHRcdHNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZXJyb3JMaXN0Lmxlbmd0aDtcblx0XHR9LFxuXG5cdFx0Zm9jdXNJbnZhbGlkOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5mb2N1c0ludmFsaWQgKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0JCggdGhpcy5maW5kTGFzdEFjdGl2ZSgpIHx8IHRoaXMuZXJyb3JMaXN0Lmxlbmd0aCAmJiB0aGlzLmVycm9yTGlzdFsgMCBdLmVsZW1lbnQgfHwgW10gKVxuXHRcdFx0XHRcdC5maWx0ZXIoIFwiOnZpc2libGVcIiApXG5cdFx0XHRcdFx0LmZvY3VzKClcblxuXHRcdFx0XHRcdC8vIE1hbnVhbGx5IHRyaWdnZXIgZm9jdXNpbiBldmVudDsgd2l0aG91dCBpdCwgZm9jdXNpbiBoYW5kbGVyIGlzbid0IGNhbGxlZCwgZmluZExhc3RBY3RpdmUgd29uJ3QgaGF2ZSBhbnl0aGluZyB0byBmaW5kXG5cdFx0XHRcdFx0LnRyaWdnZXIoIFwiZm9jdXNpblwiICk7XG5cdFx0XHRcdH0gY2F0Y2ggKCBlICkge1xuXG5cdFx0XHRcdFx0Ly8gSWdub3JlIElFIHRocm93aW5nIGVycm9ycyB3aGVuIGZvY3VzaW5nIGhpZGRlbiBlbGVtZW50c1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGZpbmRMYXN0QWN0aXZlOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBsYXN0QWN0aXZlID0gdGhpcy5sYXN0QWN0aXZlO1xuXHRcdFx0cmV0dXJuIGxhc3RBY3RpdmUgJiYgJC5ncmVwKCB0aGlzLmVycm9yTGlzdCwgZnVuY3Rpb24oIG4gKSB7XG5cdFx0XHRcdHJldHVybiBuLmVsZW1lbnQubmFtZSA9PT0gbGFzdEFjdGl2ZS5uYW1lO1xuXHRcdFx0fSApLmxlbmd0aCA9PT0gMSAmJiBsYXN0QWN0aXZlO1xuXHRcdH0sXG5cblx0XHRlbGVtZW50czogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdmFsaWRhdG9yID0gdGhpcyxcblx0XHRcdFx0cnVsZXNDYWNoZSA9IHt9O1xuXG5cdFx0XHQvLyBTZWxlY3QgYWxsIHZhbGlkIGlucHV0cyBpbnNpZGUgdGhlIGZvcm0gKG5vIHN1Ym1pdCBvciByZXNldCBidXR0b25zKVxuXHRcdFx0cmV0dXJuICQoIHRoaXMuY3VycmVudEZvcm0gKVxuXHRcdFx0LmZpbmQoIFwiaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWEsIFtjb250ZW50ZWRpdGFibGVdXCIgKVxuXHRcdFx0Lm5vdCggXCI6c3VibWl0LCA6cmVzZXQsIDppbWFnZSwgOmRpc2FibGVkXCIgKVxuXHRcdFx0Lm5vdCggdGhpcy5zZXR0aW5ncy5pZ25vcmUgKVxuXHRcdFx0LmZpbHRlciggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBuYW1lID0gdGhpcy5uYW1lIHx8ICQoIHRoaXMgKS5hdHRyKCBcIm5hbWVcIiApOyAvLyBGb3IgY29udGVudGVkaXRhYmxlXG5cdFx0XHRcdGlmICggIW5hbWUgJiYgdmFsaWRhdG9yLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiJW8gaGFzIG5vIG5hbWUgYXNzaWduZWRcIiwgdGhpcyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2V0IGZvcm0gZXhwYW5kbyBvbiBjb250ZW50ZWRpdGFibGVcblx0XHRcdFx0aWYgKCB0aGlzLmhhc0F0dHJpYnV0ZSggXCJjb250ZW50ZWRpdGFibGVcIiApICkge1xuXHRcdFx0XHRcdHRoaXMuZm9ybSA9ICQoIHRoaXMgKS5jbG9zZXN0KCBcImZvcm1cIiApWyAwIF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTZWxlY3Qgb25seSB0aGUgZmlyc3QgZWxlbWVudCBmb3IgZWFjaCBuYW1lLCBhbmQgb25seSB0aG9zZSB3aXRoIHJ1bGVzIHNwZWNpZmllZFxuXHRcdFx0XHRpZiAoIG5hbWUgaW4gcnVsZXNDYWNoZSB8fCAhdmFsaWRhdG9yLm9iamVjdExlbmd0aCggJCggdGhpcyApLnJ1bGVzKCkgKSApIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRydWxlc0NhY2hlWyBuYW1lIF0gPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gKTtcblx0XHR9LFxuXG5cdFx0Y2xlYW46IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHRcdHJldHVybiAkKCBzZWxlY3RvciApWyAwIF07XG5cdFx0fSxcblxuXHRcdGVycm9yczogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXJyb3JDbGFzcyA9IHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcy5zcGxpdCggXCIgXCIgKS5qb2luKCBcIi5cIiApO1xuXHRcdFx0cmV0dXJuICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JFbGVtZW50ICsgXCIuXCIgKyBlcnJvckNsYXNzLCB0aGlzLmVycm9yQ29udGV4dCApO1xuXHRcdH0sXG5cblx0XHRyZXNldEludGVybmFsczogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnN1Y2Nlc3NMaXN0ID0gW107XG5cdFx0XHR0aGlzLmVycm9yTGlzdCA9IFtdO1xuXHRcdFx0dGhpcy5lcnJvck1hcCA9IHt9O1xuXHRcdFx0dGhpcy50b1Nob3cgPSAkKCBbXSApO1xuXHRcdFx0dGhpcy50b0hpZGUgPSAkKCBbXSApO1xuXHRcdH0sXG5cblx0XHRyZXNldDogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnJlc2V0SW50ZXJuYWxzKCk7XG5cdFx0XHR0aGlzLmN1cnJlbnRFbGVtZW50cyA9ICQoIFtdICk7XG5cdFx0fSxcblxuXHRcdHByZXBhcmVGb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucmVzZXQoKTtcblx0XHRcdHRoaXMudG9IaWRlID0gdGhpcy5lcnJvcnMoKS5hZGQoIHRoaXMuY29udGFpbmVycyApO1xuXHRcdH0sXG5cblx0XHRwcmVwYXJlRWxlbWVudDogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHR0aGlzLnJlc2V0KCk7XG5cdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICk7XG5cdFx0fSxcblxuXHRcdGVsZW1lbnRWYWx1ZTogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHR2YXIgJGVsZW1lbnQgPSAkKCBlbGVtZW50ICksXG5cdFx0XHRcdHR5cGUgPSBlbGVtZW50LnR5cGUsXG5cdFx0XHRcdHZhbCwgaWR4O1xuXG5cdFx0XHRpZiAoIHR5cGUgPT09IFwicmFkaW9cIiB8fCB0eXBlID09PSBcImNoZWNrYm94XCIgKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmZpbHRlciggXCI6Y2hlY2tlZFwiICkudmFsKCk7XG5cdFx0XHR9IGVsc2UgaWYgKCB0eXBlID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBlbGVtZW50LnZhbGlkaXR5ICE9PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC52YWxpZGl0eS5iYWRJbnB1dCA/IFwiTmFOXCIgOiAkZWxlbWVudC52YWwoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBlbGVtZW50Lmhhc0F0dHJpYnV0ZSggXCJjb250ZW50ZWRpdGFibGVcIiApICkge1xuXHRcdFx0XHR2YWwgPSAkZWxlbWVudC50ZXh0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YWwgPSAkZWxlbWVudC52YWwoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB0eXBlID09PSBcImZpbGVcIiApIHtcblxuXHRcdFx0XHQvLyBNb2Rlcm4gYnJvd3NlciAoY2hyb21lICYgc2FmYXJpKVxuXHRcdFx0XHRpZiAoIHZhbC5zdWJzdHIoIDAsIDEyICkgPT09IFwiQzpcXFxcZmFrZXBhdGhcXFxcXCIgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbC5zdWJzdHIoIDEyICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBMZWdhY3kgYnJvd3NlcnNcblx0XHRcdFx0Ly8gVW5peC1iYXNlZCBwYXRoXG5cdFx0XHRcdGlkeCA9IHZhbC5sYXN0SW5kZXhPZiggXCIvXCIgKTtcblx0XHRcdFx0aWYgKCBpZHggPj0gMCApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsLnN1YnN0ciggaWR4ICsgMSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV2luZG93cy1iYXNlZCBwYXRoXG5cdFx0XHRcdGlkeCA9IHZhbC5sYXN0SW5kZXhPZiggXCJcXFxcXCIgKTtcblx0XHRcdFx0aWYgKCBpZHggPj0gMCApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsLnN1YnN0ciggaWR4ICsgMSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSnVzdCB0aGUgZmlsZSBuYW1lXG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0cmV0dXJuIHZhbC5yZXBsYWNlKCAvXFxyL2csIFwiXCIgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWw7XG5cdFx0fSxcblxuXHRcdGNoZWNrOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGVsZW1lbnQgPSB0aGlzLnZhbGlkYXRpb25UYXJnZXRGb3IoIHRoaXMuY2xlYW4oIGVsZW1lbnQgKSApO1xuXG5cdFx0XHR2YXIgcnVsZXMgPSAkKCBlbGVtZW50ICkucnVsZXMoKSxcblx0XHRcdFx0cnVsZXNDb3VudCA9ICQubWFwKCBydWxlcywgZnVuY3Rpb24oIG4sIGkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHRcdH0gKS5sZW5ndGgsXG5cdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IGZhbHNlLFxuXHRcdFx0XHR2YWwgPSB0aGlzLmVsZW1lbnRWYWx1ZSggZWxlbWVudCApLFxuXHRcdFx0XHRyZXN1bHQsIG1ldGhvZCwgcnVsZTtcblxuXHRcdFx0Ly8gSWYgYSBub3JtYWxpemVyIGlzIGRlZmluZWQgZm9yIHRoaXMgZWxlbWVudCwgdGhlblxuXHRcdFx0Ly8gY2FsbCBpdCB0byByZXRyZWl2ZSB0aGUgY2hhbmdlZCB2YWx1ZSBpbnN0ZWFkXG5cdFx0XHQvLyBvZiB1c2luZyB0aGUgcmVhbCBvbmUuXG5cdFx0XHQvLyBOb3RlIHRoYXQgYHRoaXNgIGluIHRoZSBub3JtYWxpemVyIGlzIGBlbGVtZW50YC5cblx0XHRcdGlmICggdHlwZW9mIHJ1bGVzLm5vcm1hbGl6ZXIgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0dmFsID0gcnVsZXMubm9ybWFsaXplci5jYWxsKCBlbGVtZW50LCB2YWwgKTtcblxuXHRcdFx0XHRpZiAoIHR5cGVvZiB2YWwgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvciggXCJUaGUgbm9ybWFsaXplciBzaG91bGQgcmV0dXJuIGEgc3RyaW5nIHZhbHVlLlwiICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBEZWxldGUgdGhlIG5vcm1hbGl6ZXIgZnJvbSBydWxlcyB0byBhdm9pZCB0cmVhdGluZ1xuXHRcdFx0XHQvLyBpdCBhcyBhIHByZS1kZWZpbmVkIG1ldGhvZC5cblx0XHRcdFx0ZGVsZXRlIHJ1bGVzLm5vcm1hbGl6ZXI7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoIG1ldGhvZCBpbiBydWxlcyApIHtcblx0XHRcdFx0cnVsZSA9IHsgbWV0aG9kOiBtZXRob2QsIHBhcmFtZXRlcnM6IHJ1bGVzWyBtZXRob2QgXSB9O1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJlc3VsdCA9ICQudmFsaWRhdG9yLm1ldGhvZHNbIG1ldGhvZCBdLmNhbGwoIHRoaXMsIHZhbCwgZWxlbWVudCwgcnVsZS5wYXJhbWV0ZXJzICk7XG5cblx0XHRcdFx0XHQvLyBJZiBhIG1ldGhvZCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmllbGQgaXMgb3B0aW9uYWwgYW5kIHRoZXJlZm9yZSB2YWxpZCxcblx0XHRcdFx0XHQvLyBkb24ndCBtYXJrIGl0IGFzIHZhbGlkIHdoZW4gdGhlcmUgYXJlIG5vIG90aGVyIHJ1bGVzXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiICYmIHJ1bGVzQ291bnQgPT09IDEgKSB7XG5cdFx0XHRcdFx0XHRkZXBlbmRlbmN5TWlzbWF0Y2ggPSB0cnVlO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwicGVuZGluZ1wiICkge1xuXHRcdFx0XHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLnRvSGlkZS5ub3QoIHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICkgKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoICFyZXN1bHQgKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmZvcm1hdEFuZEFkZCggZWxlbWVudCwgcnVsZSApO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coIFwiRXhjZXB0aW9uIG9jY3VycmVkIHdoZW4gY2hlY2tpbmcgZWxlbWVudCBcIiArIGVsZW1lbnQuaWQgKyBcIiwgY2hlY2sgdGhlICdcIiArIHJ1bGUubWV0aG9kICsgXCInIG1ldGhvZC5cIiwgZSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IgKSB7XG5cdFx0XHRcdFx0XHRlLm1lc3NhZ2UgKz0gXCIuICBFeGNlcHRpb24gb2NjdXJyZWQgd2hlbiBjaGVja2luZyBlbGVtZW50IFwiICsgZWxlbWVudC5pZCArIFwiLCBjaGVjayB0aGUgJ1wiICsgcnVsZS5tZXRob2QgKyBcIicgbWV0aG9kLlwiO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggZGVwZW5kZW5jeU1pc21hdGNoICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMub2JqZWN0TGVuZ3RoKCBydWxlcyApICkge1xuXHRcdFx0XHR0aGlzLnN1Y2Nlc3NMaXN0LnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm4gdGhlIGN1c3RvbSBtZXNzYWdlIGZvciB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgdmFsaWRhdGlvbiBtZXRob2Rcblx0XHQvLyBzcGVjaWZpZWQgaW4gdGhlIGVsZW1lbnQncyBIVE1MNSBkYXRhIGF0dHJpYnV0ZVxuXHRcdC8vIHJldHVybiB0aGUgZ2VuZXJpYyBtZXNzYWdlIGlmIHByZXNlbnQgYW5kIG5vIG1ldGhvZCBzcGVjaWZpYyBtZXNzYWdlIGlzIHByZXNlbnRcblx0XHRjdXN0b21EYXRhTWVzc2FnZTogZnVuY3Rpb24oIGVsZW1lbnQsIG1ldGhvZCApIHtcblx0XHRcdHJldHVybiAkKCBlbGVtZW50ICkuZGF0YSggXCJtc2dcIiArIG1ldGhvZC5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICtcblx0XHRcdFx0bWV0aG9kLnN1YnN0cmluZyggMSApLnRvTG93ZXJDYXNlKCkgKSB8fCAkKCBlbGVtZW50ICkuZGF0YSggXCJtc2dcIiApO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm4gdGhlIGN1c3RvbSBtZXNzYWdlIGZvciB0aGUgZ2l2ZW4gZWxlbWVudCBuYW1lIGFuZCB2YWxpZGF0aW9uIG1ldGhvZFxuXHRcdGN1c3RvbU1lc3NhZ2U6IGZ1bmN0aW9uKCBuYW1lLCBtZXRob2QgKSB7XG5cdFx0XHR2YXIgbSA9IHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIG5hbWUgXTtcblx0XHRcdHJldHVybiBtICYmICggbS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nID8gbSA6IG1bIG1ldGhvZCBdICk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybiB0aGUgZmlyc3QgZGVmaW5lZCBhcmd1bWVudCwgYWxsb3dpbmcgZW1wdHkgc3RyaW5nc1xuXHRcdGZpbmREZWZpbmVkOiBmdW5jdGlvbigpIHtcblx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0aWYgKCBhcmd1bWVudHNbIGkgXSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHJldHVybiBhcmd1bWVudHNbIGkgXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9LFxuXG5cdFx0ZGVmYXVsdE1lc3NhZ2U6IGZ1bmN0aW9uKCBlbGVtZW50LCBydWxlICkge1xuXHRcdFx0dmFyIG1lc3NhZ2UgPSB0aGlzLmZpbmREZWZpbmVkKFxuXHRcdFx0XHRcdHRoaXMuY3VzdG9tTWVzc2FnZSggZWxlbWVudC5uYW1lLCBydWxlLm1ldGhvZCApLFxuXHRcdFx0XHRcdHRoaXMuY3VzdG9tRGF0YU1lc3NhZ2UoIGVsZW1lbnQsIHJ1bGUubWV0aG9kICksXG5cblx0XHRcdFx0XHQvLyAndGl0bGUnIGlzIG5ldmVyIHVuZGVmaW5lZCwgc28gaGFuZGxlIGVtcHR5IHN0cmluZyBhcyB1bmRlZmluZWRcblx0XHRcdFx0XHQhdGhpcy5zZXR0aW5ncy5pZ25vcmVUaXRsZSAmJiBlbGVtZW50LnRpdGxlIHx8IHVuZGVmaW5lZCxcblx0XHRcdFx0XHQkLnZhbGlkYXRvci5tZXNzYWdlc1sgcnVsZS5tZXRob2QgXSxcblx0XHRcdFx0XHRcIjxzdHJvbmc+V2FybmluZzogTm8gbWVzc2FnZSBkZWZpbmVkIGZvciBcIiArIGVsZW1lbnQubmFtZSArIFwiPC9zdHJvbmc+XCJcblx0XHRcdFx0KSxcblx0XHRcdFx0dGhlcmVnZXggPSAvXFwkP1xceyhcXGQrKVxcfS9nO1xuXHRcdFx0aWYgKCB0eXBlb2YgbWVzc2FnZSA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5jYWxsKCB0aGlzLCBydWxlLnBhcmFtZXRlcnMsIGVsZW1lbnQgKTtcblx0XHRcdH0gZWxzZSBpZiAoIHRoZXJlZ2V4LnRlc3QoIG1lc3NhZ2UgKSApIHtcblx0XHRcdFx0bWVzc2FnZSA9ICQudmFsaWRhdG9yLmZvcm1hdCggbWVzc2FnZS5yZXBsYWNlKCB0aGVyZWdleCwgXCJ7JDF9XCIgKSwgcnVsZS5wYXJhbWV0ZXJzICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdH0sXG5cblx0XHRmb3JtYXRBbmRBZGQ6IGZ1bmN0aW9uKCBlbGVtZW50LCBydWxlICkge1xuXHRcdFx0dmFyIG1lc3NhZ2UgPSB0aGlzLmRlZmF1bHRNZXNzYWdlKCBlbGVtZW50LCBydWxlICk7XG5cblx0XHRcdHRoaXMuZXJyb3JMaXN0LnB1c2goIHtcblx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdFx0ZWxlbWVudDogZWxlbWVudCxcblx0XHRcdFx0bWV0aG9kOiBydWxlLm1ldGhvZFxuXHRcdFx0fSApO1xuXG5cdFx0XHR0aGlzLmVycm9yTWFwWyBlbGVtZW50Lm5hbWUgXSA9IG1lc3NhZ2U7XG5cdFx0XHR0aGlzLnN1Ym1pdHRlZFsgZWxlbWVudC5uYW1lIF0gPSBtZXNzYWdlO1xuXHRcdH0sXG5cblx0XHRhZGRXcmFwcGVyOiBmdW5jdGlvbiggdG9Ub2dnbGUgKSB7XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Mud3JhcHBlciApIHtcblx0XHRcdFx0dG9Ub2dnbGUgPSB0b1RvZ2dsZS5hZGQoIHRvVG9nZ2xlLnBhcmVudCggdGhpcy5zZXR0aW5ncy53cmFwcGVyICkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0b1RvZ2dsZTtcblx0XHR9LFxuXG5cdFx0ZGVmYXVsdFNob3dFcnJvcnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGksIGVsZW1lbnRzLCBlcnJvcjtcblx0XHRcdGZvciAoIGkgPSAwOyB0aGlzLmVycm9yTGlzdFsgaSBdOyBpKysgKSB7XG5cdFx0XHRcdGVycm9yID0gdGhpcy5lcnJvckxpc3RbIGkgXTtcblx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmhpZ2hsaWdodCApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmhpZ2hsaWdodC5jYWxsKCB0aGlzLCBlcnJvci5lbGVtZW50LCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuc2hvd0xhYmVsKCBlcnJvci5lbGVtZW50LCBlcnJvci5tZXNzYWdlICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMuZXJyb3JMaXN0Lmxlbmd0aCApIHtcblx0XHRcdFx0dGhpcy50b1Nob3cgPSB0aGlzLnRvU2hvdy5hZGQoIHRoaXMuY29udGFpbmVycyApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKSB7XG5cdFx0XHRcdGZvciAoIGkgPSAwOyB0aGlzLnN1Y2Nlc3NMaXN0WyBpIF07IGkrKyApIHtcblx0XHRcdFx0XHR0aGlzLnNob3dMYWJlbCggdGhpcy5zdWNjZXNzTGlzdFsgaSBdICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodCApIHtcblx0XHRcdFx0Zm9yICggaSA9IDAsIGVsZW1lbnRzID0gdGhpcy52YWxpZEVsZW1lbnRzKCk7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0LmNhbGwoIHRoaXMsIGVsZW1lbnRzWyBpIF0sIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcywgdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMudG9IaWRlID0gdGhpcy50b0hpZGUubm90KCB0aGlzLnRvU2hvdyApO1xuXHRcdFx0dGhpcy5oaWRlRXJyb3JzKCk7XG5cdFx0XHR0aGlzLmFkZFdyYXBwZXIoIHRoaXMudG9TaG93ICkuc2hvdygpO1xuXHRcdH0sXG5cblx0XHR2YWxpZEVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLmN1cnJlbnRFbGVtZW50cy5ub3QoIHRoaXMuaW52YWxpZEVsZW1lbnRzKCkgKTtcblx0XHR9LFxuXG5cdFx0aW52YWxpZEVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkKCB0aGlzLmVycm9yTGlzdCApLm1hcCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmVsZW1lbnQ7XG5cdFx0XHR9ICk7XG5cdFx0fSxcblxuXHRcdHNob3dMYWJlbDogZnVuY3Rpb24oIGVsZW1lbnQsIG1lc3NhZ2UgKSB7XG5cdFx0XHR2YXIgcGxhY2UsIGdyb3VwLCBlcnJvcklELCB2LFxuXHRcdFx0XHRlcnJvciA9IHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICksXG5cdFx0XHRcdGVsZW1lbnRJRCA9IHRoaXMuaWRPck5hbWUoIGVsZW1lbnQgKSxcblx0XHRcdFx0ZGVzY3JpYmVkQnkgPSAkKCBlbGVtZW50ICkuYXR0ciggXCJhcmlhLWRlc2NyaWJlZGJ5XCIgKTtcblxuXHRcdFx0aWYgKCBlcnJvci5sZW5ndGggKSB7XG5cblx0XHRcdFx0Ly8gUmVmcmVzaCBlcnJvci9zdWNjZXNzIGNsYXNzXG5cdFx0XHRcdGVycm9yLnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKS5hZGRDbGFzcyggdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzICk7XG5cblx0XHRcdFx0Ly8gUmVwbGFjZSBtZXNzYWdlIG9uIGV4aXN0aW5nIGxhYmVsXG5cdFx0XHRcdGVycm9yLmh0bWwoIG1lc3NhZ2UgKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gQ3JlYXRlIGVycm9yIGVsZW1lbnRcblx0XHRcdFx0ZXJyb3IgPSAkKCBcIjxcIiArIHRoaXMuc2V0dGluZ3MuZXJyb3JFbGVtZW50ICsgXCI+XCIgKVxuXHRcdFx0XHRcdC5hdHRyKCBcImlkXCIsIGVsZW1lbnRJRCArIFwiLWVycm9yXCIgKVxuXHRcdFx0XHRcdC5hZGRDbGFzcyggdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzIClcblx0XHRcdFx0XHQuaHRtbCggbWVzc2FnZSB8fCBcIlwiICk7XG5cblx0XHRcdFx0Ly8gTWFpbnRhaW4gcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHRvIGJlIHBsYWNlZCBpbnRvIHRoZSBET01cblx0XHRcdFx0cGxhY2UgPSBlcnJvcjtcblx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLndyYXBwZXIgKSB7XG5cblx0XHRcdFx0XHQvLyBNYWtlIHN1cmUgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZSwgZXZlbiBpbiBJRVxuXHRcdFx0XHRcdC8vIGFjdHVhbGx5IHNob3dpbmcgdGhlIHdyYXBwZWQgZWxlbWVudCBpcyBoYW5kbGVkIGVsc2V3aGVyZVxuXHRcdFx0XHRcdHBsYWNlID0gZXJyb3IuaGlkZSgpLnNob3coKS53cmFwKCBcIjxcIiArIHRoaXMuc2V0dGluZ3Mud3JhcHBlciArIFwiLz5cIiApLnBhcmVudCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGhpcy5sYWJlbENvbnRhaW5lci5sZW5ndGggKSB7XG5cdFx0XHRcdFx0dGhpcy5sYWJlbENvbnRhaW5lci5hcHBlbmQoIHBsYWNlICk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoIHRoaXMuc2V0dGluZ3MuZXJyb3JQbGFjZW1lbnQgKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5lcnJvclBsYWNlbWVudCggcGxhY2UsICQoIGVsZW1lbnQgKSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHBsYWNlLmluc2VydEFmdGVyKCBlbGVtZW50ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBMaW5rIGVycm9yIGJhY2sgdG8gdGhlIGVsZW1lbnRcblx0XHRcdFx0aWYgKCBlcnJvci5pcyggXCJsYWJlbFwiICkgKSB7XG5cblx0XHRcdFx0XHQvLyBJZiB0aGUgZXJyb3IgaXMgYSBsYWJlbCwgdGhlbiBhc3NvY2lhdGUgdXNpbmcgJ2Zvcidcblx0XHRcdFx0XHRlcnJvci5hdHRyKCBcImZvclwiLCBlbGVtZW50SUQgKTtcblxuXHRcdFx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIG5vdCBhIGNoaWxkIG9mIGFuIGFzc29jaWF0ZWQgbGFiZWwsIHRoZW4gaXQncyBuZWNlc3Nhcnlcblx0XHRcdFx0XHQvLyB0byBleHBsaWNpdGx5IGFwcGx5IGFyaWEtZGVzY3JpYmVkYnlcblx0XHRcdFx0fSBlbHNlIGlmICggZXJyb3IucGFyZW50cyggXCJsYWJlbFtmb3I9J1wiICsgdGhpcy5lc2NhcGVDc3NNZXRhKCBlbGVtZW50SUQgKSArIFwiJ11cIiApLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHRlcnJvcklEID0gZXJyb3IuYXR0ciggXCJpZFwiICk7XG5cblx0XHRcdFx0XHQvLyBSZXNwZWN0IGV4aXN0aW5nIG5vbi1lcnJvciBhcmlhLWRlc2NyaWJlZGJ5XG5cdFx0XHRcdFx0aWYgKCAhZGVzY3JpYmVkQnkgKSB7XG5cdFx0XHRcdFx0XHRkZXNjcmliZWRCeSA9IGVycm9ySUQ7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICggIWRlc2NyaWJlZEJ5Lm1hdGNoKCBuZXcgUmVnRXhwKCBcIlxcXFxiXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIGVycm9ySUQgKSArIFwiXFxcXGJcIiApICkgKSB7XG5cblx0XHRcdFx0XHRcdC8vIEFkZCB0byBlbmQgb2YgbGlzdCBpZiBub3QgYWxyZWFkeSBwcmVzZW50XG5cdFx0XHRcdFx0XHRkZXNjcmliZWRCeSArPSBcIiBcIiArIGVycm9ySUQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiwgZGVzY3JpYmVkQnkgKTtcblxuXHRcdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBpcyBncm91cGVkLCB0aGVuIGFzc2lnbiB0byBhbGwgZWxlbWVudHMgaW4gdGhlIHNhbWUgZ3JvdXBcblx0XHRcdFx0XHRncm91cCA9IHRoaXMuZ3JvdXBzWyBlbGVtZW50Lm5hbWUgXTtcblx0XHRcdFx0XHRpZiAoIGdyb3VwICkge1xuXHRcdFx0XHRcdFx0diA9IHRoaXM7XG5cdFx0XHRcdFx0XHQkLmVhY2goIHYuZ3JvdXBzLCBmdW5jdGlvbiggbmFtZSwgdGVzdGdyb3VwICkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIHRlc3Rncm91cCA9PT0gZ3JvdXAgKSB7XG5cdFx0XHRcdFx0XHRcdFx0JCggXCJbbmFtZT0nXCIgKyB2LmVzY2FwZUNzc01ldGEoIG5hbWUgKSArIFwiJ11cIiwgdi5jdXJyZW50Rm9ybSApXG5cdFx0XHRcdFx0XHRcdFx0XHQuYXR0ciggXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGVycm9yLmF0dHIoIFwiaWRcIiApICk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggIW1lc3NhZ2UgJiYgdGhpcy5zZXR0aW5ncy5zdWNjZXNzICkge1xuXHRcdFx0XHRlcnJvci50ZXh0KCBcIlwiICk7XG5cdFx0XHRcdGlmICggdHlwZW9mIHRoaXMuc2V0dGluZ3Muc3VjY2VzcyA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0XHRlcnJvci5hZGRDbGFzcyggdGhpcy5zZXR0aW5ncy5zdWNjZXNzICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zdWNjZXNzKCBlcnJvciwgZWxlbWVudCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnRvU2hvdyA9IHRoaXMudG9TaG93LmFkZCggZXJyb3IgKTtcblx0XHR9LFxuXG5cdFx0ZXJyb3JzRm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciBuYW1lID0gdGhpcy5lc2NhcGVDc3NNZXRhKCB0aGlzLmlkT3JOYW1lKCBlbGVtZW50ICkgKSxcblx0XHRcdFx0ZGVzY3JpYmVyID0gJCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiICksXG5cdFx0XHRcdHNlbGVjdG9yID0gXCJsYWJlbFtmb3I9J1wiICsgbmFtZSArIFwiJ10sIGxhYmVsW2Zvcj0nXCIgKyBuYW1lICsgXCInXSAqXCI7XG5cblx0XHRcdC8vICdhcmlhLWRlc2NyaWJlZGJ5JyBzaG91bGQgZGlyZWN0bHkgcmVmZXJlbmNlIHRoZSBlcnJvciBlbGVtZW50XG5cdFx0XHRpZiAoIGRlc2NyaWJlciApIHtcblx0XHRcdFx0c2VsZWN0b3IgPSBzZWxlY3RvciArIFwiLCAjXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIGRlc2NyaWJlciApXG5cdFx0XHRcdFx0LnJlcGxhY2UoIC9cXHMrL2csIFwiLCAjXCIgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHRcdFx0LmVycm9ycygpXG5cdFx0XHRcdC5maWx0ZXIoIHNlbGVjdG9yICk7XG5cdFx0fSxcblxuXHRcdC8vIFNlZSBodHRwczovL2FwaS5qcXVlcnkuY29tL2NhdGVnb3J5L3NlbGVjdG9ycy8sIGZvciBDU1Ncblx0XHQvLyBtZXRhLWNoYXJhY3RlcnMgdGhhdCBzaG91bGQgYmUgZXNjYXBlZCBpbiBvcmRlciB0byBiZSB1c2VkIHdpdGggSlF1ZXJ5XG5cdFx0Ly8gYXMgYSBsaXRlcmFsIHBhcnQgb2YgYSBuYW1lL2lkIG9yIGFueSBzZWxlY3Rvci5cblx0XHRlc2NhcGVDc3NNZXRhOiBmdW5jdGlvbiggc3RyaW5nICkge1xuXHRcdFx0cmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvKFtcXFxcIVwiIyQlJicoKSorLC4vOjs8PT4/QFxcW1xcXV5ge3x9fl0pL2csIFwiXFxcXCQxXCIgKTtcblx0XHR9LFxuXG5cdFx0aWRPck5hbWU6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ3JvdXBzWyBlbGVtZW50Lm5hbWUgXSB8fCAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgPyBlbGVtZW50Lm5hbWUgOiBlbGVtZW50LmlkIHx8IGVsZW1lbnQubmFtZSApO1xuXHRcdH0sXG5cblx0XHR2YWxpZGF0aW9uVGFyZ2V0Rm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblxuXHRcdFx0Ly8gSWYgcmFkaW8vY2hlY2tib3gsIHZhbGlkYXRlIGZpcnN0IGVsZW1lbnQgaW4gZ3JvdXAgaW5zdGVhZFxuXHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xuXHRcdFx0XHRlbGVtZW50ID0gdGhpcy5maW5kQnlOYW1lKCBlbGVtZW50Lm5hbWUgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWx3YXlzIGFwcGx5IGlnbm9yZSBmaWx0ZXJcblx0XHRcdHJldHVybiAkKCBlbGVtZW50ICkubm90KCB0aGlzLnNldHRpbmdzLmlnbm9yZSApWyAwIF07XG5cdFx0fSxcblxuXHRcdGNoZWNrYWJsZTogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gKCAvcmFkaW98Y2hlY2tib3gvaSApLnRlc3QoIGVsZW1lbnQudHlwZSApO1xuXHRcdH0sXG5cblx0XHRmaW5kQnlOYW1lOiBmdW5jdGlvbiggbmFtZSApIHtcblx0XHRcdHJldHVybiAkKCB0aGlzLmN1cnJlbnRGb3JtICkuZmluZCggXCJbbmFtZT0nXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIG5hbWUgKSArIFwiJ11cIiApO1xuXHRcdH0sXG5cblx0XHRnZXRMZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHN3aXRjaCAoIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSApIHtcblx0XHRcdGNhc2UgXCJzZWxlY3RcIjpcblx0XHRcdFx0cmV0dXJuICQoIFwib3B0aW9uOnNlbGVjdGVkXCIsIGVsZW1lbnQgKS5sZW5ndGg7XG5cdFx0XHRjYXNlIFwiaW5wdXRcIjpcblx0XHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmZpbHRlciggXCI6Y2hlY2tlZFwiICkubGVuZ3RoO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWUubGVuZ3RoO1xuXHRcdH0sXG5cblx0XHRkZXBlbmQ6IGZ1bmN0aW9uKCBwYXJhbSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLmRlcGVuZFR5cGVzWyB0eXBlb2YgcGFyYW0gXSA/IHRoaXMuZGVwZW5kVHlwZXNbIHR5cGVvZiBwYXJhbSBdKCBwYXJhbSwgZWxlbWVudCApIDogdHJ1ZTtcblx0XHR9LFxuXG5cdFx0ZGVwZW5kVHlwZXM6IHtcblx0XHRcdFwiYm9vbGVhblwiOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiBwYXJhbTtcblx0XHRcdH0sXG5cdFx0XHRcInN0cmluZ1wiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybiAhISQoIHBhcmFtLCBlbGVtZW50LmZvcm0gKS5sZW5ndGg7XG5cdFx0XHR9LFxuXHRcdFx0XCJmdW5jdGlvblwiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybiBwYXJhbSggZWxlbWVudCApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRvcHRpb25hbDogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHR2YXIgdmFsID0gdGhpcy5lbGVtZW50VmFsdWUoIGVsZW1lbnQgKTtcblx0XHRcdHJldHVybiAhJC52YWxpZGF0b3IubWV0aG9kcy5yZXF1aXJlZC5jYWxsKCB0aGlzLCB2YWwsIGVsZW1lbnQgKSAmJiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHR9LFxuXG5cdFx0c3RhcnRSZXF1ZXN0OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGlmICggIXRoaXMucGVuZGluZ1sgZWxlbWVudC5uYW1lIF0gKSB7XG5cdFx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QrKztcblx0XHRcdFx0JCggZWxlbWVudCApLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLnBlbmRpbmdDbGFzcyApO1xuXHRcdFx0XHR0aGlzLnBlbmRpbmdbIGVsZW1lbnQubmFtZSBdID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0c3RvcFJlcXVlc3Q6IGZ1bmN0aW9uKCBlbGVtZW50LCB2YWxpZCApIHtcblx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QtLTtcblxuXHRcdFx0Ly8gU29tZXRpbWVzIHN5bmNocm9uaXphdGlvbiBmYWlscywgbWFrZSBzdXJlIHBlbmRpbmdSZXF1ZXN0IGlzIG5ldmVyIDwgMFxuXHRcdFx0aWYgKCB0aGlzLnBlbmRpbmdSZXF1ZXN0IDwgMCApIHtcblx0XHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUgdGhpcy5wZW5kaW5nWyBlbGVtZW50Lm5hbWUgXTtcblx0XHRcdCQoIGVsZW1lbnQgKS5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy5wZW5kaW5nQ2xhc3MgKTtcblx0XHRcdGlmICggdmFsaWQgJiYgdGhpcy5wZW5kaW5nUmVxdWVzdCA9PT0gMCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgJiYgdGhpcy5mb3JtKCkgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5zdWJtaXQoKTtcblx0XHRcdFx0dGhpcy5mb3JtU3VibWl0dGVkID0gZmFsc2U7XG5cdFx0XHR9IGVsc2UgaWYgKCAhdmFsaWQgJiYgdGhpcy5wZW5kaW5nUmVxdWVzdCA9PT0gMCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS50cmlnZ2VySGFuZGxlciggXCJpbnZhbGlkLWZvcm1cIiwgWyB0aGlzIF0gKTtcblx0XHRcdFx0dGhpcy5mb3JtU3VibWl0dGVkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdHByZXZpb3VzVmFsdWU6IGZ1bmN0aW9uKCBlbGVtZW50LCBtZXRob2QgKSB7XG5cdFx0XHRyZXR1cm4gJC5kYXRhKCBlbGVtZW50LCBcInByZXZpb3VzVmFsdWVcIiApIHx8ICQuZGF0YSggZWxlbWVudCwgXCJwcmV2aW91c1ZhbHVlXCIsIHtcblx0XHRcdFx0b2xkOiBudWxsLFxuXHRcdFx0XHR2YWxpZDogdHJ1ZSxcblx0XHRcdFx0bWVzc2FnZTogdGhpcy5kZWZhdWx0TWVzc2FnZSggZWxlbWVudCwgeyBtZXRob2Q6IG1ldGhvZCB9IClcblx0XHRcdH0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gQ2xlYW5zIHVwIGFsbCBmb3JtcyBhbmQgZWxlbWVudHMsIHJlbW92ZXMgdmFsaWRhdG9yLXNwZWNpZmljIGV2ZW50c1xuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5yZXNldEZvcm0oKTtcblxuXHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApXG5cdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlXCIgKVxuXHRcdFx0XHQucmVtb3ZlRGF0YSggXCJ2YWxpZGF0b3JcIiApXG5cdFx0XHRcdC5maW5kKCBcIi52YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApXG5cdFx0XHRcdFx0Lm9mZiggXCIudmFsaWRhdGUtZXF1YWxUb1wiIClcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoIFwidmFsaWRhdGUtZXF1YWxUby1ibHVyXCIgKTtcblx0XHR9XG5cblx0fSxcblxuXHRjbGFzc1J1bGVTZXR0aW5nczoge1xuXHRcdHJlcXVpcmVkOiB7IHJlcXVpcmVkOiB0cnVlIH0sXG5cdFx0ZW1haWw6IHsgZW1haWw6IHRydWUgfSxcblx0XHR1cmw6IHsgdXJsOiB0cnVlIH0sXG5cdFx0ZGF0ZTogeyBkYXRlOiB0cnVlIH0sXG5cdFx0ZGF0ZUlTTzogeyBkYXRlSVNPOiB0cnVlIH0sXG5cdFx0bnVtYmVyOiB7IG51bWJlcjogdHJ1ZSB9LFxuXHRcdGRpZ2l0czogeyBkaWdpdHM6IHRydWUgfSxcblx0XHRjcmVkaXRjYXJkOiB7IGNyZWRpdGNhcmQ6IHRydWUgfVxuXHR9LFxuXG5cdGFkZENsYXNzUnVsZXM6IGZ1bmN0aW9uKCBjbGFzc05hbWUsIHJ1bGVzICkge1xuXHRcdGlmICggY2xhc3NOYW1lLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgKSB7XG5cdFx0XHR0aGlzLmNsYXNzUnVsZVNldHRpbmdzWyBjbGFzc05hbWUgXSA9IHJ1bGVzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkLmV4dGVuZCggdGhpcy5jbGFzc1J1bGVTZXR0aW5ncywgY2xhc3NOYW1lICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsYXNzUnVsZXM6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdHZhciBydWxlcyA9IHt9LFxuXHRcdFx0Y2xhc3NlcyA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcImNsYXNzXCIgKTtcblxuXHRcdGlmICggY2xhc3NlcyApIHtcblx0XHRcdCQuZWFjaCggY2xhc3Nlcy5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggdGhpcyBpbiAkLnZhbGlkYXRvci5jbGFzc1J1bGVTZXR0aW5ncyApIHtcblx0XHRcdFx0XHQkLmV4dGVuZCggcnVsZXMsICQudmFsaWRhdG9yLmNsYXNzUnVsZVNldHRpbmdzWyB0aGlzIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRyZXR1cm4gcnVsZXM7XG5cdH0sXG5cblx0bm9ybWFsaXplQXR0cmlidXRlUnVsZTogZnVuY3Rpb24oIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICkge1xuXG5cdFx0Ly8gQ29udmVydCB0aGUgdmFsdWUgdG8gYSBudW1iZXIgZm9yIG51bWJlciBpbnB1dHMsIGFuZCBmb3IgdGV4dCBmb3IgYmFja3dhcmRzIGNvbXBhYmlsaXR5XG5cdFx0Ly8gYWxsb3dzIHR5cGU9XCJkYXRlXCIgYW5kIG90aGVycyB0byBiZSBjb21wYXJlZCBhcyBzdHJpbmdzXG5cdFx0aWYgKCAvbWlufG1heHxzdGVwLy50ZXN0KCBtZXRob2QgKSAmJiAoIHR5cGUgPT09IG51bGwgfHwgL251bWJlcnxyYW5nZXx0ZXh0Ly50ZXN0KCB0eXBlICkgKSApIHtcblx0XHRcdHZhbHVlID0gTnVtYmVyKCB2YWx1ZSApO1xuXG5cdFx0XHQvLyBTdXBwb3J0IE9wZXJhIE1pbmksIHdoaWNoIHJldHVybnMgTmFOIGZvciB1bmRlZmluZWQgbWlubGVuZ3RoXG5cdFx0XHRpZiAoIGlzTmFOKCB2YWx1ZSApICkge1xuXHRcdFx0XHR2YWx1ZSA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIHZhbHVlIHx8IHZhbHVlID09PSAwICkge1xuXHRcdFx0cnVsZXNbIG1ldGhvZCBdID0gdmFsdWU7XG5cdFx0fSBlbHNlIGlmICggdHlwZSA9PT0gbWV0aG9kICYmIHR5cGUgIT09IFwicmFuZ2VcIiApIHtcblxuXHRcdFx0Ly8gRXhjZXB0aW9uOiB0aGUganF1ZXJ5IHZhbGlkYXRlICdyYW5nZScgbWV0aG9kXG5cdFx0XHQvLyBkb2VzIG5vdCB0ZXN0IGZvciB0aGUgaHRtbDUgJ3JhbmdlJyB0eXBlXG5cdFx0XHRydWxlc1sgbWV0aG9kIF0gPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXHRhdHRyaWJ1dGVSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHQkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcblx0XHRcdHR5cGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSxcblx0XHRcdG1ldGhvZCwgdmFsdWU7XG5cblx0XHRmb3IgKCBtZXRob2QgaW4gJC52YWxpZGF0b3IubWV0aG9kcyApIHtcblxuXHRcdFx0Ly8gU3VwcG9ydCBmb3IgPGlucHV0IHJlcXVpcmVkPiBpbiBib3RoIGh0bWw1IGFuZCBvbGRlciBicm93c2Vyc1xuXHRcdFx0aWYgKCBtZXRob2QgPT09IFwicmVxdWlyZWRcIiApIHtcblx0XHRcdFx0dmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggbWV0aG9kICk7XG5cblx0XHRcdFx0Ly8gU29tZSBicm93c2VycyByZXR1cm4gYW4gZW1wdHkgc3RyaW5nIGZvciB0aGUgcmVxdWlyZWQgYXR0cmlidXRlXG5cdFx0XHRcdC8vIGFuZCBub24tSFRNTDUgYnJvd3NlcnMgbWlnaHQgaGF2ZSByZXF1aXJlZD1cIlwiIG1hcmt1cFxuXHRcdFx0XHRpZiAoIHZhbHVlID09PSBcIlwiICkge1xuXHRcdFx0XHRcdHZhbHVlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZvcmNlIG5vbi1IVE1MNSBicm93c2VycyB0byByZXR1cm4gYm9vbFxuXHRcdFx0XHR2YWx1ZSA9ICEhdmFsdWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YWx1ZSA9ICRlbGVtZW50LmF0dHIoIG1ldGhvZCApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUoIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICk7XG5cdFx0fVxuXG5cdFx0Ly8gJ21heGxlbmd0aCcgbWF5IGJlIHJldHVybmVkIGFzIC0xLCAyMTQ3NDgzNjQ3ICggSUUgKSBhbmQgNTI0Mjg4ICggc2FmYXJpICkgZm9yIHRleHQgaW5wdXRzXG5cdFx0aWYgKCBydWxlcy5tYXhsZW5ndGggJiYgLy0xfDIxNDc0ODM2NDd8NTI0Mjg4Ly50ZXN0KCBydWxlcy5tYXhsZW5ndGggKSApIHtcblx0XHRcdGRlbGV0ZSBydWxlcy5tYXhsZW5ndGg7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdGRhdGFSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHQkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcblx0XHRcdHR5cGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSxcblx0XHRcdG1ldGhvZCwgdmFsdWU7XG5cblx0XHRmb3IgKCBtZXRob2QgaW4gJC52YWxpZGF0b3IubWV0aG9kcyApIHtcblx0XHRcdHZhbHVlID0gJGVsZW1lbnQuZGF0YSggXCJydWxlXCIgKyBtZXRob2QuY2hhckF0KCAwICkudG9VcHBlckNhc2UoKSArIG1ldGhvZC5zdWJzdHJpbmcoIDEgKS50b0xvd2VyQ2FzZSgpICk7XG5cdFx0XHR0aGlzLm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUoIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICk7XG5cdFx0fVxuXHRcdHJldHVybiBydWxlcztcblx0fSxcblxuXHRzdGF0aWNSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHR2YWxpZGF0b3IgPSAkLmRhdGEoIGVsZW1lbnQuZm9ybSwgXCJ2YWxpZGF0b3JcIiApO1xuXG5cdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3MucnVsZXMgKSB7XG5cdFx0XHRydWxlcyA9ICQudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGUoIHZhbGlkYXRvci5zZXR0aW5ncy5ydWxlc1sgZWxlbWVudC5uYW1lIF0gKSB8fCB7fTtcblx0XHR9XG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdG5vcm1hbGl6ZVJ1bGVzOiBmdW5jdGlvbiggcnVsZXMsIGVsZW1lbnQgKSB7XG5cblx0XHQvLyBIYW5kbGUgZGVwZW5kZW5jeSBjaGVja1xuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBwcm9wLCB2YWwgKSB7XG5cblx0XHRcdC8vIElnbm9yZSBydWxlIHdoZW4gcGFyYW0gaXMgZXhwbGljaXRseSBmYWxzZSwgZWcuIHJlcXVpcmVkOmZhbHNlXG5cdFx0XHRpZiAoIHZhbCA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdGRlbGV0ZSBydWxlc1sgcHJvcCBdO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHZhbC5wYXJhbSB8fCB2YWwuZGVwZW5kcyApIHtcblx0XHRcdFx0dmFyIGtlZXBSdWxlID0gdHJ1ZTtcblx0XHRcdFx0c3dpdGNoICggdHlwZW9mIHZhbC5kZXBlbmRzICkge1xuXHRcdFx0XHRjYXNlIFwic3RyaW5nXCI6XG5cdFx0XHRcdFx0a2VlcFJ1bGUgPSAhISQoIHZhbC5kZXBlbmRzLCBlbGVtZW50LmZvcm0gKS5sZW5ndGg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJmdW5jdGlvblwiOlxuXHRcdFx0XHRcdGtlZXBSdWxlID0gdmFsLmRlcGVuZHMuY2FsbCggZWxlbWVudCwgZWxlbWVudCApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgga2VlcFJ1bGUgKSB7XG5cdFx0XHRcdFx0cnVsZXNbIHByb3AgXSA9IHZhbC5wYXJhbSAhPT0gdW5kZWZpbmVkID8gdmFsLnBhcmFtIDogdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkLmRhdGEoIGVsZW1lbnQuZm9ybSwgXCJ2YWxpZGF0b3JcIiApLnJlc2V0RWxlbWVudHMoICQoIGVsZW1lbnQgKSApO1xuXHRcdFx0XHRcdGRlbGV0ZSBydWxlc1sgcHJvcCBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0Ly8gRXZhbHVhdGUgcGFyYW1ldGVyc1xuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBydWxlLCBwYXJhbWV0ZXIgKSB7XG5cdFx0XHRydWxlc1sgcnVsZSBdID0gJC5pc0Z1bmN0aW9uKCBwYXJhbWV0ZXIgKSAmJiBydWxlICE9PSBcIm5vcm1hbGl6ZXJcIiA/IHBhcmFtZXRlciggZWxlbWVudCApIDogcGFyYW1ldGVyO1xuXHRcdH0gKTtcblxuXHRcdC8vIENsZWFuIG51bWJlciBwYXJhbWV0ZXJzXG5cdFx0JC5lYWNoKCBbIFwibWlubGVuZ3RoXCIsIFwibWF4bGVuZ3RoXCIgXSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIHJ1bGVzWyB0aGlzIF0gKSB7XG5cdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBOdW1iZXIoIHJ1bGVzWyB0aGlzIF0gKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdFx0JC5lYWNoKCBbIFwicmFuZ2VsZW5ndGhcIiwgXCJyYW5nZVwiIF0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHBhcnRzO1xuXHRcdFx0aWYgKCBydWxlc1sgdGhpcyBdICkge1xuXHRcdFx0XHRpZiAoICQuaXNBcnJheSggcnVsZXNbIHRoaXMgXSApICkge1xuXHRcdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBbIE51bWJlciggcnVsZXNbIHRoaXMgXVsgMCBdICksIE51bWJlciggcnVsZXNbIHRoaXMgXVsgMSBdICkgXTtcblx0XHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHJ1bGVzWyB0aGlzIF0gPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0cGFydHMgPSBydWxlc1sgdGhpcyBdLnJlcGxhY2UoIC9bXFxbXFxdXS9nLCBcIlwiICkuc3BsaXQoIC9bXFxzLF0rLyApO1xuXHRcdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBbIE51bWJlciggcGFydHNbIDAgXSApLCBOdW1iZXIoIHBhcnRzWyAxIF0gKSBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0aWYgKCAkLnZhbGlkYXRvci5hdXRvQ3JlYXRlUmFuZ2VzICkge1xuXG5cdFx0XHQvLyBBdXRvLWNyZWF0ZSByYW5nZXNcblx0XHRcdGlmICggcnVsZXMubWluICE9IG51bGwgJiYgcnVsZXMubWF4ICE9IG51bGwgKSB7XG5cdFx0XHRcdHJ1bGVzLnJhbmdlID0gWyBydWxlcy5taW4sIHJ1bGVzLm1heCBdO1xuXHRcdFx0XHRkZWxldGUgcnVsZXMubWluO1xuXHRcdFx0XHRkZWxldGUgcnVsZXMubWF4O1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBydWxlcy5taW5sZW5ndGggIT0gbnVsbCAmJiBydWxlcy5tYXhsZW5ndGggIT0gbnVsbCApIHtcblx0XHRcdFx0cnVsZXMucmFuZ2VsZW5ndGggPSBbIHJ1bGVzLm1pbmxlbmd0aCwgcnVsZXMubWF4bGVuZ3RoIF07XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5taW5sZW5ndGg7XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5tYXhsZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdC8vIENvbnZlcnRzIGEgc2ltcGxlIHN0cmluZyB0byBhIHtzdHJpbmc6IHRydWV9IHJ1bGUsIGUuZy4sIFwicmVxdWlyZWRcIiB0byB7cmVxdWlyZWQ6dHJ1ZX1cblx0bm9ybWFsaXplUnVsZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdHZhciB0cmFuc2Zvcm1lZCA9IHt9O1xuXHRcdFx0JC5lYWNoKCBkYXRhLnNwbGl0KCAvXFxzLyApLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dHJhbnNmb3JtZWRbIHRoaXMgXSA9IHRydWU7XG5cdFx0XHR9ICk7XG5cdFx0XHRkYXRhID0gdHJhbnNmb3JtZWQ7XG5cdFx0fVxuXHRcdHJldHVybiBkYXRhO1xuXHR9LFxuXG5cdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9qUXVlcnkudmFsaWRhdG9yLmFkZE1ldGhvZC9cblx0YWRkTWV0aG9kOiBmdW5jdGlvbiggbmFtZSwgbWV0aG9kLCBtZXNzYWdlICkge1xuXHRcdCQudmFsaWRhdG9yLm1ldGhvZHNbIG5hbWUgXSA9IG1ldGhvZDtcblx0XHQkLnZhbGlkYXRvci5tZXNzYWdlc1sgbmFtZSBdID0gbWVzc2FnZSAhPT0gdW5kZWZpbmVkID8gbWVzc2FnZSA6ICQudmFsaWRhdG9yLm1lc3NhZ2VzWyBuYW1lIF07XG5cdFx0aWYgKCBtZXRob2QubGVuZ3RoIDwgMyApIHtcblx0XHRcdCQudmFsaWRhdG9yLmFkZENsYXNzUnVsZXMoIG5hbWUsICQudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGUoIG5hbWUgKSApO1xuXHRcdH1cblx0fSxcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5tZXRob2RzL1xuXHRtZXRob2RzOiB7XG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcmVxdWlyZWQtbWV0aG9kL1xuXHRcdHJlcXVpcmVkOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXG5cdFx0XHQvLyBDaGVjayBpZiBkZXBlbmRlbmN5IGlzIG1ldFxuXHRcdFx0aWYgKCAhdGhpcy5kZXBlbmQoIHBhcmFtLCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHRcdH1cblx0XHRcdGlmICggZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInNlbGVjdFwiICkge1xuXG5cdFx0XHRcdC8vIENvdWxkIGJlIGFuIGFycmF5IGZvciBzZWxlY3QtbXVsdGlwbGUgb3IgYSBzdHJpbmcsIGJvdGggYXJlIGZpbmUgdGhpcyB3YXlcblx0XHRcdFx0dmFyIHZhbCA9ICQoIGVsZW1lbnQgKS52YWwoKTtcblx0XHRcdFx0cmV0dXJuIHZhbCAmJiB2YWwubGVuZ3RoID4gMDtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5jaGVja2FibGUoIGVsZW1lbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApID4gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZS5sZW5ndGggPiAwO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvZW1haWwtbWV0aG9kL1xuXHRcdGVtYWlsOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cblx0XHRcdC8vIEZyb20gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCN2YWxpZC1lLW1haWwtYWRkcmVzc1xuXHRcdFx0Ly8gUmV0cmlldmVkIDIwMTQtMDEtMTRcblx0XHRcdC8vIElmIHlvdSBoYXZlIGEgcHJvYmxlbSB3aXRoIHRoaXMgaW1wbGVtZW50YXRpb24sIHJlcG9ydCBhIGJ1ZyBhZ2FpbnN0IHRoZSBhYm92ZSBzcGVjXG5cdFx0XHQvLyBPciB1c2UgY3VzdG9tIG1ldGhvZHMgdG8gaW1wbGVtZW50IHlvdXIgb3duIGVtYWlsIHZhbGlkYXRpb25cblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15bYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqJC8udGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3VybC1tZXRob2QvXG5cdFx0dXJsOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cblx0XHRcdC8vIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIERpZWdvIFBlcmluaSwgTUlUIGxpY2Vuc2VkXG5cdFx0XHQvLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9kcGVyaW5pLzcyOTI5NFxuXHRcdFx0Ly8gc2VlIGFsc28gaHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL2RlbW8vdXJsLXJlZ2V4XG5cdFx0XHQvLyBtb2RpZmllZCB0byBhbGxvdyBwcm90b2NvbC1yZWxhdGl2ZSBVUkxzXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eKD86KD86KD86aHR0cHM/fGZ0cCk6KT9cXC9cXC8pKD86XFxTKyg/OjpcXFMqKT9AKT8oPzooPyEoPzoxMHwxMjcpKD86XFwuXFxkezEsM30pezN9KSg/ISg/OjE2OVxcLjI1NHwxOTJcXC4xNjgpKD86XFwuXFxkezEsM30pezJ9KSg/ITE3MlxcLig/OjFbNi05XXwyXFxkfDNbMC0xXSkoPzpcXC5cXGR7MSwzfSl7Mn0pKD86WzEtOV1cXGQ/fDFcXGRcXGR8MlswMV1cXGR8MjJbMC0zXSkoPzpcXC4oPzoxP1xcZHsxLDJ9fDJbMC00XVxcZHwyNVswLTVdKSl7Mn0oPzpcXC4oPzpbMS05XVxcZD98MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC00XSkpfCg/Oig/OlthLXpcXHUwMGExLVxcdWZmZmYwLTldLSopKlthLXpcXHUwMGExLVxcdWZmZmYwLTldKykoPzpcXC4oPzpbYS16XFx1MDBhMS1cXHVmZmZmMC05XS0qKSpbYS16XFx1MDBhMS1cXHVmZmZmMC05XSspKig/OlxcLig/OlthLXpcXHUwMGExLVxcdWZmZmZdezIsfSkpLj8pKD86OlxcZHsyLDV9KT8oPzpbLz8jXVxcUyopPyQvaS50ZXN0KCB2YWx1ZSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvZGF0ZS1tZXRob2QvXG5cdFx0ZGF0ZTogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAhL0ludmFsaWR8TmFOLy50ZXN0KCBuZXcgRGF0ZSggdmFsdWUgKS50b1N0cmluZygpICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9kYXRlSVNPLW1ldGhvZC9cblx0XHRkYXRlSVNPOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eXFxkezR9W1xcL1xcLV0oMD9bMS05XXwxWzAxMl0pW1xcL1xcLV0oMD9bMS05XXxbMTJdWzAtOV18M1swMV0pJC8udGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL251bWJlci1tZXRob2QvXG5cdFx0bnVtYmVyOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eKD86LT9cXGQrfC0/XFxkezEsM30oPzosXFxkezN9KSspPyg/OlxcLlxcZCspPyQvLnRlc3QoIHZhbHVlICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9kaWdpdHMtbWV0aG9kL1xuXHRcdGRpZ2l0czogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAvXlxcZCskLy50ZXN0KCB2YWx1ZSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbWlubGVuZ3RoLW1ldGhvZC9cblx0XHRtaW5sZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHR2YXIgbGVuZ3RoID0gJC5pc0FycmF5KCB2YWx1ZSApID8gdmFsdWUubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IGxlbmd0aCA+PSBwYXJhbTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heGxlbmd0aC1tZXRob2QvXG5cdFx0bWF4bGVuZ3RoOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0dmFyIGxlbmd0aCA9ICQuaXNBcnJheSggdmFsdWUgKSA/IHZhbHVlLmxlbmd0aCA6IHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApO1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCBsZW5ndGggPD0gcGFyYW07XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yYW5nZWxlbmd0aC1tZXRob2QvXG5cdFx0cmFuZ2VsZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHR2YXIgbGVuZ3RoID0gJC5pc0FycmF5KCB2YWx1ZSApID8gdmFsdWUubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICggbGVuZ3RoID49IHBhcmFtWyAwIF0gJiYgbGVuZ3RoIDw9IHBhcmFtWyAxIF0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21pbi1tZXRob2QvXG5cdFx0bWluOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCB2YWx1ZSA+PSBwYXJhbTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heC1tZXRob2QvXG5cdFx0bWF4OiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCB2YWx1ZSA8PSBwYXJhbTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3JhbmdlLW1ldGhvZC9cblx0XHRyYW5nZTogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgKCB2YWx1ZSA+PSBwYXJhbVsgMCBdICYmIHZhbHVlIDw9IHBhcmFtWyAxIF0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3N0ZXAtbWV0aG9kL1xuXHRcdHN0ZXA6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHR2YXIgdHlwZSA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcInR5cGVcIiApLFxuXHRcdFx0XHRlcnJvck1lc3NhZ2UgPSBcIlN0ZXAgYXR0cmlidXRlIG9uIGlucHV0IHR5cGUgXCIgKyB0eXBlICsgXCIgaXMgbm90IHN1cHBvcnRlZC5cIixcblx0XHRcdFx0c3VwcG9ydGVkVHlwZXMgPSBbIFwidGV4dFwiLCBcIm51bWJlclwiLCBcInJhbmdlXCIgXSxcblx0XHRcdFx0cmUgPSBuZXcgUmVnRXhwKCBcIlxcXFxiXCIgKyB0eXBlICsgXCJcXFxcYlwiICksXG5cdFx0XHRcdG5vdFN1cHBvcnRlZCA9IHR5cGUgJiYgIXJlLnRlc3QoIHN1cHBvcnRlZFR5cGVzLmpvaW4oKSApO1xuXG5cdFx0XHQvLyBXb3JrcyBvbmx5IGZvciB0ZXh0LCBudW1iZXIgYW5kIHJhbmdlIGlucHV0IHR5cGVzXG5cdFx0XHQvLyBUT0RPIGZpbmQgYSB3YXkgdG8gc3VwcG9ydCBpbnB1dCB0eXBlcyBkYXRlLCBkYXRldGltZSwgZGF0ZXRpbWUtbG9jYWwsIG1vbnRoLCB0aW1lIGFuZCB3ZWVrXG5cdFx0XHRpZiAoIG5vdFN1cHBvcnRlZCApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCBlcnJvck1lc3NhZ2UgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgKCB2YWx1ZSAlIHBhcmFtID09PSAwICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9lcXVhbFRvLW1ldGhvZC9cblx0XHRlcXVhbFRvOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXG5cdFx0XHQvLyBCaW5kIHRvIHRoZSBibHVyIGV2ZW50IG9mIHRoZSB0YXJnZXQgaW4gb3JkZXIgdG8gcmV2YWxpZGF0ZSB3aGVuZXZlciB0aGUgdGFyZ2V0IGZpZWxkIGlzIHVwZGF0ZWRcblx0XHRcdHZhciB0YXJnZXQgPSAkKCBwYXJhbSApO1xuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLm9uZm9jdXNvdXQgJiYgdGFyZ2V0Lm5vdCggXCIudmFsaWRhdGUtZXF1YWxUby1ibHVyXCIgKS5sZW5ndGggKSB7XG5cdFx0XHRcdHRhcmdldC5hZGRDbGFzcyggXCJ2YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApLm9uKCBcImJsdXIudmFsaWRhdGUtZXF1YWxUb1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkKCBlbGVtZW50ICkudmFsaWQoKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlID09PSB0YXJnZXQudmFsKCk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yZW1vdGUtbWV0aG9kL1xuXHRcdHJlbW90ZTogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSwgbWV0aG9kICkge1xuXHRcdFx0aWYgKCB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHRcdH1cblxuXHRcdFx0bWV0aG9kID0gdHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIiAmJiBtZXRob2QgfHwgXCJyZW1vdGVcIjtcblxuXHRcdFx0dmFyIHByZXZpb3VzID0gdGhpcy5wcmV2aW91c1ZhbHVlKCBlbGVtZW50LCBtZXRob2QgKSxcblx0XHRcdFx0dmFsaWRhdG9yLCBkYXRhLCBvcHRpb25EYXRhU3RyaW5nO1xuXG5cdFx0XHRpZiAoICF0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSApIHtcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSA9IHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSB8fCB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF07XG5cdFx0XHR0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF0gPSBwcmV2aW91cy5tZXNzYWdlO1xuXG5cdFx0XHRwYXJhbSA9IHR5cGVvZiBwYXJhbSA9PT0gXCJzdHJpbmdcIiAmJiB7IHVybDogcGFyYW0gfSB8fCBwYXJhbTtcblx0XHRcdG9wdGlvbkRhdGFTdHJpbmcgPSAkLnBhcmFtKCAkLmV4dGVuZCggeyBkYXRhOiB2YWx1ZSB9LCBwYXJhbS5kYXRhICkgKTtcblx0XHRcdGlmICggcHJldmlvdXMub2xkID09PSBvcHRpb25EYXRhU3RyaW5nICkge1xuXHRcdFx0XHRyZXR1cm4gcHJldmlvdXMudmFsaWQ7XG5cdFx0XHR9XG5cblx0XHRcdHByZXZpb3VzLm9sZCA9IG9wdGlvbkRhdGFTdHJpbmc7XG5cdFx0XHR2YWxpZGF0b3IgPSB0aGlzO1xuXHRcdFx0dGhpcy5zdGFydFJlcXVlc3QoIGVsZW1lbnQgKTtcblx0XHRcdGRhdGEgPSB7fTtcblx0XHRcdGRhdGFbIGVsZW1lbnQubmFtZSBdID0gdmFsdWU7XG5cdFx0XHQkLmFqYXgoICQuZXh0ZW5kKCB0cnVlLCB7XG5cdFx0XHRcdG1vZGU6IFwiYWJvcnRcIixcblx0XHRcdFx0cG9ydDogXCJ2YWxpZGF0ZVwiICsgZWxlbWVudC5uYW1lLFxuXHRcdFx0XHRkYXRhVHlwZTogXCJqc29uXCIsXG5cdFx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRcdGNvbnRleHQ6IHZhbGlkYXRvci5jdXJyZW50Rm9ybSxcblx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRcdHZhciB2YWxpZCA9IHJlc3BvbnNlID09PSB0cnVlIHx8IHJlc3BvbnNlID09PSBcInRydWVcIixcblx0XHRcdFx0XHRcdGVycm9ycywgbWVzc2FnZSwgc3VibWl0dGVkO1xuXG5cdFx0XHRcdFx0dmFsaWRhdG9yLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF0gPSBwcmV2aW91cy5vcmlnaW5hbE1lc3NhZ2U7XG5cdFx0XHRcdFx0aWYgKCB2YWxpZCApIHtcblx0XHRcdFx0XHRcdHN1Ym1pdHRlZCA9IHZhbGlkYXRvci5mb3JtU3VibWl0dGVkO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLnJlc2V0SW50ZXJuYWxzKCk7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IudG9IaWRlID0gdmFsaWRhdG9yLmVycm9yc0ZvciggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmZvcm1TdWJtaXR0ZWQgPSBzdWJtaXR0ZWQ7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc3VjY2Vzc0xpc3QucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmludmFsaWRbIGVsZW1lbnQubmFtZSBdID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc2hvd0Vycm9ycygpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlcnJvcnMgPSB7fTtcblx0XHRcdFx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZSB8fCB2YWxpZGF0b3IuZGVmYXVsdE1lc3NhZ2UoIGVsZW1lbnQsIHsgbWV0aG9kOiBtZXRob2QsIHBhcmFtZXRlcnM6IHZhbHVlIH0gKTtcblx0XHRcdFx0XHRcdGVycm9yc1sgZWxlbWVudC5uYW1lIF0gPSBwcmV2aW91cy5tZXNzYWdlID0gbWVzc2FnZTtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5pbnZhbGlkWyBlbGVtZW50Lm5hbWUgXSA9IHRydWU7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc2hvd0Vycm9ycyggZXJyb3JzICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHByZXZpb3VzLnZhbGlkID0gdmFsaWQ7XG5cdFx0XHRcdFx0dmFsaWRhdG9yLnN0b3BSZXF1ZXN0KCBlbGVtZW50LCB2YWxpZCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBwYXJhbSApICk7XG5cdFx0XHRyZXR1cm4gXCJwZW5kaW5nXCI7XG5cdFx0fVxuXHR9XG5cbn0gKTtcblxyXG4vLyBBamF4IG1vZGU6IGFib3J0XG4vLyB1c2FnZTogJC5hamF4KHsgbW9kZTogXCJhYm9ydFwiWywgcG9ydDogXCJ1bmlxdWVwb3J0XCJdfSk7XG4vLyBpZiBtb2RlOlwiYWJvcnRcIiBpcyB1c2VkLCB0aGUgcHJldmlvdXMgcmVxdWVzdCBvbiB0aGF0IHBvcnQgKHBvcnQgY2FuIGJlIHVuZGVmaW5lZCkgaXMgYWJvcnRlZCB2aWEgWE1MSHR0cFJlcXVlc3QuYWJvcnQoKVxuXG52YXIgcGVuZGluZ1JlcXVlc3RzID0ge30sXG5cdGFqYXg7XG5cbi8vIFVzZSBhIHByZWZpbHRlciBpZiBhdmFpbGFibGUgKDEuNSspXG5pZiAoICQuYWpheFByZWZpbHRlciApIHtcblx0JC5hamF4UHJlZmlsdGVyKCBmdW5jdGlvbiggc2V0dGluZ3MsIF8sIHhociApIHtcblx0XHR2YXIgcG9ydCA9IHNldHRpbmdzLnBvcnQ7XG5cdFx0aWYgKCBzZXR0aW5ncy5tb2RlID09PSBcImFib3J0XCIgKSB7XG5cdFx0XHRpZiAoIHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdICkge1xuXHRcdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXS5hYm9ydCgpO1xuXHRcdFx0fVxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gPSB4aHI7XG5cdFx0fVxuXHR9ICk7XG59IGVsc2Uge1xuXG5cdC8vIFByb3h5IGFqYXhcblx0YWpheCA9ICQuYWpheDtcblx0JC5hamF4ID0gZnVuY3Rpb24oIHNldHRpbmdzICkge1xuXHRcdHZhciBtb2RlID0gKCBcIm1vZGVcIiBpbiBzZXR0aW5ncyA/IHNldHRpbmdzIDogJC5hamF4U2V0dGluZ3MgKS5tb2RlLFxuXHRcdFx0cG9ydCA9ICggXCJwb3J0XCIgaW4gc2V0dGluZ3MgPyBzZXR0aW5ncyA6ICQuYWpheFNldHRpbmdzICkucG9ydDtcblx0XHRpZiAoIG1vZGUgPT09IFwiYWJvcnRcIiApIHtcblx0XHRcdGlmICggcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gKSB7XG5cdFx0XHRcdHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdLmFib3J0KCk7XG5cdFx0XHR9XG5cdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSA9IGFqYXguYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdFx0cmV0dXJuIHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdO1xuXHRcdH1cblx0XHRyZXR1cm4gYWpheC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH07XG59XG5cclxufSkpO1xyXG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbi8qIVxuKiBGaXRWaWRzIDEuMVxuKlxuKiBDb3B5cmlnaHQgMjAxMywgQ2hyaXMgQ295aWVyIC0gaHR0cDovL2Nzcy10cmlja3MuY29tICsgRGF2ZSBSdXBlcnQgLSBodHRwOi8vZGF2ZXJ1cGVydC5jb21cbiogQ3JlZGl0IHRvIFRoaWVycnkgS29ibGVudHogLSBodHRwOi8vd3d3LmFsaXN0YXBhcnQuY29tL2FydGljbGVzL2NyZWF0aW5nLWludHJpbnNpYy1yYXRpb3MtZm9yLXZpZGVvL1xuKiBSZWxlYXNlZCB1bmRlciB0aGUgV1RGUEwgbGljZW5zZSAtIGh0dHA6Ly9zYW0uem95Lm9yZy93dGZwbC9cbipcbiovXG5cbjsoZnVuY3Rpb24oICQgKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgJC5mbi5maXRWaWRzID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgY3VzdG9tU2VsZWN0b3I6IG51bGwsXG4gICAgICBpZ25vcmU6IG51bGxcbiAgICB9O1xuXG4gICAgaWYoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaXQtdmlkcy1zdHlsZScpKSB7XG4gICAgICAvLyBhcHBlbmRTdHlsZXM6IGh0dHBzOi8vZ2l0aHViLmNvbS90b2RkbW90dG8vZmx1aWR2aWRzL2Jsb2IvbWFzdGVyL2Rpc3QvZmx1aWR2aWRzLmpzXG4gICAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICAgIHZhciBjc3MgPSAnLmZsdWlkLXdpZHRoLXZpZGVvLXdyYXBwZXJ7d2lkdGg6MTAwJTtwb3NpdGlvbjpyZWxhdGl2ZTtwYWRkaW5nOjA7fS5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyIGlmcmFtZSwuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlciBvYmplY3QsLmZsdWlkLXdpZHRoLXZpZGVvLXdyYXBwZXIgZW1iZWQge3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2xlZnQ6MDt3aWR0aDoxMDAlO2hlaWdodDoxMDAlO30nO1xuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBkaXYuaW5uZXJIVE1MID0gJzxwPng8L3A+PHN0eWxlIGlkPVwiZml0LXZpZHMtc3R5bGVcIj4nICsgY3NzICsgJzwvc3R5bGU+JztcbiAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoZGl2LmNoaWxkTm9kZXNbMV0pO1xuICAgIH1cblxuICAgIGlmICggb3B0aW9ucyApIHtcbiAgICAgICQuZXh0ZW5kKCBzZXR0aW5ncywgb3B0aW9ucyApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZWxlY3RvcnMgPSBbXG4gICAgICAgICdpZnJhbWVbc3JjKj1cInBsYXllci52aW1lby5jb21cIl0nLFxuICAgICAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScsXG4gICAgICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUtbm9jb29raWUuY29tXCJdJyxcbiAgICAgICAgJ2lmcmFtZVtzcmMqPVwia2lja3N0YXJ0ZXIuY29tXCJdW3NyYyo9XCJ2aWRlby5odG1sXCJdJyxcbiAgICAgICAgJ29iamVjdCcsXG4gICAgICAgICdlbWJlZCdcbiAgICAgIF07XG5cbiAgICAgIGlmIChzZXR0aW5ncy5jdXN0b21TZWxlY3Rvcikge1xuICAgICAgICBzZWxlY3RvcnMucHVzaChzZXR0aW5ncy5jdXN0b21TZWxlY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIHZhciBpZ25vcmVMaXN0ID0gJy5maXR2aWRzaWdub3JlJztcblxuICAgICAgaWYoc2V0dGluZ3MuaWdub3JlKSB7XG4gICAgICAgIGlnbm9yZUxpc3QgPSBpZ25vcmVMaXN0ICsgJywgJyArIHNldHRpbmdzLmlnbm9yZTtcbiAgICAgIH1cblxuICAgICAgdmFyICRhbGxWaWRlb3MgPSAkKHRoaXMpLmZpbmQoc2VsZWN0b3JzLmpvaW4oJywnKSk7XG4gICAgICAkYWxsVmlkZW9zID0gJGFsbFZpZGVvcy5ub3QoJ29iamVjdCBvYmplY3QnKTsgLy8gU3dmT2JqIGNvbmZsaWN0IHBhdGNoXG4gICAgICAkYWxsVmlkZW9zID0gJGFsbFZpZGVvcy5ub3QoaWdub3JlTGlzdCk7IC8vIERpc2FibGUgRml0VmlkcyBvbiB0aGlzIHZpZGVvLlxuXG4gICAgICAkYWxsVmlkZW9zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgaWYoJHRoaXMucGFyZW50cyhpZ25vcmVMaXN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuOyAvLyBEaXNhYmxlIEZpdFZpZHMgb24gdGhpcyB2aWRlby5cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdlbWJlZCcgJiYgJHRoaXMucGFyZW50KCdvYmplY3QnKS5sZW5ndGggfHwgJHRoaXMucGFyZW50KCcuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlcicpLmxlbmd0aCkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCghJHRoaXMuY3NzKCdoZWlnaHQnKSAmJiAhJHRoaXMuY3NzKCd3aWR0aCcpKSAmJiAoaXNOYU4oJHRoaXMuYXR0cignaGVpZ2h0JykpIHx8IGlzTmFOKCR0aGlzLmF0dHIoJ3dpZHRoJykpKSlcbiAgICAgICAge1xuICAgICAgICAgICR0aGlzLmF0dHIoJ2hlaWdodCcsIDkpO1xuICAgICAgICAgICR0aGlzLmF0dHIoJ3dpZHRoJywgMTYpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoZWlnaHQgPSAoIHRoaXMudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnb2JqZWN0JyB8fCAoJHRoaXMuYXR0cignaGVpZ2h0JykgJiYgIWlzTmFOKHBhcnNlSW50KCR0aGlzLmF0dHIoJ2hlaWdodCcpLCAxMCkpKSApID8gcGFyc2VJbnQoJHRoaXMuYXR0cignaGVpZ2h0JyksIDEwKSA6ICR0aGlzLmhlaWdodCgpLFxuICAgICAgICAgICAgd2lkdGggPSAhaXNOYU4ocGFyc2VJbnQoJHRoaXMuYXR0cignd2lkdGgnKSwgMTApKSA/IHBhcnNlSW50KCR0aGlzLmF0dHIoJ3dpZHRoJyksIDEwKSA6ICR0aGlzLndpZHRoKCksXG4gICAgICAgICAgICBhc3BlY3RSYXRpbyA9IGhlaWdodCAvIHdpZHRoO1xuICAgICAgICBpZighJHRoaXMuYXR0cignbmFtZScpKXtcbiAgICAgICAgICB2YXIgdmlkZW9OYW1lID0gJ2ZpdHZpZCcgKyAkLmZuLmZpdFZpZHMuX2NvdW50O1xuICAgICAgICAgICR0aGlzLmF0dHIoJ25hbWUnLCB2aWRlb05hbWUpO1xuICAgICAgICAgICQuZm4uZml0Vmlkcy5fY291bnQrKztcbiAgICAgICAgfVxuICAgICAgICAkdGhpcy53cmFwKCc8ZGl2IGNsYXNzPVwiZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlclwiPjwvZGl2PicpLnBhcmVudCgnLmZsdWlkLXdpZHRoLXZpZGVvLXdyYXBwZXInKS5jc3MoJ3BhZGRpbmctdG9wJywgKGFzcGVjdFJhdGlvICogMTAwKSsnJScpO1xuICAgICAgICAkdGhpcy5yZW1vdmVBdHRyKCdoZWlnaHQnKS5yZW1vdmVBdHRyKCd3aWR0aCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgY291bnRlciBmb3IgdW5pcXVlIHZpZGVvIG5hbWVzLlxuICAkLmZuLmZpdFZpZHMuX2NvdW50ID0gMDtcblxufSkoIGpRdWVyeSApOyIsIi8qIVxuICogalF1ZXJ5IENvb2tpZSBQbHVnaW4gdjEuNC4xXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2FyaGFydGwvanF1ZXJ5LWNvb2tpZVxuICpcbiAqIENvcHlyaWdodCAyMDEzIEtsYXVzIEhhcnRsXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTURcblx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0Ly8gQ29tbW9uSlNcblx0XHRmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpKTtcblx0fSBlbHNlIHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbHNcblx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdH1cbn0oZnVuY3Rpb24gKCQpIHtcblxuXHR2YXIgcGx1c2VzID0gL1xcKy9nO1xuXG5cdGZ1bmN0aW9uIGVuY29kZShzKSB7XG5cdFx0cmV0dXJuIGNvbmZpZy5yYXcgPyBzIDogZW5jb2RlVVJJQ29tcG9uZW50KHMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVjb2RlKHMpIHtcblx0XHRyZXR1cm4gY29uZmlnLnJhdyA/IHMgOiBkZWNvZGVVUklDb21wb25lbnQocyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzdHJpbmdpZnlDb29raWVWYWx1ZSh2YWx1ZSkge1xuXHRcdHJldHVybiBlbmNvZGUoY29uZmlnLmpzb24gPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBTdHJpbmcodmFsdWUpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlQ29va2llVmFsdWUocykge1xuXHRcdGlmIChzLmluZGV4T2YoJ1wiJykgPT09IDApIHtcblx0XHRcdC8vIFRoaXMgaXMgYSBxdW90ZWQgY29va2llIGFzIGFjY29yZGluZyB0byBSRkMyMDY4LCB1bmVzY2FwZS4uLlxuXHRcdFx0cyA9IHMuc2xpY2UoMSwgLTEpLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKS5yZXBsYWNlKC9cXFxcXFxcXC9nLCAnXFxcXCcpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBSZXBsYWNlIHNlcnZlci1zaWRlIHdyaXR0ZW4gcGx1c2VzIHdpdGggc3BhY2VzLlxuXHRcdFx0Ly8gSWYgd2UgY2FuJ3QgZGVjb2RlIHRoZSBjb29raWUsIGlnbm9yZSBpdCwgaXQncyB1bnVzYWJsZS5cblx0XHRcdC8vIElmIHdlIGNhbid0IHBhcnNlIHRoZSBjb29raWUsIGlnbm9yZSBpdCwgaXQncyB1bnVzYWJsZS5cblx0XHRcdHMgPSBkZWNvZGVVUklDb21wb25lbnQocy5yZXBsYWNlKHBsdXNlcywgJyAnKSk7XG5cdFx0XHRyZXR1cm4gY29uZmlnLmpzb24gPyBKU09OLnBhcnNlKHMpIDogcztcblx0XHR9IGNhdGNoKGUpIHt9XG5cdH1cblxuXHRmdW5jdGlvbiByZWFkKHMsIGNvbnZlcnRlcikge1xuXHRcdHZhciB2YWx1ZSA9IGNvbmZpZy5yYXcgPyBzIDogcGFyc2VDb29raWVWYWx1ZShzKTtcblx0XHRyZXR1cm4gJC5pc0Z1bmN0aW9uKGNvbnZlcnRlcikgPyBjb252ZXJ0ZXIodmFsdWUpIDogdmFsdWU7XG5cdH1cblxuXHR2YXIgY29uZmlnID0gJC5jb29raWUgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuXG5cdFx0Ly8gV3JpdGVcblxuXHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmICEkLmlzRnVuY3Rpb24odmFsdWUpKSB7XG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQoe30sIGNvbmZpZy5kZWZhdWx0cywgb3B0aW9ucyk7XG5cblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5leHBpcmVzID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHR2YXIgZGF5cyA9IG9wdGlvbnMuZXhwaXJlcywgdCA9IG9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdHQuc2V0VGltZSgrdCArIGRheXMgKiA4NjRlKzUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKGRvY3VtZW50LmNvb2tpZSA9IFtcblx0XHRcdFx0ZW5jb2RlKGtleSksICc9Jywgc3RyaW5naWZ5Q29va2llVmFsdWUodmFsdWUpLFxuXHRcdFx0XHRvcHRpb25zLmV4cGlyZXMgPyAnOyBleHBpcmVzPScgKyBvcHRpb25zLmV4cGlyZXMudG9VVENTdHJpbmcoKSA6ICcnLCAvLyB1c2UgZXhwaXJlcyBhdHRyaWJ1dGUsIG1heC1hZ2UgaXMgbm90IHN1cHBvcnRlZCBieSBJRVxuXHRcdFx0XHRvcHRpb25zLnBhdGggICAgPyAnOyBwYXRoPScgKyBvcHRpb25zLnBhdGggOiAnJyxcblx0XHRcdFx0b3B0aW9ucy5kb21haW4gID8gJzsgZG9tYWluPScgKyBvcHRpb25zLmRvbWFpbiA6ICcnLFxuXHRcdFx0XHRvcHRpb25zLnNlY3VyZSAgPyAnOyBzZWN1cmUnIDogJydcblx0XHRcdF0uam9pbignJykpO1xuXHRcdH1cblxuXHRcdC8vIFJlYWRcblxuXHRcdHZhciByZXN1bHQgPSBrZXkgPyB1bmRlZmluZWQgOiB7fTtcblxuXHRcdC8vIFRvIHByZXZlbnQgdGhlIGZvciBsb29wIGluIHRoZSBmaXJzdCBwbGFjZSBhc3NpZ24gYW4gZW1wdHkgYXJyYXlcblx0XHQvLyBpbiBjYXNlIHRoZXJlIGFyZSBubyBjb29raWVzIGF0IGFsbC4gQWxzbyBwcmV2ZW50cyBvZGQgcmVzdWx0IHdoZW5cblx0XHQvLyBjYWxsaW5nICQuY29va2llKCkuXG5cdFx0dmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUgPyBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsgJykgOiBbXTtcblxuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gY29va2llcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHZhciBwYXJ0cyA9IGNvb2tpZXNbaV0uc3BsaXQoJz0nKTtcblx0XHRcdHZhciBuYW1lID0gZGVjb2RlKHBhcnRzLnNoaWZ0KCkpO1xuXHRcdFx0dmFyIGNvb2tpZSA9IHBhcnRzLmpvaW4oJz0nKTtcblxuXHRcdFx0aWYgKGtleSAmJiBrZXkgPT09IG5hbWUpIHtcblx0XHRcdFx0Ly8gSWYgc2Vjb25kIGFyZ3VtZW50ICh2YWx1ZSkgaXMgYSBmdW5jdGlvbiBpdCdzIGEgY29udmVydGVyLi4uXG5cdFx0XHRcdHJlc3VsdCA9IHJlYWQoY29va2llLCB2YWx1ZSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBQcmV2ZW50IHN0b3JpbmcgYSBjb29raWUgdGhhdCB3ZSBjb3VsZG4ndCBkZWNvZGUuXG5cdFx0XHRpZiAoIWtleSAmJiAoY29va2llID0gcmVhZChjb29raWUpKSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJlc3VsdFtuYW1lXSA9IGNvb2tpZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGNvbmZpZy5kZWZhdWx0cyA9IHt9O1xuXG5cdCQucmVtb3ZlQ29va2llID0gZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuXHRcdGlmICgkLmNvb2tpZShrZXkpID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBNdXN0IG5vdCBhbHRlciBvcHRpb25zLCB0aHVzIGV4dGVuZGluZyBhIGZyZXNoIG9iamVjdC4uLlxuXHRcdCQuY29va2llKGtleSwgJycsICQuZXh0ZW5kKHt9LCBvcHRpb25zLCB7IGV4cGlyZXM6IC0xIH0pKTtcblx0XHRyZXR1cm4gISQuY29va2llKGtleSk7XG5cdH07XG5cbn0pKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEluaXRpYWxpemF0aW9uIHNjcmlwdCBmb3IgZ2xvYmFsIHByb2Nlc3Nlc1xuICovXG5cbihmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG5cbi8qKlxuICpcbiAqIEluaXRpYWxpemUgZml0VmlkIGZvciBZb3VUdWJlIHZpZW9zLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG5cblx0RHJ1cGFsLmJlaGF2aW9ycy5maXR2aWRpbml0ID0ge1xuXHQgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcblx0XHRcdChmdW5jdGlvbiAoJCkge1xuXHRcdFx0XHQkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xuXHRcdFx0XHRcdCQoJy52aWRlby1jb250YWluZXInKS5maXRWaWRzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSkoalF1ZXJ5KTtcblx0XHR9XG5cdH07XG5cblx0RHJ1cGFsLmJlaGF2aW9ycy5qdW1wTWVudSA9IHtcblx0XHRhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuXHRcdFx0JCgnLmpzLWRyb3Bkb3duLXNlbGVjdCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9ICQodGhpcykuZmluZCgnOnNlbGVjdGVkJykuZGF0YSgndXJsJyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cbn0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEludGVyYWN0aW9ucyBmb3IgZm9ybSB2YWxpZGF0aW9uLlxuICogUmVmZXJlbmNlIGh0dHA6Ly9jb2RlcGVuLmlvL2Fub24vcGVuL0dIS0pqXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cblxuKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgRHJ1cGFsLmJlaGF2aW9ycy5mb3JtaXRlbXMgPSB7XG4gICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gVmFsaWRhdGUgZm9ybVxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgLy8gVmFsaWRhdGUgb24gcGFnZSBsb2FkXG4gICAgICAgICQoJy5zaW1wbGUtc3RlcC1mb3JtLCAubXVsdGktc3RlcC1mb3JtJykudmFsaWRhdGUoe1xuICAgICAgICAgIHJ1bGVzOiB7XG4gICAgICAgICAgICB0ZWw6IHtcbiAgICAgICAgICAgICAgbnVtYmVyOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpZ25vcmU6ICc6aGlkZGVuJ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBNdWx0aSBzdGVwIGZvcm0gbmV4dCBsaW5rXG4gICAgICAgICQoJy5zdGVwLWZvcm0tbmV4dCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgLy8gRmllbGRzZXQgdmFyaWFibGVzXG4gICAgICAgICAgdmFyIGN1cnJlbnRfZnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XG4gICAgICAgICAgdmFyIG5leHRfZnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykubmV4dCgnZmllbGRzZXQnKTtcbiAgICAgICAgICB2YXIgcHJldl9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5wcmV2QWxsKCdmaWVsZHNldCcpO1xuXG4gICAgICAgICAgLy8gSWYgY3VycmVudCBmaWVsZHNldCBpcyB2YWxpZCBnbyB0byBuZXh0IGZpZWxkc2V0XG4gICAgICAgICAgaWYoJCgnLm11bHRpLXN0ZXAtZm9ybScpLnZhbGlkKCkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRfZnMucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpLmFkZENsYXNzKCdjb21wbGV0ZScpO1xuICAgICAgICAgICAgbmV4dF9mcy5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICBwcmV2X2ZzLmFkZENsYXNzKCdjb21wbGV0ZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU3RlcCBhbmNob3IgbGlua3NcbiAgICAgICAgJCgnLnN0ZXAtZm9ybS1hbmNob3InKS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICAgIC8vIEZpZWxkc2V0IHZhcmlhYmxlXG4gICAgICAgICAgdmFyIGN1cnJlbnRfZnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XG5cbiAgICAgICAgICAvLyBJZiBjdXJyZW50IGZpZWxkc2V0IGhhcyBjbGFzcyBkbyB0aGlzXG4gICAgICAgICAgaWYoY3VycmVudF9mcy5oYXNDbGFzcygnY29tcGxldGUnKSkge1xuICAgICAgICAgICAgY3VycmVudF9mcy5yZW1vdmVDbGFzcygnY29tcGxldGUnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICBjdXJyZW50X2ZzLnNpYmxpbmdzKCdmaWVsZHNldCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAvLyBJbml0aWF0ZSBmb3JtIGljb25zXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAvLyBDcmVhdGUgdmFyaWFibGUgZm9yIGFsbCBzZWxlY3RvcnMgbmVlZGVkIGZvciBpY29uIHZhbGlkYXRvclxuICAgICAgICB2YXIgaWNvblNlbGVjdG9yID0gJCgnLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidGV4dFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwiZW1haWxcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cInVybFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwiZGF0ZVwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwibW9udGhcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cInRpbWVcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cImRhdGV0aW1lXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJkYXRldGltZS1sb2NhbFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwid2Vla1wiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwibnVtYmVyXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJzZWFyY2hcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cInRlbFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwiY29sb3JcIl0sIC5mb3JtLWl0ZW0gc2VsZWN0LCAuZm9ybS1pdGVtIHRleHRhcmVhLCAuZm9ybS1pdGVtLXJhZGlvIGxhYmVsLmVycm9yLCAuZm9ybS1pdGVtLXJhZGlvLWxhYmVsX2dyb3VwIGxhYmVsOmxhc3QtY2hpbGQsIC5mb3JtLWl0ZW0tY2hlY2tib3ggbGFiZWwuZXJyb3InKTtcblxuICAgICAgICAvLyBDcmVhdGUgZm9ybSBpdGVtIGljb25cbiAgICAgICAgJChpY29uU2VsZWN0b3IpLmFmdGVyKCc8c3BhbiBjbGFzcz1cImZvcm0taXRlbV9pY29uXCI+PC9zcGFuPicpO1xuXG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAvLyBJbml0aWF0ZSBsYWJlbCBzaG93L2hpZGVcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICB2YXIgb25DbGFzcyA9ICdvbic7XG4gICAgICAgIHZhciBzaG93Q2xhc3MgPSAnc2hvdyc7XG5cbiAgICAgICAgJCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QnKVxuICAgICAgICAuYmluZCgnY2hlY2t2YWwnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgbGFiZWwgPSAkKHRoaXMpLnByZXYoJ2xhYmVsJyk7XG5cbiAgICAgICAgICBpZiAodGhpcy52YWx1ZSAhPT0gJycpXG4gICAgICAgICAgbGFiZWwuYWRkQ2xhc3Moc2hvd0NsYXNzKTtcblxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICBsYWJlbC5yZW1vdmVDbGFzcyhzaG93Q2xhc3MpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2tleXVwJywgZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjaGVja3ZhbCcpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2ZvY3VzJywgZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgJCh0aGlzKS5wcmV2KCdsYWJlbCcpLmFkZENsYXNzKG9uQ2xhc3MpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2JsdXInLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAkKHRoaXMpLnByZXYoJ2xhYmVsJykucmVtb3ZlQ2xhc3Mob25DbGFzcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC50cmlnZ2VyKCdjaGVja3ZhbCcpO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gU2hvdyAvIEhpZGUgcGFzc3dvcmQgdGV4dFxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgJCgnLmZvcm0taXRlbV9wYXNzd29yZCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ3Nob3cnKTtcblxuICAgICAgICAgIGlmKCQodGhpcykuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnaW5wdXQnKS5hdHRyKCd0eXBlJywgJ3RleHQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkKHRoaXMpLnNpYmxpbmdzKCdpbnB1dCcpLmF0dHIoJ3R5cGUnLCAncGFzc3dvcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB9KShqUXVlcnkpO1xuICAgIH1cbiAgfTtcbn0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIFJpYmJvbiBuYXYgdXNlciBpbnRlcmFjdGlvbnMuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5yaWJib25uYXYgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vIFNlYXJjaFxuXG4gICAgICAgICAvLyBXaGVuIGEgdXNlciBjbGlja3Mgb24gdGhlIHJpYmJvbiB0cmlnZ2VyIChtYWluKVxuICAgICAgICAgJCgnLnJpYmJvbl9kcm9wZG93bl90cmlnZ2VyJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgIC8vIFVuZm9jdXMgb24gdGhlIGRyb3Bkb3duXG4gICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnLnJpYmJvbl9kcm9wZG93bl9uYXYnKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJykuc2xpZGVUb2dnbGUoMzAwKTtcbiAgICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfdHJpZ2dlcicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfbmF2JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTs7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X3RyaWdnZXItYXV0aCcpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfbmF2LWNoaWxkJykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBXaGVuIGEgdXNlciBjbGlja3Mgb24gdGhlIHJpYmJvbiB0cmlnZ2VyIGZvciB1c2VyIGRyb3Bkb3duXG4gICAgICAgICAkKCcucmliYm9uX3VzZXItbWVudV90cmlnZ2VyJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgIC8vIFVuZm9jdXMgb24gdGhlIGRyb3Bkb3duXG4gICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnLnJpYmJvbl91c2VyLW1lbnVfbmF2JykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fdHJpZ2dlcicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLnJpYmJvbl9kcm9wZG93bl9uYXYnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuc2xpZGVVcCgzMDApO1xuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIFdoZW4gYSB1c2VyIGNsaWNrcyBvbiB0aGUgcmliYm9uIHRyaWdnZXIgZm9yIGF1dGhlbnRpY2F0ZWQgdXNlciBkcm9wZG93blxuICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfdHJpZ2dlci1hdXRoJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgIC8vIFVuZm9jdXMgb24gdGhlIGRyb3Bkb3duXG4gICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnLnJpYmJvbl91c2VyLW1lbnVfbmF2LWNoaWxkJykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fdHJpZ2dlcicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLnJpYmJvbl9kcm9wZG93bl9uYXYnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuc2xpZGVVcCgzMDApO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIFRyaWdlciBvdmVybGF5IHdoZW4gc2VhcmNoIGJveCBpcyB1c2VkLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMuc2VhcmNoTW9kYWwgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnRzIG9uIHNlYXJjaCBidXR0b24gY2xpY2tcbiAgICAgICAgICQoJy5idXR0b24tc2VhcmNoJykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgLy8gUmVtb3ZlIGNsYXNzZXMgZm9yIG5hdiBkcm9wZG93bnNcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X3NlY3Rpb24sIC5uYXYtcHJpbWFyeV9zZWN0aW9uJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlLCBuYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZScpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfc2VjdGlvbl9zdWJuYXYnKS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgICAgICAgIC8vIElmIGlzLW9wZW4gY2xhc3MgZXhpc3RzXG4gICAgICAgICAgIGlmKCAkKCcuc2VhcmNoX21vZGFsJykuaGFzQ2xhc3MoJ2lzLW9wZW4nKSApIHtcbiAgICAgICAgICAgICAkKCcuc2VhcmNoX21vZGFsJykucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUnKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUtb24nKTtcbiAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vIElmIGlzLW9wZW4gY2xhc3MgZG9lc24ndCBleGlzdFxuICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAkKCcuc2VhcmNoX21vZGFsJykuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUnKS5hZGRDbGFzcygnbmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUtb24nKTtcblxuICAgICAgICAgICAgIC8vIEZvY3VzIHNlYXJjaCBpbnB1dFxuICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICQoJy5zZWFyY2hfbW9kYWwgLnNlYXJjaC1maWVsZF9pbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBSZW1vdmUgbmF2IHByaW1hcnkgbGlzdCBvcGVuIGNsYXNzIGFuZCBhZGQgY2xvc2VkIGNsYXNzIG9uIHNlYXJjaCBidXR0b24gY2xpY2tcbiAgICAgICAgICAgaWYgKCAkKHdpbmRvdykud2lkdGgoKSA8IDc0MCApIHtcbiAgICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfbGlzdCcpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1vcGVuJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X2xpc3QtbW9iaWxlLWNsb3NlZCcpO1xuICAgICAgICAgICB9O1xuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzIHdoZW4gY2xpY2tpbmcgY2xvc2VcbiAgICAgICAgICQoJy5zZWFyY2hfbW9kYWxfY2xvc2UnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZScpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZS1vbicpO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEludGVyYWN0aW9ucyBmb3Igc2VhcmNoIGZpZWxkLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMuc2VhcmNoRmllbGQgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vIFNlYXJjaFxuXG4gICAgICAgICAvLyBDaGVjayB3aGVuIGEgdXNlciBpcyB0eXBpbmcgaW4gc2VhcmNoXG4gICAgICAgICAkKCcjc2VhcmNoLWZpZWxkJykua2V5cHJlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgIC8vIGFkZCBhIGNsYXNzIHRvIHRoZSBzaWJsaW5nIHJlc2V0IGJ1dHRvblxuICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnLnNlYXJjaC1maWVsZF9yZXNldCcpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBBZnRlciB0aGUgcmVzZXQgaXMgY2xpY2tlZCwgcmVtb3ZlIHRoZSBjbGFzc2VzXG4gICAgICAgICAkKCcuc2VhcmNoLWZpZWxkX3Jlc2V0JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnI3NlYXJjaC1maWVsZCcpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnI3NlYXJjaC1maWVsZCcpLmZvY3VzKCk7XG4gICAgICAgICB9KTtcblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogQmVoYXZpb3JzIGZvciBtYWluIG1lbnUgZHJvcGRvd25zLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMucHJpbWFyeU5hdiA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgZnVuY3Rpb24gY2xvc2VTZWFyY2goKSB7XG4gICAgICAgICAgIHNlYXJjaCA9ICQoJy5zZWFyY2hfbW9kYWwnKTtcbiAgICAgICAgICAgaWYgKHNlYXJjaC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gc2hvd01lbnUoKSB7XG4gICAgICAgICAgIC8vIGFkZCBhIGJvZHkgY2xhc3Mgc2F5aW5nIHRoYXQgdGhlIG1lbnUgaXMgb3BlblxuICAgICAgICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2JvZHktbmF2LXByaW1hcnktb3BlbicpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfbGlzdCcpLmFkZENsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1vcGVuJyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIHNob3dPdmVybGF5KCkge1xuICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUnKS5hZGRDbGFzcygnbmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUtb24nKTtcbiAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBjbG9zZU1lbnUoKSB7XG4gICAgICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnYm9keS1uYXYtcHJpbWFyeS1vcGVuJyk7XG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9saXN0JykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X2xpc3QtbW9iaWxlLW9wZW4nKS5hZGRDbGFzcygnbmF2LXByaW1hcnlfbGlzdC1tb2JpbGUtY2xvc2VkJyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZUFjdGl2ZSgpIHtcbiAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X3NlY3Rpb24nKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKS5yZW1vdmVDbGFzcygnaXMtaGlkZGVuJyk7XG4gICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIGNsb3NlT3ZlcmxheSgpIHtcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIGNoYW5nZUFjdGl2ZShzZWN0aW9uKSB7XG4gICAgICAgICAgIGlmIChzZWN0aW9uLmhhc0NsYXNzKCduYXYtcHJpbWFyeV9idXR0b24nKSkge1xuICAgICAgICAgICAgIC8vIHRvZ2dsZSBhIGNsaWNrZWQgc3RhdGUgb24gdGhlIHRyaWdnZXJcbiAgICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCduYXYtcHJpbWFyeV9idXR0b24tY2xpY2tlZCcpO1xuICAgICAgICAgICAgIC8vIHNob3cgdGhlIG92ZXJsYXlcbiAgICAgICAgICAgICBzaG93T3ZlcmxheSgpO1xuICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgIHNlY3Rpb24uYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlJyk7XG4gICAgICAgICAgICAgc2VjdGlvbi5zaWJsaW5ncygnLm5hdi1wcmltYXJ5X3NlY3Rpb24nKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKTtcbiAgICAgICAgICAgICBpZiAoICQod2luZG93KS53aWR0aCgpIDwgNzQwICkge1xuICAgICAgICAgICAgICAgc2VjdGlvbi5zaWJsaW5ncygnLm5hdi1wcmltYXJ5X3NlY3Rpb24nKS5hZGRDbGFzcygnaXMtaGlkZGVuJyk7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIC8vIEhhbmRsaW5nIGZvciBjbGljayBldmVudHMuIFdoZW4gc29tZW9uZSBjbGlja3MgdGhlIG5hdiwgdGhlIG1vYmlsZSBuYXYgYnV0dG9uLCBvciBhbnl3aGVyZVxuICAgICAgICAgLy8gb24gdGhlIHBhZ2UgaWYgdGhlIG1lbnUgaXMgYWxyZWFkeSBvcGVuOlxuXG4gICAgICAgICAkKGRvY3VtZW50KS5vbigndG91Y2hzdGFydCBjbGljaycsICcuYm9keS1uYXYtcHJpbWFyeS1vcGVuLCAubmF2LXByaW1hcnlfc2VjdGlvbiwgLm5hdi1wcmltYXJ5X2J1dHRvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgIC8vIGlzIHRoaXMgdGhlIG1vYmlsZSBidXR0b24/XG4gICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCduYXYtcHJpbWFyeV9idXR0b24nKSkge1xuICAgICAgICAgICAgIC8vIGlzIHRoZSBtZW51IGFscmVhZHkgb3Blbj9cbiAgICAgICAgICAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdib2R5LW5hdi1wcmltYXJ5LW9wZW4nKSkge1xuICAgICAgICAgICAgICAgY2xvc2VNZW51KCk7XG4gICAgICAgICAgICAgICBjbG9zZU92ZXJsYXkoKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgc2hvd01lbnUoKTtcbiAgICAgICAgICAgICAgIHNob3dPdmVybGF5KCk7XG4gICAgICAgICAgICAgICBjbG9zZVNlYXJjaCgpO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfVxuICAgICAgICAgICAvLyBpcyB0aGlzIHRoZSBuYXY/XG4gICAgICAgICAgIGVsc2UgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24nKSkge1xuICAgICAgICAgICAgIC8vIGlzIHRoaXMgdGhlIGFjdGl2ZSBpdGVtP1xuICAgICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICBpZiAoICQod2luZG93KS53aWR0aCgpIDwgNzQwICkge1xuICAgICAgICAgICAgICAgICByZW1vdmVBY3RpdmUoKTtcbiAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICAgICAgICAgICBjbG9zZU92ZXJsYXkoKTtcbiAgICAgICAgICAgICAgICAgcmVtb3ZlQWN0aXZlKCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIGlmICghJCgnYm9keScpLmhhc0NsYXNzKCdib2R5LW5hdi1wcmltYXJ5LW9wZW4nKSkge1xuICAgICAgICAgICAgICAgICBzaG93TWVudSgpO1xuICAgICAgICAgICAgICAgICBzaG93T3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICBjbG9zZVNlYXJjaCgpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgY2hhbmdlQWN0aXZlKCQodGhpcykpO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfVxuICAgICAgICAgICAvLyBpcyB0aGlzIHNvbWUgb3RoZXIgcGFydCBvZiB0aGUgZG9jdW1lbnQgKGNsaWNraW5nIG91dHNpZGUgdGhlIG5hdik/XG4gICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICAgICAgIGNsb3NlT3ZlcmxheSgpO1xuICAgICAgICAgICAgIHJlbW92ZUFjdGl2ZSgpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9KTtcblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogSnVtcCBuYXYgYmVoYXZpb3JzIGZvciBhcnRpY2xlIHBhZ2VzLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMuanVtcE5hdiA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgLy9jaGVjayBpZiBhIGp1bXAgbmF2IGV4aXN0cyBhbmQgaXMgdmlzaWJsZSBvbiB0aGUgcGFnZVxuICAgICAgICAgLy9vdGhlcndpc2Ugd2Ugc2hvdWxkbid0IGRvIGFueSBvZiB0aGlzXG4gICAgICAgICBpZiAoJCgnLmp1bXBuYXYtY29udGVudCcpLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICQoJy5hcnRpY2xlLWJvZHknKS5sZW5ndGggPiAwICYmXG4gICAgICAgICAkKCcuanVtcC1uYXZfbGlzdCBsaScpLmNoaWxkcmVuKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICBpbml0aWFsaXplSnVtcE5hdigpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBpbml0aWFsaXplSnVtcE5hdigpe1xuICAgICAgICAgICAvLyBXaGVuIGEgdXNlciBjbGlja3Mgb24gdGhlIHJpYmJvbiB0cmlnZ2VyIChtYWluKVxuICAgICAgICAgICAkKCcuanVtcC1uYXZfdGl0bGUnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAgIC8vIGFkZCBhIGNsYXNzIHRvIHRoZSBwYXJlbnRcbiAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJyNqdW1wLW5hdicpLnRvZ2dsZUNsYXNzKCdpcy1jbG9zZWQnKTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIGEgdGl0bGUgbGluaywgY2xvc2UgZHJvcGRvd25cbiAgICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QtaXRlbSBhJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHBhcmVudFxuICAgICAgICAgICAgICQoJyNqdW1wLW5hdicpLnRvZ2dsZUNsYXNzKCdpcy1jbG9zZWQnKTtcbiAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAvLyBPbiBwYWdlIHNjcm9sbFxuICAgICAgICAgICAkKHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIHZhciBkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgICAgICB2YXIgd2luZG93VG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgIHZhciBkaXZUb3AgPSAkKCcuanVtcG5hdi1hbmNob3InKS5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICAgdmFyIGJvZHkgPSBkb2MuZmluZCgnLmFydGljbGUtYm9keScpO1xuICAgICAgICAgICAgIHZhciBjb250ZW50ID0gZG9jLmZpbmQoJy5qdW1wbmF2LWNvbnRlbnQnKTtcbiAgICAgICAgICAgICB2YXIgc3RpY2t5Qm90dG9tID0gY29udGVudC5vZmZzZXQoKS50b3AgKyBjb250ZW50LmhlaWdodCgpO1xuICAgICAgICAgICAgIHZhciBib2R5Qm90dG9tID0gYm9keS5vZmZzZXQoKS50b3AgKyBib2R5LmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgLy8gVHJpZ2dlciBmaXhlZCBjbGFzc1xuICAgICAgICAgICAgIGlmICh3aW5kb3dUb3AgPiBkaXZUb3ApIHtcbiAgICAgICAgICAgICAgICQoJyNqdW1wLW5hdicpLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAkKCcjanVtcC1uYXYnKS5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAvLyBTaG93IC8gaGlkZSBqdW1wIG5hdlxuICAgICAgICAgICAgIGlmKHN0aWNreUJvdHRvbSA+IGJvZHlCb3R0b20pIHtcbiAgICAgICAgICAgICAgIGNvbnRlbnQuaGlkZSgpO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICBjb250ZW50LmZhZGVJbigyNTApO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAvLyBBbmltYXRlIHNjcm9sbCBvbiBqdW1wIG5hdiBjbGlja1xuICAgICAgICAgICAkKCcuanVtcC1uYXZfbGlzdCBhJykuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgIHZhciBqdW1wb2JqID0gJCh0aGlzKTtcbiAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0ganVtcG9iai5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICAgdmFyIHRoZXNwZWVkID0gNTAwO1xuICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkKHRhcmdldCkub2Zmc2V0KCkudG9wIC0gMTAwO1xuICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgc2Nyb2xsVG9wOiBvZmZzZXRcbiAgICAgICAgICAgICB9LCB0aGVzcGVlZCk7XG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgdmFyIGFDaGlsZHJlbiA9ICQoJy5qdW1wLW5hdl9saXN0IGxpJykuY2hpbGRyZW4oKTsgLy8gZmluZCB0aGUgYSBjaGlsZHJlbiBvZiB0aGUgbGlzdCBpdGVtc1xuICAgICAgICAgICB2YXIgYUFycmF5ID0gW107IC8vIGNyZWF0ZSB0aGUgZW1wdHkgYUFycmF5XG4gICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGFDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgIHZhciBhQ2hpbGQgPSBhQ2hpbGRyZW5baV07XG4gICAgICAgICAgICAgdmFyIGFocmVmID0gJChhQ2hpbGQpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgICBhQXJyYXkucHVzaChhaHJlZik7XG4gICAgICAgICAgIH1cblxuICAgICAgICAgICAvLyBUcmlnZ2VyIGlzLWFjdGl2ZSBjbGFzcyB3aGVuIHVzZXIgc2Nyb2xscyBpbnRvIGVhY2ggc2VjdGlvblxuICAgICAgICAgICAkKHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIHZhciB3aW5kb3dQb3MgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCkgKyAxMDU7IC8vIGdldCB0aGUgb2Zmc2V0IG9mIHRoZSB3aW5kb3cgZnJvbSB0aGUgdG9wIG9mIHBhZ2VcbiAgICAgICAgICAgICB2YXIgd2luZG93SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpOyAvLyBnZXQgdGhlIGhlaWdodCBvZiB0aGUgd2luZG93XG4gICAgICAgICAgICAgdmFyIGRvY0hlaWdodCA9ICQoZG9jdW1lbnQpLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgYUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICB2YXIgdGhlSUQgPSBhQXJyYXlbaV07XG4gICAgICAgICAgICAgICB2YXIgZGl2UG9zID0gJCh0aGVJRCkub2Zmc2V0KCkudG9wOyAvLyBnZXQgdGhlIG9mZnNldCBvZiB0aGUgZGl2IGZyb20gdGhlIHRvcCBvZiBwYWdlXG4gICAgICAgICAgICAgICB2YXIgZGl2SGVpZ2h0ID0gJCh0aGVJRCkuaGVpZ2h0KCk7IC8vIGdldCB0aGUgaGVpZ2h0IG9mIHRoZSBkaXYgaW4gcXVlc3Rpb25cbiAgICAgICAgICAgICAgIGlmICh3aW5kb3dQb3MgPj0gZGl2UG9zICYmIHdpbmRvd1BvcyA8IChkaXZQb3MgKyBkaXZIZWlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICQoJ2FbaHJlZj1cIicgKyB0aGVJRCArICdcIl0nKS5wYXJlbnQoXCJsaVwiKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAkKCdhW2hyZWY9XCInICsgdGhlSUQgKyAnXCJdJykucGFyZW50KFwibGlcIikucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgIGlmKHdpbmRvd1BvcyArIHdpbmRvd0hlaWdodCA9PSBkb2NIZWlnaHQpIHtcbiAgICAgICAgICAgICAgIGlmICghJCgnLmp1bXAtbmF2X2xpc3QgbGk6bGFzdC1jaGlsZCcpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgICB2YXIgbmF2QWN0aXZlQ3VycmVudCA9ICQoJy5pcy1hY3RpdmUnKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICAgICAgICQoJ2FbaHJlZj1cIicgKyBuYXZBY3RpdmVDdXJyZW50ICsgJ1wiXScpLnBhcmVudChcImxpXCIpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QgbGk6bGFzdC1jaGlsZCcpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH0pO1xuICAgICAgICAgfVxuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBCZWhhdmlvciBmb3IgdGFicyBvbiBob21lcGFnZSBhdWRpZW5jZSBzZWxlY3Rvci5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnRhYnNBdWRpZW5jZVNlbGVjdG9yID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICB2YXIgYnBfbWVkID0gOTAwOyAvLyA5MDBweCA9ICRicC1tZWQgY3NzIHZhcmlhYmxlXG5cbiAgICAgICAgIC8vIGNoZWNrV2lkdGggZnVuY3Rpb25cbiAgICAgICAgIGZ1bmN0aW9uIGNoZWNrV2lkdGgoKSB7XG4gICAgICAgICAgIGlmICgoJCh3aW5kb3cpLndpZHRoKCkgPj0gYnBfbWVkKSkge1xuICAgICAgICAgICAgIC8vIFNob3cgYWxsIGxpIHNlbGVjdG9yc1xuICAgICAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3QgPiBsaScpLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAvLyBEaXNwbGF5IGxpc3QtaXRlbSBmb3IgYWxsIGxpIHNlbGVjdG9yc1xuICAgICAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3QgPiBsaScpLmNzcygnZGlzcGxheScsICdsaXN0LWl0ZW0nKTtcbiAgICAgICAgICAgICAvLyBIaWRlIGFsbCBsaSBzZWxlY3RvcnMgZXhwZWN0IGZpcnN0IG9uZVxuICAgICAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3QgPiBsaTpndCgwKScpLmhpZGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBSdW4gY2hlY2tXaWR0aFxuICAgICAgICAgY2hlY2tXaWR0aCgpO1xuICAgICAgICAgLy8gUmUtcnVuIGNoZWNrV2lkdGggb24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShjaGVja1dpZHRoKTtcblxuICAgICAgICAgLy8gTW9iaWxlIEF1ZGllbmNlIFNlbGVjdG9yIHRhYnNcbiAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3QnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgIC8vIElmIHZpZXdwb3J0IGlzIHNtYWxsZXIgdGhhbiA5MDBweFxuICAgICAgICAgICBpZiAoKCQod2luZG93KS53aWR0aCgpIDwgYnBfbWVkKSkge1xuICAgICAgICAgICAgIC8vIEFkZCB0aGUgYWN0aXZlIGNsYXNzIHRvIHRoZSBsaXN0IHdoZW4gaXQgaXMgY2xpY2tlZFxuICAgICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgICAgICAvLyBUb2dnbGUgaGlkZGVuIGl0ZW1zIG9uIGNsaWNrXG4gICAgICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignbGk6Z3QoMCknKS5zbGlkZVRvZ2dsZSgpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9KTtcblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogTWFrZSBhY2NvcmRpb25zIGFjY29yZGlvbi15LlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMuYWNjb3JkaW9uID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBTZWFyY2hcblxuICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciAobWFpbilcbiAgICAgICAgICQoJy5hY2NvcmRpb24tdHJpZ2dlcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSB0cmlnZ2VyXG4gICAgICAgICAgICQodGhpcykuYmx1cigpO1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyBhY2NvcmRpb24gY29udGVudFxuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnLmFjY29yZGlvbi1jb250ZW50JykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgICAgICB9KTtcblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogQmVoYXZpb3JzIGZvciB0aGUgaG9tZXBhZ2UgZmVhdHVyZWQgY29udGVudCBibG9jay5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmZlYXR1cmVkQ29udGVudCA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgLy8gSGlkZSBpdGVtcyBleGNlcHQgZmlyc3QgM1xuICAgICAgICAgJCgnLmF1ZGllbmNlX2ZlYXR1cmVkLWhlcm9faXRlbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICQodGhpcykuZmluZCgnLmxpc3RfZmVhdHVyZWRfY29udGVudC1pdGVtOmd0KDIpJykuYWRkQ2xhc3MoJ2hpZGRlbicpLmhpZGUoKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBDcmVhdGUgYSB0b2dnbGUgYmV0d2VlbiBMb2FkIG1vcmUgYW5kIGxlc3NcbiAgICAgICAgICQoJy5saW5rX2xvYWRfbW9yZV9sZXNzIGEnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAvLyBGZWF0dXJlZCBjb250ZW50IHBhdGggdmFyaWFibGVcbiAgICAgICAgICAgdmFyIGZlYXR1cmVkQ29udGVudCA9ICcuYXVkaWVuY2VfZmVhdHVyZWQtaGVyb19pdGVtLmFjdGl2ZSAubGlzdF9mZWF0dXJlZF9jb250ZW50LWl0ZW0nO1xuICAgICAgICAgICB2YXIgZmVhdHVyZWRDb250ZW50U2hvd24gPSAkKGZlYXR1cmVkQ29udGVudCsnLnNob3duJyk7XG4gICAgICAgICAgIHZhciBmZWF0dXJlZENvbnRlbnRIaWRkZW4gPSAkKGZlYXR1cmVkQ29udGVudCsnLmhpZGRlbicpO1xuXG4gICAgICAgICAgIC8vIElmIGZlYXR1cmVkIGNvbnRlbnQgaGFzIHNob3cgY2xhc3MgZG8gdGhpc1xuICAgICAgICAgICBpZigkKGZlYXR1cmVkQ29udGVudCkuaGFzQ2xhc3MoJ2hpZGRlbicpKSB7XG5cbiAgICAgICAgICAgICAvLyBVcGRhdGVkIGxpbmsgdGV4dCBhbmQgaWNvblxuICAgICAgICAgICAgICQodGhpcykuY29udGVudHMoKS5maXJzdCgpWzBdLnRleHRDb250ZW50PSdMb2FkIGxlc3MgJztcbiAgICAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCcuaWNvbicpLnJlbW92ZUNsYXNzKCdpY29uLXZpZXdtb3JlJykuYWRkQ2xhc3MoJ2ljb24tdmlld2xlc3MnKTtcblxuICAgICAgICAgICAgIC8vIFNsaWRlIG9wZW4gaGlkZGVuIGNvbnRlbnQgb24gY2xpY2tcbiAgICAgICAgICAgICBmZWF0dXJlZENvbnRlbnRIaWRkZW4uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpLmFkZENsYXNzKCdzaG93bicpO1xuICAgICAgICAgICAgICAgJCh0aGlzKS5zbGlkZURvd24oMzAwKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vIElmIGZlYXR1cmVkIGNvbnRlbnQgaGFzIGhpZGUgY2xhc3MgZG8gdGhpc1xuICAgICAgICAgICBlbHNlIGlmKCQoZmVhdHVyZWRDb250ZW50KS5oYXNDbGFzcygnc2hvd24nKSkge1xuXG4gICAgICAgICAgICAgLy8gVXBkYXRlZCBsaW5rIHRleHQgYW5kIGljb25cbiAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuZmlyc3QoKVswXS50ZXh0Q29udGVudD0nTG9hZCBtb3JlICc7XG4gICAgICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignLmljb24nKS5yZW1vdmVDbGFzcygnaWNvbi12aWV3bGVzcycpLmFkZENsYXNzKCdpY29uLXZpZXdtb3JlJyk7XG5cbiAgICAgICAgICAgICAvLyBTbGlkZSBjbG9zZSBoaWRkZW4gY29udGVudCBvbiBjbGlja1xuICAgICAgICAgICAgIGZlYXR1cmVkQ29udGVudFNob3duLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaG93bicpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICQodGhpcykuc2xpZGVVcCgzMDApO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9O1xuXG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gQXVkaWVuY2UgdGFiIGludGVyYWN0aW9uXG4gICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0X2l0ZW0gYScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgIC8vIFRhYiBkYXRhIHZhcmlhYmxlXG4gICAgICAgICAgIHZhciB0YWJfaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtdGFiJyk7XG5cbiAgICAgICAgICAgLy8gUmVtb3ZlIGNsYXNzZXNcbiAgICAgICAgICAgJCgnLnRhYnMtYXVkaWVuY2Vfc2VsZWN0b3JfbGlzdF9pdGVtIGEnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5hdWRpZW5jZV9mZWF0dXJlZC1oZXJvX2l0ZW0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cbiAgICAgICAgICAgLy8gQWRkIGNsYXNzZXNcbiAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICQoJyMnK3RhYl9pZCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIFRvZ2dsZSBzZWxlY3QgYmxvY2sgbWVzc2FnZS5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmJsb2NrU2VsZWN0ID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAkKCcuYmxvY2stc2VsZWN0JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2Jsb2NrLXNlbGVjdC1zZWxlY3RlZCcpO1xuICAgICAgICAgICAkKCcuYmxvY2stc2VsZWN0X21lc3NhZ2UnKS50b2dnbGVDbGFzcygnYmxvY2stc2VsZWN0X21lc3NhZ2UtaGlkZGVuJyk7ICB9KTtcblxuICAgICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgICB9XG4gICAgIH07XG4gICB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBNYWtlIHByaW1hcnkgaGVhZGVyIHN0aWNreS5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmhlYWRlclByaW1hcnkgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vY2hlY2sgaWYgYSBwcmltYXJ5IG5hdiBleGlzdHMgYW5kIGlzIHZpc2libGUgb24gdGhlIHBhZ2VcbiAgICAgICAgIC8vb3RoZXJ3aXNlIHdlIHNob3VsZG4ndCBkbyBhbnkgb2YgdGhpc1xuICAgICAgICAgaWYgKCQoJy5oZWFkZXItcHJpbWFyeS1zcGFuJykubGVuZ3RoID4gMCl7XG4gICAgICAgICAgIGluaXRpYWxpemVQcmltYXJ5SGVhZGVyKCk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIC8vIEZpbmQgaGVpZ2h0IG9mIHJpYmJvbiBhbmQgaGVhZGVyLXByaW1hcnkgdG8gY3JlYXRlIHByb3BlciBzcGFjaW5nXG4gICAgICAgICBmdW5jdGlvbiBjaGVja0hlaWdodCgpIHtcbiAgICAgICAgICAgdmFyIGhlYWRlckhlaWdodCA9ICQoJy5oZWFkZXItcHJpbWFyeScpLmhlaWdodCgpO1xuICAgICAgICAgICB2YXIgcmliYm9uSGVpZ2h0ID0gJCgnLnJpYmJvbicpLmhlaWdodCgpO1xuXG4gICAgICAgICAgICQoJy5oZWFkZXItcHJpbWFyeS1zcGFuJykuY3NzKHsnaGVpZ2h0JzooaGVhZGVySGVpZ2h0KSsncHgnfSk7XG4gICAgICAgICAgICQoJy5oZWFkZXItcHJpbWFyeScpLmNzcyh7J3RvcCc6KHJpYmJvbkhlaWdodCkrJ3B4J30pO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBpbml0aWFsaXplUHJpbWFyeUhlYWRlcigpe1xuICAgICAgICAgICAvLyBTZXQgaGVpZ2h0IG9uIHBhZ2UgbG9hZFxuICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IGNoZWNrSGVpZ2h0KCk7IH0sIDEwMCk7XG4gICAgICAgICAgIC8vIENoZWNrIGhlaWdodCBvbiB3aW5kb3cgcmVzaXplXG4gICAgICAgICAgICQod2luZG93KS5yZXNpemUoY2hlY2tIZWlnaHQpO1xuXG4gICAgICAgICAgIC8vIEFkZCBjbGFzcyB0byBoZWFkZXItcHJpbWFyeSBvbiBzY3JvbGxcbiAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICB2YXIgc2Nyb2xsID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgIHZhciBvcyA9ICQoJy5oZWFkZXItcHJpbWFyeS1zcGFuJykub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgIHZhciBodCA9ICQoJy5oZWFkZXItcHJpbWFyeS1zcGFuJykuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICBpZihzY3JvbGwgPiBvcyArIGh0KXtcbiAgICAgICAgICAgICAgICQoXCIuaGVhZGVyLXByaW1hcnlcIikuYWRkQ2xhc3MoXCJoZWFkZXItcHJpbWFyeS0tc3RpY2t5XCIpO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAkKFwiLmhlYWRlci1wcmltYXJ5XCIpLnJlbW92ZUNsYXNzKFwiaGVhZGVyLXByaW1hcnktLXN0aWNreVwiKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH0pO1xuICAgICAgICAgfVxuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBJbnRlcmFjdGlvbnMgZm9yIHdheWZpbmRlci5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgRHJ1cGFsLmJlaGF2aW9ycy53YXlmaW5kZXIgPSB7XG4gICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgIC8vIFJlYWQgd2F5ZmluZGVyIGNvb2tpZXMgc2V0IGZyb20gYW1hLWFzc24gZG9tYWluc1xuICAgICAgICAkLmNvb2tpZS5qc29uID0gdHJ1ZTtcbiAgICAgICAgdmFyIGFtYV93YXlmaW5kZXJfY29va2llID0gJC5jb29raWUoJ2FtYV93YXlmaW5kZXJfY29va2llJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGFtYV93YXlmaW5kZXJfY29va2llICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICQoJy53YXlmaW5kZXJfcmVmZXJyZXIgLmxpbmstYmFjaycpLnNob3coKS5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpO1xuICAgICAgICAgICQoJy5saW5rLWJhY2snKS5hdHRyKFwiaHJlZlwiLCBhbWFfd2F5ZmluZGVyX2Nvb2tpZVsxXSk7XG4gICAgICAgICAgJCgnLmxpbmstYmFjayAubGluay1iYWNrX3RleHQnKS50ZXh0KGFtYV93YXlmaW5kZXJfY29va2llWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKCcud2F5ZmluZGVyX3JlZmVycmVyIC5saW5rLWJhY2snKS5oaWRlKClcbiAgICAgICAgfVxuICAgICAgfSkoalF1ZXJ5KTtcbiAgICB9XG4gIH07XG59KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBSZXNwb25zaXZlIGJlaGF2aW9ycyBmb3IgRUMgVGFicyBDb3Vyc2UgQnJvd3Nlci5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmVjVGFic0NvdXJzZUJyb3dzZXIgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIHZhciBicF9tZWQgPSA5MDA7IC8vIDkwMHB4ID0gJGJwLW1lZCBjc3MgdmFyaWFibGVcblxuICAgICAgICAgLy8gY2hlY2tXaWR0aCBmdW5jdGlvblxuICAgICAgICAgZnVuY3Rpb24gY2hlY2tXaWR0aCgpIHtcbiAgICAgICAgICAgaWYgKCgkKHdpbmRvdykud2lkdGgoKSA+PSBicF9tZWQpKSB7XG4gICAgICAgICAgICAgLy8gU2hvdyBhbGwgbGkgc2VsZWN0b3JzXG4gICAgICAgICAgICAgJCgnLnRhYnMtY291cnNlX2Jyb3dzZXJfbGlzdC10YWJzID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgLy8gRGlzcGxheSBsaXN0LWl0ZW0gZm9yIGFsbCBsaSBzZWxlY3RvcnNcbiAgICAgICAgICAgICAkKCcudGFicy1jb3Vyc2VfYnJvd3Nlcl9saXN0LXRhYnMgPiBsaScpLmNzcygnZGlzcGxheScsICdsaXN0LWl0ZW0nKTtcbiAgICAgICAgICAgICAvLyBIaWRlIGFsbCBsaSBzZWxlY3RvcnMgZXhwZWN0IGZpcnN0IG9uZVxuICAgICAgICAgICAgICQoJy50YWJzLWNvdXJzZV9icm93c2VyX2xpc3QtdGFicyA+IGxpOmd0KDApJykuaGlkZSgpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIC8vIFJ1biBjaGVja1dpZHRoXG4gICAgICAgICBjaGVja1dpZHRoKCk7XG4gICAgICAgICAvLyBSZS1ydW4gY2hlY2tXaWR0aCBvbiB3aW5kb3cgcmVzaXplXG4gICAgICAgICAkKHdpbmRvdykucmVzaXplKGNoZWNrV2lkdGgpO1xuXG4gICAgICAgICAvLyBNb2JpbGUgQ291cnNlIEJyb3dzZXIgdGFic1xuICAgICAgICAgJCgnLnRhYnMtY291cnNlX2Jyb3dzZXJfbGlzdC10YWJzJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAvLyBJZiB2aWV3cG9ydCBpcyBzbWFsbGVyIHRoYW4gOTAwcHhcbiAgICAgICAgICAgaWYgKCgkKHdpbmRvdykud2lkdGgoKSA8IGJwX21lZCkpIHtcbiAgICAgICAgICAgICAvLyBBZGQgdGhlIGFjdGl2ZSBjbGFzcyB0byB0aGUgbGlzdCB3aGVuIGl0IGlzIGNsaWNrZWRcbiAgICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgICAgLy8gVG9nZ2xlIGhpZGRlbiBpdGVtcyBvbiBjbGlja1xuICAgICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2xpOmd0KDApJykuc2xpZGVUb2dnbGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiJdfQ==
