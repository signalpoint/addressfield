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
