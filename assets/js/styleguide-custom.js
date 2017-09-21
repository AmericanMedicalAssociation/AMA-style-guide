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

        $('select')
        .on('change', function()
        {
          var $this = $(this);

          if ($this.val() == '')
          $this.addClass('watermark');

          else
          $this.removeClass('watermark');

          $this.trigger('checkval');
        })
        .change();


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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS52YWxpZGF0ZS5qcyIsImZpdHZpZHMuanMiLCJpbml0LmpzIiwiZm9ybS1pdGVtcy5qcyIsIm5hdi5qcyIsIjAwLWF0b21zLzA2LWJ1dHRvbnMvMDEtYnV0dG9uLXNlYXJjaC9zZWFyY2gtbW9kYWwuanMiLCIwMS1tb2xlY3VsZXMvMDQtZm9ybXMvMDAtc2VhcmNoLWZpZWxkL3NlYXJjaC5qcyIsIjAxLW1vbGVjdWxlcy8wNS1uYXZpZ2F0aW9uLzAwLXByaW1hcnktbmF2L3ByaW1hcnktbmF2LmpzIiwiMDEtbW9sZWN1bGVzLzA1LW5hdmlnYXRpb24vMDEtanVtcC1uYXYvanVtcC1uYXYuanMiLCIwMS1tb2xlY3VsZXMvMDUtbmF2aWdhdGlvbi8wNi10YWJzLWF1ZGllbmNlLXNlbGVjdG9yL3RhYnMtYXVkaWVuY2Utc2VsZWN0b3IuanMiLCIwMS1tb2xlY3VsZXMvMDYtY29tcG9uZW50cy8xMy1hY2NvcmRpb24vYWNjb3JkaW9uLmpzIiwiMDEtbW9sZWN1bGVzLzA4LWxpc3RzLzA2LWxpc3QtZmVhdHVyZWQtY29udGVudC1oZXJvL2ZlYXR1cmVkLWNvbnRlbnQuanMiLCIwMS1tb2xlY3VsZXMvMTEtYWNjb3VudC1tZ210LWNlbnRlci8wMS1ibG9jay1zZWxlY3QvYmxvY2stc2VsZWN0LmpzIiwiMDItb3JnYW5pc21zLzAwLWdsb2JhbC8wMC1oZWFkZXItcHJpbWFyeS9oZWFkZXItcHJpbWFyeS5qcyIsIjAyLW9yZ2FuaXNtcy8wNS1lYy8wMy1lYy10YWJzLWNvdXJzZS1icm93c2VyL2VjLXRhYnMtY291cnNlLWJyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNS9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic3R5bGVndWlkZS1jdXN0b20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcclxuICogalF1ZXJ5IFZhbGlkYXRpb24gUGx1Z2luIHYxLjE1LjBcclxuICpcclxuICogaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTYgSsO2cm4gWmFlZmZlcmVyXHJcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxyXG4gKi9cclxuKGZ1bmN0aW9uKCBmYWN0b3J5ICkge1xyXG5cdGlmICggdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgKSB7XHJcblx0XHRkZWZpbmUoIFtcImpxdWVyeVwiXSwgZmFjdG9yeSApO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCByZXF1aXJlKCBcImpxdWVyeVwiICkgKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZmFjdG9yeSggalF1ZXJ5ICk7XHJcblx0fVxyXG59KGZ1bmN0aW9uKCAkICkge1xyXG5cclxuJC5leHRlbmQoICQuZm4sIHtcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvdmFsaWRhdGUvXG5cdHZhbGlkYXRlOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblxuXHRcdC8vIElmIG5vdGhpbmcgaXMgc2VsZWN0ZWQsIHJldHVybiBub3RoaW5nOyBjYW4ndCBjaGFpbiBhbnl3YXlcblx0XHRpZiAoICF0aGlzLmxlbmd0aCApIHtcblx0XHRcdGlmICggb3B0aW9ucyAmJiBvcHRpb25zLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oIFwiTm90aGluZyBzZWxlY3RlZCwgY2FuJ3QgdmFsaWRhdGUsIHJldHVybmluZyBub3RoaW5nLlwiICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQ2hlY2sgaWYgYSB2YWxpZGF0b3IgZm9yIHRoaXMgZm9ybSB3YXMgYWxyZWFkeSBjcmVhdGVkXG5cdFx0dmFyIHZhbGlkYXRvciA9ICQuZGF0YSggdGhpc1sgMCBdLCBcInZhbGlkYXRvclwiICk7XG5cdFx0aWYgKCB2YWxpZGF0b3IgKSB7XG5cdFx0XHRyZXR1cm4gdmFsaWRhdG9yO1xuXHRcdH1cblxuXHRcdC8vIEFkZCBub3ZhbGlkYXRlIHRhZyBpZiBIVE1MNS5cblx0XHR0aGlzLmF0dHIoIFwibm92YWxpZGF0ZVwiLCBcIm5vdmFsaWRhdGVcIiApO1xuXG5cdFx0dmFsaWRhdG9yID0gbmV3ICQudmFsaWRhdG9yKCBvcHRpb25zLCB0aGlzWyAwIF0gKTtcblx0XHQkLmRhdGEoIHRoaXNbIDAgXSwgXCJ2YWxpZGF0b3JcIiwgdmFsaWRhdG9yICk7XG5cblx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5vbnN1Ym1pdCApIHtcblxuXHRcdFx0dGhpcy5vbiggXCJjbGljay52YWxpZGF0ZVwiLCBcIjpzdWJtaXRcIiwgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5zdWJtaXRCdXR0b24gPSBldmVudC50YXJnZXQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBBbGxvdyBzdXBwcmVzc2luZyB2YWxpZGF0aW9uIGJ5IGFkZGluZyBhIGNhbmNlbCBjbGFzcyB0byB0aGUgc3VibWl0IGJ1dHRvblxuXHRcdFx0XHRpZiAoICQoIHRoaXMgKS5oYXNDbGFzcyggXCJjYW5jZWxcIiApICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQWxsb3cgc3VwcHJlc3NpbmcgdmFsaWRhdGlvbiBieSBhZGRpbmcgdGhlIGh0bWw1IGZvcm1ub3ZhbGlkYXRlIGF0dHJpYnV0ZSB0byB0aGUgc3VibWl0IGJ1dHRvblxuXHRcdFx0XHRpZiAoICQoIHRoaXMgKS5hdHRyKCBcImZvcm1ub3ZhbGlkYXRlXCIgKSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIFZhbGlkYXRlIHRoZSBmb3JtIG9uIHN1Ym1pdFxuXHRcdFx0dGhpcy5vbiggXCJzdWJtaXQudmFsaWRhdGVcIiwgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5kZWJ1ZyApIHtcblxuXHRcdFx0XHRcdC8vIFByZXZlbnQgZm9ybSBzdWJtaXQgdG8gYmUgYWJsZSB0byBzZWUgY29uc29sZSBvdXRwdXRcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZ1bmN0aW9uIGhhbmRsZSgpIHtcblx0XHRcdFx0XHR2YXIgaGlkZGVuLCByZXN1bHQ7XG5cdFx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3Muc3VibWl0SGFuZGxlciApIHtcblx0XHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnN1Ym1pdEJ1dHRvbiApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBJbnNlcnQgYSBoaWRkZW4gaW5wdXQgYXMgYSByZXBsYWNlbWVudCBmb3IgdGhlIG1pc3Npbmcgc3VibWl0IGJ1dHRvblxuXHRcdFx0XHRcdFx0XHRoaWRkZW4gPSAkKCBcIjxpbnB1dCB0eXBlPSdoaWRkZW4nLz5cIiApXG5cdFx0XHRcdFx0XHRcdFx0LmF0dHIoIFwibmFtZVwiLCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uLm5hbWUgKVxuXHRcdFx0XHRcdFx0XHRcdC52YWwoICQoIHZhbGlkYXRvci5zdWJtaXRCdXR0b24gKS52YWwoKSApXG5cdFx0XHRcdFx0XHRcdFx0LmFwcGVuZFRvKCB2YWxpZGF0b3IuY3VycmVudEZvcm0gKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJlc3VsdCA9IHZhbGlkYXRvci5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyLmNhbGwoIHZhbGlkYXRvciwgdmFsaWRhdG9yLmN1cnJlbnRGb3JtLCBldmVudCApO1xuXHRcdFx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIEFuZCBjbGVhbiB1cCBhZnRlcndhcmRzOyB0aGFua3MgdG8gbm8tYmxvY2stc2NvcGUsIGhpZGRlbiBjYW4gYmUgcmVmZXJlbmNlZFxuXHRcdFx0XHRcdFx0XHRoaWRkZW4ucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoIHJlc3VsdCAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFByZXZlbnQgc3VibWl0IGZvciBpbnZhbGlkIGZvcm1zIG9yIGN1c3RvbSBzdWJtaXQgaGFuZGxlcnNcblx0XHRcdFx0aWYgKCB2YWxpZGF0b3IuY2FuY2VsU3VibWl0ICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm4gaGFuZGxlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB2YWxpZGF0b3IuZm9ybSgpICkge1xuXHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnBlbmRpbmdSZXF1ZXN0ICkge1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmZvcm1TdWJtaXR0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gaGFuZGxlKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFsaWRhdG9yLmZvY3VzSW52YWxpZCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB2YWxpZGF0b3I7XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3ZhbGlkL1xuXHR2YWxpZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZhbGlkLCB2YWxpZGF0b3IsIGVycm9yTGlzdDtcblxuXHRcdGlmICggJCggdGhpc1sgMCBdICkuaXMoIFwiZm9ybVwiICkgKSB7XG5cdFx0XHR2YWxpZCA9IHRoaXMudmFsaWRhdGUoKS5mb3JtKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGVycm9yTGlzdCA9IFtdO1xuXHRcdFx0dmFsaWQgPSB0cnVlO1xuXHRcdFx0dmFsaWRhdG9yID0gJCggdGhpc1sgMCBdLmZvcm0gKS52YWxpZGF0ZSgpO1xuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFsaWQgPSB2YWxpZGF0b3IuZWxlbWVudCggdGhpcyApICYmIHZhbGlkO1xuXHRcdFx0XHRpZiAoICF2YWxpZCApIHtcblx0XHRcdFx0XHRlcnJvckxpc3QgPSBlcnJvckxpc3QuY29uY2F0KCB2YWxpZGF0b3IuZXJyb3JMaXN0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHRcdHZhbGlkYXRvci5lcnJvckxpc3QgPSBlcnJvckxpc3Q7XG5cdFx0fVxuXHRcdHJldHVybiB2YWxpZDtcblx0fSxcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcnVsZXMvXG5cdHJ1bGVzOiBmdW5jdGlvbiggY29tbWFuZCwgYXJndW1lbnQgKSB7XG5cblx0XHQvLyBJZiBub3RoaW5nIGlzIHNlbGVjdGVkLCByZXR1cm4gbm90aGluZzsgY2FuJ3QgY2hhaW4gYW55d2F5XG5cdFx0aWYgKCAhdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGVsZW1lbnQgPSB0aGlzWyAwIF0sXG5cdFx0XHRzZXR0aW5ncywgc3RhdGljUnVsZXMsIGV4aXN0aW5nUnVsZXMsIGRhdGEsIHBhcmFtLCBmaWx0ZXJlZDtcblxuXHRcdGlmICggY29tbWFuZCApIHtcblx0XHRcdHNldHRpbmdzID0gJC5kYXRhKCBlbGVtZW50LmZvcm0sIFwidmFsaWRhdG9yXCIgKS5zZXR0aW5ncztcblx0XHRcdHN0YXRpY1J1bGVzID0gc2V0dGluZ3MucnVsZXM7XG5cdFx0XHRleGlzdGluZ1J1bGVzID0gJC52YWxpZGF0b3Iuc3RhdGljUnVsZXMoIGVsZW1lbnQgKTtcblx0XHRcdHN3aXRjaCAoIGNvbW1hbmQgKSB7XG5cdFx0XHRjYXNlIFwiYWRkXCI6XG5cdFx0XHRcdCQuZXh0ZW5kKCBleGlzdGluZ1J1bGVzLCAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCBhcmd1bWVudCApICk7XG5cblx0XHRcdFx0Ly8gUmVtb3ZlIG1lc3NhZ2VzIGZyb20gcnVsZXMsIGJ1dCBhbGxvdyB0aGVtIHRvIGJlIHNldCBzZXBhcmF0ZWx5XG5cdFx0XHRcdGRlbGV0ZSBleGlzdGluZ1J1bGVzLm1lc3NhZ2VzO1xuXHRcdFx0XHRzdGF0aWNSdWxlc1sgZWxlbWVudC5uYW1lIF0gPSBleGlzdGluZ1J1bGVzO1xuXHRcdFx0XHRpZiAoIGFyZ3VtZW50Lm1lc3NhZ2VzICkge1xuXHRcdFx0XHRcdHNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSA9ICQuZXh0ZW5kKCBzZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0sIGFyZ3VtZW50Lm1lc3NhZ2VzICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwicmVtb3ZlXCI6XG5cdFx0XHRcdGlmICggIWFyZ3VtZW50ICkge1xuXHRcdFx0XHRcdGRlbGV0ZSBzdGF0aWNSdWxlc1sgZWxlbWVudC5uYW1lIF07XG5cdFx0XHRcdFx0cmV0dXJuIGV4aXN0aW5nUnVsZXM7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZmlsdGVyZWQgPSB7fTtcblx0XHRcdFx0JC5lYWNoKCBhcmd1bWVudC5zcGxpdCggL1xccy8gKSwgZnVuY3Rpb24oIGluZGV4LCBtZXRob2QgKSB7XG5cdFx0XHRcdFx0ZmlsdGVyZWRbIG1ldGhvZCBdID0gZXhpc3RpbmdSdWxlc1sgbWV0aG9kIF07XG5cdFx0XHRcdFx0ZGVsZXRlIGV4aXN0aW5nUnVsZXNbIG1ldGhvZCBdO1xuXHRcdFx0XHRcdGlmICggbWV0aG9kID09PSBcInJlcXVpcmVkXCIgKSB7XG5cdFx0XHRcdFx0XHQkKCBlbGVtZW50ICkucmVtb3ZlQXR0ciggXCJhcmlhLXJlcXVpcmVkXCIgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdFx0cmV0dXJuIGZpbHRlcmVkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGRhdGEgPSAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlcyhcblx0XHQkLmV4dGVuZChcblx0XHRcdHt9LFxuXHRcdFx0JC52YWxpZGF0b3IuY2xhc3NSdWxlcyggZWxlbWVudCApLFxuXHRcdFx0JC52YWxpZGF0b3IuYXR0cmlidXRlUnVsZXMoIGVsZW1lbnQgKSxcblx0XHRcdCQudmFsaWRhdG9yLmRhdGFSdWxlcyggZWxlbWVudCApLFxuXHRcdFx0JC52YWxpZGF0b3Iuc3RhdGljUnVsZXMoIGVsZW1lbnQgKVxuXHRcdCksIGVsZW1lbnQgKTtcblxuXHRcdC8vIE1ha2Ugc3VyZSByZXF1aXJlZCBpcyBhdCBmcm9udFxuXHRcdGlmICggZGF0YS5yZXF1aXJlZCApIHtcblx0XHRcdHBhcmFtID0gZGF0YS5yZXF1aXJlZDtcblx0XHRcdGRlbGV0ZSBkYXRhLnJlcXVpcmVkO1xuXHRcdFx0ZGF0YSA9ICQuZXh0ZW5kKCB7IHJlcXVpcmVkOiBwYXJhbSB9LCBkYXRhICk7XG5cdFx0XHQkKCBlbGVtZW50ICkuYXR0ciggXCJhcmlhLXJlcXVpcmVkXCIsIFwidHJ1ZVwiICk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFrZSBzdXJlIHJlbW90ZSBpcyBhdCBiYWNrXG5cdFx0aWYgKCBkYXRhLnJlbW90ZSApIHtcblx0XHRcdHBhcmFtID0gZGF0YS5yZW1vdGU7XG5cdFx0XHRkZWxldGUgZGF0YS5yZW1vdGU7XG5cdFx0XHRkYXRhID0gJC5leHRlbmQoIGRhdGEsIHsgcmVtb3RlOiBwYXJhbSB9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cbn0gKTtcblxuLy8gQ3VzdG9tIHNlbGVjdG9yc1xuJC5leHRlbmQoICQuZXhwclsgXCI6XCIgXSwge1xuXG5cdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9ibGFuay1zZWxlY3Rvci9cblx0Ymxhbms6IGZ1bmN0aW9uKCBhICkge1xuXHRcdHJldHVybiAhJC50cmltKCBcIlwiICsgJCggYSApLnZhbCgpICk7XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2ZpbGxlZC1zZWxlY3Rvci9cblx0ZmlsbGVkOiBmdW5jdGlvbiggYSApIHtcblx0XHR2YXIgdmFsID0gJCggYSApLnZhbCgpO1xuXHRcdHJldHVybiB2YWwgIT09IG51bGwgJiYgISEkLnRyaW0oIFwiXCIgKyB2YWwgKTtcblx0fSxcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvdW5jaGVja2VkLXNlbGVjdG9yL1xuXHR1bmNoZWNrZWQ6IGZ1bmN0aW9uKCBhICkge1xuXHRcdHJldHVybiAhJCggYSApLnByb3AoIFwiY2hlY2tlZFwiICk7XG5cdH1cbn0gKTtcblxuLy8gQ29uc3RydWN0b3IgZm9yIHZhbGlkYXRvclxuJC52YWxpZGF0b3IgPSBmdW5jdGlvbiggb3B0aW9ucywgZm9ybSApIHtcblx0dGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKCB0cnVlLCB7fSwgJC52YWxpZGF0b3IuZGVmYXVsdHMsIG9wdGlvbnMgKTtcblx0dGhpcy5jdXJyZW50Rm9ybSA9IGZvcm07XG5cdHRoaXMuaW5pdCgpO1xufTtcblxuLy8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2pRdWVyeS52YWxpZGF0b3IuZm9ybWF0L1xuJC52YWxpZGF0b3IuZm9ybWF0ID0gZnVuY3Rpb24oIHNvdXJjZSwgcGFyYW1zICkge1xuXHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFyZ3MgPSAkLm1ha2VBcnJheSggYXJndW1lbnRzICk7XG5cdFx0XHRhcmdzLnVuc2hpZnQoIHNvdXJjZSApO1xuXHRcdFx0cmV0dXJuICQudmFsaWRhdG9yLmZvcm1hdC5hcHBseSggdGhpcywgYXJncyApO1xuXHRcdH07XG5cdH1cblx0aWYgKCBwYXJhbXMgPT09IHVuZGVmaW5lZCApIHtcblx0XHRyZXR1cm4gc291cmNlO1xuXHR9XG5cdGlmICggYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgcGFyYW1zLmNvbnN0cnVjdG9yICE9PSBBcnJheSAgKSB7XG5cdFx0cGFyYW1zID0gJC5tYWtlQXJyYXkoIGFyZ3VtZW50cyApLnNsaWNlKCAxICk7XG5cdH1cblx0aWYgKCBwYXJhbXMuY29uc3RydWN0b3IgIT09IEFycmF5ICkge1xuXHRcdHBhcmFtcyA9IFsgcGFyYW1zIF07XG5cdH1cblx0JC5lYWNoKCBwYXJhbXMsIGZ1bmN0aW9uKCBpLCBuICkge1xuXHRcdHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKCBuZXcgUmVnRXhwKCBcIlxcXFx7XCIgKyBpICsgXCJcXFxcfVwiLCBcImdcIiApLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBuO1xuXHRcdH0gKTtcblx0fSApO1xuXHRyZXR1cm4gc291cmNlO1xufTtcblxuJC5leHRlbmQoICQudmFsaWRhdG9yLCB7XG5cblx0ZGVmYXVsdHM6IHtcblx0XHRtZXNzYWdlczoge30sXG5cdFx0Z3JvdXBzOiB7fSxcblx0XHRydWxlczoge30sXG5cdFx0ZXJyb3JDbGFzczogXCJlcnJvclwiLFxuXHRcdHBlbmRpbmdDbGFzczogXCJwZW5kaW5nXCIsXG5cdFx0dmFsaWRDbGFzczogXCJ2YWxpZFwiLFxuXHRcdGVycm9yRWxlbWVudDogXCJsYWJlbFwiLFxuXHRcdGZvY3VzQ2xlYW51cDogZmFsc2UsXG5cdFx0Zm9jdXNJbnZhbGlkOiB0cnVlLFxuXHRcdGVycm9yQ29udGFpbmVyOiAkKCBbXSApLFxuXHRcdGVycm9yTGFiZWxDb250YWluZXI6ICQoIFtdICksXG5cdFx0b25zdWJtaXQ6IHRydWUsXG5cdFx0aWdub3JlOiBcIjpoaWRkZW5cIixcblx0XHRpZ25vcmVUaXRsZTogZmFsc2UsXG5cdFx0b25mb2N1c2luOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHRoaXMubGFzdEFjdGl2ZSA9IGVsZW1lbnQ7XG5cblx0XHRcdC8vIEhpZGUgZXJyb3IgbGFiZWwgYW5kIHJlbW92ZSBlcnJvciBjbGFzcyBvbiBmb2N1cyBpZiBlbmFibGVkXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZm9jdXNDbGVhbnVwICkge1xuXHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQgKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodC5jYWxsKCB0aGlzLCBlbGVtZW50LCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuaGlkZVRoZXNlKCB0aGlzLmVycm9yc0ZvciggZWxlbWVudCApICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvbmZvY3Vzb3V0OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGlmICggIXRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgJiYgKCBlbGVtZW50Lm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgfHwgIXRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSApICkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9ua2V5dXA6IGZ1bmN0aW9uKCBlbGVtZW50LCBldmVudCApIHtcblxuXHRcdFx0Ly8gQXZvaWQgcmV2YWxpZGF0ZSB0aGUgZmllbGQgd2hlbiBwcmVzc2luZyBvbmUgb2YgdGhlIGZvbGxvd2luZyBrZXlzXG5cdFx0XHQvLyBTaGlmdCAgICAgICA9PiAxNlxuXHRcdFx0Ly8gQ3RybCAgICAgICAgPT4gMTdcblx0XHRcdC8vIEFsdCAgICAgICAgID0+IDE4XG5cdFx0XHQvLyBDYXBzIGxvY2sgICA9PiAyMFxuXHRcdFx0Ly8gRW5kICAgICAgICAgPT4gMzVcblx0XHRcdC8vIEhvbWUgICAgICAgID0+IDM2XG5cdFx0XHQvLyBMZWZ0IGFycm93ICA9PiAzN1xuXHRcdFx0Ly8gVXAgYXJyb3cgICAgPT4gMzhcblx0XHRcdC8vIFJpZ2h0IGFycm93ID0+IDM5XG5cdFx0XHQvLyBEb3duIGFycm93ICA9PiA0MFxuXHRcdFx0Ly8gSW5zZXJ0ICAgICAgPT4gNDVcblx0XHRcdC8vIE51bSBsb2NrICAgID0+IDE0NFxuXHRcdFx0Ly8gQWx0R3Iga2V5ICAgPT4gMjI1XG5cdFx0XHR2YXIgZXhjbHVkZWRLZXlzID0gW1xuXHRcdFx0XHQxNiwgMTcsIDE4LCAyMCwgMzUsIDM2LCAzNyxcblx0XHRcdFx0MzgsIDM5LCA0MCwgNDUsIDE0NCwgMjI1XG5cdFx0XHRdO1xuXG5cdFx0XHRpZiAoIGV2ZW50LndoaWNoID09PSA5ICYmIHRoaXMuZWxlbWVudFZhbHVlKCBlbGVtZW50ICkgPT09IFwiXCIgfHwgJC5pbkFycmF5KCBldmVudC5rZXlDb2RlLCBleGNsdWRlZEtleXMgKSAhPT0gLTEgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0gZWxzZSBpZiAoIGVsZW1lbnQubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCB8fCBlbGVtZW50Lm5hbWUgaW4gdGhpcy5pbnZhbGlkICkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uY2xpY2s6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBDbGljayBvbiBzZWxlY3RzLCByYWRpb2J1dHRvbnMgYW5kIGNoZWNrYm94ZXNcblx0XHRcdGlmICggZWxlbWVudC5uYW1lIGluIHRoaXMuc3VibWl0dGVkICkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQgKTtcblxuXHRcdFx0Ly8gT3Igb3B0aW9uIGVsZW1lbnRzLCBjaGVjayBwYXJlbnQgc2VsZWN0IGluIHRoYXQgY2FzZVxuXHRcdFx0fSBlbHNlIGlmICggZWxlbWVudC5wYXJlbnROb2RlLm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCggZWxlbWVudC5wYXJlbnROb2RlICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRoaWdobGlnaHQ6IGZ1bmN0aW9uKCBlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzICkge1xuXHRcdFx0aWYgKCBlbGVtZW50LnR5cGUgPT09IFwicmFkaW9cIiApIHtcblx0XHRcdFx0dGhpcy5maW5kQnlOYW1lKCBlbGVtZW50Lm5hbWUgKS5hZGRDbGFzcyggZXJyb3JDbGFzcyApLnJlbW92ZUNsYXNzKCB2YWxpZENsYXNzICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkKCBlbGVtZW50ICkuYWRkQ2xhc3MoIGVycm9yQ2xhc3MgKS5yZW1vdmVDbGFzcyggdmFsaWRDbGFzcyApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dW5oaWdobGlnaHQ6IGZ1bmN0aW9uKCBlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzICkge1xuXHRcdFx0aWYgKCBlbGVtZW50LnR5cGUgPT09IFwicmFkaW9cIiApIHtcblx0XHRcdFx0dGhpcy5maW5kQnlOYW1lKCBlbGVtZW50Lm5hbWUgKS5yZW1vdmVDbGFzcyggZXJyb3JDbGFzcyApLmFkZENsYXNzKCB2YWxpZENsYXNzICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkKCBlbGVtZW50ICkucmVtb3ZlQ2xhc3MoIGVycm9yQ2xhc3MgKS5hZGRDbGFzcyggdmFsaWRDbGFzcyApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5zZXREZWZhdWx0cy9cblx0c2V0RGVmYXVsdHM6IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcblx0XHQkLmV4dGVuZCggJC52YWxpZGF0b3IuZGVmYXVsdHMsIHNldHRpbmdzICk7XG5cdH0sXG5cblx0bWVzc2FnZXM6IHtcblx0XHRyZXF1aXJlZDogXCJUaGlzIGZpZWxkIGlzIHJlcXVpcmVkLlwiLFxuXHRcdHJlbW90ZTogXCJQbGVhc2UgZml4IHRoaXMgZmllbGQuXCIsXG5cdFx0ZW1haWw6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZW1haWwgYWRkcmVzcy5cIixcblx0XHR1cmw6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgVVJMLlwiLFxuXHRcdGRhdGU6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZGF0ZS5cIixcblx0XHRkYXRlSVNPOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGUgKCBJU08gKS5cIixcblx0XHRudW1iZXI6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgbnVtYmVyLlwiLFxuXHRcdGRpZ2l0czogXCJQbGVhc2UgZW50ZXIgb25seSBkaWdpdHMuXCIsXG5cdFx0ZXF1YWxUbzogXCJQbGVhc2UgZW50ZXIgdGhlIHNhbWUgdmFsdWUgYWdhaW4uXCIsXG5cdFx0bWF4bGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIG5vIG1vcmUgdGhhbiB7MH0gY2hhcmFjdGVycy5cIiApLFxuXHRcdG1pbmxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhdCBsZWFzdCB7MH0gY2hhcmFjdGVycy5cIiApLFxuXHRcdHJhbmdlbGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgYmV0d2VlbiB7MH0gYW5kIHsxfSBjaGFyYWN0ZXJzIGxvbmcuXCIgKSxcblx0XHRyYW5nZTogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGJldHdlZW4gezB9IGFuZCB7MX0uXCIgKSxcblx0XHRtYXg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYSB2YWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gezB9LlwiICksXG5cdFx0bWluOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiApLFxuXHRcdHN0ZXA6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYSBtdWx0aXBsZSBvZiB7MH0uXCIgKVxuXHR9LFxuXG5cdGF1dG9DcmVhdGVSYW5nZXM6IGZhbHNlLFxuXG5cdHByb3RvdHlwZToge1xuXG5cdFx0aW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmxhYmVsQ29udGFpbmVyID0gJCggdGhpcy5zZXR0aW5ncy5lcnJvckxhYmVsQ29udGFpbmVyICk7XG5cdFx0XHR0aGlzLmVycm9yQ29udGV4dCA9IHRoaXMubGFiZWxDb250YWluZXIubGVuZ3RoICYmIHRoaXMubGFiZWxDb250YWluZXIgfHwgJCggdGhpcy5jdXJyZW50Rm9ybSApO1xuXHRcdFx0dGhpcy5jb250YWluZXJzID0gJCggdGhpcy5zZXR0aW5ncy5lcnJvckNvbnRhaW5lciApLmFkZCggdGhpcy5zZXR0aW5ncy5lcnJvckxhYmVsQ29udGFpbmVyICk7XG5cdFx0XHR0aGlzLnN1Ym1pdHRlZCA9IHt9O1xuXHRcdFx0dGhpcy52YWx1ZUNhY2hlID0ge307XG5cdFx0XHR0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gMDtcblx0XHRcdHRoaXMucGVuZGluZyA9IHt9O1xuXHRcdFx0dGhpcy5pbnZhbGlkID0ge307XG5cdFx0XHR0aGlzLnJlc2V0KCk7XG5cblx0XHRcdHZhciBncm91cHMgPSAoIHRoaXMuZ3JvdXBzID0ge30gKSxcblx0XHRcdFx0cnVsZXM7XG5cdFx0XHQkLmVhY2goIHRoaXMuc2V0dGluZ3MuZ3JvdXBzLCBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZS5zcGxpdCggL1xccy8gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmVhY2goIHZhbHVlLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0XHRcdFx0Z3JvdXBzWyBuYW1lIF0gPSBrZXk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH0gKTtcblx0XHRcdHJ1bGVzID0gdGhpcy5zZXR0aW5ncy5ydWxlcztcblx0XHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuXHRcdFx0XHRydWxlc1sga2V5IF0gPSAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCB2YWx1ZSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRmdW5jdGlvbiBkZWxlZ2F0ZSggZXZlbnQgKSB7XG5cdFx0XHRcdHZhciB2YWxpZGF0b3IgPSAkLmRhdGEoIHRoaXMuZm9ybSwgXCJ2YWxpZGF0b3JcIiApLFxuXHRcdFx0XHRcdGV2ZW50VHlwZSA9IFwib25cIiArIGV2ZW50LnR5cGUucmVwbGFjZSggL152YWxpZGF0ZS8sIFwiXCIgKSxcblx0XHRcdFx0XHRzZXR0aW5ncyA9IHZhbGlkYXRvci5zZXR0aW5ncztcblx0XHRcdFx0aWYgKCBzZXR0aW5nc1sgZXZlbnRUeXBlIF0gJiYgISQoIHRoaXMgKS5pcyggc2V0dGluZ3MuaWdub3JlICkgKSB7XG5cdFx0XHRcdFx0c2V0dGluZ3NbIGV2ZW50VHlwZSBdLmNhbGwoIHZhbGlkYXRvciwgdGhpcywgZXZlbnQgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtIClcblx0XHRcdFx0Lm9uKCBcImZvY3VzaW4udmFsaWRhdGUgZm9jdXNvdXQudmFsaWRhdGUga2V5dXAudmFsaWRhdGVcIixcblx0XHRcdFx0XHRcIjp0ZXh0LCBbdHlwZT0ncGFzc3dvcmQnXSwgW3R5cGU9J2ZpbGUnXSwgc2VsZWN0LCB0ZXh0YXJlYSwgW3R5cGU9J251bWJlciddLCBbdHlwZT0nc2VhcmNoJ10sIFwiICtcblx0XHRcdFx0XHRcIlt0eXBlPSd0ZWwnXSwgW3R5cGU9J3VybCddLCBbdHlwZT0nZW1haWwnXSwgW3R5cGU9J2RhdGV0aW1lJ10sIFt0eXBlPSdkYXRlJ10sIFt0eXBlPSdtb250aCddLCBcIiArXG5cdFx0XHRcdFx0XCJbdHlwZT0nd2VlayddLCBbdHlwZT0ndGltZSddLCBbdHlwZT0nZGF0ZXRpbWUtbG9jYWwnXSwgW3R5cGU9J3JhbmdlJ10sIFt0eXBlPSdjb2xvciddLCBcIiArXG5cdFx0XHRcdFx0XCJbdHlwZT0ncmFkaW8nXSwgW3R5cGU9J2NoZWNrYm94J10sIFtjb250ZW50ZWRpdGFibGVdXCIsIGRlbGVnYXRlIClcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWUsIG9sZElFXG5cdFx0XHRcdC8vIFwic2VsZWN0XCIgaXMgcHJvdmlkZWQgYXMgZXZlbnQudGFyZ2V0IHdoZW4gY2xpY2tpbmcgYSBvcHRpb25cblx0XHRcdFx0Lm9uKCBcImNsaWNrLnZhbGlkYXRlXCIsIFwic2VsZWN0LCBvcHRpb24sIFt0eXBlPSdyYWRpbyddLCBbdHlwZT0nY2hlY2tib3gnXVwiLCBkZWxlZ2F0ZSApO1xuXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuaW52YWxpZEhhbmRsZXIgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5vbiggXCJpbnZhbGlkLWZvcm0udmFsaWRhdGVcIiwgdGhpcy5zZXR0aW5ncy5pbnZhbGlkSGFuZGxlciApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGQgYXJpYS1yZXF1aXJlZCB0byBhbnkgU3RhdGljL0RhdGEvQ2xhc3MgcmVxdWlyZWQgZmllbGRzIGJlZm9yZSBmaXJzdCB2YWxpZGF0aW9uXG5cdFx0XHQvLyBTY3JlZW4gcmVhZGVycyByZXF1aXJlIHRoaXMgYXR0cmlidXRlIHRvIGJlIHByZXNlbnQgYmVmb3JlIHRoZSBpbml0aWFsIHN1Ym1pc3Npb24gaHR0cDovL3d3dy53My5vcmcvVFIvV0NBRy1URUNIUy9BUklBMi5odG1sXG5cdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkuZmluZCggXCJbcmVxdWlyZWRdLCBbZGF0YS1ydWxlLXJlcXVpcmVkXSwgLnJlcXVpcmVkXCIgKS5hdHRyKCBcImFyaWEtcmVxdWlyZWRcIiwgXCJ0cnVlXCIgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5mb3JtL1xuXHRcdGZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5jaGVja0Zvcm0oKTtcblx0XHRcdCQuZXh0ZW5kKCB0aGlzLnN1Ym1pdHRlZCwgdGhpcy5lcnJvck1hcCApO1xuXHRcdFx0dGhpcy5pbnZhbGlkID0gJC5leHRlbmQoIHt9LCB0aGlzLmVycm9yTWFwICk7XG5cdFx0XHRpZiAoICF0aGlzLnZhbGlkKCkgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS50cmlnZ2VySGFuZGxlciggXCJpbnZhbGlkLWZvcm1cIiwgWyB0aGlzIF0gKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc2hvd0Vycm9ycygpO1xuXHRcdFx0cmV0dXJuIHRoaXMudmFsaWQoKTtcblx0XHR9LFxuXG5cdFx0Y2hlY2tGb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucHJlcGFyZUZvcm0oKTtcblx0XHRcdGZvciAoIHZhciBpID0gMCwgZWxlbWVudHMgPSAoIHRoaXMuY3VycmVudEVsZW1lbnRzID0gdGhpcy5lbGVtZW50cygpICk7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcblx0XHRcdFx0dGhpcy5jaGVjayggZWxlbWVudHNbIGkgXSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXMudmFsaWQoKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5lbGVtZW50L1xuXHRcdGVsZW1lbnQ6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0dmFyIGNsZWFuRWxlbWVudCA9IHRoaXMuY2xlYW4oIGVsZW1lbnQgKSxcblx0XHRcdFx0Y2hlY2tFbGVtZW50ID0gdGhpcy52YWxpZGF0aW9uVGFyZ2V0Rm9yKCBjbGVhbkVsZW1lbnQgKSxcblx0XHRcdFx0diA9IHRoaXMsXG5cdFx0XHRcdHJlc3VsdCA9IHRydWUsXG5cdFx0XHRcdHJzLCBncm91cDtcblxuXHRcdFx0aWYgKCBjaGVja0VsZW1lbnQgPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0ZGVsZXRlIHRoaXMuaW52YWxpZFsgY2xlYW5FbGVtZW50Lm5hbWUgXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMucHJlcGFyZUVsZW1lbnQoIGNoZWNrRWxlbWVudCApO1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRFbGVtZW50cyA9ICQoIGNoZWNrRWxlbWVudCApO1xuXG5cdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBpcyBncm91cGVkLCB0aGVuIHZhbGlkYXRlIGFsbCBncm91cCBlbGVtZW50cyBhbHJlYWR5XG5cdFx0XHRcdC8vIGNvbnRhaW5pbmcgYSB2YWx1ZVxuXHRcdFx0XHRncm91cCA9IHRoaXMuZ3JvdXBzWyBjaGVja0VsZW1lbnQubmFtZSBdO1xuXHRcdFx0XHRpZiAoIGdyb3VwICkge1xuXHRcdFx0XHRcdCQuZWFjaCggdGhpcy5ncm91cHMsIGZ1bmN0aW9uKCBuYW1lLCB0ZXN0Z3JvdXAgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIHRlc3Rncm91cCA9PT0gZ3JvdXAgJiYgbmFtZSAhPT0gY2hlY2tFbGVtZW50Lm5hbWUgKSB7XG5cdFx0XHRcdFx0XHRcdGNsZWFuRWxlbWVudCA9IHYudmFsaWRhdGlvblRhcmdldEZvciggdi5jbGVhbiggdi5maW5kQnlOYW1lKCBuYW1lICkgKSApO1xuXHRcdFx0XHRcdFx0XHRpZiAoIGNsZWFuRWxlbWVudCAmJiBjbGVhbkVsZW1lbnQubmFtZSBpbiB2LmludmFsaWQgKSB7XG5cdFx0XHRcdFx0XHRcdFx0di5jdXJyZW50RWxlbWVudHMucHVzaCggY2xlYW5FbGVtZW50ICk7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gcmVzdWx0ICYmIHYuY2hlY2soIGNsZWFuRWxlbWVudCApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cnMgPSB0aGlzLmNoZWNrKCBjaGVja0VsZW1lbnQgKSAhPT0gZmFsc2U7XG5cdFx0XHRcdHJlc3VsdCA9IHJlc3VsdCAmJiBycztcblx0XHRcdFx0aWYgKCBycyApIHtcblx0XHRcdFx0XHR0aGlzLmludmFsaWRbIGNoZWNrRWxlbWVudC5uYW1lIF0gPSBmYWxzZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmludmFsaWRbIGNoZWNrRWxlbWVudC5uYW1lIF0gPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCAhdGhpcy5udW1iZXJPZkludmFsaWRzKCkgKSB7XG5cblx0XHRcdFx0XHQvLyBIaWRlIGVycm9yIGNvbnRhaW5lcnMgb24gbGFzdCBlcnJvclxuXHRcdFx0XHRcdHRoaXMudG9IaWRlID0gdGhpcy50b0hpZGUuYWRkKCB0aGlzLmNvbnRhaW5lcnMgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnNob3dFcnJvcnMoKTtcblxuXHRcdFx0XHQvLyBBZGQgYXJpYS1pbnZhbGlkIHN0YXR1cyBmb3Igc2NyZWVuIHJlYWRlcnNcblx0XHRcdFx0JCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1pbnZhbGlkXCIsICFycyApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvVmFsaWRhdG9yLnNob3dFcnJvcnMvXG5cdFx0c2hvd0Vycm9yczogZnVuY3Rpb24oIGVycm9ycyApIHtcblx0XHRcdGlmICggZXJyb3JzICkge1xuXHRcdFx0XHR2YXIgdmFsaWRhdG9yID0gdGhpcztcblxuXHRcdFx0XHQvLyBBZGQgaXRlbXMgdG8gZXJyb3IgbGlzdCBhbmQgbWFwXG5cdFx0XHRcdCQuZXh0ZW5kKCB0aGlzLmVycm9yTWFwLCBlcnJvcnMgKTtcblx0XHRcdFx0dGhpcy5lcnJvckxpc3QgPSAkLm1hcCggdGhpcy5lcnJvck1hcCwgZnVuY3Rpb24oIG1lc3NhZ2UsIG5hbWUgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdFx0XHRlbGVtZW50OiB2YWxpZGF0b3IuZmluZEJ5TmFtZSggbmFtZSApWyAwIF1cblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0Ly8gUmVtb3ZlIGl0ZW1zIGZyb20gc3VjY2VzcyBsaXN0XG5cdFx0XHRcdHRoaXMuc3VjY2Vzc0xpc3QgPSAkLmdyZXAoIHRoaXMuc3VjY2Vzc0xpc3QsIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0XHRcdHJldHVybiAhKCBlbGVtZW50Lm5hbWUgaW4gZXJyb3JzICk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5zaG93RXJyb3JzICkge1xuXHRcdFx0XHR0aGlzLnNldHRpbmdzLnNob3dFcnJvcnMuY2FsbCggdGhpcywgdGhpcy5lcnJvck1hcCwgdGhpcy5lcnJvckxpc3QgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuZGVmYXVsdFNob3dFcnJvcnMoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5yZXNldEZvcm0vXG5cdFx0cmVzZXRGb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggJC5mbi5yZXNldEZvcm0gKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5yZXNldEZvcm0oKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuaW52YWxpZCA9IHt9O1xuXHRcdFx0dGhpcy5zdWJtaXR0ZWQgPSB7fTtcblx0XHRcdHRoaXMucHJlcGFyZUZvcm0oKTtcblx0XHRcdHRoaXMuaGlkZUVycm9ycygpO1xuXHRcdFx0dmFyIGVsZW1lbnRzID0gdGhpcy5lbGVtZW50cygpXG5cdFx0XHRcdC5yZW1vdmVEYXRhKCBcInByZXZpb3VzVmFsdWVcIiApXG5cdFx0XHRcdC5yZW1vdmVBdHRyKCBcImFyaWEtaW52YWxpZFwiICk7XG5cblx0XHRcdHRoaXMucmVzZXRFbGVtZW50cyggZWxlbWVudHMgKTtcblx0XHR9LFxuXG5cdFx0cmVzZXRFbGVtZW50czogZnVuY3Rpb24oIGVsZW1lbnRzICkge1xuXHRcdFx0dmFyIGk7XG5cblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodCApIHtcblx0XHRcdFx0Zm9yICggaSA9IDA7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0LmNhbGwoIHRoaXMsIGVsZW1lbnRzWyBpIF0sXG5cdFx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIFwiXCIgKTtcblx0XHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnRzWyBpIF0ubmFtZSApLnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWxlbWVudHNcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcyApXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0bnVtYmVyT2ZJbnZhbGlkczogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vYmplY3RMZW5ndGgoIHRoaXMuaW52YWxpZCApO1xuXHRcdH0sXG5cblx0XHRvYmplY3RMZW5ndGg6IGZ1bmN0aW9uKCBvYmogKSB7XG5cdFx0XHQvKiBqc2hpbnQgdW51c2VkOiBmYWxzZSAqL1xuXHRcdFx0dmFyIGNvdW50ID0gMCxcblx0XHRcdFx0aTtcblx0XHRcdGZvciAoIGkgaW4gb2JqICkge1xuXHRcdFx0XHRpZiAoIG9ialsgaSBdICkge1xuXHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBjb3VudDtcblx0XHR9LFxuXG5cdFx0aGlkZUVycm9yczogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmhpZGVUaGVzZSggdGhpcy50b0hpZGUgKTtcblx0XHR9LFxuXG5cdFx0aGlkZVRoZXNlOiBmdW5jdGlvbiggZXJyb3JzICkge1xuXHRcdFx0ZXJyb3JzLm5vdCggdGhpcy5jb250YWluZXJzICkudGV4dCggXCJcIiApO1xuXHRcdFx0dGhpcy5hZGRXcmFwcGVyKCBlcnJvcnMgKS5oaWRlKCk7XG5cdFx0fSxcblxuXHRcdHZhbGlkOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLnNpemUoKSA9PT0gMDtcblx0XHR9LFxuXG5cdFx0c2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lcnJvckxpc3QubGVuZ3RoO1xuXHRcdH0sXG5cblx0XHRmb2N1c0ludmFsaWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmZvY3VzSW52YWxpZCApIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQkKCB0aGlzLmZpbmRMYXN0QWN0aXZlKCkgfHwgdGhpcy5lcnJvckxpc3QubGVuZ3RoICYmIHRoaXMuZXJyb3JMaXN0WyAwIF0uZWxlbWVudCB8fCBbXSApXG5cdFx0XHRcdFx0LmZpbHRlciggXCI6dmlzaWJsZVwiIClcblx0XHRcdFx0XHQuZm9jdXMoKVxuXG5cdFx0XHRcdFx0Ly8gTWFudWFsbHkgdHJpZ2dlciBmb2N1c2luIGV2ZW50OyB3aXRob3V0IGl0LCBmb2N1c2luIGhhbmRsZXIgaXNuJ3QgY2FsbGVkLCBmaW5kTGFzdEFjdGl2ZSB3b24ndCBoYXZlIGFueXRoaW5nIHRvIGZpbmRcblx0XHRcdFx0XHQudHJpZ2dlciggXCJmb2N1c2luXCIgKTtcblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cblx0XHRcdFx0XHQvLyBJZ25vcmUgSUUgdGhyb3dpbmcgZXJyb3JzIHdoZW4gZm9jdXNpbmcgaGlkZGVuIGVsZW1lbnRzXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZmluZExhc3RBY3RpdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGxhc3RBY3RpdmUgPSB0aGlzLmxhc3RBY3RpdmU7XG5cdFx0XHRyZXR1cm4gbGFzdEFjdGl2ZSAmJiAkLmdyZXAoIHRoaXMuZXJyb3JMaXN0LCBmdW5jdGlvbiggbiApIHtcblx0XHRcdFx0cmV0dXJuIG4uZWxlbWVudC5uYW1lID09PSBsYXN0QWN0aXZlLm5hbWU7XG5cdFx0XHR9ICkubGVuZ3RoID09PSAxICYmIGxhc3RBY3RpdmU7XG5cdFx0fSxcblxuXHRcdGVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB2YWxpZGF0b3IgPSB0aGlzLFxuXHRcdFx0XHRydWxlc0NhY2hlID0ge307XG5cblx0XHRcdC8vIFNlbGVjdCBhbGwgdmFsaWQgaW5wdXRzIGluc2lkZSB0aGUgZm9ybSAobm8gc3VibWl0IG9yIHJlc2V0IGJ1dHRvbnMpXG5cdFx0XHRyZXR1cm4gJCggdGhpcy5jdXJyZW50Rm9ybSApXG5cdFx0XHQuZmluZCggXCJpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYSwgW2NvbnRlbnRlZGl0YWJsZV1cIiApXG5cdFx0XHQubm90KCBcIjpzdWJtaXQsIDpyZXNldCwgOmltYWdlLCA6ZGlzYWJsZWRcIiApXG5cdFx0XHQubm90KCB0aGlzLnNldHRpbmdzLmlnbm9yZSApXG5cdFx0XHQuZmlsdGVyKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIG5hbWUgPSB0aGlzLm5hbWUgfHwgJCggdGhpcyApLmF0dHIoIFwibmFtZVwiICk7IC8vIEZvciBjb250ZW50ZWRpdGFibGVcblx0XHRcdFx0aWYgKCAhbmFtZSAmJiB2YWxpZGF0b3Iuc2V0dGluZ3MuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvciggXCIlbyBoYXMgbm8gbmFtZSBhc3NpZ25lZFwiLCB0aGlzICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTZXQgZm9ybSBleHBhbmRvIG9uIGNvbnRlbnRlZGl0YWJsZVxuXHRcdFx0XHRpZiAoIHRoaXMuaGFzQXR0cmlidXRlKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgKSB7XG5cdFx0XHRcdFx0dGhpcy5mb3JtID0gJCggdGhpcyApLmNsb3Nlc3QoIFwiZm9ybVwiIClbIDAgXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFNlbGVjdCBvbmx5IHRoZSBmaXJzdCBlbGVtZW50IGZvciBlYWNoIG5hbWUsIGFuZCBvbmx5IHRob3NlIHdpdGggcnVsZXMgc3BlY2lmaWVkXG5cdFx0XHRcdGlmICggbmFtZSBpbiBydWxlc0NhY2hlIHx8ICF2YWxpZGF0b3Iub2JqZWN0TGVuZ3RoKCAkKCB0aGlzICkucnVsZXMoKSApICkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJ1bGVzQ2FjaGVbIG5hbWUgXSA9IHRydWU7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHRjbGVhbjogZnVuY3Rpb24oIHNlbGVjdG9yICkge1xuXHRcdFx0cmV0dXJuICQoIHNlbGVjdG9yIClbIDAgXTtcblx0XHR9LFxuXG5cdFx0ZXJyb3JzOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBlcnJvckNsYXNzID0gdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLnNwbGl0KCBcIiBcIiApLmpvaW4oIFwiLlwiICk7XG5cdFx0XHRyZXR1cm4gJCggdGhpcy5zZXR0aW5ncy5lcnJvckVsZW1lbnQgKyBcIi5cIiArIGVycm9yQ2xhc3MsIHRoaXMuZXJyb3JDb250ZXh0ICk7XG5cdFx0fSxcblxuXHRcdHJlc2V0SW50ZXJuYWxzOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc3VjY2Vzc0xpc3QgPSBbXTtcblx0XHRcdHRoaXMuZXJyb3JMaXN0ID0gW107XG5cdFx0XHR0aGlzLmVycm9yTWFwID0ge307XG5cdFx0XHR0aGlzLnRvU2hvdyA9ICQoIFtdICk7XG5cdFx0XHR0aGlzLnRvSGlkZSA9ICQoIFtdICk7XG5cdFx0fSxcblxuXHRcdHJlc2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucmVzZXRJbnRlcm5hbHMoKTtcblx0XHRcdHRoaXMuY3VycmVudEVsZW1lbnRzID0gJCggW10gKTtcblx0XHR9LFxuXG5cdFx0cHJlcGFyZUZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5yZXNldCgpO1xuXHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLmVycm9ycygpLmFkZCggdGhpcy5jb250YWluZXJzICk7XG5cdFx0fSxcblxuXHRcdHByZXBhcmVFbGVtZW50OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHRoaXMucmVzZXQoKTtcblx0XHRcdHRoaXMudG9IaWRlID0gdGhpcy5lcnJvcnNGb3IoIGVsZW1lbnQgKTtcblx0XHR9LFxuXG5cdFx0ZWxlbWVudFZhbHVlOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciAkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcblx0XHRcdFx0dHlwZSA9IGVsZW1lbnQudHlwZSxcblx0XHRcdFx0dmFsLCBpZHg7XG5cblx0XHRcdGlmICggdHlwZSA9PT0gXCJyYWRpb1wiIHx8IHR5cGUgPT09IFwiY2hlY2tib3hcIiApIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkuZmlsdGVyKCBcIjpjaGVja2VkXCIgKS52YWwoKTtcblx0XHRcdH0gZWxzZSBpZiAoIHR5cGUgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIGVsZW1lbnQudmFsaWRpdHkgIT09IFwidW5kZWZpbmVkXCIgKSB7XG5cdFx0XHRcdHJldHVybiBlbGVtZW50LnZhbGlkaXR5LmJhZElucHV0ID8gXCJOYU5cIiA6ICRlbGVtZW50LnZhbCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGVsZW1lbnQuaGFzQXR0cmlidXRlKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgKSB7XG5cdFx0XHRcdHZhbCA9ICRlbGVtZW50LnRleHQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhbCA9ICRlbGVtZW50LnZhbCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHR5cGUgPT09IFwiZmlsZVwiICkge1xuXG5cdFx0XHRcdC8vIE1vZGVybiBicm93c2VyIChjaHJvbWUgJiBzYWZhcmkpXG5cdFx0XHRcdGlmICggdmFsLnN1YnN0ciggMCwgMTIgKSA9PT0gXCJDOlxcXFxmYWtlcGF0aFxcXFxcIiApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsLnN1YnN0ciggMTIgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIExlZ2FjeSBicm93c2Vyc1xuXHRcdFx0XHQvLyBVbml4LWJhc2VkIHBhdGhcblx0XHRcdFx0aWR4ID0gdmFsLmxhc3RJbmRleE9mKCBcIi9cIiApO1xuXHRcdFx0XHRpZiAoIGlkeCA+PSAwICkge1xuXHRcdFx0XHRcdHJldHVybiB2YWwuc3Vic3RyKCBpZHggKyAxICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBXaW5kb3dzLWJhc2VkIHBhdGhcblx0XHRcdFx0aWR4ID0gdmFsLmxhc3RJbmRleE9mKCBcIlxcXFxcIiApO1xuXHRcdFx0XHRpZiAoIGlkeCA+PSAwICkge1xuXHRcdFx0XHRcdHJldHVybiB2YWwuc3Vic3RyKCBpZHggKyAxICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBKdXN0IHRoZSBmaWxlIG5hbWVcblx0XHRcdFx0cmV0dXJuIHZhbDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHRyZXR1cm4gdmFsLnJlcGxhY2UoIC9cXHIvZywgXCJcIiApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbDtcblx0XHR9LFxuXG5cdFx0Y2hlY2s6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0ZWxlbWVudCA9IHRoaXMudmFsaWRhdGlvblRhcmdldEZvciggdGhpcy5jbGVhbiggZWxlbWVudCApICk7XG5cblx0XHRcdHZhciBydWxlcyA9ICQoIGVsZW1lbnQgKS5ydWxlcygpLFxuXHRcdFx0XHRydWxlc0NvdW50ID0gJC5tYXAoIHJ1bGVzLCBmdW5jdGlvbiggbiwgaSApIHtcblx0XHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdFx0fSApLmxlbmd0aCxcblx0XHRcdFx0ZGVwZW5kZW5jeU1pc21hdGNoID0gZmFsc2UsXG5cdFx0XHRcdHZhbCA9IHRoaXMuZWxlbWVudFZhbHVlKCBlbGVtZW50ICksXG5cdFx0XHRcdHJlc3VsdCwgbWV0aG9kLCBydWxlO1xuXG5cdFx0XHQvLyBJZiBhIG5vcm1hbGl6ZXIgaXMgZGVmaW5lZCBmb3IgdGhpcyBlbGVtZW50LCB0aGVuXG5cdFx0XHQvLyBjYWxsIGl0IHRvIHJldHJlaXZlIHRoZSBjaGFuZ2VkIHZhbHVlIGluc3RlYWRcblx0XHRcdC8vIG9mIHVzaW5nIHRoZSByZWFsIG9uZS5cblx0XHRcdC8vIE5vdGUgdGhhdCBgdGhpc2AgaW4gdGhlIG5vcm1hbGl6ZXIgaXMgYGVsZW1lbnRgLlxuXHRcdFx0aWYgKCB0eXBlb2YgcnVsZXMubm9ybWFsaXplciA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHR2YWwgPSBydWxlcy5ub3JtYWxpemVyLmNhbGwoIGVsZW1lbnQsIHZhbCApO1xuXG5cdFx0XHRcdGlmICggdHlwZW9mIHZhbCAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCBcIlRoZSBub3JtYWxpemVyIHNob3VsZCByZXR1cm4gYSBzdHJpbmcgdmFsdWUuXCIgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIERlbGV0ZSB0aGUgbm9ybWFsaXplciBmcm9tIHJ1bGVzIHRvIGF2b2lkIHRyZWF0aW5nXG5cdFx0XHRcdC8vIGl0IGFzIGEgcHJlLWRlZmluZWQgbWV0aG9kLlxuXHRcdFx0XHRkZWxldGUgcnVsZXMubm9ybWFsaXplcjtcblx0XHRcdH1cblxuXHRcdFx0Zm9yICggbWV0aG9kIGluIHJ1bGVzICkge1xuXHRcdFx0XHRydWxlID0geyBtZXRob2Q6IG1ldGhvZCwgcGFyYW1ldGVyczogcnVsZXNbIG1ldGhvZCBdIH07XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmVzdWx0ID0gJC52YWxpZGF0b3IubWV0aG9kc1sgbWV0aG9kIF0uY2FsbCggdGhpcywgdmFsLCBlbGVtZW50LCBydWxlLnBhcmFtZXRlcnMgKTtcblxuXHRcdFx0XHRcdC8vIElmIGEgbWV0aG9kIGluZGljYXRlcyB0aGF0IHRoZSBmaWVsZCBpcyBvcHRpb25hbCBhbmQgdGhlcmVmb3JlIHZhbGlkLFxuXHRcdFx0XHRcdC8vIGRvbid0IG1hcmsgaXQgYXMgdmFsaWQgd2hlbiB0aGVyZSBhcmUgbm8gb3RoZXIgcnVsZXNcblx0XHRcdFx0XHRpZiAoIHJlc3VsdCA9PT0gXCJkZXBlbmRlbmN5LW1pc21hdGNoXCIgJiYgcnVsZXNDb3VudCA9PT0gMSApIHtcblx0XHRcdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IHRydWU7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVwZW5kZW5jeU1pc21hdGNoID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoIHJlc3VsdCA9PT0gXCJwZW5kaW5nXCIgKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLm5vdCggdGhpcy5lcnJvcnNGb3IoIGVsZW1lbnQgKSApO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggIXJlc3VsdCApIHtcblx0XHRcdFx0XHRcdHRoaXMuZm9ybWF0QW5kQWRkKCBlbGVtZW50LCBydWxlICk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyggXCJFeGNlcHRpb24gb2NjdXJyZWQgd2hlbiBjaGVja2luZyBlbGVtZW50IFwiICsgZWxlbWVudC5pZCArIFwiLCBjaGVjayB0aGUgJ1wiICsgcnVsZS5tZXRob2QgKyBcIicgbWV0aG9kLlwiLCBlICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggZSBpbnN0YW5jZW9mIFR5cGVFcnJvciApIHtcblx0XHRcdFx0XHRcdGUubWVzc2FnZSArPSBcIi4gIEV4Y2VwdGlvbiBvY2N1cnJlZCB3aGVuIGNoZWNraW5nIGVsZW1lbnQgXCIgKyBlbGVtZW50LmlkICsgXCIsIGNoZWNrIHRoZSAnXCIgKyBydWxlLm1ldGhvZCArIFwiJyBtZXRob2QuXCI7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCBkZXBlbmRlbmN5TWlzbWF0Y2ggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5vYmplY3RMZW5ndGgoIHJ1bGVzICkgKSB7XG5cdFx0XHRcdHRoaXMuc3VjY2Vzc0xpc3QucHVzaCggZWxlbWVudCApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybiB0aGUgY3VzdG9tIG1lc3NhZ2UgZm9yIHRoZSBnaXZlbiBlbGVtZW50IGFuZCB2YWxpZGF0aW9uIG1ldGhvZFxuXHRcdC8vIHNwZWNpZmllZCBpbiB0aGUgZWxlbWVudCdzIEhUTUw1IGRhdGEgYXR0cmlidXRlXG5cdFx0Ly8gcmV0dXJuIHRoZSBnZW5lcmljIG1lc3NhZ2UgaWYgcHJlc2VudCBhbmQgbm8gbWV0aG9kIHNwZWNpZmljIG1lc3NhZ2UgaXMgcHJlc2VudFxuXHRcdGN1c3RvbURhdGFNZXNzYWdlOiBmdW5jdGlvbiggZWxlbWVudCwgbWV0aG9kICkge1xuXHRcdFx0cmV0dXJuICQoIGVsZW1lbnQgKS5kYXRhKCBcIm1zZ1wiICsgbWV0aG9kLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgK1xuXHRcdFx0XHRtZXRob2Quc3Vic3RyaW5nKCAxICkudG9Mb3dlckNhc2UoKSApIHx8ICQoIGVsZW1lbnQgKS5kYXRhKCBcIm1zZ1wiICk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybiB0aGUgY3VzdG9tIG1lc3NhZ2UgZm9yIHRoZSBnaXZlbiBlbGVtZW50IG5hbWUgYW5kIHZhbGlkYXRpb24gbWV0aG9kXG5cdFx0Y3VzdG9tTWVzc2FnZTogZnVuY3Rpb24oIG5hbWUsIG1ldGhvZCApIHtcblx0XHRcdHZhciBtID0gdGhpcy5zZXR0aW5ncy5tZXNzYWdlc1sgbmFtZSBdO1xuXHRcdFx0cmV0dXJuIG0gJiYgKCBtLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgPyBtIDogbVsgbWV0aG9kIF0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJuIHRoZSBmaXJzdCBkZWZpbmVkIGFyZ3VtZW50LCBhbGxvd2luZyBlbXB0eSBzdHJpbmdzXG5cdFx0ZmluZERlZmluZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIGFyZ3VtZW50c1sgaSBdICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFyZ3VtZW50c1sgaSBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH0sXG5cblx0XHRkZWZhdWx0TWVzc2FnZTogZnVuY3Rpb24oIGVsZW1lbnQsIHJ1bGUgKSB7XG5cdFx0XHR2YXIgbWVzc2FnZSA9IHRoaXMuZmluZERlZmluZWQoXG5cdFx0XHRcdFx0dGhpcy5jdXN0b21NZXNzYWdlKCBlbGVtZW50Lm5hbWUsIHJ1bGUubWV0aG9kICksXG5cdFx0XHRcdFx0dGhpcy5jdXN0b21EYXRhTWVzc2FnZSggZWxlbWVudCwgcnVsZS5tZXRob2QgKSxcblxuXHRcdFx0XHRcdC8vICd0aXRsZScgaXMgbmV2ZXIgdW5kZWZpbmVkLCBzbyBoYW5kbGUgZW1wdHkgc3RyaW5nIGFzIHVuZGVmaW5lZFxuXHRcdFx0XHRcdCF0aGlzLnNldHRpbmdzLmlnbm9yZVRpdGxlICYmIGVsZW1lbnQudGl0bGUgfHwgdW5kZWZpbmVkLFxuXHRcdFx0XHRcdCQudmFsaWRhdG9yLm1lc3NhZ2VzWyBydWxlLm1ldGhvZCBdLFxuXHRcdFx0XHRcdFwiPHN0cm9uZz5XYXJuaW5nOiBObyBtZXNzYWdlIGRlZmluZWQgZm9yIFwiICsgZWxlbWVudC5uYW1lICsgXCI8L3N0cm9uZz5cIlxuXHRcdFx0XHQpLFxuXHRcdFx0XHR0aGVyZWdleCA9IC9cXCQ/XFx7KFxcZCspXFx9L2c7XG5cdFx0XHRpZiAoIHR5cGVvZiBtZXNzYWdlID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLmNhbGwoIHRoaXMsIHJ1bGUucGFyYW1ldGVycywgZWxlbWVudCApO1xuXHRcdFx0fSBlbHNlIGlmICggdGhlcmVnZXgudGVzdCggbWVzc2FnZSApICkge1xuXHRcdFx0XHRtZXNzYWdlID0gJC52YWxpZGF0b3IuZm9ybWF0KCBtZXNzYWdlLnJlcGxhY2UoIHRoZXJlZ2V4LCBcInskMX1cIiApLCBydWxlLnBhcmFtZXRlcnMgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0fSxcblxuXHRcdGZvcm1hdEFuZEFkZDogZnVuY3Rpb24oIGVsZW1lbnQsIHJ1bGUgKSB7XG5cdFx0XHR2YXIgbWVzc2FnZSA9IHRoaXMuZGVmYXVsdE1lc3NhZ2UoIGVsZW1lbnQsIHJ1bGUgKTtcblxuXHRcdFx0dGhpcy5lcnJvckxpc3QucHVzaCgge1xuXHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRlbGVtZW50OiBlbGVtZW50LFxuXHRcdFx0XHRtZXRob2Q6IHJ1bGUubWV0aG9kXG5cdFx0XHR9ICk7XG5cblx0XHRcdHRoaXMuZXJyb3JNYXBbIGVsZW1lbnQubmFtZSBdID0gbWVzc2FnZTtcblx0XHRcdHRoaXMuc3VibWl0dGVkWyBlbGVtZW50Lm5hbWUgXSA9IG1lc3NhZ2U7XG5cdFx0fSxcblxuXHRcdGFkZFdyYXBwZXI6IGZ1bmN0aW9uKCB0b1RvZ2dsZSApIHtcblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy53cmFwcGVyICkge1xuXHRcdFx0XHR0b1RvZ2dsZSA9IHRvVG9nZ2xlLmFkZCggdG9Ub2dnbGUucGFyZW50KCB0aGlzLnNldHRpbmdzLndyYXBwZXIgKSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRvVG9nZ2xlO1xuXHRcdH0sXG5cblx0XHRkZWZhdWx0U2hvd0Vycm9yczogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaSwgZWxlbWVudHMsIGVycm9yO1xuXHRcdFx0Zm9yICggaSA9IDA7IHRoaXMuZXJyb3JMaXN0WyBpIF07IGkrKyApIHtcblx0XHRcdFx0ZXJyb3IgPSB0aGlzLmVycm9yTGlzdFsgaSBdO1xuXHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuaGlnaGxpZ2h0ICkge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuaGlnaGxpZ2h0LmNhbGwoIHRoaXMsIGVycm9yLmVsZW1lbnQsIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcywgdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5zaG93TGFiZWwoIGVycm9yLmVsZW1lbnQsIGVycm9yLm1lc3NhZ2UgKTtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5lcnJvckxpc3QubGVuZ3RoICkge1xuXHRcdFx0XHR0aGlzLnRvU2hvdyA9IHRoaXMudG9TaG93LmFkZCggdGhpcy5jb250YWluZXJzICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Muc3VjY2VzcyApIHtcblx0XHRcdFx0Zm9yICggaSA9IDA7IHRoaXMuc3VjY2Vzc0xpc3RbIGkgXTsgaSsrICkge1xuXHRcdFx0XHRcdHRoaXMuc2hvd0xhYmVsKCB0aGlzLnN1Y2Nlc3NMaXN0WyBpIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0ICkge1xuXHRcdFx0XHRmb3IgKCBpID0gMCwgZWxlbWVudHMgPSB0aGlzLnZhbGlkRWxlbWVudHMoKTsgZWxlbWVudHNbIGkgXTsgaSsrICkge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCggdGhpcywgZWxlbWVudHNbIGkgXSwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLnRvSGlkZS5ub3QoIHRoaXMudG9TaG93ICk7XG5cdFx0XHR0aGlzLmhpZGVFcnJvcnMoKTtcblx0XHRcdHRoaXMuYWRkV3JhcHBlciggdGhpcy50b1Nob3cgKS5zaG93KCk7XG5cdFx0fSxcblxuXHRcdHZhbGlkRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY3VycmVudEVsZW1lbnRzLm5vdCggdGhpcy5pbnZhbGlkRWxlbWVudHMoKSApO1xuXHRcdH0sXG5cblx0XHRpbnZhbGlkRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICQoIHRoaXMuZXJyb3JMaXN0ICkubWFwKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZWxlbWVudDtcblx0XHRcdH0gKTtcblx0XHR9LFxuXG5cdFx0c2hvd0xhYmVsOiBmdW5jdGlvbiggZWxlbWVudCwgbWVzc2FnZSApIHtcblx0XHRcdHZhciBwbGFjZSwgZ3JvdXAsIGVycm9ySUQsIHYsXG5cdFx0XHRcdGVycm9yID0gdGhpcy5lcnJvcnNGb3IoIGVsZW1lbnQgKSxcblx0XHRcdFx0ZWxlbWVudElEID0gdGhpcy5pZE9yTmFtZSggZWxlbWVudCApLFxuXHRcdFx0XHRkZXNjcmliZWRCeSA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiApO1xuXG5cdFx0XHRpZiAoIGVycm9yLmxlbmd0aCApIHtcblxuXHRcdFx0XHQvLyBSZWZyZXNoIGVycm9yL3N1Y2Nlc3MgY2xhc3Ncblx0XHRcdFx0ZXJyb3IucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyApLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MgKTtcblxuXHRcdFx0XHQvLyBSZXBsYWNlIG1lc3NhZ2Ugb24gZXhpc3RpbmcgbGFiZWxcblx0XHRcdFx0ZXJyb3IuaHRtbCggbWVzc2FnZSApO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBDcmVhdGUgZXJyb3IgZWxlbWVudFxuXHRcdFx0XHRlcnJvciA9ICQoIFwiPFwiICsgdGhpcy5zZXR0aW5ncy5lcnJvckVsZW1lbnQgKyBcIj5cIiApXG5cdFx0XHRcdFx0LmF0dHIoIFwiaWRcIiwgZWxlbWVudElEICsgXCItZXJyb3JcIiApXG5cdFx0XHRcdFx0LmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MgKVxuXHRcdFx0XHRcdC5odG1sKCBtZXNzYWdlIHx8IFwiXCIgKTtcblxuXHRcdFx0XHQvLyBNYWludGFpbiByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgdG8gYmUgcGxhY2VkIGludG8gdGhlIERPTVxuXHRcdFx0XHRwbGFjZSA9IGVycm9yO1xuXHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Mud3JhcHBlciApIHtcblxuXHRcdFx0XHRcdC8vIE1ha2Ugc3VyZSB0aGUgZWxlbWVudCBpcyB2aXNpYmxlLCBldmVuIGluIElFXG5cdFx0XHRcdFx0Ly8gYWN0dWFsbHkgc2hvd2luZyB0aGUgd3JhcHBlZCBlbGVtZW50IGlzIGhhbmRsZWQgZWxzZXdoZXJlXG5cdFx0XHRcdFx0cGxhY2UgPSBlcnJvci5oaWRlKCkuc2hvdygpLndyYXAoIFwiPFwiICsgdGhpcy5zZXR0aW5ncy53cmFwcGVyICsgXCIvPlwiICkucGFyZW50KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0aGlzLmxhYmVsQ29udGFpbmVyLmxlbmd0aCApIHtcblx0XHRcdFx0XHR0aGlzLmxhYmVsQ29udGFpbmVyLmFwcGVuZCggcGxhY2UgKTtcblx0XHRcdFx0fSBlbHNlIGlmICggdGhpcy5zZXR0aW5ncy5lcnJvclBsYWNlbWVudCApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmVycm9yUGxhY2VtZW50KCBwbGFjZSwgJCggZWxlbWVudCApICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cGxhY2UuaW5zZXJ0QWZ0ZXIoIGVsZW1lbnQgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIExpbmsgZXJyb3IgYmFjayB0byB0aGUgZWxlbWVudFxuXHRcdFx0XHRpZiAoIGVycm9yLmlzKCBcImxhYmVsXCIgKSApIHtcblxuXHRcdFx0XHRcdC8vIElmIHRoZSBlcnJvciBpcyBhIGxhYmVsLCB0aGVuIGFzc29jaWF0ZSB1c2luZyAnZm9yJ1xuXHRcdFx0XHRcdGVycm9yLmF0dHIoIFwiZm9yXCIsIGVsZW1lbnRJRCApO1xuXG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGVsZW1lbnQgaXMgbm90IGEgY2hpbGQgb2YgYW4gYXNzb2NpYXRlZCBsYWJlbCwgdGhlbiBpdCdzIG5lY2Vzc2FyeVxuXHRcdFx0XHRcdC8vIHRvIGV4cGxpY2l0bHkgYXBwbHkgYXJpYS1kZXNjcmliZWRieVxuXHRcdFx0XHR9IGVsc2UgaWYgKCBlcnJvci5wYXJlbnRzKCBcImxhYmVsW2Zvcj0nXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIGVsZW1lbnRJRCApICsgXCInXVwiICkubGVuZ3RoID09PSAwICkge1xuXHRcdFx0XHRcdGVycm9ySUQgPSBlcnJvci5hdHRyKCBcImlkXCIgKTtcblxuXHRcdFx0XHRcdC8vIFJlc3BlY3QgZXhpc3Rpbmcgbm9uLWVycm9yIGFyaWEtZGVzY3JpYmVkYnlcblx0XHRcdFx0XHRpZiAoICFkZXNjcmliZWRCeSApIHtcblx0XHRcdFx0XHRcdGRlc2NyaWJlZEJ5ID0gZXJyb3JJRDtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKCAhZGVzY3JpYmVkQnkubWF0Y2goIG5ldyBSZWdFeHAoIFwiXFxcXGJcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggZXJyb3JJRCApICsgXCJcXFxcYlwiICkgKSApIHtcblxuXHRcdFx0XHRcdFx0Ly8gQWRkIHRvIGVuZCBvZiBsaXN0IGlmIG5vdCBhbHJlYWR5IHByZXNlbnRcblx0XHRcdFx0XHRcdGRlc2NyaWJlZEJ5ICs9IFwiIFwiICsgZXJyb3JJRDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0JCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiLCBkZXNjcmliZWRCeSApO1xuXG5cdFx0XHRcdFx0Ly8gSWYgdGhpcyBlbGVtZW50IGlzIGdyb3VwZWQsIHRoZW4gYXNzaWduIHRvIGFsbCBlbGVtZW50cyBpbiB0aGUgc2FtZSBncm91cFxuXHRcdFx0XHRcdGdyb3VwID0gdGhpcy5ncm91cHNbIGVsZW1lbnQubmFtZSBdO1xuXHRcdFx0XHRcdGlmICggZ3JvdXAgKSB7XG5cdFx0XHRcdFx0XHR2ID0gdGhpcztcblx0XHRcdFx0XHRcdCQuZWFjaCggdi5ncm91cHMsIGZ1bmN0aW9uKCBuYW1lLCB0ZXN0Z3JvdXAgKSB7XG5cdFx0XHRcdFx0XHRcdGlmICggdGVzdGdyb3VwID09PSBncm91cCApIHtcblx0XHRcdFx0XHRcdFx0XHQkKCBcIltuYW1lPSdcIiArIHYuZXNjYXBlQ3NzTWV0YSggbmFtZSApICsgXCInXVwiLCB2LmN1cnJlbnRGb3JtIClcblx0XHRcdFx0XHRcdFx0XHRcdC5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiwgZXJyb3IuYXR0ciggXCJpZFwiICkgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCAhbWVzc2FnZSAmJiB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKSB7XG5cdFx0XHRcdGVycm9yLnRleHQoIFwiXCIgKTtcblx0XHRcdFx0aWYgKCB0eXBlb2YgdGhpcy5zZXR0aW5ncy5zdWNjZXNzID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHRcdGVycm9yLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnN1Y2Nlc3MoIGVycm9yLCBlbGVtZW50ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMudG9TaG93ID0gdGhpcy50b1Nob3cuYWRkKCBlcnJvciApO1xuXHRcdH0sXG5cblx0XHRlcnJvcnNGb3I6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0dmFyIG5hbWUgPSB0aGlzLmVzY2FwZUNzc01ldGEoIHRoaXMuaWRPck5hbWUoIGVsZW1lbnQgKSApLFxuXHRcdFx0XHRkZXNjcmliZXIgPSAkKCBlbGVtZW50ICkuYXR0ciggXCJhcmlhLWRlc2NyaWJlZGJ5XCIgKSxcblx0XHRcdFx0c2VsZWN0b3IgPSBcImxhYmVsW2Zvcj0nXCIgKyBuYW1lICsgXCInXSwgbGFiZWxbZm9yPSdcIiArIG5hbWUgKyBcIiddICpcIjtcblxuXHRcdFx0Ly8gJ2FyaWEtZGVzY3JpYmVkYnknIHNob3VsZCBkaXJlY3RseSByZWZlcmVuY2UgdGhlIGVycm9yIGVsZW1lbnRcblx0XHRcdGlmICggZGVzY3JpYmVyICkge1xuXHRcdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yICsgXCIsICNcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggZGVzY3JpYmVyIClcblx0XHRcdFx0XHQucmVwbGFjZSggL1xccysvZywgXCIsICNcIiApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpc1xuXHRcdFx0XHQuZXJyb3JzKClcblx0XHRcdFx0LmZpbHRlciggc2VsZWN0b3IgKTtcblx0XHR9LFxuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vYXBpLmpxdWVyeS5jb20vY2F0ZWdvcnkvc2VsZWN0b3JzLywgZm9yIENTU1xuXHRcdC8vIG1ldGEtY2hhcmFjdGVycyB0aGF0IHNob3VsZCBiZSBlc2NhcGVkIGluIG9yZGVyIHRvIGJlIHVzZWQgd2l0aCBKUXVlcnlcblx0XHQvLyBhcyBhIGxpdGVyYWwgcGFydCBvZiBhIG5hbWUvaWQgb3IgYW55IHNlbGVjdG9yLlxuXHRcdGVzY2FwZUNzc01ldGE6IGZ1bmN0aW9uKCBzdHJpbmcgKSB7XG5cdFx0XHRyZXR1cm4gc3RyaW5nLnJlcGxhY2UoIC8oW1xcXFwhXCIjJCUmJygpKissLi86Ozw9Pj9AXFxbXFxdXmB7fH1+XSkvZywgXCJcXFxcJDFcIiApO1xuXHRcdH0sXG5cblx0XHRpZE9yTmFtZTogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5ncm91cHNbIGVsZW1lbnQubmFtZSBdIHx8ICggdGhpcy5jaGVja2FibGUoIGVsZW1lbnQgKSA/IGVsZW1lbnQubmFtZSA6IGVsZW1lbnQuaWQgfHwgZWxlbWVudC5uYW1lICk7XG5cdFx0fSxcblxuXHRcdHZhbGlkYXRpb25UYXJnZXRGb3I6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBJZiByYWRpby9jaGVja2JveCwgdmFsaWRhdGUgZmlyc3QgZWxlbWVudCBpbiBncm91cCBpbnN0ZWFkXG5cdFx0XHRpZiAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdGVsZW1lbnQgPSB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBbHdheXMgYXBwbHkgaWdub3JlIGZpbHRlclxuXHRcdFx0cmV0dXJuICQoIGVsZW1lbnQgKS5ub3QoIHRoaXMuc2V0dGluZ3MuaWdub3JlIClbIDAgXTtcblx0XHR9LFxuXG5cdFx0Y2hlY2thYmxlOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHJldHVybiAoIC9yYWRpb3xjaGVja2JveC9pICkudGVzdCggZWxlbWVudC50eXBlICk7XG5cdFx0fSxcblxuXHRcdGZpbmRCeU5hbWU6IGZ1bmN0aW9uKCBuYW1lICkge1xuXHRcdFx0cmV0dXJuICQoIHRoaXMuY3VycmVudEZvcm0gKS5maW5kKCBcIltuYW1lPSdcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggbmFtZSApICsgXCInXVwiICk7XG5cdFx0fSxcblxuXHRcdGdldExlbmd0aDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xuXHRcdFx0c3dpdGNoICggZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICkge1xuXHRcdFx0Y2FzZSBcInNlbGVjdFwiOlxuXHRcdFx0XHRyZXR1cm4gJCggXCJvcHRpb246c2VsZWN0ZWRcIiwgZWxlbWVudCApLmxlbmd0aDtcblx0XHRcdGNhc2UgXCJpbnB1dFwiOlxuXHRcdFx0XHRpZiAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkuZmlsdGVyKCBcIjpjaGVja2VkXCIgKS5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cdFx0fSxcblxuXHRcdGRlcGVuZDogZnVuY3Rpb24oIHBhcmFtLCBlbGVtZW50ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZGVwZW5kVHlwZXNbIHR5cGVvZiBwYXJhbSBdID8gdGhpcy5kZXBlbmRUeXBlc1sgdHlwZW9mIHBhcmFtIF0oIHBhcmFtLCBlbGVtZW50ICkgOiB0cnVlO1xuXHRcdH0sXG5cblx0XHRkZXBlbmRUeXBlczoge1xuXHRcdFx0XCJib29sZWFuXCI6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHBhcmFtO1xuXHRcdFx0fSxcblx0XHRcdFwic3RyaW5nXCI6IGZ1bmN0aW9uKCBwYXJhbSwgZWxlbWVudCApIHtcblx0XHRcdFx0cmV0dXJuICEhJCggcGFyYW0sIGVsZW1lbnQuZm9ybSApLmxlbmd0aDtcblx0XHRcdH0sXG5cdFx0XHRcImZ1bmN0aW9uXCI6IGZ1bmN0aW9uKCBwYXJhbSwgZWxlbWVudCApIHtcblx0XHRcdFx0cmV0dXJuIHBhcmFtKCBlbGVtZW50ICk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdG9wdGlvbmFsOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciB2YWwgPSB0aGlzLmVsZW1lbnRWYWx1ZSggZWxlbWVudCApO1xuXHRcdFx0cmV0dXJuICEkLnZhbGlkYXRvci5tZXRob2RzLnJlcXVpcmVkLmNhbGwoIHRoaXMsIHZhbCwgZWxlbWVudCApICYmIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xuXHRcdH0sXG5cblx0XHRzdGFydFJlcXVlc3Q6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYgKCAhdGhpcy5wZW5kaW5nWyBlbGVtZW50Lm5hbWUgXSApIHtcblx0XHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCsrO1xuXHRcdFx0XHQkKCBlbGVtZW50ICkuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MucGVuZGluZ0NsYXNzICk7XG5cdFx0XHRcdHRoaXMucGVuZGluZ1sgZWxlbWVudC5uYW1lIF0gPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRzdG9wUmVxdWVzdDogZnVuY3Rpb24oIGVsZW1lbnQsIHZhbGlkICkge1xuXHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdC0tO1xuXG5cdFx0XHQvLyBTb21ldGltZXMgc3luY2hyb25pemF0aW9uIGZhaWxzLCBtYWtlIHN1cmUgcGVuZGluZ1JlcXVlc3QgaXMgbmV2ZXIgPCAwXG5cdFx0XHRpZiAoIHRoaXMucGVuZGluZ1JlcXVlc3QgPCAwICkge1xuXHRcdFx0XHR0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gMDtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSB0aGlzLnBlbmRpbmdbIGVsZW1lbnQubmFtZSBdO1xuXHRcdFx0JCggZWxlbWVudCApLnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnBlbmRpbmdDbGFzcyApO1xuXHRcdFx0aWYgKCB2YWxpZCAmJiB0aGlzLnBlbmRpbmdSZXF1ZXN0ID09PSAwICYmIHRoaXMuZm9ybVN1Ym1pdHRlZCAmJiB0aGlzLmZvcm0oKSApIHtcblx0XHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLnN1Ym1pdCgpO1xuXHRcdFx0XHR0aGlzLmZvcm1TdWJtaXR0ZWQgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSBpZiAoICF2YWxpZCAmJiB0aGlzLnBlbmRpbmdSZXF1ZXN0ID09PSAwICYmIHRoaXMuZm9ybVN1Ym1pdHRlZCApIHtcblx0XHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLnRyaWdnZXJIYW5kbGVyKCBcImludmFsaWQtZm9ybVwiLCBbIHRoaXMgXSApO1xuXHRcdFx0XHR0aGlzLmZvcm1TdWJtaXR0ZWQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0cHJldmlvdXNWYWx1ZTogZnVuY3Rpb24oIGVsZW1lbnQsIG1ldGhvZCApIHtcblx0XHRcdHJldHVybiAkLmRhdGEoIGVsZW1lbnQsIFwicHJldmlvdXNWYWx1ZVwiICkgfHwgJC5kYXRhKCBlbGVtZW50LCBcInByZXZpb3VzVmFsdWVcIiwge1xuXHRcdFx0XHRvbGQ6IG51bGwsXG5cdFx0XHRcdHZhbGlkOiB0cnVlLFxuXHRcdFx0XHRtZXNzYWdlOiB0aGlzLmRlZmF1bHRNZXNzYWdlKCBlbGVtZW50LCB7IG1ldGhvZDogbWV0aG9kIH0gKVxuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHQvLyBDbGVhbnMgdXAgYWxsIGZvcm1zIGFuZCBlbGVtZW50cywgcmVtb3ZlcyB2YWxpZGF0b3Itc3BlY2lmaWMgZXZlbnRzXG5cdFx0ZGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnJlc2V0Rm9ybSgpO1xuXG5cdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtIClcblx0XHRcdFx0Lm9mZiggXCIudmFsaWRhdGVcIiApXG5cdFx0XHRcdC5yZW1vdmVEYXRhKCBcInZhbGlkYXRvclwiIClcblx0XHRcdFx0LmZpbmQoIFwiLnZhbGlkYXRlLWVxdWFsVG8tYmx1clwiIClcblx0XHRcdFx0XHQub2ZmKCBcIi52YWxpZGF0ZS1lcXVhbFRvXCIgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggXCJ2YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApO1xuXHRcdH1cblxuXHR9LFxuXG5cdGNsYXNzUnVsZVNldHRpbmdzOiB7XG5cdFx0cmVxdWlyZWQ6IHsgcmVxdWlyZWQ6IHRydWUgfSxcblx0XHRlbWFpbDogeyBlbWFpbDogdHJ1ZSB9LFxuXHRcdHVybDogeyB1cmw6IHRydWUgfSxcblx0XHRkYXRlOiB7IGRhdGU6IHRydWUgfSxcblx0XHRkYXRlSVNPOiB7IGRhdGVJU086IHRydWUgfSxcblx0XHRudW1iZXI6IHsgbnVtYmVyOiB0cnVlIH0sXG5cdFx0ZGlnaXRzOiB7IGRpZ2l0czogdHJ1ZSB9LFxuXHRcdGNyZWRpdGNhcmQ6IHsgY3JlZGl0Y2FyZDogdHJ1ZSB9XG5cdH0sXG5cblx0YWRkQ2xhc3NSdWxlczogZnVuY3Rpb24oIGNsYXNzTmFtZSwgcnVsZXMgKSB7XG5cdFx0aWYgKCBjbGFzc05hbWUuY29uc3RydWN0b3IgPT09IFN0cmluZyApIHtcblx0XHRcdHRoaXMuY2xhc3NSdWxlU2V0dGluZ3NbIGNsYXNzTmFtZSBdID0gcnVsZXM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQuZXh0ZW5kKCB0aGlzLmNsYXNzUnVsZVNldHRpbmdzLCBjbGFzc05hbWUgKTtcblx0XHR9XG5cdH0sXG5cblx0Y2xhc3NSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHRjbGFzc2VzID0gJCggZWxlbWVudCApLmF0dHIoIFwiY2xhc3NcIiApO1xuXG5cdFx0aWYgKCBjbGFzc2VzICkge1xuXHRcdFx0JC5lYWNoKCBjbGFzc2VzLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCB0aGlzIGluICQudmFsaWRhdG9yLmNsYXNzUnVsZVNldHRpbmdzICkge1xuXHRcdFx0XHRcdCQuZXh0ZW5kKCBydWxlcywgJC52YWxpZGF0b3IuY2xhc3NSdWxlU2V0dGluZ3NbIHRoaXMgXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXHRcdHJldHVybiBydWxlcztcblx0fSxcblxuXHRub3JtYWxpemVBdHRyaWJ1dGVSdWxlOiBmdW5jdGlvbiggcnVsZXMsIHR5cGUsIG1ldGhvZCwgdmFsdWUgKSB7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSB2YWx1ZSB0byBhIG51bWJlciBmb3IgbnVtYmVyIGlucHV0cywgYW5kIGZvciB0ZXh0IGZvciBiYWNrd2FyZHMgY29tcGFiaWxpdHlcblx0XHQvLyBhbGxvd3MgdHlwZT1cImRhdGVcIiBhbmQgb3RoZXJzIHRvIGJlIGNvbXBhcmVkIGFzIHN0cmluZ3Ncblx0XHRpZiAoIC9taW58bWF4fHN0ZXAvLnRlc3QoIG1ldGhvZCApICYmICggdHlwZSA9PT0gbnVsbCB8fCAvbnVtYmVyfHJhbmdlfHRleHQvLnRlc3QoIHR5cGUgKSApICkge1xuXHRcdFx0dmFsdWUgPSBOdW1iZXIoIHZhbHVlICk7XG5cblx0XHRcdC8vIFN1cHBvcnQgT3BlcmEgTWluaSwgd2hpY2ggcmV0dXJucyBOYU4gZm9yIHVuZGVmaW5lZCBtaW5sZW5ndGhcblx0XHRcdGlmICggaXNOYU4oIHZhbHVlICkgKSB7XG5cdFx0XHRcdHZhbHVlID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICggdmFsdWUgfHwgdmFsdWUgPT09IDAgKSB7XG5cdFx0XHRydWxlc1sgbWV0aG9kIF0gPSB2YWx1ZTtcblx0XHR9IGVsc2UgaWYgKCB0eXBlID09PSBtZXRob2QgJiYgdHlwZSAhPT0gXCJyYW5nZVwiICkge1xuXG5cdFx0XHQvLyBFeGNlcHRpb246IHRoZSBqcXVlcnkgdmFsaWRhdGUgJ3JhbmdlJyBtZXRob2Rcblx0XHRcdC8vIGRvZXMgbm90IHRlc3QgZm9yIHRoZSBodG1sNSAncmFuZ2UnIHR5cGVcblx0XHRcdHJ1bGVzWyBtZXRob2QgXSA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cdGF0dHJpYnV0ZVJ1bGVzOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHR2YXIgcnVsZXMgPSB7fSxcblx0XHRcdCRlbGVtZW50ID0gJCggZWxlbWVudCApLFxuXHRcdFx0dHlwZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCBcInR5cGVcIiApLFxuXHRcdFx0bWV0aG9kLCB2YWx1ZTtcblxuXHRcdGZvciAoIG1ldGhvZCBpbiAkLnZhbGlkYXRvci5tZXRob2RzICkge1xuXG5cdFx0XHQvLyBTdXBwb3J0IGZvciA8aW5wdXQgcmVxdWlyZWQ+IGluIGJvdGggaHRtbDUgYW5kIG9sZGVyIGJyb3dzZXJzXG5cdFx0XHRpZiAoIG1ldGhvZCA9PT0gXCJyZXF1aXJlZFwiICkge1xuXHRcdFx0XHR2YWx1ZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCBtZXRob2QgKTtcblxuXHRcdFx0XHQvLyBTb21lIGJyb3dzZXJzIHJldHVybiBhbiBlbXB0eSBzdHJpbmcgZm9yIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGVcblx0XHRcdFx0Ly8gYW5kIG5vbi1IVE1MNSBicm93c2VycyBtaWdodCBoYXZlIHJlcXVpcmVkPVwiXCIgbWFya3VwXG5cdFx0XHRcdGlmICggdmFsdWUgPT09IFwiXCIgKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRm9yY2Ugbm9uLUhUTUw1IGJyb3dzZXJzIHRvIHJldHVybiBib29sXG5cdFx0XHRcdHZhbHVlID0gISF2YWx1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhbHVlID0gJGVsZW1lbnQuYXR0ciggbWV0aG9kICk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubm9ybWFsaXplQXR0cmlidXRlUnVsZSggcnVsZXMsIHR5cGUsIG1ldGhvZCwgdmFsdWUgKTtcblx0XHR9XG5cblx0XHQvLyAnbWF4bGVuZ3RoJyBtYXkgYmUgcmV0dXJuZWQgYXMgLTEsIDIxNDc0ODM2NDcgKCBJRSApIGFuZCA1MjQyODggKCBzYWZhcmkgKSBmb3IgdGV4dCBpbnB1dHNcblx0XHRpZiAoIHJ1bGVzLm1heGxlbmd0aCAmJiAvLTF8MjE0NzQ4MzY0N3w1MjQyODgvLnRlc3QoIHJ1bGVzLm1heGxlbmd0aCApICkge1xuXHRcdFx0ZGVsZXRlIHJ1bGVzLm1heGxlbmd0aDtcblx0XHR9XG5cblx0XHRyZXR1cm4gcnVsZXM7XG5cdH0sXG5cblx0ZGF0YVJ1bGVzOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHR2YXIgcnVsZXMgPSB7fSxcblx0XHRcdCRlbGVtZW50ID0gJCggZWxlbWVudCApLFxuXHRcdFx0dHlwZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCBcInR5cGVcIiApLFxuXHRcdFx0bWV0aG9kLCB2YWx1ZTtcblxuXHRcdGZvciAoIG1ldGhvZCBpbiAkLnZhbGlkYXRvci5tZXRob2RzICkge1xuXHRcdFx0dmFsdWUgPSAkZWxlbWVudC5kYXRhKCBcInJ1bGVcIiArIG1ldGhvZC5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICsgbWV0aG9kLnN1YnN0cmluZyggMSApLnRvTG93ZXJDYXNlKCkgKTtcblx0XHRcdHRoaXMubm9ybWFsaXplQXR0cmlidXRlUnVsZSggcnVsZXMsIHR5cGUsIG1ldGhvZCwgdmFsdWUgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdHN0YXRpY1J1bGVzOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHR2YXIgcnVsZXMgPSB7fSxcblx0XHRcdHZhbGlkYXRvciA9ICQuZGF0YSggZWxlbWVudC5mb3JtLCBcInZhbGlkYXRvclwiICk7XG5cblx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5ydWxlcyApIHtcblx0XHRcdHJ1bGVzID0gJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggdmFsaWRhdG9yLnNldHRpbmdzLnJ1bGVzWyBlbGVtZW50Lm5hbWUgXSApIHx8IHt9O1xuXHRcdH1cblx0XHRyZXR1cm4gcnVsZXM7XG5cdH0sXG5cblx0bm9ybWFsaXplUnVsZXM6IGZ1bmN0aW9uKCBydWxlcywgZWxlbWVudCApIHtcblxuXHRcdC8vIEhhbmRsZSBkZXBlbmRlbmN5IGNoZWNrXG5cdFx0JC5lYWNoKCBydWxlcywgZnVuY3Rpb24oIHByb3AsIHZhbCApIHtcblxuXHRcdFx0Ly8gSWdub3JlIHJ1bGUgd2hlbiBwYXJhbSBpcyBleHBsaWNpdGx5IGZhbHNlLCBlZy4gcmVxdWlyZWQ6ZmFsc2Vcblx0XHRcdGlmICggdmFsID09PSBmYWxzZSApIHtcblx0XHRcdFx0ZGVsZXRlIHJ1bGVzWyBwcm9wIF07XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmICggdmFsLnBhcmFtIHx8IHZhbC5kZXBlbmRzICkge1xuXHRcdFx0XHR2YXIga2VlcFJ1bGUgPSB0cnVlO1xuXHRcdFx0XHRzd2l0Y2ggKCB0eXBlb2YgdmFsLmRlcGVuZHMgKSB7XG5cdFx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcblx0XHRcdFx0XHRrZWVwUnVsZSA9ICEhJCggdmFsLmRlcGVuZHMsIGVsZW1lbnQuZm9ybSApLmxlbmd0aDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdFx0a2VlcFJ1bGUgPSB2YWwuZGVwZW5kcy5jYWxsKCBlbGVtZW50LCBlbGVtZW50ICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBrZWVwUnVsZSApIHtcblx0XHRcdFx0XHRydWxlc1sgcHJvcCBdID0gdmFsLnBhcmFtICE9PSB1bmRlZmluZWQgPyB2YWwucGFyYW0gOiB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQuZGF0YSggZWxlbWVudC5mb3JtLCBcInZhbGlkYXRvclwiICkucmVzZXRFbGVtZW50cyggJCggZWxlbWVudCApICk7XG5cdFx0XHRcdFx0ZGVsZXRlIHJ1bGVzWyBwcm9wIF07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHQvLyBFdmFsdWF0ZSBwYXJhbWV0ZXJzXG5cdFx0JC5lYWNoKCBydWxlcywgZnVuY3Rpb24oIHJ1bGUsIHBhcmFtZXRlciApIHtcblx0XHRcdHJ1bGVzWyBydWxlIF0gPSAkLmlzRnVuY3Rpb24oIHBhcmFtZXRlciApICYmIHJ1bGUgIT09IFwibm9ybWFsaXplclwiID8gcGFyYW1ldGVyKCBlbGVtZW50ICkgOiBwYXJhbWV0ZXI7XG5cdFx0fSApO1xuXG5cdFx0Ly8gQ2xlYW4gbnVtYmVyIHBhcmFtZXRlcnNcblx0XHQkLmVhY2goIFsgXCJtaW5sZW5ndGhcIiwgXCJtYXhsZW5ndGhcIiBdLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggcnVsZXNbIHRoaXMgXSApIHtcblx0XHRcdFx0cnVsZXNbIHRoaXMgXSA9IE51bWJlciggcnVsZXNbIHRoaXMgXSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0XHQkLmVhY2goIFsgXCJyYW5nZWxlbmd0aFwiLCBcInJhbmdlXCIgXSwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcGFydHM7XG5cdFx0XHRpZiAoIHJ1bGVzWyB0aGlzIF0gKSB7XG5cdFx0XHRcdGlmICggJC5pc0FycmF5KCBydWxlc1sgdGhpcyBdICkgKSB7XG5cdFx0XHRcdFx0cnVsZXNbIHRoaXMgXSA9IFsgTnVtYmVyKCBydWxlc1sgdGhpcyBdWyAwIF0gKSwgTnVtYmVyKCBydWxlc1sgdGhpcyBdWyAxIF0gKSBdO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCB0eXBlb2YgcnVsZXNbIHRoaXMgXSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0XHRwYXJ0cyA9IHJ1bGVzWyB0aGlzIF0ucmVwbGFjZSggL1tcXFtcXF1dL2csIFwiXCIgKS5zcGxpdCggL1tcXHMsXSsvICk7XG5cdFx0XHRcdFx0cnVsZXNbIHRoaXMgXSA9IFsgTnVtYmVyKCBwYXJ0c1sgMCBdICksIE51bWJlciggcGFydHNbIDEgXSApIF07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRpZiAoICQudmFsaWRhdG9yLmF1dG9DcmVhdGVSYW5nZXMgKSB7XG5cblx0XHRcdC8vIEF1dG8tY3JlYXRlIHJhbmdlc1xuXHRcdFx0aWYgKCBydWxlcy5taW4gIT0gbnVsbCAmJiBydWxlcy5tYXggIT0gbnVsbCApIHtcblx0XHRcdFx0cnVsZXMucmFuZ2UgPSBbIHJ1bGVzLm1pbiwgcnVsZXMubWF4IF07XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5taW47XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5tYXg7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHJ1bGVzLm1pbmxlbmd0aCAhPSBudWxsICYmIHJ1bGVzLm1heGxlbmd0aCAhPSBudWxsICkge1xuXHRcdFx0XHRydWxlcy5yYW5nZWxlbmd0aCA9IFsgcnVsZXMubWlubGVuZ3RoLCBydWxlcy5tYXhsZW5ndGggXTtcblx0XHRcdFx0ZGVsZXRlIHJ1bGVzLm1pbmxlbmd0aDtcblx0XHRcdFx0ZGVsZXRlIHJ1bGVzLm1heGxlbmd0aDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcnVsZXM7XG5cdH0sXG5cblx0Ly8gQ29udmVydHMgYSBzaW1wbGUgc3RyaW5nIHRvIGEge3N0cmluZzogdHJ1ZX0gcnVsZSwgZS5nLiwgXCJyZXF1aXJlZFwiIHRvIHtyZXF1aXJlZDp0cnVlfVxuXHRub3JtYWxpemVSdWxlOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRpZiAoIHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0dmFyIHRyYW5zZm9ybWVkID0ge307XG5cdFx0XHQkLmVhY2goIGRhdGEuc3BsaXQoIC9cXHMvICksIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0cmFuc2Zvcm1lZFsgdGhpcyBdID0gdHJ1ZTtcblx0XHRcdH0gKTtcblx0XHRcdGRhdGEgPSB0cmFuc2Zvcm1lZDtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH0sXG5cblx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2pRdWVyeS52YWxpZGF0b3IuYWRkTWV0aG9kL1xuXHRhZGRNZXRob2Q6IGZ1bmN0aW9uKCBuYW1lLCBtZXRob2QsIG1lc3NhZ2UgKSB7XG5cdFx0JC52YWxpZGF0b3IubWV0aG9kc1sgbmFtZSBdID0gbWV0aG9kO1xuXHRcdCQudmFsaWRhdG9yLm1lc3NhZ2VzWyBuYW1lIF0gPSBtZXNzYWdlICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlIDogJC52YWxpZGF0b3IubWVzc2FnZXNbIG5hbWUgXTtcblx0XHRpZiAoIG1ldGhvZC5sZW5ndGggPCAzICkge1xuXHRcdFx0JC52YWxpZGF0b3IuYWRkQ2xhc3NSdWxlcyggbmFtZSwgJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggbmFtZSApICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9qUXVlcnkudmFsaWRhdG9yLm1ldGhvZHMvXG5cdG1ldGhvZHM6IHtcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yZXF1aXJlZC1tZXRob2QvXG5cdFx0cmVxdWlyZWQ6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cblx0XHRcdC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgaXMgbWV0XG5cdFx0XHRpZiAoICF0aGlzLmRlcGVuZCggcGFyYW0sIGVsZW1lbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwic2VsZWN0XCIgKSB7XG5cblx0XHRcdFx0Ly8gQ291bGQgYmUgYW4gYXJyYXkgZm9yIHNlbGVjdC1tdWx0aXBsZSBvciBhIHN0cmluZywgYm90aCBhcmUgZmluZSB0aGlzIHdheVxuXHRcdFx0XHR2YXIgdmFsID0gJCggZWxlbWVudCApLnZhbCgpO1xuXHRcdFx0XHRyZXR1cm4gdmFsICYmIHZhbC5sZW5ndGggPiAwO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICkgPiAwO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlLmxlbmd0aCA+IDA7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9lbWFpbC1tZXRob2QvXG5cdFx0ZW1haWw6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblxuXHRcdFx0Ly8gRnJvbSBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9mb3Jtcy5odG1sI3ZhbGlkLWUtbWFpbC1hZGRyZXNzXG5cdFx0XHQvLyBSZXRyaWV2ZWQgMjAxNC0wMS0xNFxuXHRcdFx0Ly8gSWYgeW91IGhhdmUgYSBwcm9ibGVtIHdpdGggdGhpcyBpbXBsZW1lbnRhdGlvbiwgcmVwb3J0IGEgYnVnIGFnYWluc3QgdGhlIGFib3ZlIHNwZWNcblx0XHRcdC8vIE9yIHVzZSBjdXN0b20gbWV0aG9kcyB0byBpbXBsZW1lbnQgeW91ciBvd24gZW1haWwgdmFsaWRhdGlvblxuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAvXlthLXpBLVowLTkuISMkJSYnKitcXC89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSokLy50ZXN0KCB2YWx1ZSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvdXJsLW1ldGhvZC9cblx0XHR1cmw6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblxuXHRcdFx0Ly8gQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgRGllZ28gUGVyaW5pLCBNSVQgbGljZW5zZWRcblx0XHRcdC8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2RwZXJpbmkvNzI5Mjk0XG5cdFx0XHQvLyBzZWUgYWxzbyBodHRwczovL21hdGhpYXNieW5lbnMuYmUvZGVtby91cmwtcmVnZXhcblx0XHRcdC8vIG1vZGlmaWVkIHRvIGFsbG93IHByb3RvY29sLXJlbGF0aXZlIFVSTHNcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL14oPzooPzooPzpodHRwcz98ZnRwKTopP1xcL1xcLykoPzpcXFMrKD86OlxcUyopP0ApPyg/Oig/ISg/OjEwfDEyNykoPzpcXC5cXGR7MSwzfSl7M30pKD8hKD86MTY5XFwuMjU0fDE5MlxcLjE2OCkoPzpcXC5cXGR7MSwzfSl7Mn0pKD8hMTcyXFwuKD86MVs2LTldfDJcXGR8M1swLTFdKSg/OlxcLlxcZHsxLDN9KXsyfSkoPzpbMS05XVxcZD98MVxcZFxcZHwyWzAxXVxcZHwyMlswLTNdKSg/OlxcLig/OjE/XFxkezEsMn18MlswLTRdXFxkfDI1WzAtNV0pKXsyfSg/OlxcLig/OlsxLTldXFxkP3wxXFxkXFxkfDJbMC00XVxcZHwyNVswLTRdKSl8KD86KD86W2EtelxcdTAwYTEtXFx1ZmZmZjAtOV0tKikqW2EtelxcdTAwYTEtXFx1ZmZmZjAtOV0rKSg/OlxcLig/OlthLXpcXHUwMGExLVxcdWZmZmYwLTldLSopKlthLXpcXHUwMGExLVxcdWZmZmYwLTldKykqKD86XFwuKD86W2EtelxcdTAwYTEtXFx1ZmZmZl17Mix9KSkuPykoPzo6XFxkezIsNX0pPyg/OlsvPyNdXFxTKik/JC9pLnRlc3QoIHZhbHVlICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9kYXRlLW1ldGhvZC9cblx0XHRkYXRlOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICEvSW52YWxpZHxOYU4vLnRlc3QoIG5ldyBEYXRlKCB2YWx1ZSApLnRvU3RyaW5nKCkgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2RhdGVJU08tbWV0aG9kL1xuXHRcdGRhdGVJU086IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15cXGR7NH1bXFwvXFwtXSgwP1sxLTldfDFbMDEyXSlbXFwvXFwtXSgwP1sxLTldfFsxMl1bMC05XXwzWzAxXSkkLy50ZXN0KCB2YWx1ZSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbnVtYmVyLW1ldGhvZC9cblx0XHRudW1iZXI6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL14oPzotP1xcZCt8LT9cXGR7MSwzfSg/OixcXGR7M30pKyk/KD86XFwuXFxkKyk/JC8udGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2RpZ2l0cy1tZXRob2QvXG5cdFx0ZGlnaXRzOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eXFxkKyQvLnRlc3QoIHZhbHVlICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHA6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9taW5sZW5ndGgtbWV0aG9kL1xuXHRcdG1pbmxlbmd0aDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHZhciBsZW5ndGggPSAkLmlzQXJyYXkoIHZhbHVlICkgPyB2YWx1ZS5sZW5ndGggOiB0aGlzLmdldExlbmd0aCggdmFsdWUsIGVsZW1lbnQgKTtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgbGVuZ3RoID49IHBhcmFtO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbWF4bGVuZ3RoLW1ldGhvZC9cblx0XHRtYXhsZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHR2YXIgbGVuZ3RoID0gJC5pc0FycmF5KCB2YWx1ZSApID8gdmFsdWUubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IGxlbmd0aCA8PSBwYXJhbTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3JhbmdlbGVuZ3RoLW1ldGhvZC9cblx0XHRyYW5nZWxlbmd0aDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHZhciBsZW5ndGggPSAkLmlzQXJyYXkoIHZhbHVlICkgPyB2YWx1ZS5sZW5ndGggOiB0aGlzLmdldExlbmd0aCggdmFsdWUsIGVsZW1lbnQgKTtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgKCBsZW5ndGggPj0gcGFyYW1bIDAgXSAmJiBsZW5ndGggPD0gcGFyYW1bIDEgXSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbWluLW1ldGhvZC9cblx0XHRtaW46IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbHVlID49IHBhcmFtO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbWF4LW1ldGhvZC9cblx0XHRtYXg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbHVlIDw9IHBhcmFtO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcmFuZ2UtbWV0aG9kL1xuXHRcdHJhbmdlOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAoIHZhbHVlID49IHBhcmFtWyAwIF0gJiYgdmFsdWUgPD0gcGFyYW1bIDEgXSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvc3RlcC1tZXRob2QvXG5cdFx0c3RlcDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHZhciB0eXBlID0gJCggZWxlbWVudCApLmF0dHIoIFwidHlwZVwiICksXG5cdFx0XHRcdGVycm9yTWVzc2FnZSA9IFwiU3RlcCBhdHRyaWJ1dGUgb24gaW5wdXQgdHlwZSBcIiArIHR5cGUgKyBcIiBpcyBub3Qgc3VwcG9ydGVkLlwiLFxuXHRcdFx0XHRzdXBwb3J0ZWRUeXBlcyA9IFsgXCJ0ZXh0XCIsIFwibnVtYmVyXCIsIFwicmFuZ2VcIiBdLFxuXHRcdFx0XHRyZSA9IG5ldyBSZWdFeHAoIFwiXFxcXGJcIiArIHR5cGUgKyBcIlxcXFxiXCIgKSxcblx0XHRcdFx0bm90U3VwcG9ydGVkID0gdHlwZSAmJiAhcmUudGVzdCggc3VwcG9ydGVkVHlwZXMuam9pbigpICk7XG5cblx0XHRcdC8vIFdvcmtzIG9ubHkgZm9yIHRleHQsIG51bWJlciBhbmQgcmFuZ2UgaW5wdXQgdHlwZXNcblx0XHRcdC8vIFRPRE8gZmluZCBhIHdheSB0byBzdXBwb3J0IGlucHV0IHR5cGVzIGRhdGUsIGRhdGV0aW1lLCBkYXRldGltZS1sb2NhbCwgbW9udGgsIHRpbWUgYW5kIHdlZWtcblx0XHRcdGlmICggbm90U3VwcG9ydGVkICkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIGVycm9yTWVzc2FnZSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAoIHZhbHVlICUgcGFyYW0gPT09IDAgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2VxdWFsVG8tbWV0aG9kL1xuXHRcdGVxdWFsVG86IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cblx0XHRcdC8vIEJpbmQgdG8gdGhlIGJsdXIgZXZlbnQgb2YgdGhlIHRhcmdldCBpbiBvcmRlciB0byByZXZhbGlkYXRlIHdoZW5ldmVyIHRoZSB0YXJnZXQgZmllbGQgaXMgdXBkYXRlZFxuXHRcdFx0dmFyIHRhcmdldCA9ICQoIHBhcmFtICk7XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Mub25mb2N1c291dCAmJiB0YXJnZXQubm90KCBcIi52YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApLmxlbmd0aCApIHtcblx0XHRcdFx0dGFyZ2V0LmFkZENsYXNzKCBcInZhbGlkYXRlLWVxdWFsVG8tYmx1clwiICkub24oIFwiYmx1ci52YWxpZGF0ZS1lcXVhbFRvXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQoIGVsZW1lbnQgKS52YWxpZCgpO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWUgPT09IHRhcmdldC52YWwoKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cDovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3JlbW90ZS1tZXRob2QvXG5cdFx0cmVtb3RlOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtLCBtZXRob2QgKSB7XG5cdFx0XHRpZiAoIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xuXHRcdFx0fVxuXG5cdFx0XHRtZXRob2QgPSB0eXBlb2YgbWV0aG9kID09PSBcInN0cmluZ1wiICYmIG1ldGhvZCB8fCBcInJlbW90ZVwiO1xuXG5cdFx0XHR2YXIgcHJldmlvdXMgPSB0aGlzLnByZXZpb3VzVmFsdWUoIGVsZW1lbnQsIG1ldGhvZCApLFxuXHRcdFx0XHR2YWxpZGF0b3IsIGRhdGEsIG9wdGlvbkRhdGFTdHJpbmc7XG5cblx0XHRcdGlmICggIXRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdICkge1xuXHRcdFx0XHR0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0cHJldmlvdXMub3JpZ2luYWxNZXNzYWdlID0gcHJldmlvdXMub3JpZ2luYWxNZXNzYWdlIHx8IHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdWyBtZXRob2QgXTtcblx0XHRcdHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdWyBtZXRob2QgXSA9IHByZXZpb3VzLm1lc3NhZ2U7XG5cblx0XHRcdHBhcmFtID0gdHlwZW9mIHBhcmFtID09PSBcInN0cmluZ1wiICYmIHsgdXJsOiBwYXJhbSB9IHx8IHBhcmFtO1xuXHRcdFx0b3B0aW9uRGF0YVN0cmluZyA9ICQucGFyYW0oICQuZXh0ZW5kKCB7IGRhdGE6IHZhbHVlIH0sIHBhcmFtLmRhdGEgKSApO1xuXHRcdFx0aWYgKCBwcmV2aW91cy5vbGQgPT09IG9wdGlvbkRhdGFTdHJpbmcgKSB7XG5cdFx0XHRcdHJldHVybiBwcmV2aW91cy52YWxpZDtcblx0XHRcdH1cblxuXHRcdFx0cHJldmlvdXMub2xkID0gb3B0aW9uRGF0YVN0cmluZztcblx0XHRcdHZhbGlkYXRvciA9IHRoaXM7XG5cdFx0XHR0aGlzLnN0YXJ0UmVxdWVzdCggZWxlbWVudCApO1xuXHRcdFx0ZGF0YSA9IHt9O1xuXHRcdFx0ZGF0YVsgZWxlbWVudC5uYW1lIF0gPSB2YWx1ZTtcblx0XHRcdCQuYWpheCggJC5leHRlbmQoIHRydWUsIHtcblx0XHRcdFx0bW9kZTogXCJhYm9ydFwiLFxuXHRcdFx0XHRwb3J0OiBcInZhbGlkYXRlXCIgKyBlbGVtZW50Lm5hbWUsXG5cdFx0XHRcdGRhdGFUeXBlOiBcImpzb25cIixcblx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0Y29udGV4dDogdmFsaWRhdG9yLmN1cnJlbnRGb3JtLFxuXHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG5cdFx0XHRcdFx0dmFyIHZhbGlkID0gcmVzcG9uc2UgPT09IHRydWUgfHwgcmVzcG9uc2UgPT09IFwidHJ1ZVwiLFxuXHRcdFx0XHRcdFx0ZXJyb3JzLCBtZXNzYWdlLCBzdWJtaXR0ZWQ7XG5cblx0XHRcdFx0XHR2YWxpZGF0b3Iuc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdWyBtZXRob2QgXSA9IHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZTtcblx0XHRcdFx0XHRpZiAoIHZhbGlkICkge1xuXHRcdFx0XHRcdFx0c3VibWl0dGVkID0gdmFsaWRhdG9yLmZvcm1TdWJtaXR0ZWQ7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IucmVzZXRJbnRlcm5hbHMoKTtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci50b0hpZGUgPSB2YWxpZGF0b3IuZXJyb3JzRm9yKCBlbGVtZW50ICk7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IuZm9ybVN1Ym1pdHRlZCA9IHN1Ym1pdHRlZDtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5zdWNjZXNzTGlzdC5wdXNoKCBlbGVtZW50ICk7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IuaW52YWxpZFsgZWxlbWVudC5uYW1lIF0gPSBmYWxzZTtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5zaG93RXJyb3JzKCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVycm9ycyA9IHt9O1xuXHRcdFx0XHRcdFx0bWVzc2FnZSA9IHJlc3BvbnNlIHx8IHZhbGlkYXRvci5kZWZhdWx0TWVzc2FnZSggZWxlbWVudCwgeyBtZXRob2Q6IG1ldGhvZCwgcGFyYW1ldGVyczogdmFsdWUgfSApO1xuXHRcdFx0XHRcdFx0ZXJyb3JzWyBlbGVtZW50Lm5hbWUgXSA9IHByZXZpb3VzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmludmFsaWRbIGVsZW1lbnQubmFtZSBdID0gdHJ1ZTtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5zaG93RXJyb3JzKCBlcnJvcnMgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cHJldmlvdXMudmFsaWQgPSB2YWxpZDtcblx0XHRcdFx0XHR2YWxpZGF0b3Iuc3RvcFJlcXVlc3QoIGVsZW1lbnQsIHZhbGlkICk7XG5cdFx0XHRcdH1cblx0XHRcdH0sIHBhcmFtICkgKTtcblx0XHRcdHJldHVybiBcInBlbmRpbmdcIjtcblx0XHR9XG5cdH1cblxufSApO1xuXHJcbi8vIEFqYXggbW9kZTogYWJvcnRcbi8vIHVzYWdlOiAkLmFqYXgoeyBtb2RlOiBcImFib3J0XCJbLCBwb3J0OiBcInVuaXF1ZXBvcnRcIl19KTtcbi8vIGlmIG1vZGU6XCJhYm9ydFwiIGlzIHVzZWQsIHRoZSBwcmV2aW91cyByZXF1ZXN0IG9uIHRoYXQgcG9ydCAocG9ydCBjYW4gYmUgdW5kZWZpbmVkKSBpcyBhYm9ydGVkIHZpYSBYTUxIdHRwUmVxdWVzdC5hYm9ydCgpXG5cbnZhciBwZW5kaW5nUmVxdWVzdHMgPSB7fSxcblx0YWpheDtcblxuLy8gVXNlIGEgcHJlZmlsdGVyIGlmIGF2YWlsYWJsZSAoMS41KylcbmlmICggJC5hamF4UHJlZmlsdGVyICkge1xuXHQkLmFqYXhQcmVmaWx0ZXIoIGZ1bmN0aW9uKCBzZXR0aW5ncywgXywgeGhyICkge1xuXHRcdHZhciBwb3J0ID0gc2V0dGluZ3MucG9ydDtcblx0XHRpZiAoIHNldHRpbmdzLm1vZGUgPT09IFwiYWJvcnRcIiApIHtcblx0XHRcdGlmICggcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gKSB7XG5cdFx0XHRcdHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdLmFib3J0KCk7XG5cdFx0XHR9XG5cdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSA9IHhocjtcblx0XHR9XG5cdH0gKTtcbn0gZWxzZSB7XG5cblx0Ly8gUHJveHkgYWpheFxuXHRhamF4ID0gJC5hamF4O1xuXHQkLmFqYXggPSBmdW5jdGlvbiggc2V0dGluZ3MgKSB7XG5cdFx0dmFyIG1vZGUgPSAoIFwibW9kZVwiIGluIHNldHRpbmdzID8gc2V0dGluZ3MgOiAkLmFqYXhTZXR0aW5ncyApLm1vZGUsXG5cdFx0XHRwb3J0ID0gKCBcInBvcnRcIiBpbiBzZXR0aW5ncyA/IHNldHRpbmdzIDogJC5hamF4U2V0dGluZ3MgKS5wb3J0O1xuXHRcdGlmICggbW9kZSA9PT0gXCJhYm9ydFwiICkge1xuXHRcdFx0aWYgKCBwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSApIHtcblx0XHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0uYWJvcnQoKTtcblx0XHRcdH1cblx0XHRcdHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdID0gYWpheC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm4gcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF07XG5cdFx0fVxuXHRcdHJldHVybiBhamF4LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fTtcbn1cblxyXG59KSk7XHJcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLyohXG4qIEZpdFZpZHMgMS4xXG4qXG4qIENvcHlyaWdodCAyMDEzLCBDaHJpcyBDb3lpZXIgLSBodHRwOi8vY3NzLXRyaWNrcy5jb20gKyBEYXZlIFJ1cGVydCAtIGh0dHA6Ly9kYXZlcnVwZXJ0LmNvbVxuKiBDcmVkaXQgdG8gVGhpZXJyeSBLb2JsZW50eiAtIGh0dHA6Ly93d3cuYWxpc3RhcGFydC5jb20vYXJ0aWNsZXMvY3JlYXRpbmctaW50cmluc2ljLXJhdGlvcy1mb3ItdmlkZW8vXG4qIFJlbGVhc2VkIHVuZGVyIHRoZSBXVEZQTCBsaWNlbnNlIC0gaHR0cDovL3NhbS56b3kub3JnL3d0ZnBsL1xuKlxuKi9cblxuOyhmdW5jdGlvbiggJCApe1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAkLmZuLmZpdFZpZHMgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICBjdXN0b21TZWxlY3RvcjogbnVsbCxcbiAgICAgIGlnbm9yZTogbnVsbFxuICAgIH07XG5cbiAgICBpZighZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpdC12aWRzLXN0eWxlJykpIHtcbiAgICAgIC8vIGFwcGVuZFN0eWxlczogaHR0cHM6Ly9naXRodWIuY29tL3RvZGRtb3R0by9mbHVpZHZpZHMvYmxvYi9tYXN0ZXIvZGlzdC9mbHVpZHZpZHMuanNcbiAgICAgIHZhciBoZWFkID0gZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgICAgdmFyIGNzcyA9ICcuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlcnt3aWR0aDoxMDAlO3Bvc2l0aW9uOnJlbGF0aXZlO3BhZGRpbmc6MDt9LmZsdWlkLXdpZHRoLXZpZGVvLXdyYXBwZXIgaWZyYW1lLC5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyIG9iamVjdCwuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlciBlbWJlZCB7cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7bGVmdDowO3dpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7fSc7XG4gICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGRpdi5pbm5lckhUTUwgPSAnPHA+eDwvcD48c3R5bGUgaWQ9XCJmaXQtdmlkcy1zdHlsZVwiPicgKyBjc3MgKyAnPC9zdHlsZT4nO1xuICAgICAgaGVhZC5hcHBlbmRDaGlsZChkaXYuY2hpbGROb2Rlc1sxXSk7XG4gICAgfVxuXG4gICAgaWYgKCBvcHRpb25zICkge1xuICAgICAgJC5leHRlbmQoIHNldHRpbmdzLCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyIHNlbGVjdG9ycyA9IFtcbiAgICAgICAgJ2lmcmFtZVtzcmMqPVwicGxheWVyLnZpbWVvLmNvbVwiXScsXG4gICAgICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJyxcbiAgICAgICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS1ub2Nvb2tpZS5jb21cIl0nLFxuICAgICAgICAnaWZyYW1lW3NyYyo9XCJraWNrc3RhcnRlci5jb21cIl1bc3JjKj1cInZpZGVvLmh0bWxcIl0nLFxuICAgICAgICAnb2JqZWN0JyxcbiAgICAgICAgJ2VtYmVkJ1xuICAgICAgXTtcblxuICAgICAgaWYgKHNldHRpbmdzLmN1c3RvbVNlbGVjdG9yKSB7XG4gICAgICAgIHNlbGVjdG9ycy5wdXNoKHNldHRpbmdzLmN1c3RvbVNlbGVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlnbm9yZUxpc3QgPSAnLmZpdHZpZHNpZ25vcmUnO1xuXG4gICAgICBpZihzZXR0aW5ncy5pZ25vcmUpIHtcbiAgICAgICAgaWdub3JlTGlzdCA9IGlnbm9yZUxpc3QgKyAnLCAnICsgc2V0dGluZ3MuaWdub3JlO1xuICAgICAgfVxuXG4gICAgICB2YXIgJGFsbFZpZGVvcyA9ICQodGhpcykuZmluZChzZWxlY3RvcnMuam9pbignLCcpKTtcbiAgICAgICRhbGxWaWRlb3MgPSAkYWxsVmlkZW9zLm5vdCgnb2JqZWN0IG9iamVjdCcpOyAvLyBTd2ZPYmogY29uZmxpY3QgcGF0Y2hcbiAgICAgICRhbGxWaWRlb3MgPSAkYWxsVmlkZW9zLm5vdChpZ25vcmVMaXN0KTsgLy8gRGlzYWJsZSBGaXRWaWRzIG9uIHRoaXMgdmlkZW8uXG5cbiAgICAgICRhbGxWaWRlb3MuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICBpZigkdGhpcy5wYXJlbnRzKGlnbm9yZUxpc3QpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm47IC8vIERpc2FibGUgRml0VmlkcyBvbiB0aGlzIHZpZGVvLlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2VtYmVkJyAmJiAkdGhpcy5wYXJlbnQoJ29iamVjdCcpLmxlbmd0aCB8fCAkdGhpcy5wYXJlbnQoJy5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyJykubGVuZ3RoKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoKCEkdGhpcy5jc3MoJ2hlaWdodCcpICYmICEkdGhpcy5jc3MoJ3dpZHRoJykpICYmIChpc05hTigkdGhpcy5hdHRyKCdoZWlnaHQnKSkgfHwgaXNOYU4oJHRoaXMuYXR0cignd2lkdGgnKSkpKVxuICAgICAgICB7XG4gICAgICAgICAgJHRoaXMuYXR0cignaGVpZ2h0JywgOSk7XG4gICAgICAgICAgJHRoaXMuYXR0cignd2lkdGgnLCAxNik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhlaWdodCA9ICggdGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdvYmplY3QnIHx8ICgkdGhpcy5hdHRyKCdoZWlnaHQnKSAmJiAhaXNOYU4ocGFyc2VJbnQoJHRoaXMuYXR0cignaGVpZ2h0JyksIDEwKSkpICkgPyBwYXJzZUludCgkdGhpcy5hdHRyKCdoZWlnaHQnKSwgMTApIDogJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICB3aWR0aCA9ICFpc05hTihwYXJzZUludCgkdGhpcy5hdHRyKCd3aWR0aCcpLCAxMCkpID8gcGFyc2VJbnQoJHRoaXMuYXR0cignd2lkdGgnKSwgMTApIDogJHRoaXMud2lkdGgoKSxcbiAgICAgICAgICAgIGFzcGVjdFJhdGlvID0gaGVpZ2h0IC8gd2lkdGg7XG4gICAgICAgIGlmKCEkdGhpcy5hdHRyKCduYW1lJykpe1xuICAgICAgICAgIHZhciB2aWRlb05hbWUgPSAnZml0dmlkJyArICQuZm4uZml0Vmlkcy5fY291bnQ7XG4gICAgICAgICAgJHRoaXMuYXR0cignbmFtZScsIHZpZGVvTmFtZSk7XG4gICAgICAgICAgJC5mbi5maXRWaWRzLl9jb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgICR0aGlzLndyYXAoJzxkaXYgY2xhc3M9XCJmbHVpZC13aWR0aC12aWRlby13cmFwcGVyXCI+PC9kaXY+JykucGFyZW50KCcuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlcicpLmNzcygncGFkZGluZy10b3AnLCAoYXNwZWN0UmF0aW8gKiAxMDApKyclJyk7XG4gICAgICAgICR0aGlzLnJlbW92ZUF0dHIoJ2hlaWdodCcpLnJlbW92ZUF0dHIoJ3dpZHRoJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBjb3VudGVyIGZvciB1bmlxdWUgdmlkZW8gbmFtZXMuXG4gICQuZm4uZml0Vmlkcy5fY291bnQgPSAwO1xuXG59KSggalF1ZXJ5ICk7IiwiLyoqXG4gKiBAZmlsZVxuICogSW5pdGlhbGl6YXRpb24gc2NyaXB0IGZvciBnbG9iYWwgcHJvY2Vzc2VzXG4gKi9cblxuKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcblxuLyoqXG4gKlxuICogSW5pdGlhbGl6ZSBmaXRWaWQgZm9yIFlvdVR1YmUgdmllb3MuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cblxuXHREcnVwYWwuYmVoYXZpb3JzLmZpdHZpZGluaXQgPSB7XG5cdCBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuXHRcdFx0KGZ1bmN0aW9uICgkKSB7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0JCgnLnZpZGVvLWNvbnRhaW5lcicpLmZpdFZpZHMoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KShqUXVlcnkpO1xuXHRcdH1cblx0fTtcblxufSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogSW50ZXJhY3Rpb25zIGZvciBmb3JtIHZhbGlkYXRpb24uXG4gKiBSZWZlcmVuY2UgaHR0cDovL2NvZGVwZW4uaW8vYW5vbi9wZW4vR0hLSmpcbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuXG4oZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICBEcnVwYWwuYmVoYXZpb3JzLmZvcm1pdGVtcyA9IHtcbiAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAvLyBWYWxpZGF0ZSBmb3JtXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAvLyBWYWxpZGF0ZSBvbiBwYWdlIGxvYWRcbiAgICAgICAgJCgnLnNpbXBsZS1zdGVwLWZvcm0sIC5tdWx0aS1zdGVwLWZvcm0nKS52YWxpZGF0ZSh7XG4gICAgICAgICAgcnVsZXM6IHtcbiAgICAgICAgICAgIHRlbDoge1xuICAgICAgICAgICAgICBudW1iZXI6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGlnbm9yZTogJzpoaWRkZW4nXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE11bHRpIHN0ZXAgZm9ybSBuZXh0IGxpbmtcbiAgICAgICAgJCgnLnN0ZXAtZm9ybS1uZXh0JykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAvLyBGaWVsZHNldCB2YXJpYWJsZXNcbiAgICAgICAgICB2YXIgY3VycmVudF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKTtcbiAgICAgICAgICB2YXIgbmV4dF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5uZXh0KCdmaWVsZHNldCcpO1xuICAgICAgICAgIHZhciBwcmV2X2ZzID0gJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLnByZXZBbGwoJ2ZpZWxkc2V0Jyk7XG5cbiAgICAgICAgICAvLyBJZiBjdXJyZW50IGZpZWxkc2V0IGlzIHZhbGlkIGdvIHRvIG5leHQgZmllbGRzZXRcbiAgICAgICAgICBpZigkKCcubXVsdGktc3RlcC1mb3JtJykudmFsaWQoKSkge1xuICAgICAgICAgICAgY3VycmVudF9mcy5yZW1vdmVDbGFzcygnYWN0aXZlJykuYWRkQ2xhc3MoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICBuZXh0X2ZzLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIHByZXZfZnMuYWRkQ2xhc3MoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdGVwIGFuY2hvciBsaW5rc1xuICAgICAgICAkKCcuc3RlcC1mb3JtLWFuY2hvcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgLy8gRmllbGRzZXQgdmFyaWFibGVcbiAgICAgICAgICB2YXIgY3VycmVudF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKTtcblxuICAgICAgICAgIC8vIElmIGN1cnJlbnQgZmllbGRzZXQgaGFzIGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICBpZihjdXJyZW50X2ZzLmhhc0NsYXNzKCdjb21wbGV0ZScpKSB7XG4gICAgICAgICAgICBjdXJyZW50X2ZzLnJlbW92ZUNsYXNzKCdjb21wbGV0ZScpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGN1cnJlbnRfZnMuc2libGluZ3MoJ2ZpZWxkc2V0JykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIEluaXRpYXRlIGZvcm0gaWNvbnNcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZSBmb3IgYWxsIHNlbGVjdG9ycyBuZWVkZWQgZm9yIGljb24gdmFsaWRhdG9yXG4gICAgICAgIHZhciBpY29uU2VsZWN0b3IgPSAkKCcuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJ0ZXh0XCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJlbWFpbFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidXJsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJkYXRlXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJtb250aFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidGltZVwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwiZGF0ZXRpbWVcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cImRhdGV0aW1lLWxvY2FsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJ3ZWVrXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJudW1iZXJcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cInNlYXJjaFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidGVsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJjb2xvclwiXSwgLmZvcm0taXRlbSBzZWxlY3QsIC5mb3JtLWl0ZW0gdGV4dGFyZWEsIC5mb3JtLWl0ZW0tcmFkaW8gbGFiZWwuZXJyb3IsIC5mb3JtLWl0ZW0tcmFkaW8tbGFiZWxfZ3JvdXAgbGFiZWw6bGFzdC1jaGlsZCwgLmZvcm0taXRlbS1jaGVja2JveCBsYWJlbC5lcnJvcicpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGl0ZW0gaWNvblxuICAgICAgICAkKGljb25TZWxlY3RvcikuYWZ0ZXIoJzxzcGFuIGNsYXNzPVwiZm9ybS1pdGVtX2ljb25cIj48L3NwYW4+Jyk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIEluaXRpYXRlIGxhYmVsIHNob3cvaGlkZVxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIHZhciBvbkNsYXNzID0gJ29uJztcbiAgICAgICAgdmFyIHNob3dDbGFzcyA9ICdzaG93JztcblxuICAgICAgICAkKCdpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCcpXG4gICAgICAgIC5iaW5kKCdjaGVja3ZhbCcsIGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBsYWJlbCA9ICQodGhpcykucHJldignbGFiZWwnKTtcblxuICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSAnJylcbiAgICAgICAgICBsYWJlbC5hZGRDbGFzcyhzaG93Q2xhc3MpO1xuXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIGxhYmVsLnJlbW92ZUNsYXNzKHNob3dDbGFzcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigna2V5dXAnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2NoZWNrdmFsJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZm9jdXMnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAkKHRoaXMpLnByZXYoJ2xhYmVsJykuYWRkQ2xhc3Mob25DbGFzcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYmx1cicsIGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICQodGhpcykucHJldignbGFiZWwnKS5yZW1vdmVDbGFzcyhvbkNsYXNzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRyaWdnZXIoJ2NoZWNrdmFsJyk7XG5cbiAgICAgICAgJCgnc2VsZWN0JylcbiAgICAgICAgLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgaWYgKCR0aGlzLnZhbCgpID09ICcnKVxuICAgICAgICAgICR0aGlzLmFkZENsYXNzKCd3YXRlcm1hcmsnKTtcblxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAkdGhpcy5yZW1vdmVDbGFzcygnd2F0ZXJtYXJrJyk7XG5cbiAgICAgICAgICAkdGhpcy50cmlnZ2VyKCdjaGVja3ZhbCcpO1xuICAgICAgICB9KVxuICAgICAgICAuY2hhbmdlKCk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIFNob3cgLyBIaWRlIHBhc3N3b3JkIHRleHRcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICQoJy5mb3JtLWl0ZW1fcGFzc3dvcmQnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdzaG93Jyk7XG5cbiAgICAgICAgICBpZigkKHRoaXMpLmhhc0NsYXNzKCdzaG93JykpIHtcbiAgICAgICAgICAgICQodGhpcykuc2libGluZ3MoJ2lucHV0JykuYXR0cigndHlwZScsICd0ZXh0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnaW5wdXQnKS5hdHRyKCd0eXBlJywgJ3Bhc3N3b3JkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfSkoalF1ZXJ5KTtcbiAgICB9XG4gIH07XG59KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBSaWJib24gbmF2IHVzZXIgaW50ZXJhY3Rpb25zLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMucmliYm9ubmF2ID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBTZWFyY2hcblxuICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciAobWFpbilcbiAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fdHJpZ2dlcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fZHJvcGRvd25fbmF2JykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X25hdicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVVwKDMwMCk7O1xuICAgICAgICAgICAkKCcucmliYm9uX3VzZXItbWVudV90cmlnZ2VyLWF1dGgnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X25hdi1jaGlsZCcpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVVwKDMwMCk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciBmb3IgdXNlciBkcm9wZG93blxuICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfdHJpZ2dlcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fdXNlci1tZW51X25hdicpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgICAkKCcucmliYm9uX2Ryb3Bkb3duX3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fbmF2JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBXaGVuIGEgdXNlciBjbGlja3Mgb24gdGhlIHJpYmJvbiB0cmlnZ2VyIGZvciBhdXRoZW50aWNhdGVkIHVzZXIgZHJvcGRvd25cbiAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X3RyaWdnZXItYXV0aCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fdXNlci1tZW51X25hdi1jaGlsZCcpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgICAkKCcucmliYm9uX2Ryb3Bkb3duX3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fbmF2JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBUcmlnZXIgb3ZlcmxheSB3aGVuIHNlYXJjaCBib3ggaXMgdXNlZC5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnNlYXJjaE1vZGFsID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50cyBvbiBzZWFyY2ggYnV0dG9uIGNsaWNrXG4gICAgICAgICAkKCcuYnV0dG9uLXNlYXJjaCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzIGZvciBuYXYgZHJvcGRvd25zXG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9zZWN0aW9uLCAubmF2LXByaW1hcnlfc2VjdGlvbicpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZSwgbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X3NlY3Rpb25fc3VibmF2JykucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgICAgICAgICAvLyBJZiBpcy1vcGVuIGNsYXNzIGV4aXN0c1xuICAgICAgICAgICBpZiggJCgnLnNlYXJjaF9tb2RhbCcpLmhhc0NsYXNzKCdpcy1vcGVuJykgKSB7XG4gICAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG4gICAgICAgICAgIH1cblxuICAgICAgICAgICAvLyBJZiBpcy1vcGVuIGNsYXNzIGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG5cbiAgICAgICAgICAgICAvLyBGb2N1cyBzZWFyY2ggaW5wdXRcbiAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAkKCcuc2VhcmNoX21vZGFsIC5zZWFyY2gtZmllbGRfaW5wdXQnKS5mb2N1cygpO1xuICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gUmVtb3ZlIG5hdiBwcmltYXJ5IGxpc3Qgb3BlbiBjbGFzcyBhbmQgYWRkIGNsb3NlZCBjbGFzcyBvbiBzZWFyY2ggYnV0dG9uIGNsaWNrXG4gICAgICAgICAgIGlmICggJCh3aW5kb3cpLndpZHRoKCkgPCA3NDAgKSB7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X2xpc3QnKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfbGlzdC1tb2JpbGUtb3BlbicpLmFkZENsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1jbG9zZWQnKTtcbiAgICAgICAgICAgfTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBSZW1vdmUgY2xhc3NlcyB3aGVuIGNsaWNraW5nIGNsb3NlXG4gICAgICAgICAkKCcuc2VhcmNoX21vZGFsX2Nsb3NlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICQoJy5zZWFyY2hfbW9kYWwnKS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUnKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUtb24nKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBJbnRlcmFjdGlvbnMgZm9yIHNlYXJjaCBmaWVsZC5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnNlYXJjaEZpZWxkID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBTZWFyY2hcblxuICAgICAgICAgLy8gQ2hlY2sgd2hlbiBhIHVzZXIgaXMgdHlwaW5nIGluIHNlYXJjaFxuICAgICAgICAgJCgnI3NlYXJjaC1maWVsZCcpLmtleXByZXNzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyByZXNldCBidXR0b25cbiAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5zZWFyY2gtZmllbGRfcmVzZXQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gQWZ0ZXIgdGhlIHJlc2V0IGlzIGNsaWNrZWQsIHJlbW92ZSB0aGUgY2xhc3Nlc1xuICAgICAgICAgJCgnLnNlYXJjaC1maWVsZF9yZXNldCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJyNzZWFyY2gtZmllbGQnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJyNzZWFyY2gtZmllbGQnKS5mb2N1cygpO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEJlaGF2aW9ycyBmb3IgbWFpbiBtZW51IGRyb3Bkb3ducy5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnByaW1hcnlOYXYgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIGZ1bmN0aW9uIGNsb3NlU2VhcmNoKCkge1xuICAgICAgICAgICBzZWFyY2ggPSAkKCcuc2VhcmNoX21vZGFsJyk7XG4gICAgICAgICAgIGlmIChzZWFyY2guaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgICAgICAgICQoJy5zZWFyY2hfbW9kYWwnKS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIHNob3dNZW51KCkge1xuICAgICAgICAgICAvLyBhZGQgYSBib2R5IGNsYXNzIHNheWluZyB0aGF0IHRoZSBtZW51IGlzIG9wZW5cbiAgICAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdib2R5LW5hdi1wcmltYXJ5LW9wZW4nKTtcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X2xpc3QnKS5hZGRDbGFzcygnbmF2LXByaW1hcnlfbGlzdC1tb2JpbGUtb3BlbicpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBzaG93T3ZlcmxheSgpIHtcbiAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG4gICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICAgICAgICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2JvZHktbmF2LXByaW1hcnktb3BlbicpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfbGlzdCcpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1vcGVuJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X2xpc3QtbW9iaWxlLWNsb3NlZCcpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiByZW1vdmVBY3RpdmUoKSB7XG4gICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBjbG9zZU92ZXJsYXkoKSB7XG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZScpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZS1vbicpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBjaGFuZ2VBY3RpdmUoc2VjdGlvbikge1xuICAgICAgICAgICBpZiAoc2VjdGlvbi5oYXNDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uJykpIHtcbiAgICAgICAgICAgICAvLyB0b2dnbGUgYSBjbGlja2VkIHN0YXRlIG9uIHRoZSB0cmlnZ2VyXG4gICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uLWNsaWNrZWQnKTtcbiAgICAgICAgICAgICAvLyBzaG93IHRoZSBvdmVybGF5XG4gICAgICAgICAgICAgc2hvd092ZXJsYXkoKTtcbiAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICBzZWN0aW9uLmFkZENsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZScpO1xuICAgICAgICAgICAgIHNlY3Rpb24uc2libGluZ3MoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlJyk7XG4gICAgICAgICAgICAgaWYgKCAkKHdpbmRvdykud2lkdGgoKSA8IDc0MCApIHtcbiAgICAgICAgICAgICAgIHNlY3Rpb24uc2libGluZ3MoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykuYWRkQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBIYW5kbGluZyBmb3IgY2xpY2sgZXZlbnRzLiBXaGVuIHNvbWVvbmUgY2xpY2tzIHRoZSBuYXYsIHRoZSBtb2JpbGUgbmF2IGJ1dHRvbiwgb3IgYW55d2hlcmVcbiAgICAgICAgIC8vIG9uIHRoZSBwYWdlIGlmIHRoZSBtZW51IGlzIGFscmVhZHkgb3BlbjpcblxuICAgICAgICAgJChkb2N1bWVudCkub24oJ3RvdWNoc3RhcnQgY2xpY2snLCAnLmJvZHktbmF2LXByaW1hcnktb3BlbiwgLm5hdi1wcmltYXJ5X3NlY3Rpb24sIC5uYXYtcHJpbWFyeV9idXR0b24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAvLyBpcyB0aGlzIHRoZSBtb2JpbGUgYnV0dG9uP1xuICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uJykpIHtcbiAgICAgICAgICAgICAvLyBpcyB0aGUgbWVudSBhbHJlYWR5IG9wZW4/XG4gICAgICAgICAgICAgaWYgKCQoJ2JvZHknKS5oYXNDbGFzcygnYm9keS1uYXYtcHJpbWFyeS1vcGVuJykpIHtcbiAgICAgICAgICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICAgICAgICAgY2xvc2VPdmVybGF5KCk7XG4gICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIHNob3dNZW51KCk7XG4gICAgICAgICAgICAgICBzaG93T3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgY2xvc2VTZWFyY2goKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gaXMgdGhpcyB0aGUgbmF2P1xuICAgICAgICAgICBlbHNlIGlmICgkKHRoaXMpLmhhc0NsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uJykpIHtcbiAgICAgICAgICAgICAvLyBpcyB0aGlzIHRoZSBhY3RpdmUgaXRlbT9cbiAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgaWYgKCAkKHdpbmRvdykud2lkdGgoKSA8IDc0MCApIHtcbiAgICAgICAgICAgICAgICAgcmVtb3ZlQWN0aXZlKCk7XG4gICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgICAgICAgY2xvc2VPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgIHJlbW92ZUFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICBpZiAoISQoJ2JvZHknKS5oYXNDbGFzcygnYm9keS1uYXYtcHJpbWFyeS1vcGVuJykpIHtcbiAgICAgICAgICAgICAgICAgc2hvd01lbnUoKTtcbiAgICAgICAgICAgICAgICAgc2hvd092ZXJsYXkoKTtcbiAgICAgICAgICAgICAgICAgY2xvc2VTZWFyY2goKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGNoYW5nZUFjdGl2ZSgkKHRoaXMpKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gaXMgdGhpcyBzb21lIG90aGVyIHBhcnQgb2YgdGhlIGRvY3VtZW50IChjbGlja2luZyBvdXRzaWRlIHRoZSBuYXYpP1xuICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgICBjbG9zZU92ZXJsYXkoKTtcbiAgICAgICAgICAgICByZW1vdmVBY3RpdmUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEp1bXAgbmF2IGJlaGF2aW9ycyBmb3IgYXJ0aWNsZSBwYWdlcy5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmp1bXBOYXYgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vY2hlY2sgaWYgYSBqdW1wIG5hdiBleGlzdHMgYW5kIGlzIHZpc2libGUgb24gdGhlIHBhZ2VcbiAgICAgICAgIC8vb3RoZXJ3aXNlIHdlIHNob3VsZG4ndCBkbyBhbnkgb2YgdGhpc1xuICAgICAgICAgaWYgKCQoJy5qdW1wbmF2LWNvbnRlbnQnKS5sZW5ndGggPiAwICYmXG4gICAgICAgICAkKCcuYXJ0aWNsZS1ib2R5JykubGVuZ3RoID4gMCAmJlxuICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QgbGknKS5jaGlsZHJlbigpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgaW5pdGlhbGl6ZUp1bXBOYXYoKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZUp1bXBOYXYoKXtcbiAgICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciAobWFpbilcbiAgICAgICAgICAgJCgnLmp1bXAtbmF2X3RpdGxlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgLy8gVW5mb2N1cyBvbiB0aGUgZHJvcGRvd25cbiAgICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgcGFyZW50XG4gICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcjanVtcC1uYXYnKS50b2dnbGVDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIC8vIFdoZW4gYSB1c2VyIGNsaWNrcyBvbiBhIHRpdGxlIGxpbmssIGNsb3NlIGRyb3Bkb3duXG4gICAgICAgICAgICQoJy5qdW1wLW5hdl9saXN0LWl0ZW0gYScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIC8vIGFkZCBhIGNsYXNzIHRvIHRoZSBwYXJlbnRcbiAgICAgICAgICAgICAkKCcjanVtcC1uYXYnKS50b2dnbGVDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgLy8gT24gcGFnZSBzY3JvbGxcbiAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICB2YXIgZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgICAgICAgdmFyIHdpbmRvd1RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICB2YXIgZGl2VG9wID0gJCgnLmp1bXBuYXYtYW5jaG9yJykub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgIHZhciBib2R5ID0gZG9jLmZpbmQoJy5hcnRpY2xlLWJvZHknKTtcbiAgICAgICAgICAgICB2YXIgY29udGVudCA9IGRvYy5maW5kKCcuanVtcG5hdi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgdmFyIHN0aWNreUJvdHRvbSA9IGNvbnRlbnQub2Zmc2V0KCkudG9wICsgY29udGVudC5oZWlnaHQoKTtcbiAgICAgICAgICAgICB2YXIgYm9keUJvdHRvbSA9IGJvZHkub2Zmc2V0KCkudG9wICsgYm9keS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgIC8vIFRyaWdnZXIgZml4ZWQgY2xhc3NcbiAgICAgICAgICAgICBpZiAod2luZG93VG9wID4gZGl2VG9wKSB7XG4gICAgICAgICAgICAgICAkKCcjanVtcC1uYXYnKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgJCgnI2p1bXAtbmF2JykucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgLy8gU2hvdyAvIGhpZGUganVtcCBuYXZcbiAgICAgICAgICAgICBpZihzdGlja3lCb3R0b20gPiBib2R5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICBjb250ZW50LmhpZGUoKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY29udGVudC5mYWRlSW4oMjUwKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgLy8gQW5pbWF0ZSBzY3JvbGwgb24ganVtcCBuYXYgY2xpY2tcbiAgICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QgYScpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICB2YXIganVtcG9iaiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgdmFyIHRhcmdldCA9IGp1bXBvYmouYXR0cignaHJlZicpO1xuICAgICAgICAgICAgIHZhciB0aGVzcGVlZCA9IDUwMDtcbiAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJCh0YXJnZXQpLm9mZnNldCgpLnRvcCAtIDEwMDtcbiAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgIHNjcm9sbFRvcDogb2Zmc2V0XG4gICAgICAgICAgICAgfSwgdGhlc3BlZWQpO1xuICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgIHZhciBhQ2hpbGRyZW4gPSAkKCcuanVtcC1uYXZfbGlzdCBsaScpLmNoaWxkcmVuKCk7IC8vIGZpbmQgdGhlIGEgY2hpbGRyZW4gb2YgdGhlIGxpc3QgaXRlbXNcbiAgICAgICAgICAgdmFyIGFBcnJheSA9IFtdOyAvLyBjcmVhdGUgdGhlIGVtcHR5IGFBcnJheVxuICAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBhQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICB2YXIgYUNoaWxkID0gYUNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgIHZhciBhaHJlZiA9ICQoYUNoaWxkKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICAgYUFycmF5LnB1c2goYWhyZWYpO1xuICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy8gVHJpZ2dlciBpcy1hY3RpdmUgY2xhc3Mgd2hlbiB1c2VyIHNjcm9sbHMgaW50byBlYWNoIHNlY3Rpb25cbiAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICB2YXIgd2luZG93UG9zID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpICsgMTA1OyAvLyBnZXQgdGhlIG9mZnNldCBvZiB0aGUgd2luZG93IGZyb20gdGhlIHRvcCBvZiBwYWdlXG4gICAgICAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTsgLy8gZ2V0IHRoZSBoZWlnaHQgb2YgdGhlIHdpbmRvd1xuICAgICAgICAgICAgIHZhciBkb2NIZWlnaHQgPSAkKGRvY3VtZW50KS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGFBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgdmFyIHRoZUlEID0gYUFycmF5W2ldO1xuICAgICAgICAgICAgICAgdmFyIGRpdlBvcyA9ICQodGhlSUQpLm9mZnNldCgpLnRvcDsgLy8gZ2V0IHRoZSBvZmZzZXQgb2YgdGhlIGRpdiBmcm9tIHRoZSB0b3Agb2YgcGFnZVxuICAgICAgICAgICAgICAgdmFyIGRpdkhlaWdodCA9ICQodGhlSUQpLmhlaWdodCgpOyAvLyBnZXQgdGhlIGhlaWdodCBvZiB0aGUgZGl2IGluIHF1ZXN0aW9uXG4gICAgICAgICAgICAgICBpZiAod2luZG93UG9zID49IGRpdlBvcyAmJiB3aW5kb3dQb3MgPCAoZGl2UG9zICsgZGl2SGVpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAkKCdhW2hyZWY9XCInICsgdGhlSUQgKyAnXCJdJykucGFyZW50KFwibGlcIikuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgJCgnYVtocmVmPVwiJyArIHRoZUlEICsgJ1wiXScpLnBhcmVudChcImxpXCIpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICBpZih3aW5kb3dQb3MgKyB3aW5kb3dIZWlnaHQgPT0gZG9jSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICBpZiAoISQoJy5qdW1wLW5hdl9saXN0IGxpOmxhc3QtY2hpbGQnKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICAgdmFyIG5hdkFjdGl2ZUN1cnJlbnQgPSAkKCcuaXMtYWN0aXZlJykuYXR0cignaHJlZicpO1xuICAgICAgICAgICAgICAgICAkKCdhW2hyZWY9XCInICsgbmF2QWN0aXZlQ3VycmVudCArICdcIl0nKS5wYXJlbnQoXCJsaVwiKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICQoJy5qdW1wLW5hdl9saXN0IGxpOmxhc3QtY2hpbGQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogQmVoYXZpb3IgZm9yIHRhYnMgb24gaG9tZXBhZ2UgYXVkaWVuY2Ugc2VsZWN0b3IuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy50YWJzQXVkaWVuY2VTZWxlY3RvciA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgdmFyIGJwX21lZCA9IDkwMDsgLy8gOTAwcHggPSAkYnAtbWVkIGNzcyB2YXJpYWJsZVxuXG4gICAgICAgICAvLyBjaGVja1dpZHRoIGZ1bmN0aW9uXG4gICAgICAgICBmdW5jdGlvbiBjaGVja1dpZHRoKCkge1xuICAgICAgICAgICBpZiAoKCQod2luZG93KS53aWR0aCgpID49IGJwX21lZCkpIHtcbiAgICAgICAgICAgICAvLyBTaG93IGFsbCBsaSBzZWxlY3RvcnNcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgLy8gRGlzcGxheSBsaXN0LWl0ZW0gZm9yIGFsbCBsaSBzZWxlY3RvcnNcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnbGlzdC1pdGVtJyk7XG4gICAgICAgICAgICAgLy8gSGlkZSBhbGwgbGkgc2VsZWN0b3JzIGV4cGVjdCBmaXJzdCBvbmVcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGk6Z3QoMCknKS5oaWRlKCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgLy8gUnVuIGNoZWNrV2lkdGhcbiAgICAgICAgIGNoZWNrV2lkdGgoKTtcbiAgICAgICAgIC8vIFJlLXJ1biBjaGVja1dpZHRoIG9uIHdpbmRvdyByZXNpemVcbiAgICAgICAgICQod2luZG93KS5yZXNpemUoY2hlY2tXaWR0aCk7XG5cbiAgICAgICAgIC8vIE1vYmlsZSBBdWRpZW5jZSBTZWxlY3RvciB0YWJzXG4gICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0JykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAvLyBJZiB2aWV3cG9ydCBpcyBzbWFsbGVyIHRoYW4gOTAwcHhcbiAgICAgICAgICAgaWYgKCgkKHdpbmRvdykud2lkdGgoKSA8IGJwX21lZCkpIHtcbiAgICAgICAgICAgICAvLyBBZGQgdGhlIGFjdGl2ZSBjbGFzcyB0byB0aGUgbGlzdCB3aGVuIGl0IGlzIGNsaWNrZWRcbiAgICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgICAgLy8gVG9nZ2xlIGhpZGRlbiBpdGVtcyBvbiBjbGlja1xuICAgICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2xpOmd0KDApJykuc2xpZGVUb2dnbGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIE1ha2UgYWNjb3JkaW9ucyBhY2NvcmRpb24teS5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmFjY29yZGlvbiA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgLy8gU2VhcmNoXG5cbiAgICAgICAgIC8vIFdoZW4gYSB1c2VyIGNsaWNrcyBvbiB0aGUgcmliYm9uIHRyaWdnZXIgKG1haW4pXG4gICAgICAgICAkKCcuYWNjb3JkaW9uLXRyaWdnZXInKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgLy8gVW5mb2N1cyBvbiB0aGUgdHJpZ2dlclxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgYWNjb3JkaW9uIGNvbnRlbnRcbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5hY2NvcmRpb24tY29udGVudCcpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEJlaGF2aW9ycyBmb3IgdGhlIGhvbWVwYWdlIGZlYXR1cmVkIGNvbnRlbnQgYmxvY2suXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5mZWF0dXJlZENvbnRlbnQgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vIEhpZGUgaXRlbXMgZXhjZXB0IGZpcnN0IDNcbiAgICAgICAgICQoJy5hdWRpZW5jZV9mZWF0dXJlZC1oZXJvX2l0ZW0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLmZpbmQoJy5saXN0X2ZlYXR1cmVkX2NvbnRlbnQtaXRlbTpndCgyKScpLmFkZENsYXNzKCdoaWRkZW4nKS5oaWRlKCk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gQ3JlYXRlIGEgdG9nZ2xlIGJldHdlZW4gTG9hZCBtb3JlIGFuZCBsZXNzXG4gICAgICAgICAkKCcubGlua19sb2FkX21vcmVfbGVzcyBhJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgLy8gRmVhdHVyZWQgY29udGVudCBwYXRoIHZhcmlhYmxlXG4gICAgICAgICAgIHZhciBmZWF0dXJlZENvbnRlbnQgPSAnLmF1ZGllbmNlX2ZlYXR1cmVkLWhlcm9faXRlbS5hY3RpdmUgLmxpc3RfZmVhdHVyZWRfY29udGVudC1pdGVtJztcbiAgICAgICAgICAgdmFyIGZlYXR1cmVkQ29udGVudFNob3duID0gJChmZWF0dXJlZENvbnRlbnQrJy5zaG93bicpO1xuICAgICAgICAgICB2YXIgZmVhdHVyZWRDb250ZW50SGlkZGVuID0gJChmZWF0dXJlZENvbnRlbnQrJy5oaWRkZW4nKTtcblxuICAgICAgICAgICAvLyBJZiBmZWF0dXJlZCBjb250ZW50IGhhcyBzaG93IGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICAgaWYoJChmZWF0dXJlZENvbnRlbnQpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuXG4gICAgICAgICAgICAgLy8gVXBkYXRlZCBsaW5rIHRleHQgYW5kIGljb25cbiAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuZmlyc3QoKVswXS50ZXh0Q29udGVudD0nTG9hZCBsZXNzICc7XG4gICAgICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignLmljb24nKS5yZW1vdmVDbGFzcygnaWNvbi12aWV3bW9yZScpLmFkZENsYXNzKCdpY29uLXZpZXdsZXNzJyk7XG5cbiAgICAgICAgICAgICAvLyBTbGlkZSBvcGVuIGhpZGRlbiBjb250ZW50IG9uIGNsaWNrXG4gICAgICAgICAgICAgZmVhdHVyZWRDb250ZW50SGlkZGVuLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5hZGRDbGFzcygnc2hvd24nKTtcbiAgICAgICAgICAgICAgICQodGhpcykuc2xpZGVEb3duKDMwMCk7XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH1cblxuICAgICAgICAgICAvLyBJZiBmZWF0dXJlZCBjb250ZW50IGhhcyBoaWRlIGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICAgZWxzZSBpZigkKGZlYXR1cmVkQ29udGVudCkuaGFzQ2xhc3MoJ3Nob3duJykpIHtcblxuICAgICAgICAgICAgIC8vIFVwZGF0ZWQgbGluayB0ZXh0IGFuZCBpY29uXG4gICAgICAgICAgICAgJCh0aGlzKS5jb250ZW50cygpLmZpcnN0KClbMF0udGV4dENvbnRlbnQ9J0xvYWQgbW9yZSAnO1xuICAgICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oJy5pY29uJykucmVtb3ZlQ2xhc3MoJ2ljb24tdmlld2xlc3MnKS5hZGRDbGFzcygnaWNvbi12aWV3bW9yZScpO1xuXG4gICAgICAgICAgICAgLy8gU2xpZGUgY2xvc2UgaGlkZGVuIGNvbnRlbnQgb24gY2xpY2tcbiAgICAgICAgICAgICBmZWF0dXJlZENvbnRlbnRTaG93bi5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvd24nKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAkKHRoaXMpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfTtcblxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIEF1ZGllbmNlIHRhYiBpbnRlcmFjdGlvblxuICAgICAgICAgJCgnLnRhYnMtYXVkaWVuY2Vfc2VsZWN0b3JfbGlzdF9pdGVtIGEnKS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAvLyBUYWIgZGF0YSB2YXJpYWJsZVxuICAgICAgICAgICB2YXIgdGFiX2lkID0gJCh0aGlzKS5hdHRyKCdkYXRhLXRhYicpO1xuXG4gICAgICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzXG4gICAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3RfaXRlbSBhJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAkKCcuYXVkaWVuY2VfZmVhdHVyZWQtaGVyb19pdGVtJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgIC8vIEFkZCBjbGFzc2VzXG4gICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAkKCcjJyt0YWJfaWQpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBUb2dnbGUgc2VsZWN0IGJsb2NrIG1lc3NhZ2UuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5ibG9ja1NlbGVjdCA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgJCgnLmJsb2NrLXNlbGVjdCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdibG9jay1zZWxlY3Qtc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgJCgnLmJsb2NrLXNlbGVjdF9tZXNzYWdlJykudG9nZ2xlQ2xhc3MoJ2Jsb2NrLXNlbGVjdF9tZXNzYWdlLWhpZGRlbicpOyAgfSk7XG5cbiAgICAgICAgIH0pKGpRdWVyeSk7XG4gICAgICAgfVxuICAgICB9O1xuICAgfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogTWFrZSBwcmltYXJ5IGhlYWRlciBzdGlja3kuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5oZWFkZXJQcmltYXJ5ID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvL2NoZWNrIGlmIGEgcHJpbWFyeSBuYXYgZXhpc3RzIGFuZCBpcyB2aXNpYmxlIG9uIHRoZSBwYWdlXG4gICAgICAgICAvL290aGVyd2lzZSB3ZSBzaG91bGRuJ3QgZG8gYW55IG9mIHRoaXNcbiAgICAgICAgIGlmICgkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmxlbmd0aCA+IDApe1xuICAgICAgICAgICBpbml0aWFsaXplUHJpbWFyeUhlYWRlcigpO1xuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBGaW5kIGhlaWdodCBvZiByaWJib24gYW5kIGhlYWRlci1wcmltYXJ5IHRvIGNyZWF0ZSBwcm9wZXIgc3BhY2luZ1xuICAgICAgICAgZnVuY3Rpb24gY2hlY2tIZWlnaHQoKSB7XG4gICAgICAgICAgIHZhciBoZWFkZXJIZWlnaHQgPSAkKCcuaGVhZGVyLXByaW1hcnknKS5oZWlnaHQoKTtcbiAgICAgICAgICAgdmFyIHJpYmJvbkhlaWdodCA9ICQoJy5yaWJib24nKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmNzcyh7J2hlaWdodCc6KGhlYWRlckhlaWdodCkrJ3B4J30pO1xuICAgICAgICAgICAkKCcuaGVhZGVyLXByaW1hcnknKS5jc3Moeyd0b3AnOihyaWJib25IZWlnaHQpKydweCd9KTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZVByaW1hcnlIZWFkZXIoKXtcbiAgICAgICAgICAgLy8gU2V0IGhlaWdodCBvbiBwYWdlIGxvYWRcbiAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBjaGVja0hlaWdodCgpOyB9LCAxMDApO1xuICAgICAgICAgICAvLyBDaGVjayBoZWlnaHQgb24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgICAkKHdpbmRvdykucmVzaXplKGNoZWNrSGVpZ2h0KTtcblxuICAgICAgICAgICAvLyBBZGQgY2xhc3MgdG8gaGVhZGVyLXByaW1hcnkgb24gc2Nyb2xsXG4gICAgICAgICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgdmFyIHNjcm9sbCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICB2YXIgb3MgPSAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICB2YXIgaHQgPSAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgaWYoc2Nyb2xsID4gb3MgKyBodCl7XG4gICAgICAgICAgICAgICAkKFwiLmhlYWRlci1wcmltYXJ5XCIpLmFkZENsYXNzKFwiaGVhZGVyLXByaW1hcnktLXN0aWNreVwiKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgJChcIi5oZWFkZXItcHJpbWFyeVwiKS5yZW1vdmVDbGFzcyhcImhlYWRlci1wcmltYXJ5LS1zdGlja3lcIik7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogUmVzcG9uc2l2ZSBiZWhhdmlvcnMgZm9yIEVDIFRhYnMgQ291cnNlIEJyb3dzZXIuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5lY1RhYnNDb3Vyc2VCcm93c2VyID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICB2YXIgYnBfbWVkID0gOTAwOyAvLyA5MDBweCA9ICRicC1tZWQgY3NzIHZhcmlhYmxlXG5cbiAgICAgICAgIC8vIGNoZWNrV2lkdGggZnVuY3Rpb25cbiAgICAgICAgIGZ1bmN0aW9uIGNoZWNrV2lkdGgoKSB7XG4gICAgICAgICAgIGlmICgoJCh3aW5kb3cpLndpZHRoKCkgPj0gYnBfbWVkKSkge1xuICAgICAgICAgICAgIC8vIFNob3cgYWxsIGxpIHNlbGVjdG9yc1xuICAgICAgICAgICAgICQoJy50YWJzLWNvdXJzZV9icm93c2VyX2xpc3QtdGFicyA+IGxpJykuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIC8vIERpc3BsYXkgbGlzdC1pdGVtIGZvciBhbGwgbGkgc2VsZWN0b3JzXG4gICAgICAgICAgICAgJCgnLnRhYnMtY291cnNlX2Jyb3dzZXJfbGlzdC10YWJzID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnbGlzdC1pdGVtJyk7XG4gICAgICAgICAgICAgLy8gSGlkZSBhbGwgbGkgc2VsZWN0b3JzIGV4cGVjdCBmaXJzdCBvbmVcbiAgICAgICAgICAgICAkKCcudGFicy1jb3Vyc2VfYnJvd3Nlcl9saXN0LXRhYnMgPiBsaTpndCgwKScpLmhpZGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBSdW4gY2hlY2tXaWR0aFxuICAgICAgICAgY2hlY2tXaWR0aCgpO1xuICAgICAgICAgLy8gUmUtcnVuIGNoZWNrV2lkdGggb24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShjaGVja1dpZHRoKTtcblxuICAgICAgICAgLy8gTW9iaWxlIENvdXJzZSBCcm93c2VyIHRhYnNcbiAgICAgICAgICQoJy50YWJzLWNvdXJzZV9icm93c2VyX2xpc3QtdGFicycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgLy8gSWYgdmlld3BvcnQgaXMgc21hbGxlciB0aGFuIDkwMHB4XG4gICAgICAgICAgIGlmICgoJCh3aW5kb3cpLndpZHRoKCkgPCBicF9tZWQpKSB7XG4gICAgICAgICAgICAgLy8gQWRkIHRoZSBhY3RpdmUgY2xhc3MgdG8gdGhlIGxpc3Qgd2hlbiBpdCBpcyBjbGlja2VkXG4gICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnb3BlbicpO1xuICAgICAgICAgICAgIC8vIFRvZ2dsZSBoaWRkZW4gaXRlbXMgb24gY2xpY2tcbiAgICAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdsaTpndCgwKScpLnNsaWRlVG9nZ2xlKCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iXX0=
