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

