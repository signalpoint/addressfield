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
