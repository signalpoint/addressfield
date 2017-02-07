/**
 *
 */
function addressfield_get_components() {
    return [
      'name_line',
      'first_name',
      'last_name',
      'country',
      'thoroughfare',
      'premise',
      'locality',
      'administrative_area',
      'postal_code'
    ];
}

/**
 * Given a form id, an element name and an address object, this will inject the address
 * into the address element waiting in the DOM.
 * @param {String} form_id
 * @param {String} name
 * @param {Object} address
 */
function addressfield_inject_components(form_id, name, address) {
  if (!address) { return; }
  var prefix = drupalgap_form_get_element_id(name, form_id);
  $.each(address, function(component, value) {
    var id = prefix + '-' + component;
    var input = $('#' + id);
    if (input.get(0)) {
      // If the address' country differs from the widgets country, force change the
      // country, which then in turn re triggers this via a services post process.
      if (component == 'country' && value != 'US' && value != $(input).val()) {
        $(input).val(value).selectmenu('refresh', true).change();
        return false;
      }
      if ($(input).attr('type') == 'text') {
        $(input).val(value);
      }
      else if ($(input).get(0).tagName == 'SELECT') {
        $(input).val(value).selectmenu('refresh', true);
      }
    }
  });
}

/**
 * Implements hook_field_formatter_view().
 */
function addressfield_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    var element = {};
    $.each(items, function(delta, item) {
      element[delta] = {
        markup: theme('addressfield', item)
      };
    });
    return element;
  }
  catch (error) { console.log('addressfield_field_formatter_view - ' + error); }
}

/**
 * Implements hook_field_widget_form().
 */
function addressfield_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // @see https://www.drupal.org/node/1933438
    //console.log(form);
    //console.log(field);
    //console.log(instance);
    //console.log(items[delta]);

    // @TODO we need more unique ids because the node add form vs the node edit
    // form has colliding ids when first editing a node, then creating a node
    // later, the latter form will inherit the country code from the prior.

    // Is this a new or existing entity?
    _address_field_new_entity = form.arguments.length && form.arguments[0][entity_primary_key(form.entity_type)] ? false : true;

    // Extract the countries. If it's an array and empty, that means every
    // country is allowed and we'll need to grab them from the server. If it's
    // an object, then only the countries listed within the object are valid,
    // and they are listed only as country codes as the property name and value.
    var countries = instance.widget.settings.available_countries;
    var country_widget_id = items[delta].id + '-country';

    // How many available countries are there?
    var country_count = 0; // we'll default to all countries, aka zero
    for (var country_code in countries) {
      if (!countries.hasOwnProperty(country_code)) { continue; }
      var country = countries[country_code];
      country_count++;
    }

    // If we're editing an existing value, set it aside so we can populate its
    // values into the widget later.
    if (items[delta].item) {
      if (typeof _address_field_items[field.field_name] === 'undefined') {
        _address_field_items[field.field_name] = [];
      }
      _address_field_items[field.field_name].push({
        id: items[delta].id,
        item: items[delta].item
      });
    }

    // What's the default country? An empty string means "none", otherwise it
    // will be the country code, or site_default. If it was an empty string,
    // and there is only one country available, use it.
    // @TODO - properly handle the site_default country. This will probably need
    // to be delivered via drupalgap system connect and made available to the
    // SDK.
    var default_country = instance.widget.settings.default_country;
    if (default_country == 'site_default') { default_country = 'US'; }
    else if (empty(default_country) && country_count == 1) {
      for (var country_code in countries) {
        if (!countries.hasOwnProperty(country_code)) { continue; }
        default_country = countries[country_code];
        break;
      }
    }

    // Prepare the child widget. If there is no default country, and this field
    // is optional add an empty option for '- None -'.
    var child = {
      type: 'select',
      title: 'Country',
      options: {},
      attributes: {
        id: country_widget_id,
        onchange: "_addressfield_field_widget_form_country_onchange(this, " +
        "'" + items[delta].id + "'," +
        delta + "," +
        "'" + field.field_name + "'" +
        ")"
      }
    };
    if (form.entity_type) { child.attributes.entity_type = form.entity_type; }
    if (form.bundle) { child.attributes.bundle = form.bundle; }
    if (empty(default_country) && !instance.required) {
      child.options[''] = '- None -';
    }

    // What countries are allowed?
    if ($.isArray(countries) && countries.length == 0) {

      // All countries allowed.
      child.suffix = drupalgap_jqm_page_event_script_code({
        page_id: drupalgap_get_page_id(),
        jqm_page_event: 'pageshow',
        jqm_page_event_callback: '_addressfield_field_widget_form_country_pageshow',
        jqm_page_event_args: JSON.stringify({
          country_widget_id: country_widget_id,
          delta: delta,
          field_name: field.field_name,
          default_country: default_country,
          required: instance.required
        })
      });

    }
    else {

      // Only certain countries are allowed, add them as options.
      // @TODO - display the country name instead of the code.
      $.each(countries, function(code, value) {
        child.options[code] = value;
      });

      // If there was an item or no default country, manually trigger the
      // onchange event for that particular country.
      if (items[delta].item || !empty(default_country)) {
        var country_code = items[delta].item ? items[delta].item.country : default_country;
        child.suffix = drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: '_addressfield_field_widget_default_country_pageshow',
          jqm_page_event_args: JSON.stringify({
            country_widget_id: country_widget_id,
            default_country: country_code
          })
        });
      }

    }

    // Finally push the child onto the element and place an empty container for
    // the country's widget to be injected dynamically.
    items[delta].children.push(child);
    items[delta].children.push({
      markup: '<div id="' + country_widget_id + '-widget"></div>'
    });

  }
  catch (error) { console.log('addressfield_field_widget_form - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_pageshow(options) {
  try {
    addressfield_country_get_list({
      success: function(countries) {

        // Add each country to the drop down.
        var html = '';
        $.each(countries, function(code, name) {
          html += '<option value="' + code + '">' + name + '</option>';
        });
        if (!empty(html)) {
          $('#' + options.country_widget_id).append(html);
        }

        // If we have an existing country, change the value of the widget to
        // that country.
        if (
            typeof _address_field_items[options.field_name] !== 'undefined' &&
            typeof _address_field_items[options.field_name][parseInt(options.delta)] !== 'undefined'
        ) {
          setTimeout(function () {
            var item = _address_field_items[options.field_name][parseInt(options.delta)].item;
            var select = $('#' + options.country_widget_id);
            select.val(item.country).selectmenu('refresh', true).change();
          }, 1);
        }

        // We didn't have an existing country, but if we have a default
        // country use it and fire the change event for the country select.
        else if (!empty(options.default_country)) {
          setTimeout(function () {
            $('#' + options.country_widget_id).val(options.default_country).selectmenu('refresh', true).change();
          }, 1);
        }

        // We don't have an existing country, and we don't have a default
        // country, so if this field is required immediately trigger the
        // change event on the first available country.
        else if (empty(options.default_country) && options.required) {
          setTimeout(function () {
            $('#' + options.country_widget_id).selectmenu('refresh', true).change();
          }, 1);
        }

      }
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_pageshow - ' + error); }
}

/**
 * Used to manually trigger the country widget's change event.
 */
function _addressfield_field_widget_default_country_pageshow(options) {
  try {
    $('#' + options.country_widget_id).val(options.default_country).change();
  }
  catch (error) { console.log('_addressfield_field_widget_default_country_pageshow - ' + error); }
}

/**
 * A form state value callback.
 */
function addressfield_field_value_callback(id, element) {
  try {
    var values = [];
    var widgets = addressfield_get_components();
    for (var index in widgets) {
      if (!widgets.hasOwnProperty(index)) { continue; }
      var widget = widgets[index];
      var widget_id = id + '-' + widget;
      var val = $('#' + widget_id).val();
      if (typeof val !== 'undefined') { values.push(val); }
    }
    if (values.length == 0 || (values.length == 1 && empty(values[0]))) { return null; }
    if (element.is_field) { return values.join(','); }
    else {
      var result = {};
      var widgets = addressfield_get_components();
      $.each(widgets, function(index, widget) {
        var widget_id = element.id + '-' + widget;
        result[widget] = $('#' + widget_id).val();
      });
      return result;
    }

  }
  catch (error) { console.log('addressfield_field_value_callback - ' + error); }
}

var _address_field_new_entity = false;
var _address_field_items = {};
var _addressfield_elements = {};

// @credit https://gist.github.com/maephisto/9228207
var _addressfield_countries = {
  'AF' : 'Afghanistan',
  'AX' : 'Aland Islands',
  'AL' : 'Albania',
  'DZ' : 'Algeria',
  'AS' : 'American Samoa',
  'AD' : 'Andorra',
  'AO' : 'Angola',
  'AI' : 'Anguilla',
  'AQ' : 'Antarctica',
  'AG' : 'Antigua And Barbuda',
  'AR' : 'Argentina',
  'AM' : 'Armenia',
  'AW' : 'Aruba',
  'AU' : 'Australia',
  'AT' : 'Austria',
  'AZ' : 'Azerbaijan',
  'BS' : 'Bahamas',
  'BH' : 'Bahrain',
  'BD' : 'Bangladesh',
  'BB' : 'Barbados',
  'BY' : 'Belarus',
  'BE' : 'Belgium',
  'BZ' : 'Belize',
  'BJ' : 'Benin',
  'BM' : 'Bermuda',
  'BT' : 'Bhutan',
  'BO' : 'Bolivia',
  'BA' : 'Bosnia And Herzegovina',
  'BW' : 'Botswana',
  'BV' : 'Bouvet Island',
  'BR' : 'Brazil',
  'IO' : 'British Indian Ocean Territory',
  'BN' : 'Brunei Darussalam',
  'BG' : 'Bulgaria',
  'BF' : 'Burkina Faso',
  'BI' : 'Burundi',
  'KH' : 'Cambodia',
  'CM' : 'Cameroon',
  'CA' : 'Canada',
  'CV' : 'Cape Verde',
  'KY' : 'Cayman Islands',
  'CF' : 'Central African Republic',
  'TD' : 'Chad',
  'CL' : 'Chile',
  'CN' : 'China',
  'CX' : 'Christmas Island',
  'CC' : 'Cocos (Keeling) Islands',
  'CO' : 'Colombia',
  'KM' : 'Comoros',
  'CG' : 'Congo',
  'CD' : 'Congo, Democratic Republic',
  'CK' : 'Cook Islands',
  'CR' : 'Costa Rica',
  'CI' : 'Cote D\'Ivoire',
  'HR' : 'Croatia',
  'CU' : 'Cuba',
  'CY' : 'Cyprus',
  'CZ' : 'Czech Republic',
  'DK' : 'Denmark',
  'DJ' : 'Djibouti',
  'DM' : 'Dominica',
  'DO' : 'Dominican Republic',
  'EC' : 'Ecuador',
  'EG' : 'Egypt',
  'SV' : 'El Salvador',
  'GQ' : 'Equatorial Guinea',
  'ER' : 'Eritrea',
  'EE' : 'Estonia',
  'ET' : 'Ethiopia',
  'FK' : 'Falkland Islands (Malvinas)',
  'FO' : 'Faroe Islands',
  'FJ' : 'Fiji',
  'FI' : 'Finland',
  'FR' : 'France',
  'GF' : 'French Guiana',
  'PF' : 'French Polynesia',
  'TF' : 'French Southern Territories',
  'GA' : 'Gabon',
  'GM' : 'Gambia',
  'GE' : 'Georgia',
  'DE' : 'Germany',
  'GH' : 'Ghana',
  'GI' : 'Gibraltar',
  'GR' : 'Greece',
  'GL' : 'Greenland',
  'GD' : 'Grenada',
  'GP' : 'Guadeloupe',
  'GU' : 'Guam',
  'GT' : 'Guatemala',
  'GG' : 'Guernsey',
  'GN' : 'Guinea',
  'GW' : 'Guinea-Bissau',
  'GY' : 'Guyana',
  'HT' : 'Haiti',
  'HM' : 'Heard Island & Mcdonald Islands',
  'VA' : 'Holy See (Vatican City State)',
  'HN' : 'Honduras',
  'HK' : 'Hong Kong',
  'HU' : 'Hungary',
  'IS' : 'Iceland',
  'IN' : 'India',
  'ID' : 'Indonesia',
  'IR' : 'Iran, Islamic Republic Of',
  'IQ' : 'Iraq',
  'IE' : 'Ireland',
  'IM' : 'Isle Of Man',
  'IL' : 'Israel',
  'IT' : 'Italy',
  'JM' : 'Jamaica',
  'JP' : 'Japan',
  'JE' : 'Jersey',
  'JO' : 'Jordan',
  'KZ' : 'Kazakhstan',
  'KE' : 'Kenya',
  'KI' : 'Kiribati',
  'KR' : 'Korea',
  'KW' : 'Kuwait',
  'KG' : 'Kyrgyzstan',
  'LA' : 'Lao People\'s Democratic Republic',
  'LV' : 'Latvia',
  'LB' : 'Lebanon',
  'LS' : 'Lesotho',
  'LR' : 'Liberia',
  'LY' : 'Libyan Arab Jamahiriya',
  'LI' : 'Liechtenstein',
  'LT' : 'Lithuania',
  'LU' : 'Luxembourg',
  'MO' : 'Macao',
  'MK' : 'Macedonia',
  'MG' : 'Madagascar',
  'MW' : 'Malawi',
  'MY' : 'Malaysia',
  'MV' : 'Maldives',
  'ML' : 'Mali',
  'MT' : 'Malta',
  'MH' : 'Marshall Islands',
  'MQ' : 'Martinique',
  'MR' : 'Mauritania',
  'MU' : 'Mauritius',
  'YT' : 'Mayotte',
  'MX' : 'Mexico',
  'FM' : 'Micronesia, Federated States Of',
  'MD' : 'Moldova',
  'MC' : 'Monaco',
  'MN' : 'Mongolia',
  'ME' : 'Montenegro',
  'MS' : 'Montserrat',
  'MA' : 'Morocco',
  'MZ' : 'Mozambique',
  'MM' : 'Myanmar',
  'NA' : 'Namibia',
  'NR' : 'Nauru',
  'NP' : 'Nepal',
  'NL' : 'Netherlands',
  'AN' : 'Netherlands Antilles',
  'NC' : 'New Caledonia',
  'NZ' : 'New Zealand',
  'NI' : 'Nicaragua',
  'NE' : 'Niger',
  'NG' : 'Nigeria',
  'NU' : 'Niue',
  'NF' : 'Norfolk Island',
  'MP' : 'Northern Mariana Islands',
  'NO' : 'Norway',
  'OM' : 'Oman',
  'PK' : 'Pakistan',
  'PW' : 'Palau',
  'PS' : 'Palestinian Territory, Occupied',
  'PA' : 'Panama',
  'PG' : 'Papua New Guinea',
  'PY' : 'Paraguay',
  'PE' : 'Peru',
  'PH' : 'Philippines',
  'PN' : 'Pitcairn',
  'PL' : 'Poland',
  'PT' : 'Portugal',
  'PR' : 'Puerto Rico',
  'QA' : 'Qatar',
  'RE' : 'Reunion',
  'RO' : 'Romania',
  'RU' : 'Russian Federation',
  'RW' : 'Rwanda',
  'BL' : 'Saint Barthelemy',
  'SH' : 'Saint Helena',
  'KN' : 'Saint Kitts And Nevis',
  'LC' : 'Saint Lucia',
  'MF' : 'Saint Martin',
  'PM' : 'Saint Pierre And Miquelon',
  'VC' : 'Saint Vincent And Grenadines',
  'WS' : 'Samoa',
  'SM' : 'San Marino',
  'ST' : 'Sao Tome And Principe',
  'SA' : 'Saudi Arabia',
  'SN' : 'Senegal',
  'RS' : 'Serbia',
  'SC' : 'Seychelles',
  'SL' : 'Sierra Leone',
  'SG' : 'Singapore',
  'SK' : 'Slovakia',
  'SI' : 'Slovenia',
  'SB' : 'Solomon Islands',
  'SO' : 'Somalia',
  'ZA' : 'South Africa',
  'GS' : 'South Georgia And Sandwich Isl.',
  'ES' : 'Spain',
  'LK' : 'Sri Lanka',
  'SD' : 'Sudan',
  'SR' : 'Suriname',
  'SJ' : 'Svalbard And Jan Mayen',
  'SZ' : 'Swaziland',
  'SE' : 'Sweden',
  'CH' : 'Switzerland',
  'SY' : 'Syrian Arab Republic',
  'TW' : 'Taiwan',
  'TJ' : 'Tajikistan',
  'TZ' : 'Tanzania',
  'TH' : 'Thailand',
  'TL' : 'Timor-Leste',
  'TG' : 'Togo',
  'TK' : 'Tokelau',
  'TO' : 'Tonga',
  'TT' : 'Trinidad And Tobago',
  'TN' : 'Tunisia',
  'TR' : 'Turkey',
  'TM' : 'Turkmenistan',
  'TC' : 'Turks And Caicos Islands',
  'TV' : 'Tuvalu',
  'UG' : 'Uganda',
  'UA' : 'Ukraine',
  'AE' : 'United Arab Emirates',
  'GB' : 'United Kingdom',
  'US' : 'United States',
  'UM' : 'United States Outlying Islands',
  'UY' : 'Uruguay',
  'UZ' : 'Uzbekistan',
  'VU' : 'Vanuatu',
  'VE' : 'Venezuela',
  'VN' : 'Viet Nam',
  'VG' : 'Virgin Islands, British',
  'VI' : 'Virgin Islands, U.S.',
  'WF' : 'Wallis And Futuna',
  'EH' : 'Western Sahara',
  'YE' : 'Yemen',
  'ZM' : 'Zambia',
  'ZW' : 'Zimbabwe'
};

/**
 * Given a country code, this will return the country's name.
 * @param {String} country_code
 * @return {String}
 */
function addressfield_get_country_name(country_code) {
  try {
    return _addressfield_countries[country_code];
  }
  catch (error) { console.log('addressfield_get_country_name - ' + error); }
}

/**
 * Given an address_format object and a field name, this will return true if the
 * field is required, false if it isn't.
 */
function _addressfield_widget_field_required(address_format, field_name) {
  try {
    return in_array(field_name, address_format.required_fields);
  }
  catch (error) { console.log('_addressfield_widget_field_required - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_onchange(select, widget_id, delta, field_name) {
  try {
    //console.log('_addressfield_field_widget_form_country_onchange', arguments);
    var variables = _addressfield_elements[widget_id];
    var country_code = $(select).val();
    addressfield_get_address_format_and_administrative_areas(country_code, {
      success: function(results) {

        var address_format = results.address_format;
        var administrative_areas = results.administrative_areas;
        //console.log(address_format);
        //console.log(administrative_areas);

        // Iterate over each "used_fields" on the address format and add them
        // to the widget. Some may or may not be required, and may have custom
        // labels applied along the way. We will render each separately
        var html = '';
        var components = [];

        // Try to grab the field instance.
        var entityType = $(select).attr('entity_type');
        var bundle = $(select).attr('bundle');
        var instance = entityType && bundle && field_name.indexOf('field_') != -1 ?
            drupalgap_field_info_instance(entityType, field_name, bundle) : null;

        //console.log(address_format, administrative_areas, instance, _addressfield_elements);

        // @TODO - need to add support for name components!

        // Determine which components will be hidden, if any.
        var showNameLine = false;
        var showFirstName = false;
        var showLastName = false;
        var showThoroughfare = false;
        var showPremise = false;
        if (instance && instance.widget.settings.format_handlers['address-hide-street'] == 0) {
          showThoroughfare = true;
          showPremise = true;
        }
        else if (variables.components) {
          showNameLine = typeof variables.components.name_line !== 'undefined';
          showFirstName = typeof variables.components.first_name !== 'undefined';
          showLastName = typeof variables.components.last_name !== 'undefined';
          showThoroughfare = typeof variables.components.thoroughfare !== 'undefined';
          showPremise = typeof variables.components.premise !== 'undefined';
        }

        // Name line
        if (showNameLine && !showFirstName && !showLastName) {
          components.push({
            theme: 'textfield',
            attributes: {
              placeholder: t('Full name'),
              id: widget_id + '-name_line',
              class: 'addressfield-name-line'
            },
            required: true
          });
        }

        // First name
        if (showFirstName && !showNameLine) {
          components.push({
            theme: 'textfield',
            attributes: {
              placeholder: t('First name'),
              id: widget_id + '-first_name',
              class: 'addressfield-first-name'
            },
            required: true
          });
        }

        // Last name
        if (showLastName && !showNameLine) {
          components.push({
            theme: 'textfield',
            attributes: {
              placeholder: t('Last name'),
              id: widget_id + '-last_name',
              class: 'addressfield-last-name'
            },
            required: true
          });
        }

        // thoroughfare
        if (showThoroughfare) {
          components.push({
            theme: 'textfield',
            attributes: {
              placeholder: t('Address 1'),
              id: widget_id + '-thoroughfare',
              class: 'addressfield-thoroughfare'
            },
            required: true
          });
        }

        // premise
        if (showPremise) {
          components.push({
            theme: 'textfield',
            attributes: {
              placeholder: t('Address 2'),
              id: widget_id + '-premise',
              class: 'addressfield-premise'
            }
          });
        }

        // locality
        components.push({
          theme: 'textfield',
          attributes: {
            placeholder: address_format.locality_label,
            id: widget_id + '-locality',
            class: 'addressfield-locality'
          },
          required: _addressfield_widget_field_required(address_format, 'locality')
        });

        // administrative_area
        if (administrative_areas) {
          components.push({
            theme: 'select',
            options: administrative_areas,
            attributes: {
              id: widget_id + '-administrative_area',
              class: 'addressfield-administrative-area'
            },
            required: _addressfield_widget_field_required(address_format, 'administrative_area')
          });
        }

        // postal_code
        components.push({
          theme: 'textfield',
          attributes: {
            placeholder: address_format.postal_code_label,
            id: widget_id + '-postal_code',
            class: 'addressfield-postal-code'
          },
          required: _addressfield_widget_field_required(address_format, 'postal_code')
        });

        // Now render each widget then inject them into the container.
        $.each(components, function(index, widget) {
          if (widget.required) {
            widget.attributes.placeholder += '*';
          }
          html += theme(widget.theme, widget);
        });
        $('#' + $(select).attr('id') + '-widget').html(html).trigger('create');

      }
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_onchange - ' + error); }
}

function addressfield_services_postprocess_inject() {
  // @TODO replace with call to addressfield_inject_components()...?
  var components = addressfield_get_components();
  $.each(_address_field_items, function(field_name, items) {
    $.each(items, function(delta, object) {
      var id = object.id;
      var item = object.item;
      $.each(components, function(index, component) {
        if (component == 'country') { return; } // skip country
        var selector = '#' + id + '-' + component;
        $(selector).val(item[component]);
        if (component == 'administrative_area') {
          $(selector).selectmenu('refresh', true).change();
        }
      });
    });
  });
}

/**
 * Implements hook_field_info_instance_add_to_form().
 */
function addressfield_field_info_instance_add_to_form(entity_type, bundle, form, entity, element) {
  try {
    element.value_callback = 'addressfield_field_value_callback';
  }
  catch (error) { console.log('addressfield_field_info_instance_add_to_form - ' + error); }
}

/**
 * Implements hook_services_postprocess().
 */
function addressfield_services_postprocess(options, result) {
  // Save results to local store.
  if (options.service == 'services_addressfield') { _addressfield_localstorage_save(options, result); }

  // When we have an existing value in an address field, we use this hook to
  // place the values into the widget after its been rendered.
  if (
      options.service == 'services_addressfield' &&
      options.resource == 'get_address_format_and_administrative_areas' &&
      !_address_field_new_entity
  ) { addressfield_services_postprocess_inject(); }
}

/**
 * Implements hook_assemble_form_state_into_field().
 */
function addressfield_assemble_form_state_into_field(entity_type, bundle,
                                                     form_state_value, field, instance, langcode, delta, field_key) {
  try {
    field_key.use_delta = false;
    var result = {};
    var widgets = addressfield_get_components();
    $.each(widgets, function(index, widget) {
      var widget_id = field_key.element_id + '-' + widget;
      result[widget] = $('#' + widget_id).val();
    });
    return result;
  }
  catch (error) {
    console.log('hook_assemble_form_state_into_field - ' + error);
  }
}

/**
 * Implements hook_addressfield_local_storage_resolve().
 */
function addressfield_addressfield_local_storage_resolve(result, options) {
  addressfield_services_postprocess_inject();
}

function _addressfield_localstorage_check(options) {
  var result = _addressfield_localstorage_load(options);
  return result && _addressfield_localstorage_resolve(result, options);
}

function _addressfield_localstorage_key(options) {
  switch (options.resource) {
    case 'country_get_list': return 'addressfield_' + options.resource; break;
    case 'get_address_format':
    case 'get_administrative_areas':
    case 'get_address_format_and_administrative_areas':
        if (options.data) {
          var data = JSON.parse(options.data);
          var key = 'addressfield_' + options.resource;
          if (data.country_code) { key += '_' + data.country_code; }
          return key;
        }
      break;
  }
  return options.path;
}

function _addressfield_localstorage_load(options) {
  var result = window.localStorage.getItem(_addressfield_localstorage_key(options));
  return result ? JSON.parse(result) : null;
}

function _addressfield_localstorage_resolve(result, options) {
  if (options.success) {
    options.success(result);
    module_invoke_all('addressfield_local_storage_resolve', result, options);
    return true;
  }
  return false;
}

function _addressfield_localstorage_save(options, result) {
  window.localStorage.setItem(_addressfield_localstorage_key(options), JSON.stringify(result));
}

/**
 *
 * @param options
 * @deprecated
 */
function country_get_list(options) {
  console.log('WARNING: country_get_list() is deprecated, use addressfield_country_get_list() instead!');
  return addressfield_country_get_list(options);
}

function addressfield_country_get_list(options) {
  options.method = 'POST';
  options.path = 'services_addressfield/country_get_list.json';
  options.service = 'services_addressfield';
  options.resource = 'country_get_list';
  if (_addressfield_localstorage_check(options)) { return; }
  Drupal.services.call(options);
}

function addressfield_get_address_format(country_code, options) {
  options.data = JSON.stringify({ country_code: country_code });
  options.method = 'POST';
  options.path = 'services_addressfield/get_address_format.json';
  options.service = 'services_addressfield';
  options.resource = 'get_address_format';
  if (_addressfield_localstorage_check(options)) { return; }
  Drupal.services.call(options);
}

function addressfield_get_administrative_areas(country_code, options) {
  options.data = JSON.stringify({ country_code: country_code });
  options.method = 'POST';
  options.path = 'services_addressfield/get_administrative_areas.json';
  options.service = 'services_addressfield';
  options.resource = 'get_administrative_areas';
  if (_addressfield_localstorage_check(options)) { return; }
  Drupal.services.call(options);
}

function addressfield_get_address_format_and_administrative_areas(country_code, options) {
  options.data = JSON.stringify({ country_code: country_code });
  options.method = 'POST';
  options.path = 'services_addressfield/get_address_format_and_administrative_areas.json';
  options.service = 'services_addressfield';
  options.resource = 'get_address_format_and_administrative_areas';
  if (_addressfield_localstorage_check(options)) { return; }
  Drupal.services.call(options);
}

/**
 * Used to place an address field onto a non entity form.
 */
function theme_addressfield_form_element(variables) {

  _addressfield_elements[variables.id] = variables;

  // Determine the country widget id and init the global array for this element.
  var country_widget_id = variables.id + '-country';
  _address_field_items[variables.name] = [];

  // If no value callback was provided, set it to the default.
  if (!variables.element.value_callback) {
    variables.element.value_callback = 'addressfield_field_value_callback';
  }

  // Prepare the child element.
  var onchange = "_addressfield_field_widget_form_country_onchange(this, " +
      "'" + variables.id + "'," +
      0 + "," +
      "'" + variables.name + "'" +
      ")";
  var child = {
    title: 'Country',
    options: {},
    attributes: {
      id: country_widget_id,
      onchange: onchange
    }
  };
  if (empty(variables.default_country) && !variables.required) {
    child.options[''] = '- None -';
  }

  // All countries allowed.
  return theme('select', child) + '<div id="' + country_widget_id + '-widget' + '"></div>' +
      drupalgap_jqm_page_event_script_code({
        page_id: drupalgap_get_page_id(),
        jqm_page_event: 'pageshow',
        jqm_page_event_callback: '_addressfield_field_widget_form_country_pageshow',
        jqm_page_event_args: JSON.stringify({
          country_widget_id: country_widget_id,
          delta: 0,
          field_name: variables.name,
          default_country: variables.default_country,
          required: variables.required
        })
      });

}

/**
 * Themes an address field. To provide a country specific theme, see the
 * theme_addressfield_US() example below. Make a copy of it, and replace 'US'
 * with your country code, then style it as needed.
 */
function theme_addressfield(variables) {
  try {

    // Allow for country specific themes.
    var function_name = 'theme_addressfield_' + variables.country;
    if (function_exists(function_name)) {
      var fn = window[function_name];
      return fn(variables);
    }

    // Default theme.
    var html = '';
    if (variables.organisation_name && variables.organisation_name != '') {
      html += variables.organisation_name + '<br />';
    }
    if (variables.name_line && variables.name_line != '') {
      html += variables.name_line + '<br />';
    }
    if (variables.first_name && variables.first_name != '') {
      html += variables.first_name + '<br />';
    }
    if (variables.last_name && variables.last_name != '') {
      html += variables.last_name + '<br />';
    }
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare + '<br />';
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.sub_premise && variables.sub_premise != '') {
      html += variables.sub_premise + '<br />';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality + '<br />';
    }
    if (variables.dependent_locality && variables.dependent_locality != '') {
      html += variables.dependent_locality + '<br />';
    }
    if (variables.administrative_area && variables.administrative_area != '') {
      html += variables.administrative_area + '<br />';
    }
    if (variables.sub_administrative_area && variables.sub_administrative_area != '') {
      html += variables.sub_premise + '<br />';
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + '<br />';
    }
    if (variables.country && variables.country != '') {
      html += addressfield_get_country_name(variables.country);
    }
    return html;

  }
  catch (error) { console.log('theme_addressfield - ' + error); }
}

/**
 * Theme's a typical address field's name.
 */
function theme_addressfield_name(variables) {
  try {
    var html = '';
    if (variables.organisation_name && variables.organisation_name != '') {
      html += variables.organisation_name + '<br />';
    }
    if (variables.name_line && variables.name_line != '') {
      html += variables.name_line + '<br />';
    }
    else {
      if (variables.first_name && variables.first_name != '') {
        html += variables.first_name;
        if (variables.last_name && variables.last_name != '') {
          html += ' ';
        }
      }
      if (variables.last_name && variables.last_name != '') {
        html += variables.last_name + '<br />';
      }
    }
    return html;
  }
  catch (error) { console.log('theme_addressfield_name - ' + error); }
}

/**
 * Austria address field theme.
 */
function theme_addressfield_AT(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare;
      if (variables.premise && variables.premise != '') {
        html += ' - ';
      }
      else {
        html += '<br />';
      }
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + ' ';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
    }
    html += '<br />Austria';
    return html;
  }
  catch (error) { console.log('theme_addressfield_AT - ' + error); }
}

/**
 * Canada address field theme.
 */
function theme_addressfield_CA(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare + '<br />';
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
      if (variables.administrative_area && variables.administrative_area != '') {
        html += ', ';
      }
    }
    if (variables.administrative_area && variables.administrative_area != '') {
      html += variables.administrative_area;
      if (variables.postal_code && variables.postal_code != '') {
        html += ' ';
      }
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + '<br />';
    }
    return html;
  }
  catch (error) { console.log('theme_addressfield_CA - ' + error); }
}

/**
 * Switzerland address field theme.
 */
function theme_addressfield_CH(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare;
      if (variables.premise && variables.premise != '') {
        html += ' - ';
      }
      else {
        html += '<br />';
      }
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + ' ';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
    }
    html += '<br />Switzerland';
    return html;
  }
  catch (error) { console.log('theme_addressfield_CH - ' + error); }
}

/**
 * Germany address field theme.
 */
function theme_addressfield_DE(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare;
      if (variables.premise && variables.premise != '') { html += ' - '; }
      else { html += '<br />'; }
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    html += variables.country + '-';
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + ' ';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
    }
    html += '<br />Germany';
    return html;
  }
  catch (error) { console.log('theme_addressfield_DE - ' + error); }
}

/**
 * France address field theme.
 */
function theme_addressfield_FR(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare;
      if (variables.premise && variables.premise != '') { html += ' - '; }
      else { html += '<br />'; }
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + ' ';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
    }
    html += '<br />France';
    return html;
  }
  catch (error) { console.log('theme_addressfield_FR - ' + error); }
}

/**
 * United Kingdom address field theme.
 */
function theme_addressfield_GB(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare + '<br />';
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality + '<br />';
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + '<br />';
    }
    return html + 'United Kingdom';
  }
  catch (error) { console.log('theme_addressfield_GB - ' + error); }
}

/**
 * United States address field theme.
 */
function theme_addressfield_US(variables) {
  try {
    var html = theme_addressfield_name(variables);
    if (variables.thoroughfare && variables.thoroughfare != '') {
      html += variables.thoroughfare + '<br />';
    }
    if (variables.premise && variables.premise != '') {
      html += variables.premise + '<br />';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
      if (variables.administrative_area && variables.administrative_area != '') {
        html += ', ';
      }
    }
    if (variables.administrative_area && variables.administrative_area != '') {
      html += variables.administrative_area;
      if (variables.postal_code && variables.postal_code != '') {
        html += ' ';
      }
    }
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + '<br />';
    }
    return html;
  }
  catch (error) { console.log('theme_addressfield_US - ' + error); }
}
