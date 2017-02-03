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
