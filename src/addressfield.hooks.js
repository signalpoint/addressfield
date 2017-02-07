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
