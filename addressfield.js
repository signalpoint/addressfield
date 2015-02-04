var _address_field_items = {};

/**
 *
 */
function addressfield_get_components() {
  try {
    return ['country', 'thoroughfare', 'premise', 'locality', 'administrative_area', 'postal_code'];
  }
  catch (error) { console.log('addressfield_get_components - ' + error); }
}

/**
 * Implements hook_field_widget_form().
 */
function addressfield_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // @see https://www.drupal.org/node/1933438
    //console.log(instance);
    //console.log(items[delta]);

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

    // There is no existing value...

    // Extract the countries. If it's an array and empty, that means every
    // country is allowed and we'll need to grab them from the server. If it's
    // an object, then only the countries listed within the object are valid,
    // and they are listed only as country codes as the property name and value.
    var countries = instance.widget.settings.available_countries;
    var country_widget_id = items[delta].id + '-country';
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
    if ($.isArray(countries) && countries.length == 0) {
      child.suffix = drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: '_addressfield_field_widget_form_country_pageshow',
          jqm_page_event_args: JSON.stringify({
              country_widget_id: country_widget_id,
              delta: delta,
              field_name: field.field_name
          })
      });
    }
    else {
      $.each(countries, function(code, value) {
          child.options[code] = value;
      });
    }
    items[delta].children.push(child);
    // Place an empty container for the country's widet to be injected
    // dynamically.
    items[delta].children.push({
        markup: '<div id="' + country_widget_id + '-widget"></div>'
    });
  }
  catch (error) { console.log('hook_field_widget_form - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_pageshow(options) {
  try {
    country_get_list({
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
          // that country, then let our implementation of 
          if (
            typeof _address_field_items[options.field_name] !== 'undefined' &&
            typeof _address_field_items[options.field_name][parseInt(options.delta)] !== 'undefined'
          ) {
            var item = _address_field_items[options.field_name][parseInt(options.delta)].item;
            var select = $('#' + options.country_widget_id);
            select.val(item.country).selectmenu("refresh", true).change();
          }

        }                                                                     
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_pageshow - ' + error); }
}

/**
 * Implements hook_services_postprocess().
 */
function addressfield_services_postprocess(options, result) {
  try {
    // When we have an existing value in an address field, we use this hook to
    // place the values into the widget after its been rendered.
    if (
      options.service == 'services_addressfield' &&
      options.resource == 'get_address_format_and_administrative_areas'
    ) {
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
                    $(selector).selectmenu("refresh", true).change();
                  }
              });
          });
      });
    }
  }
  catch (error) { console.log('addressfield_services_postprocess - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_onchange(select, widget_id, delta, field_name) {
  try {
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

          // thoroughfare
          var widget = {
            theme: 'textfield',
            attributes: {
              placeholder: 'Address 1',
              id: widget_id + '-thoroughfare'
            },
            required: true
          };
          components.push(widget);

          // premise
          var widget = {
            theme: 'textfield',
            attributes: {
              placeholder: 'Address 2',
              id: widget_id + '-premise'
            }
          };
          components.push(widget);

          // locality
          var widget = {
            theme: 'textfield',
            attributes: {
              placeholder: address_format.locality_label,
              id: widget_id + '-locality'
            },
            required: _addressfield_widget_field_required(address_format, 'locality')
          };
          components.push(widget);

          // administrative_area
          if (administrative_areas) {
            var widget = {
              theme: 'select',
              options: administrative_areas,
              attributes: {
                id: widget_id + '-administrative_area'
              }
            };
            components.push(widget);
            //_addressfield_widget_field_required(address_format, 'administrative_area')
          }

          // postal_code
          var widget = {
            theme: 'textfield',
            attributes: {
              placeholder: address_format.postal_code_label,
              id: widget_id + '-postal_code'
            },
            required: _addressfield_widget_field_required(address_format, 'postal_code')
          };
          components.push(widget);

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

/**
 * Given an address_format object and a field name, this will return true if the
 * field is required, false if it isn't.
 */
function _addressfield_widget_field_required(address_format, field_name) {
  try {
    var result = false;
    $.each(address_format.required_fields, function(index, _field_name) {
        if (field_name == _field_name) {
          result = true;
          return false;
        }
    });
    return result;
  }
  catch (error) { console.log('_addressfield_widget_field_required - ' + error); }
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
 * Themes an address field. To provide a country specific theme, see the
 * theme_addressfield_US() example below. Make a copy of it, and replace 'US'
 * with your country code, then style it as needed.
 */
function theme_addressfield(variables) {
  try {
    
    // Allow for country specific themes.
    var function_name = 'theme_addressfield_' + variables.country;
    if (drupalgap_function_exists(function_name)) {
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
      html += variables.country;
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
 * German address field theme.
 */
function theme_addressfield_DE(variables) {
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
    html += variables.country + '-';
    if (variables.postal_code && variables.postal_code != '') {
      html += variables.postal_code + ' ';
    }
    if (variables.locality && variables.locality != '') {
      html += variables.locality;
    }
    return html;
  }
  catch (error) { console.log('theme_addressfield_US - ' + error); }
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

function country_get_list(options) {
  try {
    options.method = 'POST';
    options.path = 'services_addressfield/country_get_list.json';
    options.service = 'services_addressfield';
    options.resource = 'country_get_list';
    Drupal.services.call(options);
  }
  catch (error) { console.log('country_get_list - ' + error); }
}

function addressfield_get_address_format(country_code, options) {
  try {
    options.data = JSON.stringify({ country_code: country_code });
    options.method = 'POST';
    options.path = 'services_addressfield/get_address_format.json';
    options.service = 'services_addressfield';
    options.resource = 'get_address_format';
    Drupal.services.call(options);
  }
  catch (error) { console.log('addressfield_get_address_format - ' + error); }
}

function addressfield_get_administrative_areas(country_code, options) {
  try {
    options.data = JSON.stringify({ country_code: country_code });
    options.method = 'POST';
    options.path = 'services_addressfield/get_administrative_areas.json';
    options.service = 'services_addressfield';
    options.resource = 'get_administrative_areas';
    Drupal.services.call(options);
  }
  catch (error) { console.log('addressfield_get_administrative_areas - ' + error); }
}

function addressfield_get_address_format_and_administrative_areas(country_code, options) {
  try {
    options.data = JSON.stringify({ country_code: country_code });
    options.method = 'POST';
    options.path = 'services_addressfield/get_address_format_and_administrative_areas.json';
    options.service = 'services_addressfield';
    options.resource = 'get_address_format_and_administrative_areas';
    Drupal.services.call(options);
  }
  catch (error) { console.log('addressfield_get_address_format_and_administrative_areas - ' + error); }
}

