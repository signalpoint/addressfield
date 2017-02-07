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
