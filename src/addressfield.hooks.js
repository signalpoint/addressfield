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
  try {
    // When we have an existing value in an address field, we use this hook to
    // place the values into the widget after its been rendered.
    if (
        options.service == 'services_addressfield' &&
        options.resource == 'get_address_format_and_administrative_areas' &&
        !_address_field_new_entity
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
              $(selector).selectmenu('refresh', true).change();
            }
          });
        });
      });
    }
  }
  catch (error) { console.log('addressfield_services_postprocess - ' + error); }
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
