/**
 * Implements hook_field_widget_form().
 */
function addressfield_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // @see https://www.drupal.org/node/1933438
    console.log(instance);
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
        onchange: '_addressfield_field_widget_form_country_onchange(this)'
      }
    };
    if ($.isArray(countries) && countries.length == 0) {
      child.suffix = drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: '_addressfield_field_widget_form_country_pageshow',
          jqm_page_event_args: JSON.stringify({
              country_widget_id: country_widget_id
          })
      });
    }
    else {
      $.each(countries, function(code, value) {
          child.options[code] = value;
      });
    }
    items[delta].children.push(child);
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
          var html = '';
          $.each(countries, function(code, name) {
              html += '<option value="' + code + '">' + name + '</option>';
          });
          if (!empty(html)) {
            $('#' + options.country_widget_id).append(html);
          }
        }
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_pageshow - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_onchange(select) {
  try {
    addressfield_get_address_format($(select).val(), {
        success: function(address_format) {
          console.log(address_format);
        }
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_onchange - ' + error); }
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
 * Themes an address field.
 */
function theme_addressfield(variables) {
  try {
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

